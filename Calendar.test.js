import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calendar from './src/Calendar.jsx';
import { Calendar as RbcCalendar } from 'react-big-calendar';

jest.mock('react-big-calendar', () => {
  const React = require('react');
  const Calendar = jest.fn((props) => {
    Calendar.latestProps = props;
    return <div data-testid="rbc-mock" />;
  });
  const momentLocalizer = () => () => {};
  return { Calendar, momentLocalizer };
});

jest.mock('react-big-calendar/lib/addons/dragAndDrop', () => (comp) => comp);

describe('Calendar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('removes event when deleted from modal', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Neck Training',
          start: start.toISOString(),
          end: end.toISOString(),
          kind: 'planned',
        },
      ])
    );

    render(<Calendar onBack={() => {}} />);

    act(() => {
      RbcCalendar.latestProps.onSelectEvent({
        ...RbcCalendar.latestProps.events[0],
      });
    });

    const delBtn = await screen.findByText('Delete');
    act(() => {
      delBtn.click();
    });

    await waitFor(() => {
      expect(RbcCalendar.latestProps.events).toHaveLength(0);
    });
  });

  test('renders mark done button and marks event complete on click', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Neck Training',
          start: start.toISOString(),
          end: end.toISOString(),
          kind: 'planned',
        },
      ])
    );

    render(<Calendar onBack={() => {}} />);

    const EventComp = RbcCalendar.latestProps.components.event;
    render(EventComp({ event: RbcCalendar.latestProps.events[0] }));

    const doneBtn = screen.getByRole('button', { name: /mark done/i });
    expect(doneBtn).toBeInTheDocument();
    act(() => {
      doneBtn.click();
    });

    await waitFor(() => {
      expect(RbcCalendar.latestProps.events).toHaveLength(1);
    });
    expect(RbcCalendar.latestProps.events[0].kind).toBe('done');
  });

  test('removes original event when marking done with new object instance', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Neck Training',
          start: start.toISOString(),
          end: end.toISOString(),
          kind: 'planned',
        },
      ])
    );

    render(<Calendar onBack={() => {}} />);

    const EventComp = RbcCalendar.latestProps.components.event;
    const copy = { ...RbcCalendar.latestProps.events[0] };
    render(EventComp({ event: copy }));

    const doneBtn = screen.getByText('✓');
    act(() => {
      doneBtn.click();
    });

    await waitFor(() => {
      expect(RbcCalendar.latestProps.events).toHaveLength(1);
    });
    expect(RbcCalendar.latestProps.events[0].kind).toBe('done');
  });

  test('marks event as done from modal button', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Neck Training',
          start: start.toISOString(),
          end: end.toISOString(),
          kind: 'planned',
        },
      ])
    );

    render(<Calendar onBack={() => {}} />);

    act(() => {
      RbcCalendar.latestProps.onSelectEvent({
        ...RbcCalendar.latestProps.events[0],
      });
    });

    const doneBtns = await screen.findAllByRole('button', { name: 'Done' });
    expect(doneBtns).toHaveLength(1);
    act(() => {
      doneBtns[0].click();
    });

    await waitFor(() => {
      expect(RbcCalendar.latestProps.events).toHaveLength(1);
    });
    expect(RbcCalendar.latestProps.events[0].kind).toBe('done');
  });

  test('dragging or resizing does not throw without onMoveEvent', () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Test',
          start: start.toISOString(),
          end: end.toISOString(),
          kind: 'planned',
        },
      ])
    );

    render(<Calendar onBack={() => {}} />);
    const original = RbcCalendar.latestProps.events[0];
    const newStart = new Date(start.getTime() + 60 * 60000);
    const newEnd = new Date(end.getTime() + 60 * 60000);

    expect(() => {
      act(() => {
        RbcCalendar.latestProps.onEventDrop({
          event: original,
          start: newStart,
          end: newEnd,
        });
      });
    }).not.toThrow();

    expect(() => {
      act(() => {
        RbcCalendar.latestProps.onEventResize({
          event: RbcCalendar.latestProps.events[0],
          start: newStart,
          end: newEnd,
        });
      });
    }).not.toThrow();
  });
});
