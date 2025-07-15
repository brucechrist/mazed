import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Transformer,
  Line,
} from 'react-konva';
import './idea-board.css';

export default function IdeaBoard({ onBack }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 300, height: 300 });
  const initialNodes = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('ideaBoardNodes'));
      if (Array.isArray(stored)) {
        return stored.map((n) => ({
          type: 'note',
          width: 120,
          height: 40,
          ...n,
        }));
      }
    } catch {}
    return [
      {
        id: '1',
        type: 'note',
        text: 'Idea',
        x: 50,
        y: 50,
        width: 120,
        height: 40,
      },
    ];
  };

  const [nodes, setNodes] = useState(initialNodes);
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editPos, setEditPos] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState('');
  const [editSize, setEditSize] = useState({ width: 120, height: 40 });
  const [tool, setTool] = useState('select');
  const [shapeMenu, setShapeMenu] = useState(false);
  const [tempShape, setTempShape] = useState(null);
  const rectRefs = useRef({});
  const transformerRef = useRef(null);

  const [boardTheme, setBoardTheme] = useState(() =>
    localStorage.getItem('ideaBoardTheme') ||
    (document.body.classList.contains('light-theme') ? 'light' : 'dark')
  );

  useEffect(() => {
    localStorage.setItem('ideaBoardTheme', boardTheme);
  }, [boardTheme]);

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

  useEffect(() => {
    if (!transformerRef.current) return;
    const node = rectRefs.current[selectedId]?.current;
    if (selectedId && node) {
      transformerRef.current.nodes([node]);
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, nodes]);

  const addNode = () => {
    const id = Date.now().toString();
    const newNode = {
      id,
      type: 'note',
      text: '',
      x: 100,
      y: 100,
      width: 120,
      height: 40,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedId(id);
    setEditPos({ x: newNode.x, y: newNode.y });
    setEditSize({ width: newNode.width, height: newNode.height });
    setEditingText('');
    setEditingId(id);
  };

  const addRect = (x = 100, y = 100) => {
    const id = Date.now().toString();
    const newNode = {
      id,
      type: 'rect',
      x,
      y,
      width: 120,
      height: 80,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedId(id);
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
    if (!node || node.text === undefined) return;
    setEditingText(node.text);
    setEditPos({ x: node.x, y: node.y });
    setEditSize({ width: node.width, height: node.height });
    setEditingId(id);
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        shapeMenu &&
        !e.target.closest('.shape-menu') &&
        !e.target.closest('.tool-button')
      ) {
        setShapeMenu(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [shapeMenu]);

  return (
    <div className="idea-board">
      <div className="idea-board-controls">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="action-button" onClick={addNode}>Add Idea</button>
      </div>
      <div
        className={`idea-board-flow${boardTheme === 'light' ? ' light' : ''}`}
        ref={containerRef}
      >
        <button
          aria-label="toggle board theme"
          className="board-theme-toggle"
          onClick={() =>
            setBoardTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: boardTheme === 'light' ? '#fff' : '#333',
            color: boardTheme === 'light' ? '#000' : '#fff',
          }}
        >
          {boardTheme === 'light' ? '☀️' : '🌙'}
        </button>
        <Stage
          width={size.width}
          height={size.height}
          className="idea-board-stage"
          onMouseDown={(e) => {
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();
            if (!pos) return;

            if (tool === 'text') {
              const id = Date.now().toString();
              const newNode = {
                id,
                type: 'note',
                text: '',
                x: pos.x,
                y: pos.y,
                width: 120,
                height: 40,
              };
              setNodes((nds) => [...nds, newNode]);
              setSelectedId(id);
              setEditPos({ x: newNode.x, y: newNode.y });
              setEditSize({ width: newNode.width, height: newNode.height });
              setEditingText('');
              setEditingId(id);
              setTool('select');
              return;
            }

            if (tool === 'pencil' || tool === 'frame') {
              setTempShape({ type: tool, start: pos });
              return;
            }

            if (e.target === stage) setSelectedId(null);
            setShapeMenu(false);
            setMenu(null);
          }}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();
            if (!pos || !tempShape) return;
            setTempShape({ ...tempShape, end: pos });
          }}
          onMouseUp={(e) => {
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();
            if (tempShape && pos) {
              const id = Date.now().toString();
              if (tempShape.type === 'pencil') {
                const line = {
                  id,
                  type: 'pencil',
                  points: [tempShape.start.x, tempShape.start.y, pos.x, pos.y],
                };
                setNodes((nds) => [...nds, line]);
              } else if (tempShape.type === 'frame') {
                const rect = {
                  id,
                  type: 'frame',
                  x: Math.min(tempShape.start.x, pos.x),
                  y: Math.min(tempShape.start.y, pos.y),
                  width: Math.abs(pos.x - tempShape.start.x),
                  height: Math.abs(pos.y - tempShape.start.y),
                };
                setNodes((nds) => [...nds, rect]);
              }
              setTool('select');
            }
            setTempShape(null);
          }}
        >
          <Layer>
            {nodes.map((n) => {
              if (n.type === 'pencil') {
                return (
                  <Line
                    key={n.id}
                    points={n.points}
                    stroke="#000"
                    strokeWidth={2}
                    lineCap="round"
                    onClick={() => setSelectedId(n.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      const rect = containerRef.current.getBoundingClientRect();
                      setMenu({
                        id: n.id,
                        x: e.evt.clientX - rect.left,
                        y: e.evt.clientY - rect.top,
                      });
                      setSelectedId(n.id);
                    }}
                  />
                );
              }

              return (
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
                    setMenu({
                      id: n.id,
                      x: e.evt.clientX - rect.left,
                      y: e.evt.clientY - rect.top,
                    });
                    setSelectedId(n.id);
                  }}
                >
                  <Rect
                    ref={(el) => {
                      if (el) rectRefs.current[n.id] = { current: el };
                    }}
                    width={n.width}
                    height={n.height}
                    fill={n.type === 'frame' ? undefined : '#ffffff'}
                    cornerRadius={4}
                    shadowBlur={n.type === 'note' ? 2 : 0}
                    stroke={selectedId === n.id ? '#1646F1' : '#000'}
                    dash={n.type === 'frame' ? [6, 4] : undefined}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const width = node.width() * node.scaleX();
                      const height = node.height() * node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      setNodes((nds) =>
                        nds.map((nn) =>
                          nn.id === n.id ? { ...nn, width, height } : nn
                        )
                      );
                    }}
                  />
                  {n.text !== undefined && (
                    <Text
                      text={n.text}
                      fontSize={16}
                      fill="#000"
                      width={n.width}
                      height={n.height}
                      padding={8}
                    />
                  )}
                </Group>
              );
            })}
            <Transformer ref={transformerRef} rotateEnabled={false} />
          </Layer>
        </Stage>
        <div className="idea-toolbar">
          {['select', 'frame', 'shape', 'pencil', 'text'].map((t) => (
            <button
              key={t}
              className={`tool-button${tool === t ? ' active' : ''}`}
              onClick={() => {
                setTool(t);
                if (t === 'shape') setShapeMenu((o) => !o);
                else setShapeMenu(false);
              }}
            >
              {t === 'select' && '🖱️'}
              {t === 'frame' && '▭'}
              {t === 'shape' && '□▾'}
              {t === 'pencil' && '✏️'}
              {t === 'text' && 'T'}
            </button>
          ))}
        </div>
        {editingId && (
          <textarea
            className="idea-edit-input"
            style={{ left: editPos.x, top: editPos.y, width: editSize.width, height: editSize.height }}
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
      {shapeMenu && (
        <div className="shape-menu">
          <button
            onClick={() => {
              const center = {
                x: size.width / 2 - 60,
                y: size.height / 2 - 40,
              };
              addRect(center.x, center.y);
              setShapeMenu(false);
            }}
          >
            Rectangle
          </button>
          <button onClick={() => setShapeMenu(false)}>Line</button>
          <button onClick={() => setShapeMenu(false)}>Arrow</button>
          <button onClick={() => setShapeMenu(false)}>Ellipse</button>
          <button onClick={() => setShapeMenu(false)}>Polygon</button>
          <button onClick={() => setShapeMenu(false)}>Image</button>
        </div>
      )}
    </div>
  );
}
