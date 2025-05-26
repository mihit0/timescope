import React from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  year: number;
  title: string;
  update: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  // Ensure events are sorted chronologically
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  // Define the new left offset for tighter alignment
  const lineOffset = 16; // pixels

  return (
    <div className="relative pl-10">
      {/* Vertical line, closer to the left */}
      <div
        className="absolute h-full w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"
        style={{ left: `${lineOffset}px` }}
      />

      <div className="space-y-10">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative pl-20 group"
          >
            {/* Year Circle repositioned to match the line */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="absolute z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/50 text-primary font-semibold shadow-sm hover:bg-background transition-all duration-200"
              style={{ left: `${lineOffset - 1}px` }} // center on the 1px line
            >
              <div className="absolute inset-0 rounded-full bg-background z-0" />
              <span className="relative z-10">{event.year}</span>
            </motion.div>

            {/* Content card */}
            <motion.div
              whileHover={{ x: 5 }}
              className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-200 ml-2"
            >
              <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.update}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
