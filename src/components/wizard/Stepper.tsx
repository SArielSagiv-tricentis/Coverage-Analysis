interface StepperProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { id: 1 as const, label: "Scope" },
  { id: 2 as const, label: "Metrics" },
  { id: 3 as const, label: "Name" },
];

const Line = ({ active, className = "" }: { active: boolean; className?: string }) => (
  <div className={`h-[2px] ${active ? "bg-link" : "bg-border"} ${className}`} />
);

const Stepper = ({ currentStep }: StepperProps) => (
  <div className="flex items-center w-full px-12 pt-6 pb-8">
    {/* Leading edge */}
    <Line active={currentStep >= 1} className="w-12" />
    {STEPS.map((step, idx) => {
      const reached = step.id <= currentStep;
      const isLast = idx === STEPS.length - 1;
      return (
        <div key={step.id} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
          <div className="flex flex-col items-center relative">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                reached
                  ? "bg-link text-primary-foreground"
                  : "bg-[hsl(214_15%_78%)] text-white"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`absolute top-full mt-2 whitespace-nowrap text-sm font-medium ${
                reached ? "text-link" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {!isLast && <Line active={STEPS[idx + 1].id <= currentStep} className="flex-1" />}
        </div>
      );
    })}
    {/* Trailing edge */}
    <Line active={currentStep >= 3} className="w-12" />
  </div>
);

export default Stepper;
