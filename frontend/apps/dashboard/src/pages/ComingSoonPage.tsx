import { motion, useReducedMotion } from "framer-motion";
import { Construction } from "lucide-react";
import { EmptyState } from "@paw-match/ui";

export interface ComingSoonPageProps {
  title: string;
  description?: string;
}

/**
 * Shared placeholder for every Dashboard section not yet built — this
 * phase only delivers the layout and shared components; pages are added
 * one at a time afterward, per the approved implementation order.
 */
export const ComingSoonPage = ({ title, description }: ComingSoonPageProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <div className="mt-8">
        <EmptyState
          icon={<Construction className="h-6 w-6" aria-hidden />}
          title="This section is coming soon"
          description={description ?? "This part of the Dashboard hasn't been built yet."}
        />
      </div>
    </motion.div>
  );
};
