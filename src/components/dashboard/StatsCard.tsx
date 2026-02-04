import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "pink" | "emerald" | "blue" | "purple" | "orange" | "cyan";
  onClick?: () => void;
}

const colorClasses = {
  pink: {
    icon: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    glow: "shadow-pink-500/20",
    gradient: "from-pink-500/20 to-pink-600/5",
  },
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  purple: {
    icon: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    gradient: "from-purple-500/20 to-purple-600/5",
  },
  orange: {
    icon: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    gradient: "from-orange-500/20 to-orange-600/5",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color,
  onClick 
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
        "bg-gradient-to-br",
        colors.gradient,
        colors.border,
        "hover:shadow-lg",
        colors.glow,
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-40",
        colors.bg
      )} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            "p-2 rounded-lg",
            colors.bg
          )}>
            <Icon className={cn("w-4 h-4", colors.icon)} />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.isPositive 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
        
        <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
