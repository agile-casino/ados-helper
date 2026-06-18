use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct FetchResponse {
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
    redirected: bool,
    url: String,
}

#[tauri::command]
async fn check_auth_state(window: tauri::WebviewWindow) -> Result<bool, String> {
    let url = match tauri::Url::parse("https://dev.azure.com") {
        Ok(u) => u,
        Err(e) => return Err(e.to_string()),
    };
    let cookies = window.cookies_for_url(url).map_err(|e| e.to_string())?;
    let has_auth = cookies.iter().any(|c| {
        let name = c.name();
        name == "UserAuthentication" || name == "AadAuthentication" || name == "FedAuth" || name == "VstsSession"
    });
    Ok(has_auth)
}

#[tauri::command]
async fn trigger_login(app: tauri::AppHandle, window: tauri::WebviewWindow, org: String) -> Result<(), String> {
    if let Some(login_win) = app.get_webview_window("login") {
        let _ = login_win.set_focus();
        return Ok(());
    }

    // Clear stale cookies for dev.azure.com and vssps.dev.azure.com (including path-scoped cookies)
    // to prevent the login window closing prematurely.
    let domains = [
        format!("https://dev.azure.com/{}", org),
        format!("https://vssps.dev.azure.com/{}", org),
        "https://dev.azure.com".to_string(),
        "https://vssps.dev.azure.com".to_string(),
    ];
    for domain in &domains {
        if let Ok(url) = tauri::Url::parse(domain) {
            if let Ok(cookies) = window.cookies_for_url(url) {
                for cookie in cookies {
                    let name = cookie.name().to_string();
                    if name == "UserAuthentication"
                        || name == "AadAuthentication"
                        || name == "FedAuth"
                        || name == "VstsSession"
                    {
                        let delete_res = window.delete_cookie(cookie);
                        println!("Deleted stale ADO cookie '{}' from {}: {:?}", name, domain, delete_res);
                    }
                }
            }
        }
    }

    let target_url = format!("https://dev.azure.com/{}", org);
    let login_url = match tauri::Url::parse(&target_url) {
        Ok(u) => u,
        Err(e) => return Err(e.to_string()),
    };

    let visited_login = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let visited_login_clone = visited_login.clone();

    let app_handle = app.clone();
    let _login_win = tauri::webview::WebviewWindowBuilder::new(
        &app,
        "login",
        tauri::WebviewUrl::External(login_url),
    )
    .title("Sign in to Azure DevOps")
    .inner_size(600.0, 800.0)
    .resizable(true)
    .on_navigation(move |url| {
        let app_handle = app_handle.clone();
        let url_str = url.as_str().to_string();
        let visited_login_clone = visited_login_clone.clone();

        if url_str.contains("login.microsoftonline.com")
            || url_str.contains("login.microsoft.com")
            || url_str.contains("live.com")
            || url_str.contains("/signin")
            || url_str.contains("oauth2")
        {
            visited_login_clone.store(true, std::sync::atomic::Ordering::SeqCst);
        }

        if url_str.starts_with("https://dev.azure.com") {
            if visited_login_clone.load(std::sync::atomic::Ordering::SeqCst) {
                let url_clone = url.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(login_win) = app_handle.get_webview_window("login") {
                        if let Ok(cookies) = login_win.cookies_for_url(url_clone) {
                            println!("on_navigation: URL = {}, found {} cookies:", url_str, cookies.len());
                            for c in &cookies {
                                println!("  Cookie name={}, domain={}, path={}", c.name(), c.domain().unwrap_or(""), c.path().unwrap_or(""));
                            }
                            let has_auth = cookies.iter().any(|c| {
                                let name = c.name();
                                name == "UserAuthentication" || name == "AadAuthentication" || name == "FedAuth" || name == "VstsSession"
                            });
                            if has_auth {
                                println!("on_navigation: has_auth is true, closing window!");
                                let _ = login_win.close();
                                let _ = app_handle.emit("login-status-changed", true);
                            }
                        }
                    }
                });
            }
        }
        true
    })
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn clear_session(window: tauri::WebviewWindow) -> Result<(), String> {
    window.clear_all_browsing_data().map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_from_ado(
    window: tauri::WebviewWindow,
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<FetchResponse, String> {
    let parsed_url = tauri::Url::parse(&url).map_err(|e| e.to_string())?;

    // 1. Get cookies for this URL from the webview
    let cookies = window.cookies_for_url(parsed_url.clone()).map_err(|e| e.to_string())?;
    let cookie_header = cookies
        .iter()
        .map(|c| format!("{}={}", c.name(), c.value()))
        .collect::<Vec<String>>()
        .join("; ");

    // 2. Build the reqwest client (use custom redirect policy to intercept auth login redirects but follow other redirects)
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 10 {
                attempt.error("Too many redirects")
            } else {
                let url_str = attempt.url().as_str();
                if url_str.contains("login.microsoftonline.com")
                    || url_str.contains("live.com")
                    || url_str.contains("/signin")
                {
                    attempt.stop()
                } else {
                    attempt.follow()
                }
            }
        }))
        .build()
        .map_err(|e| e.to_string())?;

    let method_str = method.unwrap_or_else(|| "GET".to_string()).to_uppercase();
    let req_method = reqwest::Method::from_bytes(method_str.as_bytes())
        .map_err(|_| "Invalid HTTP method".to_string())?;

    let mut req_builder = client.request(req_method, parsed_url.clone());

    // 3. Add headers (checking case-insensitively for standard Accept header)
    let has_accept = headers.as_ref().map_or(false, |h| {
        h.keys().any(|k| k.eq_ignore_ascii_case("accept"))
    });

    if let Some(mut h) = headers {
        if !has_accept {
            h.insert("Accept".to_string(), "application/json".to_string());
        }
        for (k, v) in h {
            req_builder = req_builder.header(k, v);
        }
    } else {
        req_builder = req_builder.header("Accept", "application/json");
    }

    if !cookie_header.is_empty() {
        req_builder = req_builder.header("Cookie", cookie_header);
    }

    if let Some(b) = body {
        req_builder = req_builder.body(b);
    }

    // 4. Send request
    let response = req_builder.send().await.map_err(|e| e.to_string())?;

    let status = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("").to_string();

    let mut resp_headers = HashMap::new();
    for (k, v) in response.headers().iter() {
        if let Ok(v_str) = v.to_str() {
            resp_headers.insert(k.as_str().to_string(), v_str.to_string());
        }
    }

    let redirected = response.status().is_redirection();
    let location_url = resp_headers
        .get("location")
        .cloned()
        .unwrap_or_else(|| url.clone());

    let resp_body = response.text().await.map_err(|e| e.to_string())?;

    // 5. Check for auth errors
    let is_html = resp_headers
        .get("content-type")
        .map(|ct| ct.contains("text/html"))
        .unwrap_or(false);

    let mut is_auth_error = status == 401 || status == 203;

    if !is_auth_error
        && redirected
        && (location_url.contains("login.microsoftonline.com")
            || location_url.contains("live.com")
            || location_url.contains("/signin"))
    {
        is_auth_error = true;
    }

    if !is_auth_error && is_html && (url.contains("/_apis/") || url.contains("/_api/")) {
        is_auth_error = true;
    }

    if is_auth_error {
        let _ = window.emit("login-status-changed", false);
    }

    Ok(FetchResponse {
        status,
        status_text,
        headers: resp_headers,
        body: resp_body,
        redirected,
        url: location_url,
    })
}

#[tauri::command]
async fn save_file(filename: String, bytes: Vec<u8>) -> Result<String, String> {
    let file_path = rfd::AsyncFileDialog::new()
        .set_file_name(&filename)
        .save_file()
        .await;

    if let Some(path) = file_path {
        std::fs::write(path.path(), bytes).map_err(|e| e.to_string())?;
        Ok(path.path().to_string_lossy().to_string())
    } else {
        Err("Save cancelled".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        check_auth_state,
        trigger_login,
        clear_session,
        fetch_from_ado,
        save_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
