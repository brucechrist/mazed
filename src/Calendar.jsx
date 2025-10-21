import React, { useState, useEffect, useRef } from "react";
import { Calendar as RBCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-app.css";
import EventModal from "./EventModal.jsx";
import BlockModal from "./BlockModal.jsx";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);
const ACTIVE_EVENT_KIND = "active";

function CalendarEvent({ event, onDelete, onMarkDone }) {
  return (
    <div className="calendar-event-content">
      {event.title}
      {event.kind !== "done" && (
        <button
          type="button"
          className="event-done-button"
          aria-label="Mark done"
          onClick={(e) => {
            e.stopPropagation();
            onMarkDone(event);
          }}
        >
          ✓
        </button>
      )}
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

/**
 * Calendar component used throughout the app.
 *
 * @param {Object} props
 * @param {Function} [props.onMoveEvent] - Callback fired when an event is moved
 * or resized. Receives the original event followed by the updated event.
 */
export default function Calendar({
  onBack,
  backLabel = 'Back',
  defaultView = 'month',
  externalActivity = null,
  onExternalDrop,
  backDisabled = false,
  onDeleteEvent,
  onMoveEvent,
}) {
  const roundSlot = (date) => {
    const d = new Date(date);
    d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0);
    return d;
  };

  const hydrateEvent = (event) => {
    if (!event || !event.start || !event.end) {
      return null;
    }

    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    const kind = event.kind || "planned";
    let adjustedEnd = end;
    if (kind === ACTIVE_EVENT_KIND) {
      const now = new Date();
      if (!Number.isNaN(now.getTime()) && now.getTime() > start.getTime()) {
        if (now.getTime() > adjustedEnd.getTime()) {
          adjustedEnd = now;
        }
      }
    }

    return {
      ...event,
      start,
      end: adjustedEnd,
      kind,
    };
  };

  const serializeEvents = (list) =>
    [...list]
      .map((event) => ({
        id: event.id ?? null,
        title: event.title,
        start:
          event.start instanceof Date
            ? event.start.getTime()
            : new Date(event.start).getTime(),
        end:
          event.end instanceof Date
            ? event.end.getTime()
            : new Date(event.end).getTime(),
        kind: event.kind || "planned",
        color: event.color || "",
      }))
      .sort((a, b) => {
        if (a.id != null && b.id != null && a.id !== b.id) {
          return String(a.id).localeCompare(String(b.id));
        }
        if (a.start !== b.start) return a.start - b.start;
        if (a.end !== b.end) return a.end - b.end;
        if (a.title !== b.title) return a.title.localeCompare(b.title);
        if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
        return a.color.localeCompare(b.color);
      });

  const eventsAreEqual = (prev, next) => {
    if (prev.length !== next.length) {
      return false;
    }
    return (
      JSON.stringify(serializeEvents(prev)) ===
      JSON.stringify(serializeEvents(next))
    );
  };

  const parseStoredEvents = () => {
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
        .map(hydrateEvent)
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const [events, setEvents] = useState(() => parseStoredEvents());
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
    window.dispatchEvent(new Event('calendar-updated'));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('calendarBlocks', JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    const handleAdd = (e) => {
      const incoming = hydrateEvent(e.detail);
      if (!incoming) {
        return;
      }

      setEvents((prev) => {
        const byIdIndex =
          incoming.id != null
            ? prev.findIndex((event) => event.id === incoming.id)
            : -1;
        if (byIdIndex !== -1) {
          const updated = [...prev];
          updated[byIdIndex] = { ...prev[byIdIndex], ...incoming };
          return updated;
        }

        const fallbackIndex = prev.findIndex(
          (event) =>
            event.title === incoming.title &&
            event.start.getTime() === incoming.start.getTime() &&
            event.end.getTime() === incoming.end.getTime() &&
            (event.kind || "planned") === incoming.kind
        );

        if (fallbackIndex !== -1) {
          const updated = [...prev];
          updated[fallbackIndex] = { ...prev[fallbackIndex], ...incoming };
          return updated;
        }

        return [...prev, incoming];
      });
    };
    window.addEventListener("calendar-add-event", handleAdd);
    return () => window.removeEventListener("calendar-add-event", handleAdd);
  }, []);

  useEffect(() => {
    const handleUpdated = () => {
      setEvents((prev) => {
        const parsed = parseStoredEvents();
        if (eventsAreEqual(prev, parsed)) {
          return prev;
        }
        return parsed;
      });
    };
    window.addEventListener('calendar-updated', handleUpdated);
    return () => window.removeEventListener('calendar-updated', handleUpdated);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) =>
        prev.map((event) => {
          if ((event.kind || 'planned') !== ACTIVE_EVENT_KIND) {
            return event;
          }
          const now = new Date();
          if (
            Number.isNaN(now.getTime()) ||
            now.getTime() <= event.start.getTime() ||
            now.getTime() - event.end.getTime() < 30000
          ) {
            return event;
          }
          return { ...event, end: now };
        })
      );
    }, 30000);

    return () => clearInterval(interval);
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
    if (modalEvent && modalEvent.index != null && modalEvent.index !== -1) {
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
      const idx = events.findIndex(
        (ev) =>
          ev.title === event.title &&
          ev.start.getTime() === new Date(event.start).getTime() &&
          ev.end.getTime() === new Date(event.end).getTime()
      );
      setModalEvent({
        ...event,
        index: idx,
        original: event,
      });
    }
  };

  const handleMarkDone = (event) => {
    const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
    const start = roundSlot(new Date());
    const end = new Date(start.getTime() + duration);
    const done = { ...event, start, end, kind: 'done', color: '#34a853' };
    setEvents((prev) =>
      prev
        .filter(
          (ev) =>
            !(
              ev.title === event.title &&
              ev.start.getTime() === new Date(event.start).getTime() &&
              ev.end.getTime() === new Date(event.end).getTime()
            )
        )
        .concat(done)
    );
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
    if (event.kind === ACTIVE_EVENT_KIND) {
      return {
        className: "done-event active-event",
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
      setEvents((prev) =>
        prev.filter(
          (ev) =>
            !(
              ev.title === toDelete.title &&
              ev.start.getTime() === new Date(toDelete.start).getTime() &&
              ev.end.getTime() === new Date(toDelete.end).getTime()
            )
        )
      );
      if (onDeleteEvent) onDeleteEvent(toDelete);
      setModalEvent(null);
    }
  };

  const moveEvent = ({ event, start, end }) => {
    if (event.kind === 'block') return;
    const idx = events.indexOf(event);
    if (idx !== -1) {
      const updated = [...events];
      const next = { ...event, start, end };
      updated[idx] = next;
      setEvents(updated);
      if (onMoveEvent) onMoveEvent(event, next);
    }
  };

  const resizeEvent = ({ event, start, end }) => {
    moveEvent({ event, start, end });
  };

  return (
    <div className="calendar-app">
      <button className="back-button" onClick={onBack} disabled={backDisabled}>
        {backLabel}
      </button>
      <div className="calendar-container" ref={containerRef}>
        <DnDCalendar
          selectable
          resizable
          localizer={localizer}
          events={[...events, ...blocks]}
          startAccessor="start"
          endAccessor="end"
          defaultView={defaultView}
          views={["month", "week", "day"]}
          style={{ height: "100%" }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          eventPropGetter={eventPropGetter}
          dragFromOutsideItem={() => externalActivity}
          onDropFromOutside={({ start }) => {
            if (!externalActivity) return;
            const duration = externalActivity.base || 30;
            const ev = {
              title: externalActivity.title,
              start: new Date(start),
              end: new Date(new Date(start).getTime() + duration * 60000),
              kind: 'planned',
              color: '#4285f4',
            };
            setEvents((prev) => [...prev, ev]);
            if (onExternalDrop) onExternalDrop(ev);
          }}
          onDragOver={(e) => {
            if (externalActivity) {
              e.preventDefault();
            }
          }}
          components={{
            event: (props) => (
              <CalendarEvent
                {...props}
                onDelete={handleDelete}
                onMarkDone={handleMarkDone}
              />
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
          onDone={
            modalEvent.index != null
              ? () => handleMarkDone(modalEvent.original)
              : undefined
          }
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
