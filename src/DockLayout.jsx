import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoldenLayout } from 'golden-layout';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-light-theme.css';
import Calendar from './Calendar.jsx';
import DayPlanner from './DayPlanner.jsx';
import Moodtracker from './Moodtracker.jsx';
import MusicSearch from './MusicSearch.jsx';
import ShadowWork from './ShadowWork.jsx';

const componentMap = {
  calendar: { title: 'Calendar', component: Calendar },
  dayPlanner: { title: 'Day Planner', component: DayPlanner },
  moodtracker: { title: 'Mood Tracker', component: Moodtracker },
  musicSearch: { title: 'Music Search', component: MusicSearch },
  shadowWork: { title: 'Shadow Work', component: ShadowWork },
};

export default function DockLayout() {
  const containerRef = useRef(null);

  useEffect(() => {
    const config = {
      content: [
        {
          type: 'row',
          content: [
            { type: 'component', componentName: 'calendar', title: 'Calendar' },
            { type: 'component', componentName: 'dayPlanner', title: 'Day Planner' },
          ],
        },
      ],
    };

    const layout = new GoldenLayout(config, containerRef.current);

    Object.entries(componentMap).forEach(([name, { component: Comp }]) => {
      layout.registerComponent(name, (container) => {
        const element = container.getElement()[0];
        const root = createRoot(element);
        root.render(<Comp />);
        container.on('destroy', () => root.unmount());
      });
    });

    layout.init();
    window.dockLayout = layout;

    return () => {
      layout.destroy();
      delete window.dockLayout;
    };
  }, []);

  return <div style={{ height: '100%', width: '100%' }} ref={containerRef} />;
}
