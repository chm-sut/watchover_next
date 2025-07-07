"use client";

interface PriorityBadgeProps {
  priority: string;
  size?: "sm" | "md" | "lg";
}

export default function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm": return "px-1 py-0.5 text-xs";
      case "md": return "px-2 py-1 text-xs"; 
      case "lg": return "px-3 py-1 text-sm";
      default: return "px-2 py-1 text-xs";
    }
  };

  const getPriorityColor = (level: string) => {
    const base = `${getSizeClass()} rounded-full font-semibold font-body`;
    switch (level) {
      case "CRITICAL":
        return `${base} bg-black text-logoWhite border border-logoWhite`;
      case "HIGH":
        return `${base} bg-lightRed text-darkRed`;
      case "MEDIUM":
        return `${base} bg-lightOrange text-darkRed`;
      case "LOW":
        return `${base} bg-lightYellow text-darkRed`;
      default:
        return base;
    }
  };

  return (
    <span className={getPriorityColor(priority || 'LOW')}>
      {priority || 'LOW'}
    </span>
  );
}