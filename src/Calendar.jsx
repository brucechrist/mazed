import React, { useState, useEffect } from 'react';
import { Calendar as RBCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-app.css';
import EventModal from '../EventModal.jsx';

const localizer = momentLocalizer(moment);

export default function Calendar({ onBack }) {
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem('calendarEvents');
    return stored ? JSON.parse(stored) : [];
  });
  const [newEvent, setNewEvent] = useState(null);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({ start, end });
  };

  const handleSaveEvent = (event) => {
    setEvents([...events, event]);
  };

  const handleSelectEvent = (event) => {
    if (window.confirm(`Delete event "${event.title}"?`)) {
      setEvents(events.filter((e) => e !== event));
    }
  };

  const eventPropGetter = (event) => ({
    style: { backgroundColor: event.color || '#1a73e8' },
  });

  return (
    <div className="calendar-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="calendar-container">
        <RBCalendar
          selectable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month', 'week', 'day']}
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
        />
      </div>
      {newEvent && (
        <EventModal
          start={newEvent.start}
          end={newEvent.end}
          onSave={handleSaveEvent}
          onClose={() => setNewEvent(null)}
        />
      )}
    </div>
  );
}
