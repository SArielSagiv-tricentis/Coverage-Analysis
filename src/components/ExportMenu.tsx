import { useEffect, useRef, useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  exportPDF,
  exportCSV,
  defaultExportTestStages,
  defaultExportApps,
  defaultChangeOverall,
  defaultEntireOverall,
} from "@/lib/exportUtils";
import type { MetricKey } from "@/components/wizard/types";

interface ExportMenuProps {
  viewName: string;
  scope: string;
  dateRange: string;
  metrics: MetricKey[];
}

const ExportMenu = ({ viewName, scope, dateRange, metrics }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildData = () => ({
    viewName,
    scope,
    dateRange,
    metrics,
    overall: defaultChangeOverall,
    entireOverall: defaultEntireOverall,
    testStages: defaultExportTestStages,
    apps: defaultExportApps,
  });

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-link transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
          <button
            onClick={() => { exportPDF(buildData()); setOpen(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            Export as PDF
          </button>
          <button
            onClick={() => { exportCSV(buildData()); setOpen(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
