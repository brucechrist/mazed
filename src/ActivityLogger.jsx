import { useEffect, useRef } from 'react';

export default function ActivityLogger({ enabled }) {
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onActivity) {
      const handler = (_event, data) => {
        if (!enabledRef.current) return;
        const stored = localStorage.getItem('calendarEvents');
        const events = stored ? JSON.parse(stored) : [];
        const newEvent = {
          title: `${data.app}: ${data.title}`,
          start: data.start,
          end: data.end,
          color: '#1a73e8',
          kind: 'done',
        };
        events.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        window.dispatchEvent(
          new CustomEvent('calendar-add-event', { detail: newEvent })
        );
      };
      window.electronAPI.onActivity(handler);
    }
  }, []);
  return null;
}
