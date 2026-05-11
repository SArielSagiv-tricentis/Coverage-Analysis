import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MetricKey } from "@/components/wizard/types";

export interface ExportTestStage {
  name: string;
  coverage: number;
  untestedMethods: number;
  failedTests: number;
}

export interface ExportApp {
  name: string;
  methods: number;
  untested: number;
  coverage: number;
}

export interface ExportData {
  viewName: string;
  scope: string;
  dateRange: string;
  metrics: MetricKey[];
  overall: { coverage: number; tested: number; total: number };
  entireOverall?: { coverage: number; tested: number; total: number };
  testStages: ExportTestStage[];
  apps: ExportApp[];
}

const sampleMethods = [
  "init", "render", "validate", "submit", "load", "save", "update", "delete",
  "fetch", "parse", "format", "handleClick", "handleChange", "onMount", "onError",
];

const sampleFiles = [
  "src/index.ts", "src/utils/helpers.ts", "src/components/Form.tsx",
  "src/api/client.ts", "src/services/auth.ts", "src/hooks/useData.ts",
];

export function exportPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.viewName, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`${data.scope}  •  ${data.dateRange}`, 14, y);
  y += 4;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
  y += 8;

  doc.setTextColor(0);

  // Metrics summary
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Metrics", 14, y);
  y += 6;

  const metricRows: string[][] = [];
  if (data.metrics.includes("change")) {
    metricRows.push([
      "Change Coverage",
      `${data.overall.coverage}%`,
      `${data.overall.tested} covered / ${data.overall.total} methods`,
      `${data.overall.total - data.overall.tested} uncovered`,
    ]);
  }
  if (data.metrics.includes("entire") && data.entireOverall) {
    metricRows.push([
      "Overall Coverage",
      `${data.entireOverall.coverage}%`,
      `${data.entireOverall.tested} covered / ${data.entireOverall.total} methods`,
      `${data.entireOverall.total - data.entireOverall.tested} uncovered`,
    ]);
  }
  if (data.metrics.includes("failed")) {
    const totalFailed = data.testStages.reduce((a, s) => a + s.failedTests, 0);
    metricRows.push(["Failed Tests", String(totalFailed), "across all test stages", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value", "Detail", "Notes"]],
    body: metricRows,
    theme: "striped",
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9 },
  });
  // @ts-expect-error - lastAutoTable injected by plugin
  y = doc.lastAutoTable.finalY + 10;

  // Test stages
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Test Stages", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y + 2,
    head: [["Test Stage", "Coverage", "Uncovered Methods", "Failed Tests"]],
    body: data.testStages.map((s) => [
      s.name,
      `${s.coverage}%`,
      String(s.untestedMethods),
      String(s.failedTests),
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9 },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 10;

  // Apps
  if (y > 250) {
    doc.addPage();
    y = 15;
  }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Apps", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y + 2,
    head: [["App", "Methods", "Uncovered", "Coverage"]],
    body: data.apps.map((a) => [a.name, String(a.methods), String(a.untested), `${a.coverage}%`]),
    theme: "striped",
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9 },
  });

  doc.save(`${data.viewName.replace(/\s+/g, "_")}.pdf`);
}

export function exportCSV(data: ExportData) {
  const stageNames = data.testStages.map((s) => s.name);
  const headers = ["app", "file path", "method", ...stageNames, "changed"];

  const rows: string[][] = [];
  // Generate per-method rows derived from apps
  data.apps.forEach((app, ai) => {
    const count = Math.max(3, Math.min(app.methods, 8));
    for (let i = 0; i < count; i++) {
      const file = sampleFiles[(ai * 3 + i) % sampleFiles.length];
      const method = sampleMethods[(ai * 5 + i) % sampleMethods.length];
      const stageVals = data.testStages.map((s) => {
        const seed = (ai * 13 + i * 7 + s.name.length) % 3;
        if (seed === 0) return "Covered";
        if (seed === 1) return "Uncovered";
        return "Partial";
      });
      const changed = (ai + i) % 2 === 0 ? "Yes" : "No";
      rows.push([app.name, file, method, ...stageVals, changed]);
    }
  });

  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.viewName.replace(/\s+/g, "_")}_coverage.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Default sample data matching the dashboard's base data
export const defaultExportTestStages: ExportTestStage[] = [
  { name: "Regression Tests", coverage: 68, untestedMethods: 88, failedTests: 12 },
  { name: "Unit Tests", coverage: 65, untestedMethods: 96, failedTests: 0 },
  { name: "Functional Tests", coverage: 54, untestedMethods: 127, failedTests: 5 },
  { name: "Component Tests", coverage: 23, untestedMethods: 212, failedTests: 3 },
];

export const defaultExportApps: ExportApp[] = [
  { name: "inventory-mgr", methods: 6, untested: 1, coverage: 86 },
  { name: "payment-gateway", methods: 88, untested: 21, coverage: 68 },
  { name: "auth-service", methods: 32, untested: 21, coverage: 44 },
  { name: "user-profile-api", methods: 54, untested: 37, coverage: 32 },
];

export const defaultChangeOverall = { coverage: 78, tested: 244, total: 276 };
export const defaultEntireOverall = { coverage: 62, tested: 198, total: 320 };
