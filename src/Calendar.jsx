import React, { useState, useEffect, useRef } from "react";
import { Calendar as RBCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-app.css";
import EventModal from "../EventModal.jsx";
import BlockModal from "./BlockModal.jsx";

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
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("calendarEvents");
    if (!stored) return [];
    try {
      return JSON.parse(stored)
        .filter(
          (e) =>
            e &&
            e.start &&
            e.end &&
            typeof e.title === "string" &&
            e.title.trim() !== ""
        )
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
  const [blocks, setBlocks] = useState(() => {
    const stored = localStorage.getItem('calendarBlocks');
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((b) => ({
        ...b,
        start: new Date(b.start),
        end: new Date(b.end),
      }));
    } catch {
      return [];
    }
  });
  const [modalEvent, setModalEvent] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const containerRef = useRef(null);
  const lastClickX = useRef(null);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('calendarBlocks', JSON.stringify(blocks));
  }, [blocks]);

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

  useEffect(() => {
    const handleBlockAdd = (e) => {
      const b = e.detail;
      setBlocks((prev) => {
        const idx = prev.findIndex(
          (p) => new Date(p.start).getTime() === new Date(b.start).getTime()
        );
        const block = {
          ...b,
          start: new Date(b.start),
          end: new Date(b.end),
        };
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = block;
          return updated;
        }
        return [...prev, block];
      });
    };
    window.addEventListener('calendar-add-block', handleBlockAdd);
    return () => window.removeEventListener('calendar-add-block', handleBlockAdd);
  }, []);

  useEffect(() => {
    const capture = (e) => {
      lastClickX.current = e.clientX;
    };
    const node = containerRef.current;
    if (node) {
      node.addEventListener("mousedown", capture);
    }
    return () => {
      if (node) node.removeEventListener("mousedown", capture);
    };
  }, []);

  const handleSelectSlot = ({ start, end, bounds, box }) => {
    if (!start || !end) return;
    let mid = null;
    let clickX = null;
    if (bounds && box) {
      mid = (bounds.left + bounds.right) / 2;
      clickX = box.x ?? bounds.left;
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mid = rect.left + rect.width / 2;
      clickX = lastClickX.current;
    }
    if (mid != null && clickX != null && clickX > mid) {
      return;
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
    if (event.kind === 'block') {
      setSelectedBlock(event);
    } else {
      setModalEvent({
        ...event,
        index: events.indexOf(event),
        original: event,
      });
    }
  };

  const eventPropGetter = (event) => {
    const base = {
      backgroundColor:
        event.color || (event.kind === "done" ? "#34a853" : "#888888"),
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

  const handleDelete = (target) => {
    const toDelete = target || (modalEvent && modalEvent.original);
    if (toDelete) {
      setEvents(events.filter((ev) => ev !== toDelete));
    }
  };

  const moveEvent = ({ event, start, end }) => {
    if (event.kind === 'block') return;
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

  return (
    <div className="calendar-app">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <div className="calendar-container" ref={containerRef}>
        <DnDCalendar
          selectable
          resizable
          localizer={localizer}
          events={[...events, ...blocks]}
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
          onSave={handleSaveEvent}
          onDelete={modalEvent.index != null ? handleDelete : undefined}
          onClose={() => setModalEvent(null)}
        />
      )}
      {selectedBlock && (
        <BlockModal
          start={selectedBlock.start}
          end={selectedBlock.end}
          items={selectedBlock.items}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
