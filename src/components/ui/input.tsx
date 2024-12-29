import * as React from "react";
import { cn } from "@/utils/shadcn/utils";
import { cva, VariantProps } from "class-variance-authority";

// Define variants for Input
const inputVariants = cva(
  "flex w-full border bg-transparent py-1 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "h-9 rounded-md  border-input shadow-sm px-3",
        underline:
          "h-auto border-0 border-b px-1 border-dotted border-muted focus-visible:ring-0 focus-visible:border-solid focus-visible:border-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
