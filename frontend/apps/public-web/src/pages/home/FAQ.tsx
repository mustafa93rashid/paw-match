import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";

const faqs = [
  {
    question: "How does Paw Match verify shelters?",
    answer:
      "Every shelter is reviewed and manually approved before any of their animals become publicly visible. Only active, approved shelters appear anywhere on the site.",
  },
  {
    question: "How does the matching system work?",
    answer:
      "You create an adopter profile describing your home, experience, and lifestyle. Animals are then ranked by compatibility across factors like species, home type, activity level, and more.",
  },
  {
    question: "What happens after I submit an adoption request?",
    answer:
      "The shelter reviews your request and may move it through interview and home-check stages before approving or rejecting it — you can track status changes the whole way.",
  },
  {
    question: "Can I book a vet appointment before adopting?",
    answer:
      "Yes. Veterinarians connected to the shelter network are browsable and bookable for consultations and behavior training appointments.",
  },
  {
    question: "Is adopting through Paw Match free?",
    answer:
      "Creating an account and browsing is free. Any adoption fees are set directly by individual shelters, not by Paw Match.",
  },
];

const AccordionItem = ({
  question,
  answer,
  isOpen,
  onToggle,
  reduceMotion,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
}) => (
  <div className="border-b border-slate-200 py-2">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-4 py-4 text-left"
    >
      <span className="text-lg font-semibold text-slate-900">{question}</span>
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isOpen ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </motion.span>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQ = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 sm:py-28">
      <Container className="mx-auto max-w-3xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Questions
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
              reduceMotion={reduceMotion}
            />
          ))}
        </motion.div>
      </Container>
    </section>
  );
};
