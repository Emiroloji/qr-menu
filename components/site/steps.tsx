"use client";

import { MotionConfig, motion } from "motion/react";

/** "Nasıl çalışır" adımları: ekrana girince kareler sırayla dolar. */
export function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.ol
        initial="idle"
        whileInView="done"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: 0.28 }}
        className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
      >
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <motion.span
                aria-hidden
                variants={{
                  idle: { backgroundColor: "#ffffff", color: "#16211d" },
                  done: { backgroundColor: "#1f4d40", color: "#ffffff" },
                }}
                transition={{ duration: 0.35 }}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-site-green font-site-display text-xl font-bold"
              >
                {i + 1}
              </motion.span>
              {i < steps.length - 1 && (
                <motion.span
                  aria-hidden
                  variants={{ idle: { scaleX: 0 }, done: { scaleX: 1 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="hidden h-0.5 flex-1 origin-left bg-site-green lg:block"
                />
              )}
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="leading-relaxed text-site-muted">{step.text}</p>
          </li>
        ))}
      </motion.ol>
    </MotionConfig>
  );
}
