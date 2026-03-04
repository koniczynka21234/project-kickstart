import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border/50 transition-all duration-300",
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent data-[state=checked]:border-primary/50 data-[state=checked]:shadow-[0_0_12px_hsl(330_100%_60%/0.4)]",
      "data-[state=unchecked]:bg-secondary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-md ring-0 transition-all duration-300",
        "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-white data-[state=checked]:shadow-[0_0_8px_hsl(330_100%_60%/0.3)]",
        "data-[state=unchecked]:translate-x-0.5 data-[state=unchecked]:bg-muted-foreground/60",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
