import React from 'react';
import './timeline.css';

export default function Timeline({ onBack }) {
  const stages = ['S1', 'S2', 'S3', 'S4'];
  const tracks = ['D', 'B', 'A', 'C', 'E'];
  const xSpacing = 120;
  const ySpacing = 80;
  const startX = 160; // position of S1
  const startY = 60;  // position of row D
  const radius = 20;

  const nodeA = { x: startX - xSpacing, y: startY + ySpacing * 2 };
  const nodeB = { x: startX + stages.length * xSpacing, y: nodeA.y };

  const stageX = (i) => startX + i * xSpacing;
  const trackY = (j) => startY + j * ySpacing;

  // Breadcrumb dots for track A
  const breadcrumbDots = (x1, x2, y, labels = []) => {
    const count = 5;
    const dots = [];
    for (let i = 1; i <= count; i++) {
      const x = x1 + ((x2 - x1) * i) / (count + 1);
      const label = labels[i - 1];
      dots.push({ x, y, label });
    }
    return dots;
  };

  return (
    <div className="timeline-container">
      <button className="back-button" onClick={onBack}>Back</button>
      <svg
        className="timeline-svg"
        width={startX + (stages.length + 1) * xSpacing}
        height={startY + tracks.length * ySpacing}
      >
        {/* Connections from A to S1 */}
        {tracks.map((t, j) => (
          <line
            key={`a-${t}`}
            x1={nodeA.x}
            y1={nodeA.y}
            x2={stageX(0)}
            y2={trackY(j)}
            stroke="black"
            strokeWidth={4}
          />
        ))}

        {/* Stage connections */}
        {tracks.map((track, j) =>
          stages.slice(0, -1).map((s, i) => {
            const x1 = stageX(i);
            const x2 = stageX(i + 1);
            const y = trackY(j);
            if (track === 'A') {
              const labels = i === 0 ? ['A', 'B', 'C', 'D'] : [];
              const dots = breadcrumbDots(x1, x2, y, labels);
              return (
                <g key={`crumb-${i}-${j}`} className="breadcrumb">
                  {dots.map((d, idx) => (
                    <g key={idx}>
                      <circle cx={d.x} cy={d.y} r={4} />
                      {d.label && (
                        <text x={d.x} y={d.y - 6} textAnchor="middle">
                          {d.label}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              );
            }
            return (
              <line
                key={`${track}-${i}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="#cccccc"
                strokeWidth={2}
              />
            );
          })
        )}

        {/* Connections from S4 to B */}
        {tracks.map((t, j) => (
          <line
            key={`b-${t}`}
            x1={stageX(stages.length - 1)}
            y1={trackY(j)}
            x2={nodeB.x}
            y2={nodeB.y}
            stroke="black"
            strokeWidth={4}
          />
        ))}

        {/* Grid nodes */}
        {tracks.map((track, j) =>
          stages.map((stage, i) => (
            <g
              key={`${stage}-${track}`}
              className="grid-node"
              transform={`translate(${stageX(i)}, ${trackY(j)})`}
            >
              <circle r={radius} />
              <text textAnchor="middle" dy="-4">
                {stage}
              </text>
              <text textAnchor="middle" dy="12">
                {track}
              </text>
            </g>
          ))
        )}

        {/* Endpoint nodes */}
        <g className="endpoint" transform={`translate(${nodeA.x}, ${nodeA.y})`}>
          <circle r={radius + 4} />
          <text textAnchor="middle" dy="4">
            A
          </text>
        </g>
        <g className="endpoint" transform={`translate(${nodeB.x}, ${nodeB.y})`}>
          <circle r={radius + 4} />
          <text textAnchor="middle" dy="4">
            B
          </text>
        </g>
      </svg>
    </div>
  );
}
