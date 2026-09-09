export interface ReportSectionTheme {
  label: string;
  accent: string;
}

export const REPORT_SECTIONS = {
  completed: { label: "Completed", accent: "059669" },
  inProgress: { label: "In Progress", accent: "D97706" },
  notStarted: { label: "Not Started", accent: "64748B" },
  removed: { label: "Removed", accent: "E11D48" },
  studyTime: { label: "Study Time", accent: "7C3AED" }
} as const;

export const SLATE_400 = "94A3B8";
export const SLATE_500 = "64748B";
export const SLATE_700 = "334155";
export const SLATE_800 = "1E293B";
export const SLATE_900 = "0F172A";
export const DEFAULT_BANNER_COLOR = "F3F4F6";
export const DIVIDER_COLOR = "E2E8F0";

export const AC_BULLET_LINE = /^\s*•\s?(.*)$/;

export function darkenHex(hex: string, factor: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map(char => char + char)
          .join("")
      : value;
  const number = Number.parseInt(full, 16);
  const red = Math.round(((number >> 16) & 0xff) * factor);
  const green = Math.round(((number >> 8) & 0xff) * factor);
  const blue = Math.round((number & 0xff) * factor);
  return [red, green, blue]
    .map(channel => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function formatSectionTitle(section: ReportSectionTheme, count: number): string {
  return `${section.label} (${count})`;
}
