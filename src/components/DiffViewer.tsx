'use client';

import React from 'react';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';

interface DiffViewerProps {
  originalSummary: string;
  modernSummary: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export function DiffViewer({ originalSummary, modernSummary }: DiffViewerProps) {
  const cards = [
    {
      title: 'Original Summary',
      content: originalSummary,
    },
    {
      title: 'Modern Summary (2024)',
      content: modernSummary,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Card className="hover-lift bg-white dark:bg-zinc-900 shadow-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {card.content}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
