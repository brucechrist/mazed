import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import './idea-board.css';

export default function IdeaBoard({ onBack }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 300, height: 300 });
  const initialNodes = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('ideaBoardNodes'));
      if (Array.isArray(stored)) return stored;
    } catch {}
    return [{ id: '1', text: 'Idea', x: 50, y: 50 }];
  };

  const [nodes, setNodes] = useState(initialNodes);

  useEffect(() => {
    document.body.classList.add('idea-board-page');
    return () => {
      document.body.classList.remove('idea-board-page');
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ideaBoardNodes', JSON.stringify(nodes));
  }, [nodes]);

  useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const addNode = () => {
    const id = Date.now().toString();
    setNodes((nds) => [...nds, { id, text: 'New idea', x: 100, y: 100 }]);
  };

  const handleDragEnd = (id, e) => {
    const { x, y } = e.target.position();
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const handleEdit = (id) => {
    const node = nodes.find((n) => n.id === id);
    const text = prompt('Edit idea', node.text);
    if (text !== null) {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, text } : n)));
    }
  };

  return (
    <div className="idea-board">
      <div className="idea-board-controls">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="action-button" onClick={addNode}>Add Idea</button>
      </div>
      <div className="idea-board-flow" ref={containerRef}>
        <Stage width={size.width} height={size.height} className="idea-board-stage">
          <Layer>
            {nodes.map((n) => (
              <Group
                key={n.id}
                x={n.x}
                y={n.y}
                draggable
                onDragEnd={(e) => handleDragEnd(n.id, e)}
                onDblClick={() => handleEdit(n.id)}
              >
                <Rect width={120} height={40} fill="#ffffff" cornerRadius={4} shadowBlur={2} />
                <Text text={n.text} fontSize={16} fill="#000" width={120} padding={8} />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
