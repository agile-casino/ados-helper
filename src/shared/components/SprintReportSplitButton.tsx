import { Button, Menu } from "@mantine/core";

const ExcelIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Excel Icon</title>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h2v5H8z" />
    <path d="M12 15h2v3h-2z" />
    <path d="M16 12h2v6h-2z" />
  </svg>
);

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>PDF Icon</title>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h6" />
    <path d="M9 11h6" />
    <path d="M9 18h6" />
  </svg>
);

const ChevronDownIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Menu Icon</title>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface SprintReportSplitButtonProps {
  onExportExcel: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
}

export const SprintReportSplitButton = ({ onExportExcel, onExportPdf, disabled = false }: SprintReportSplitButtonProps) => (
  <Button.Group>
    <Button leftSection={ExcelIcon} onClick={onExportExcel} disabled={disabled}>
      Sprint Report
    </Button>
    <Menu>
      <Menu.Target>
        <Button px={8} disabled={disabled} aria-label="Export options">
          {ChevronDownIcon}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={ExcelIcon} onClick={onExportExcel}>
          Export to Excel
        </Menu.Item>
        <Menu.Item leftSection={PdfIcon} onClick={onExportPdf}>
          Export to PDF
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Button.Group>
);
