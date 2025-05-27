import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineEvent {
  year: number;
  title: string;
  update: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  const lineOffset = 16; 

  return (
    <div className="relative pl-10">
      {/* Vertical line */}
      <div
        className="absolute h-full w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"
        style={{ left: `${lineOffset}px` }}
      />

      <div className="space-y-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            className="space-y-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {sortedEvents.map((event, index) => (
              <motion.div
                key={`${event.year}-${event.title}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative pl-20 group"
              >
                {/* Year Circle */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="absolute z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/50 text-primary font-semibold shadow-sm hover:bg-background transition-all duration-200"
                  style={{ left: `${lineOffset - 1}px` }}
                >
                  <div className="absolute inset-0 rounded-full bg-background z-0" />
                  <span className="relative z-10">{event.year}</span>
                </motion.div>

                {/* Content card */}
                <motion.div
                  initial={{ x: -5, opacity: 0.8 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ x: 5 }}
                  className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-200 ml-2"
                >
                  <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{event.update}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
