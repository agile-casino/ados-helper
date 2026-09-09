// @vitest-environment happy-dom

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AcceptanceCriteriaReportSplitButton } from "./AcceptanceCriteriaReportSplitButton";

describe("AcceptanceCriteriaReportSplitButton", () => {
  test("renders the default Word export action", () => {
    const onExportPdf = vi.fn();
    const onExportWord = vi.fn();

    render(
      <MantineProvider>
        <AcceptanceCriteriaReportSplitButton onExportPdf={onExportPdf} onExportWord={onExportWord} />
      </MantineProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /acceptance criteria report/i }));
    expect(onExportWord).toHaveBeenCalledTimes(1);
    expect(onExportPdf).not.toHaveBeenCalled();
  });

  test("offers both PDF and Word export options in the menu and exports to PDF", async () => {
    const onExportPdf = vi.fn();
    const onExportWord = vi.fn();

    render(
      <MantineProvider>
        <AcceptanceCriteriaReportSplitButton onExportPdf={onExportPdf} onExportWord={onExportWord} />
      </MantineProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Acceptance criteria export options" }));

    fireEvent.click(await screen.findByRole("menuitem", { name: /export to pdf/i }));
    expect(onExportPdf).toHaveBeenCalledTimes(1);
    expect(onExportWord).not.toHaveBeenCalled();
  });

  test("exports to Word from the menu", async () => {
    const onExportPdf = vi.fn();
    const onExportWord = vi.fn();

    render(
      <MantineProvider>
        <AcceptanceCriteriaReportSplitButton onExportPdf={onExportPdf} onExportWord={onExportWord} />
      </MantineProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Acceptance criteria export options" }));

    fireEvent.click(await screen.findByRole("menuitem", { name: /export to word/i }));
    expect(onExportWord).toHaveBeenCalledTimes(1);
    expect(onExportPdf).not.toHaveBeenCalled();
  });

  test("disables both actions when disabled", () => {
    render(
      <MantineProvider>
        <AcceptanceCriteriaReportSplitButton onExportPdf={() => {}} onExportWord={() => {}} disabled />
      </MantineProvider>
    );

    expect(screen.getByRole<HTMLButtonElement>("button", { name: /acceptance criteria report/i }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Acceptance criteria export options" }).disabled).toBe(true);
  });
});
