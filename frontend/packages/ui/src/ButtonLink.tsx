import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps } from "react";
import { cn } from "@paw-match/utilities";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

const MotionLink = motion.create(Link);

export interface ButtonLinkProps extends ComponentProps<typeof MotionLink> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Same visual style as `Button`, but renders a real navigable `<a>` via React Router. */
export const ButtonLink = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <MotionLink
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </MotionLink>
  );
};
