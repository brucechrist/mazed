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
});
