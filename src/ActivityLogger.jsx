import { useEffect } from 'react';

export default function ActivityLogger() {
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onActivity) {
      const handler = (_event, data) => {
        const stored = localStorage.getItem('calendarEvents');
        const events = stored ? JSON.parse(stored) : [];
        events.push({
          title: `${data.app}: ${data.title}`,
          start: data.start,
          end: data.end,
          color: '#1a73e8',
        });
        localStorage.setItem('calendarEvents', JSON.stringify(events));
      };
      window.electronAPI.onActivity(handler);
    }
  }, []);
  return null;
}
