import { useEffect, useState } from "react";

interface LoadingStateProps {
  message?: string;
  stages?: string[];
  showStages?: boolean;
}

const defaultStages = [
  "Analyzing your scope and filters...",
  "Collecting test results across selected stages...",
  "Computing coverage metrics for entire code...",
  "Identifying changed lines and matching coverage...",
  "Aggregating failed tests and quality signals...",
  "Applying thresholds and quality gates...",
  "Finalizing your Coverage Analysis view...",
];

const LoadingState = ({ message, stages = defaultStages, showStages = false }: LoadingStateProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(interval);
  }, [stages]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-32 px-6">
      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      {message && (
        <p className="text-foreground text-base font-medium mt-6">{message}</p>
      )}
      {showStages && (
        <p
          key={index}
          className="text-muted-foreground text-sm mt-3 text-center max-w-md transition-opacity duration-500"
          style={{ animation: "fadeIn 0.5s ease-in" }}
        >
          {stages[index]}
        </p>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default LoadingState;
