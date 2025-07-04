import React, { useState, useEffect, useMemo } from "react";
import { Calendar as RBCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-app.css";
import EventModal from "./EventModal.jsx";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

function CalendarEvent({ event, onDelete }) {
  return (
    <div className="calendar-event-content">
      {event.title}
      <span
        className="event-delete-icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(event);
        }}
      >
        ×
      </span>
    </div>
  );
}

export default function Calendar({ onBack }) {
  const parseStored = (key) => {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        kind: e.kind || (e.title?.includes(":") ? "done" : "planned"),
        description: e.description || "",
      }));
    } catch {
      return [];
    }
  };

  const [plans, setPlans] = useState(() => parseStored('calendarPlans'));
  const [logs, setLogs] = useState(() => parseStored('calendarLogs'));
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
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const handleAdd = (e) => {
      const ev = e.detail;
      const newEvent = {
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
        kind: ev.kind || 'planned',
        description: ev.description || '',
      };
      if (newEvent.kind === 'done') {
        setLogs((prev) => [...prev, newEvent]);
      } else {
        setPlans((prev) => [...prev, newEvent]);
      }
    };
    window.addEventListener('calendar-add-event', handleAdd);
    return () => window.removeEventListener('calendar-add-event', handleAdd);
  }, []);

  const handleSelectSlot = ({ start, end, bounds, box }) => {
    if (!start || !end) return;

    if (bounds && box) {
      const mid = (bounds.left + bounds.right) / 2;
      const clickX = box.x ?? bounds.left;
      if (clickX > mid) {
        // Ignore clicks on the right half; reserved for auto logs
        return;
      }
    }

    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return;
    setModalEvent({ start: s, end: e, kind: "planned", description: "" });
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

  const eventPropGetter = (event) => {
    const base = {
      backgroundColor:
        event.color || (event.kind === "done" ? "#34a853" : "#1a73e8"),
    };
    if (event.kind === "planned") {
      return {
        className: "planned-event",
        style: { ...base, left: "0%", width: "50%" },
      };
    }
    if (event.kind === "done") {
      return {
        className: "done-event",
        style: { ...base, left: "50%", width: "50%" },
      };
    }
    if (event.kind === "block") {
      return {
        className: "block-event",
        style: {
          backgroundColor: "#17181d",
          color: "#fff",
          left: "50%",
          width: "50%",
        },
      };
    }
    return { style: base };
  };

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
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <div className="calendar-container">
        <DnDCalendar
          selectable
          resizable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          tooltipAccessor="description"
          defaultView="month"
          views={["month", "week", "day"]}
          style={{ height: "100%" }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          eventPropGetter={eventPropGetter}
          components={{
            event: (props) => (
              <CalendarEvent {...props} onDelete={handleDelete} />
            ),
          }}
        />
      </div>
      {modalEvent && (
          <EventModal
            start={modalEvent.start}
            end={modalEvent.end}
            title={modalEvent.title}
            color={modalEvent.color}
            kind={modalEvent.kind || "planned"}
            description={modalEvent.description}
            onSave={handleSaveEvent}
            onDelete={modalEvent.index != null ? handleDelete : undefined}
            onClose={() => setModalEvent(null)}
          />
      )}
    </div>
  );
}
