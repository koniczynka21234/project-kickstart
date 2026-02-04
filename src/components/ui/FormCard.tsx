import * as React from "react";
import { cn } from "@/lib/utils";

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 md:p-8 bg-card border border-border/70 rounded-2xl",
        "shadow-md",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-foreground font-sans mb-1">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
);
FormCard.displayName = "FormCard";

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, label, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {label && (
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </h3>
      )}
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";

interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, cols = 2, children, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-3",
      4: "grid-cols-2 md:grid-cols-4",
    };

    return (
      <div
        ref={ref}
        className={cn("grid gap-4", gridCols[cols], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormRow.displayName = "FormRow";

export { FormCard, FormSection, FormRow };
