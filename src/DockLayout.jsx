import React, { useEffect, useRef } from 'react';
import GoldenLayout from 'golden-layout';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-light-theme.css';

export default function DockLayout() {
  const containerRef = useRef(null);

  useEffect(() => {
    const config = {
      content: [
        {
          type: 'row',
          content: [
            { type: 'component', componentName: 'left', title: 'Left Pane' },
            { type: 'component', componentName: 'right', title: 'Right Pane' }
          ]
        }
      ]
    };

    const layout = new GoldenLayout(config, containerRef.current);

    layout.registerComponent('left', (container) => {
      container.getElement().html('<div style="padding:10px;">Left content</div>');
    });

    layout.registerComponent('right', (container) => {
      container.getElement().html('<div style="padding:10px;">Right content</div>');
    });

    layout.init();

    return () => {
      layout.destroy();
    };
  }, []);

  return <div style={{ height: '100%', width: '100%' }} ref={containerRef} />;
}
