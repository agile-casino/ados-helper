import { Button, Menu } from "@mantine/core";

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

const WordIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Word Icon</title>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m7.5 11 1.5 6 2-4.5 2 4.5 1.5-6" />
  </svg>
);

const ChevronDownIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Menu Icon</title>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface AcceptanceCriteriaReportSplitButtonProps {
  onExportPdf: () => void;
  onExportWord: () => void;
  disabled?: boolean;
}

export const AcceptanceCriteriaReportSplitButton = ({ onExportPdf, onExportWord, disabled = false }: AcceptanceCriteriaReportSplitButtonProps) => (
  <Button.Group>
    <Button leftSection={WordIcon} onClick={onExportWord} disabled={disabled}>
      Acceptance Criteria Report
    </Button>
    <Menu>
      <Menu.Target>
        <Button px={8} disabled={disabled} aria-label="Acceptance criteria export options">
          {ChevronDownIcon}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={WordIcon} onClick={onExportWord}>
          Export to Word
        </Menu.Item>
        <Menu.Item leftSection={PdfIcon} onClick={onExportPdf}>
          Export to PDF
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Button.Group>
);
