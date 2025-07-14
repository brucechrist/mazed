import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './idea-board.css';

function TextNode({ id, data }) {
  const onBlur = (e) => {
    data.onChange(id, e.target.innerText);
  };

  return (
    <div className="text-node">
      <div contentEditable suppressContentEditableWarning onBlur={onBlur}>
        {data.label}
      </div>
    </div>
  );
}

export default function IdeaBoard({ onBack }) {
  const initialNodes = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('ideaNodes'));
      if (Array.isArray(stored)) return stored;
    } catch {}
    return [
      { id: '1', type: 'text', data: { label: 'Idea' }, position: { x: 50, y: 50 } },
    ];
  };

  const initialEdges = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('ideaEdges'));
      if (Array.isArray(stored)) return stored;
    } catch {}
    return [];
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges());

  useEffect(() => {
    localStorage.setItem('ideaNodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('ideaEdges', JSON.stringify(edges));
  }, [edges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeChange = useCallback(
    (id, label) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
      );
    },
    [setNodes]
  );

  const addNode = () => {
    const id = Date.now().toString();
    setNodes((nds) => [
      ...nds,
      { id, type: 'text', data: { label: 'New idea', onChange: handleNodeChange }, position: { x: 100, y: 100 } },
    ]);
  };

  // inject handler into nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        type: 'text',
        data: { ...n.data, onChange: handleNodeChange },
      }))
    );
  }, []); // run once

  const nodeTypes = { text: TextNode };

  return (
    <div className="idea-board">
      <div className="idea-board-controls">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="action-button" onClick={addNode}>Add Idea</button>
      </div>
      <div className="idea-board-flow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
