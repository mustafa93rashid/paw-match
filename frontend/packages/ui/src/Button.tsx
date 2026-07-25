import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@paw-match/utilities";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileTap={reduceMotion || isDisabled ? undefined : { scale: 0.97 }}
      whileHover={reduceMotion || isDisabled ? undefined : { scale: 1.02 }}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
};
