import { useState } from "react";
import Stepper from "./Stepper";
import ScopeStep from "./ScopeStep";
import MetricsStep from "./MetricsStep";
import NameStep from "./NameStep";
import { emptyWizardData, type WizardData } from "./types";

interface ViewWizardProps {
  initial?: WizardData;
  isEditing: boolean;
  testStageNames: string[];
  appNames: string[];
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

const ViewWizard = ({
  initial, isEditing, testStageNames, appNames, onComplete, onCancel,
}: ViewWizardProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<WizardData>(initial || emptyWizardData);

  const update = (patch: Partial<WizardData>) => setData((p) => ({ ...p, ...patch }));

  const canNextFromStep1 = !!data.dateRange && !!data.scope;
  const canNextFromStep2 = data.metrics.length > 0;
  const canFinish = !!data.name.trim();

  const goNext = () => {
    if (step === 1 && canNextFromStep1) setStep(2);
    else if (step === 2 && canNextFromStep2) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
    else onCancel();
  };

  return (
    <div className="bg-card border border-border rounded-lg flex flex-col min-h-[calc(100vh-220px)]">
      <Stepper currentStep={step} />

      <div className="flex-1 flex flex-col px-6 py-8">
        {step === 1 && <ScopeStep data={data} update={update} />}
        {step === 2 && (
          <MetricsStep
            data={data}
            update={update}
            testStageNames={testStageNames}
            appNames={appNames}
          />
        )}
        {step === 3 && <NameStep data={data} update={update} />}

        <div className="flex items-center justify-end gap-4 pt-8 mt-auto border-t border-border">
          <button
            onClick={goBack}
            className="text-sm text-foreground hover:text-link transition-colors px-3 py-2"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={step === 1 ? !canNextFromStep1 : !canNextFromStep2}
              className={`px-6 py-2 rounded text-sm font-medium transition-all ${
                (step === 1 ? canNextFromStep1 : canNextFromStep2)
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => canFinish && onComplete(data)}
              disabled={!canFinish}
              className={`px-6 py-2 rounded text-sm font-medium transition-all ${
                canFinish
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isEditing ? "Update View" : "Generate Quality Insights"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewWizard;
