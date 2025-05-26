import React from 'react';

interface TimelineEvent {
  year: number;
  title: string;
  update: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 h-full w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
      
      <div className="space-y-10">
        {events.map((event, index) => (
          <div key={index} className="relative pl-16 group">
            {/* Year circle with glow effect */}
            <div className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary/50 text-primary font-semibold shadow-sm group-hover:bg-primary/10 transition-colors duration-200">
              {event.year}
            </div>
            
            {/* Content card */}
            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card transition-colors duration-200">
              <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.update}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}