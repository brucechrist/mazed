import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as RBCalendar,
  momentLocalizer,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-app.css';
import EventModal from './EventModal.jsx';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

export default function Calendar({ onBack }) {
  const [plans, setPlans] = useState(() => {
    const stored = localStorage.getItem('calendarPlans');
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState(() => {
    const stored = localStorage.getItem('calendarLogs');
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
    } catch {
      return [];
    }
  });
  const [modalEvent, setModalEvent] = useState(null);
  const events = useMemo(
    () => [
      ...plans.map((e) => ({ ...e, type: 'plan' })),
      ...logs.map((e) => ({ ...e, type: 'log' })),
    ],
    [plans, logs]
  );

  useEffect(() => {
    localStorage.setItem('calendarPlans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('calendarLogs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const handleAdd = (e) => {
      const ev = e.detail;
      setLogs((prev) => [
        ...prev,
        {
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
        },
      ]);
    };
    window.addEventListener('calendar-add-log', handleAdd);
    return () => window.removeEventListener('calendar-add-log', handleAdd);
  }, []);

  const handleSelectSlot = ({ start, end }) => {
    if (!start || !end) return;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return;
    setModalEvent({ start: s, end: e, type: 'plan' });
  };

  const handleSaveEvent = (event) => {
    if (modalEvent && modalEvent.index != null) {
      if (modalEvent.type === 'log') {
        const updated = [...logs];
        updated[modalEvent.index] = event;
        setLogs(updated);
      } else {
        const updated = [...plans];
        updated[modalEvent.index] = event;
        setPlans(updated);
      }
    } else {
      if (modalEvent && modalEvent.type === 'log') {
        setLogs([...logs, event]);
      } else {
        setPlans([...plans, event]);
      }
    }
  };

  const handleSelectEvent = (event) => {
    const idx = event.type === 'log'
      ? logs.indexOf(event)
      : plans.indexOf(event);
    setModalEvent({ ...event, index: idx, type: event.type });
  };

  const eventPropGetter = (event) => ({
    className: event.type === 'log' ? 'log-event' : 'plan-event',
    style: { backgroundColor: event.color || '#1a73e8' },
  });

  const moveEvent = ({ event, start, end }) => {
    if (event.type === 'log') {
      const idx = logs.indexOf(event);
      if (idx !== -1) {
        const updated = [...logs];
        updated[idx] = { ...event, start, end };
        setLogs(updated);
      }
    } else {
      const idx = plans.indexOf(event);
      if (idx !== -1) {
        const updated = [...plans];
        updated[idx] = { ...event, start, end };
        setPlans(updated);
      }
    }
  };

  const resizeEvent = ({ event, start, end }) => {
    moveEvent({ event, start, end });
  };

  const handleDelete = () => {
    if (modalEvent && modalEvent.index != null) {
      if (modalEvent.type === 'log') {
        setLogs(logs.filter((_, i) => i !== modalEvent.index));
      } else {
        setPlans(plans.filter((_, i) => i !== modalEvent.index));
      }
    }
  };

  return (
    <div className="calendar-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="calendar-container">
        <DnDCalendar
          selectable
          resizable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month', 'week', 'day']}
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          eventPropGetter={eventPropGetter}
        />
      </div>
      {modalEvent && (
        <EventModal
          start={modalEvent.start}
          end={modalEvent.end}
          title={modalEvent.title}
          color={modalEvent.color}
          onSave={handleSaveEvent}
          onDelete={modalEvent.index != null ? handleDelete : undefined}
          onClose={() => setModalEvent(null)}
        />
      )}
    </div>
  );
}
