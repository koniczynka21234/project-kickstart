import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumToastType = "success" | "error" | "warning" | "info";

interface PremiumToastData {
  id: number;
  type: PremiumToastType;
  title: string;
  description?: string;
  duration?: number;
}

let toastId = 0;
const listeners: Set<(t: PremiumToastData) => void> = new Set();

export function premiumToast({
  type = "success",
  title,
  description,
  duration = 3500,
}: {
  type?: PremiumToastType;
  title: string;
  description?: string;
  duration?: number;
}) {
  const data: PremiumToastData = { id: ++toastId, type, title, description, duration };
  listeners.forEach((fn) => fn(data));
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    icon: "text-[hsl(160_70%_50%)]",
    glow: "shadow-[0_0_60px_hsl(160_70%_45%/0.15),0_0_20px_hsl(160_70%_45%/0.1)]",
    border: "border-[hsl(160_70%_45%/0.2)]",
    line: "bg-[hsl(160_70%_50%)]",
  },
  error: {
    icon: "text-[hsl(0_75%_60%)]",
    glow: "shadow-[0_0_60px_hsl(0_75%_55%/0.15),0_0_20px_hsl(0_75%_55%/0.1)]",
    border: "border-[hsl(0_75%_55%/0.2)]",
    line: "bg-[hsl(0_75%_60%)]",
  },
  warning: {
    icon: "text-[hsl(40_90%_55%)]",
    glow: "shadow-[0_0_60px_hsl(40_90%_55%/0.12),0_0_20px_hsl(40_90%_55%/0.08)]",
    border: "border-[hsl(40_90%_55%/0.2)]",
    line: "bg-[hsl(40_90%_55%)]",
  },
  info: {
    icon: "text-primary",
    glow: "shadow-[0_0_60px_hsl(330_100%_60%/0.15),0_0_20px_hsl(330_100%_60%/0.1)]",
    border: "border-primary/20",
    line: "bg-primary",
  },
};

function PremiumToastItem({ data, onDone }: { data: PremiumToastData; onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const Icon = iconMap[data.type];
  const colors = colorMap[data.type];

  useEffect(() => {
    requestAnimationFrame(() => setPhase("visible"));
    const timer = setTimeout(() => {
      setPhase("exit");
      setTimeout(onDone, 400);
    }, data.duration || 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center w-[min(340px,calc(100vw-3rem))] rounded-2xl border bg-[hsl(0_0%_5%/0.98)] backdrop-blur-3xl px-8 py-7 transition-all duration-400 ease-out",
        colors.glow,
        colors.border,
        phase === "visible"
          ? "opacity-100 scale-100 translate-y-0"
          : phase === "enter"
          ? "opacity-0 scale-90 -translate-y-6"
          : "opacity-0 scale-95 translate-y-4"
      )}
    >
      {/* Icon */}
      <div className={cn("mb-4", colors.icon)}>
        <Icon className="w-10 h-10" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground tracking-tight">{data.title}</h3>

      {/* Description */}
      {data.description && (
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{data.description}</p>
      )}

      {/* Subtle accent line */}
      <div className={cn("w-12 h-0.5 rounded-full mt-5 opacity-40", colors.line)} />
    </div>
  );
}

export function PremiumToastContainer() {
  const [toasts, setToasts] = useState<PremiumToastData[]>([]);

  useEffect(() => {
    const handler = (t: PremiumToastData) => {
      setToasts((prev) => [...prev, t]);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setToasts([])}
      />
      {/* Toasts */}
      <div className="relative flex flex-col gap-4">
        {toasts.map((t) => (
          <PremiumToastItem
            key={t.id}
            data={t}
            onDone={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
}
