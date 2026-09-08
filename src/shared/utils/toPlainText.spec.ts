import { describe, expect, test } from "vitest";
import { toPlainText } from "./toPlainText";

describe("toPlainText", () => {
  test("returns empty string for empty input", () => {
    expect(toPlainText("")).toBe("");
  });

  test("returns plain text unchanged", () => {
    expect(toPlainText("The system shall work")).toBe("The system shall work");
  });

  describe("HTML content", () => {
    test("strips simple inline tags", () => {
      expect(toPlainText("<b>Bold</b> and <i>italic</i> text")).toBe("Bold and italic text");
    });

    test("converts list items to bullet points", () => {
      const html = "<ul><li>First criterion</li><li>Second criterion</li></ul>";
      expect(toPlainText(html)).toBe("• First criterion\n• Second criterion");
    });

    test("converts br, p and div tags to line breaks", () => {
      expect(toPlainText("Line one<br>Line two")).toBe("Line one\nLine two");
      expect(toPlainText("<p>Paragraph one</p><p>Paragraph two</p>")).toBe("Paragraph one\nParagraph two");
      expect(toPlainText("<div>Div text</div>")).toBe("Div text");
    });

    test("decodes named HTML entities", () => {
      expect(toPlainText("A &amp; B &lt; C &gt; D")).toBe("A & B < C > D");
      expect(toPlainText("Quote &quot;here&quot;")).toBe('Quote "here"');
      expect(toPlainText("Non&nbsp;breaking")).toBe("Non breaking");
    });

    test("decodes numeric and hex HTML entities", () => {
      expect(toPlainText("&#65;&#66;")).toBe("AB");
      expect(toPlainText("&#x41;&#x42;")).toBe("AB");
    });

    test("leaves unknown entities untouched", () => {
      expect(toPlainText("Custom &unknown; entity")).toBe("Custom &unknown; entity");
    });

    test("collapses excess whitespace and blank lines", () => {
      expect(toPlainText("<div>A</div><div><div>B</div></div>")).toBe("A\nB");
      expect(toPlainText("<p>A</p><p></p><p></p><p></p><p>B</p>")).toBe("A\n\nB");
      expect(toPlainText("Spaced   out\ttext")).toBe("Spaced out text");
    });

    test("handles typical Azure DevOps acceptance criteria markup", () => {
      const html = "<div><b>Given</b> a user with an account<br><ul><li>When they log in</li><li>Then they see the dashboard</li></ul></div>";
      expect(toPlainText(html)).toBe("Given a user with an account\n• When they log in\n• Then they see the dashboard");
    });

    test("takes precedence over markdown markers", () => {
      expect(toPlainText("<ul><li>**stays literal**</li></ul>")).toBe("• **stays literal**");
    });
  });

  describe("Markdown content", () => {
    test("converts dash, asterisk and plus bullets to bullet points", () => {
      expect(toPlainText("- First\n- Second")).toBe("• First\n• Second");
      expect(toPlainText("* First\n* Second")).toBe("• First\n• Second");
      expect(toPlainText("+ First\n+ Second")).toBe("• First\n• Second");
    });

    test("keeps task list checkboxes with bullet points", () => {
      expect(toPlainText("- [ ] To do\n- [x] Done")).toBe("• [ ] To do\n• [x] Done");
    });

    test("keeps numbered lists as-is", () => {
      expect(toPlainText("1. One\n2. Two")).toBe("1. One\n2. Two");
    });

    test("strips bold, italic, strikethrough and code span markers", () => {
      expect(toPlainText("**Bold** and *italic* and ~~gone~~ and `code`")).toBe("Bold and italic and gone and code");
      expect(toPlainText("__Underlined__ too")).toBe("Underlined too");
    });

    test("strips underscore emphasis but not snake_case words", () => {
      expect(toPlainText("_emphasis_ start")).toBe("emphasis start");
      expect(toPlainText("snake_case_word unchanged")).toBe("snake_case_word unchanged");
    });

    test("strips heading markers", () => {
      expect(toPlainText("## Heading\nContent")).toBe("Heading\nContent");
      expect(toPlainText("#Hashtag stays")).toBe("#Hashtag stays");
    });

    test("strips blockquote markers", () => {
      expect(toPlainText("> Quoted text")).toBe("Quoted text");
    });

    test("reduces links to their text and removes images", () => {
      expect(toPlainText("See [the docs](http://example.com) for more")).toBe("See the docs for more");
      expect(toPlainText("![logo](http://example.com/img.png) logo")).toBe("logo");
    });

    test("removes horizontal rules and code fences", () => {
      expect(toPlainText("---\nText after rule")).toBe("Text after rule");
      expect(toPlainText("```\ncode line\n```")).toBe("code line");
    });

    test("handles typical markdown acceptance criteria", () => {
      const markdown = "**Given** the user is logged in\n- When they click logout\n- Then the session ends";
      expect(toPlainText(markdown)).toBe("Given the user is logged in\n• When they click logout\n• Then the session ends");
    });

    test("collapses excess whitespace and blank lines", () => {
      expect(toPlainText("A\n\n\n\nB")).toBe("A\n\nB");
      expect(toPlainText("Spaced   out\ttext")).toBe("Spaced out text");
    });
  });
});
