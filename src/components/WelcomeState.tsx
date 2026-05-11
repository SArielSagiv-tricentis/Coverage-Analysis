interface WelcomeStateProps {
  onGetStarted: () => void;
}

const WelcomeState = ({ onGetStarted }: WelcomeStateProps) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center py-32 px-6">
    <h2 className="text-3xl font-semibold text-foreground mb-3">
      Let's bring your quality data to life.
    </h2>
    <p className="text-base text-muted-foreground max-w-md mb-8">
      Build a custom view to track your coverage, identify testing gaps,
      and manage quality risks in one place.
    </p>
    <button
      onClick={onGetStarted}
      className="px-6 py-2.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
    >
      Get Started
    </button>
  </div>
);

export default WelcomeState;
