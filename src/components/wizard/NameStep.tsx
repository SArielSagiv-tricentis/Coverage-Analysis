import type { WizardData } from "./types";

interface NameStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
}

const NameStep = ({ data, update }: NameStepProps) => (
  <div className="max-w-3xl mx-auto w-full">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-semibold text-foreground">Give it a name</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Name your view so it's easy for your team to find.
      </p>
    </div>

    <div className="bg-surface-filter border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-md bg-[hsl(214_77%_60%)] flex items-center justify-center shrink-0 text-white text-lg font-semibold">
        Aa
      </div>
      <div className="flex-1">
        <label className="text-sm text-foreground font-medium block mb-1">View Name</label>
        <input
          type="text"
          placeholder="Enter a view name"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
          autoFocus
        />
      </div>
    </div>
  </div>
);

export default NameStep;
