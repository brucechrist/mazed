import React, { useState, useEffect } from "react";
import { Calendar as RBCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-app.css";
import EventModal from "./EventModal.jsx";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

export default function Calendar({ onBack }) {
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("calendarEvents");
    if (!stored) return [];
    try {
      return JSON.parse(stored)
        .filter((e) => e && e.start && e.end && typeof e.title === "string")
        .map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
          kind: e.kind || (e.title.includes(":") ? "done" : "planned"),
        }));
    } catch {
      return [];
    }
  });
  const [modalEvent, setModalEvent] = useState(null);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const handleAdd = (e) => {
      const ev = e.detail;
      setEvents((prev) => [
        ...prev,
        {
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
          kind: ev.kind || "planned",
        },
      ]);
    };
    window.addEventListener("calendar-add-event", handleAdd);
    return () => window.removeEventListener("calendar-add-event", handleAdd);
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
    setModalEvent({ start: s, end: e, kind: "planned" });
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

  const eventPropGetter = (event) => {
    const base = { backgroundColor: event.color || "#1a73e8" };
    if (event.kind === "planned") {
      return {
        className: "planned-event",
        style: base,
      };
    }
    if (event.kind === "done") {
      return {
        className: "done-event",
        style: base,
      };
    }
    return { style: base };
  };

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
          defaultView="month"
          views={["month", "week", "day"]}
          style={{ height: "100%" }}
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
          kind={modalEvent.kind || "planned"}
          onSave={handleSaveEvent}
          onDelete={modalEvent.index != null ? handleDelete : undefined}
          onClose={() => setModalEvent(null)}
        />
      )}
    </div>
  );
}
