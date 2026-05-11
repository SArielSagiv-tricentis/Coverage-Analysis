import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  LayoutDashboard,
  FilePlus2,
  SlidersHorizontal,
  Target,
  Filter,
  PanelRightOpen,
  RefreshCw,
  Calendar,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const Section = ({ icon: Icon, title, children }: SectionProps) => (
  <section className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
    <div className="pl-9 text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
  </section>
);

const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Quality Insights — User Guide</DialogTitle>
              <DialogDescription>
                A complete walkthrough of reports, metrics, thresholds, filters, and the drill-down panel.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-6">
            <Section icon={LayoutDashboard} title="Overview">
              <p>
                <strong className="text-foreground">Quality Insights</strong> is a configurable coverage and quality
                dashboard. You build <strong className="text-foreground">Reports</strong> (saved views) that combine a
                scope, a date range, and a chosen set of metrics. Each report renders an interactive dashboard with
                drill-down details for every app and test stage.
              </p>
            </Section>

            <Section icon={FilePlus2} title="Creating a Report">
              <p>Open the <strong className="text-foreground">Report</strong> dropdown at the top and choose
                <em> Create new report</em>, or click <em>Get Started</em> from the Welcome screen. The wizard walks
                you through four steps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong className="text-foreground">Name</strong> — give the report a descriptive name.</li>
                <li><strong className="text-foreground">Scope</strong> — pick labs and/or define an Advanced Scope
                  (Column / Condition / Value rules) to narrow what is analyzed.</li>
                <li><strong className="text-foreground">Date Range</strong> — choose Fixed dates, Since a date, or
                  Last N days/weeks. Optional time-of-day fields refine the window.</li>
                <li><strong className="text-foreground">Metrics</strong> — select one or more of:
                  <em> Change Coverage</em>, <em>Overall Coverage</em>, <em>Failed Tests</em>. You may also
                  configure thresholds for each metric here.</li>
              </ol>
              <p>Generating a new report runs a longer pipeline (~40s) and shows rotating progress messages so you
                can see what is being computed. Opening an existing report is fast and skips those stages.</p>
            </Section>

            <Section icon={Layers} title="Metrics">
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-foreground">Change Coverage</strong> — coverage of code that changed in
                  the selected window. Best for PR / release readiness.</li>
                <li><strong className="text-foreground">Overall Coverage</strong> — coverage of the full codebase.
                  When viewing this tab, the right-side drill-down panel hides change-specific data because it is
                  not relevant.</li>
                <li><strong className="text-foreground">Failed Tests</strong> — number of failing tests in scope.
                  By default the number is shown in a neutral color (it is not red unless a threshold is breached).
                  When the Failed Tests metric is selected, it inherits the main metric color treatment used by
                  Change Coverage.</li>
              </ul>
            </Section>

            <Section icon={Target} title="Quality Gates & Thresholds">
              <p>Every metric supports two thresholds:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Target</strong> — the goal you want to meet.</li>
                <li><strong className="text-foreground">At-Risk</strong> — an early-warning level below the target.</li>
              </ul>
              <p>Thresholds can be applied <em>globally</em>, per <em>test stage</em>, or per <em>app</em>, and
                each metric (Change / Entire / Failed Tests) keeps its own independent settings. Values that miss
                target render in the warning/destructive palette so issues stand out.</p>
            </Section>

            <Section icon={Filter} title="Filtering">
              <p>The collapsible <strong className="text-foreground">Filter sidebar</strong> on the left supports
                multi-select filtering across labs, apps, branches, and more. Active filters appear as removable
                badges above the dashboard, so you always know what is currently applied.</p>
            </Section>

            <Section icon={PanelRightOpen} title="Drill-Down Panel">
              <p>Click any <strong className="text-foreground">app</strong> or <strong className="text-foreground">test
                stage</strong> row to open the right-anchored detail panel. Content adapts to context:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>On Change Coverage views, the panel shows <em>code changes</em> alongside the coverage table.</li>
                <li>On Overall Coverage views, code changes are hidden (not relevant to entire-codebase analysis).</li>
                <li>The coverage table includes an <strong className="text-foreground">Uncovered Methods Only</strong>
                  toggle (top-left of the toolbar). When on, covered methods are filtered out so you can focus on
                  gaps. Search and download actions are grouped on the right.</li>
              </ul>
            </Section>

            <Section icon={Calendar} title="Date Management">
              <p>Date Range supports three modes — <strong className="text-foreground">Fixed</strong> (explicit
                start/end), <strong className="text-foreground">Since</strong> (from a date until now), and
                <strong className="text-foreground"> Last</strong> (rolling window like “Last 30 days”). Each mode
                has optional time fields for hour-level precision.</p>
            </Section>

            <Section icon={SlidersHorizontal} title="Editing & Managing Reports">
              <p>Use <em>Edit</em> next to the report name to reopen the wizard pre-filled with the current report’s
                settings. Hover any report in the dropdown to reveal a delete icon. Filter and quality-gate changes
                you make while viewing a report are persisted back to it automatically.</p>
            </Section>

            <Section icon={RefreshCw} title="Freshness & Refresh">
              <p>The header shows when the report was last updated. The platform polls in the background; if new
                results are available after a report has been open for more than two minutes, an
                <em> Updates pending</em> indicator appears next to the refresh button.</p>
            </Section>

            <Section icon={AlertTriangle} title="“New data found” Alert">
              <p>To avoid noise, the yellow <strong className="text-foreground">New data found</strong> banner is
                only shown after a report has been open for at least two minutes — not on every load. Click the
                refresh icon (or dismiss the banner with ×) to clear it. Refreshing pulls the latest results and
                resets the freshness timer.</p>
            </Section>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground">
              Tip: you can return to this guide any time by clicking the <strong className="text-foreground">?</strong>
              {" "}icon next to the page title.
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
