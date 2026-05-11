import { ChevronDown, Play, HelpCircle, Settings } from "lucide-react";

const navItems = [
  { label: "Coverage Analysis", active: true },
  { label: "Custom Coverage Views", hasDropdown: true },
  { label: "Quality Analytics", hasDropdown: true },
  { label: "Test Optimization", hasDropdown: true },
  { label: "Cockpit", hasDropdown: true },
];

const TopNav = () => {
  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">X</span>
          </div>
          <span className="font-semibold text-foreground text-lg">SeaLights</span>
        </div>

        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              item.active
                ? "bg-secondary text-secondary-foreground border border-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
            {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground">
          <Play className="w-5 h-5" />
        </button>
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
          SA
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
