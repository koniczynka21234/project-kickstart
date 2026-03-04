import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      offset={24}
      gap={8}
      duration={2500}
      icons={{
        success: <CheckCircle2 className="w-4 h-4 text-[hsl(160_70%_50%)]" strokeWidth={2.5} />,
        error: <XCircle className="w-4 h-4 text-[hsl(0_75%_60%)]" strokeWidth={2.5} />,
        warning: <AlertTriangle className="w-4 h-4 text-[hsl(40_90%_55%)]" strokeWidth={2.5} />,
        info: <Info className="w-4 h-4 text-primary" strokeWidth={2.5} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[hsl(0_0%_100%/0.06)] backdrop-blur-xl border border-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_88%)] text-[13px] font-medium tracking-tight shadow-[0_8px_40px_hsl(0_0%_0%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.04)] w-fit max-w-[380px] ml-auto pointer-events-auto",
          description: "text-[hsl(0_0%_50%)] text-[11px] font-normal ml-0.5",
          actionButton: "bg-primary/15 text-primary border border-primary/20 rounded-full px-3 py-1 text-[11px] font-medium hover:bg-primary/25 transition-colors ml-2",
          cancelButton: "bg-[hsl(0_0%_100%/0.05)] text-[hsl(0_0%_55%)] rounded-full px-3 py-1 text-[11px] border border-[hsl(0_0%_100%/0.06)] hover:bg-[hsl(0_0%_100%/0.1)] transition-colors",
          success: "!border-[hsl(160_70%_45%/0.15)] !shadow-[0_8px_40px_hsl(0_0%_0%/0.5),0_0_24px_hsl(160_70%_45%/0.08),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
          error: "!border-[hsl(0_75%_55%/0.15)] !shadow-[0_8px_40px_hsl(0_0%_0%/0.5),0_0_24px_hsl(0_75%_55%/0.08),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
          warning: "!border-[hsl(40_90%_55%/0.15)] !shadow-[0_8px_40px_hsl(0_0%_0%/0.5),0_0_24px_hsl(40_90%_55%/0.08),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
          info: "!border-primary/15 !shadow-[0_8px_40px_hsl(0_0%_0%/0.5),0_0_24px_hsl(330_100%_60%/0.08),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
