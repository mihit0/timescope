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
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {events.map((event, index) => (
        <div key={index} className="relative flex items-center gap-6 pl-8">
          <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-semibold">
            {event.year}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.update}</p>
          </div>
        </div>
      ))}
    </div>
  );
}