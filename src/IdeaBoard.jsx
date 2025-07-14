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
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editPos, setEditPos] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    document.body.classList.add('idea-board-page');
    return () => {
      document.body.classList.remove('idea-board-page');
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ideaBoardNodes', JSON.stringify(nodes));
  }, [nodes]);

  const deleteNode = (id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    setMenu(null);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        deleteNode(selectedId);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      setSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const addNode = () => {
    const id = Date.now().toString();
    const newNode = { id, text: '', x: 100, y: 100 };
    setNodes((nds) => [...nds, newNode]);
    setSelectedId(id);
    setEditPos({ x: newNode.x, y: newNode.y });
    setEditingText('');
    setEditingId(id);
  };

  const handleDragEnd = (id, e) => {
    const { x, y } = e.target.position();
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const finishEdit = () => {
    if (editingId) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingId ? { ...n, text: editingText || 'Idea' } : n
        )
      );
    }
    setEditingId(null);
  };

  const handleEdit = (id) => {
    const node = nodes.find((n) => n.id === id);
    setEditingText(node.text);
    setEditPos({ x: node.x, y: node.y });
    setEditingId(id);
  };

  return (
    <div className="idea-board">
      <div className="idea-board-controls">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="action-button" onClick={addNode}>Add Idea</button>
      </div>
      <div className="idea-board-flow" ref={containerRef}>
        <Stage
          width={size.width}
          height={size.height}
          className="idea-board-stage"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null);
            setMenu(null);
          }}
        >
          <Layer>
            {nodes.map((n) => (
              <Group
                key={n.id}
                x={n.x}
                y={n.y}
                draggable
                onDragEnd={(e) => handleDragEnd(n.id, e)}
                onDblClick={() => handleEdit(n.id)}
                onClick={() => setSelectedId(n.id)}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  const rect = containerRef.current.getBoundingClientRect();
                  setMenu({ id: n.id, x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top });
                  setSelectedId(n.id);
                }}
              >
               <Rect
                  width={120}
                  height={40}
                  fill="#ffffff"
                  cornerRadius={4}
                  shadowBlur={2}
                  stroke={selectedId === n.id ? '#1646F1' : undefined}
               />
                <Text text={n.text} fontSize={16} fill="#000" width={120} padding={8} />
              </Group>
            ))}
          </Layer>
        </Stage>
        {editingId && (
          <textarea
            className="idea-edit-input"
            style={{ left: editPos.x, top: editPos.y }}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
              }
            }}
            autoFocus
          />
        )}
        {menu && (
          <div
            className="context-menu"
            style={{ left: menu.x, top: menu.y }}
          >
            <button onClick={() => deleteNode(menu.id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
