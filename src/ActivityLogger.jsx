import { useEffect, useRef } from 'react';

export default function ActivityLogger({ enabled }) {
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const roundSlot = (date) => {
    const d = new Date(date);
    d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0);
    return d;
  };

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
          color: '#888888',
          kind: 'done',
        };
        events.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        window.dispatchEvent(
          new CustomEvent('calendar-add-event', { detail: newEvent })
        );

        const blockStart = roundSlot(data.start);
        const blockEnd = new Date(blockStart.getTime() + 30 * 60000);
        const blocks = JSON.parse(localStorage.getItem('calendarBlocks') || '[]');
        let block = blocks.find((b) => b.start === blockStart.toISOString());
        if (!block) {
          block = {
            start: blockStart.toISOString(),
            end: blockEnd.toISOString(),
            items: [],
            kind: 'block',
            color: '#000000',
          };
          blocks.push(block);
        }
        block.items.push({
          label: `${data.app}: ${data.title}`,
          duration: new Date(data.end).getTime() - new Date(data.start).getTime(),
        });
        block.title = block.items
          .map((i) => i.label.split(':')[0])
          .slice(0, 2)
          .join(', ');
        if (block.items.length > 2) block.title += ' & more';
        localStorage.setItem('calendarBlocks', JSON.stringify(blocks));
        window.dispatchEvent(
          new CustomEvent('calendar-add-block', { detail: block })
        );
      };
      window.electronAPI.onActivity(handler);
    }
  }, []);
  return null;
}
