import React, { useState, useEffect } from 'react';
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
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem('calendarEvents');
    return stored ? JSON.parse(stored) : [];
  });
  const [modalEvent, setModalEvent] = useState(null);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleSelectSlot = ({ start, end }) => {
    setModalEvent({ start, end });
  };

  const handleSaveEvent = (event) => {
    if (modalEvent && modalEvent.index != null) {
      const updated = [...events];
      updated[modalEvent.index] = event;
      setEvents(updated);
    } else {
      setEvents([...events, event]);
    }
  };

  const handleSelectEvent = (event) => {
    setModalEvent({ ...event, index: events.indexOf(event) });
  };

  const eventPropGetter = (event) => ({
    style: { backgroundColor: event.color || '#1a73e8' },
  });

  const moveEvent = ({ event, start, end }) => {
    const idx = events.indexOf(event);
    if (idx !== -1) {
      const updated = [...events];
      updated[idx] = { ...event, start, end };
      setEvents(updated);
    }
  };

  const resizeEvent = ({ event, start, end }) => {
    moveEvent({ event, start, end });
  };

  const handleDelete = () => {
    if (modalEvent && modalEvent.index != null) {
      setEvents(events.filter((_, i) => i !== modalEvent.index));
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
