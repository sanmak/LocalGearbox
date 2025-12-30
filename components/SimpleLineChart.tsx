/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

interface SimpleLineChartProps {
  x: number[];
  lines: Array<{
    label: string;
    color: string;
    data: number[];
  }>;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  width?: number;
}

// Minimal SVG line chart for 3 lines, responsive, accessible
export default function SimpleLineChart({
  x,
  lines,
  xLabel = 'Attempt',
  yLabel = 'Delay (seconds)',
  height = 220,
  width = 480,
}: SimpleLineChartProps) {
  // Find min/max for scaling
  const allY = lines.flatMap((l) => l.data);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 1);
  const minX = Math.min(...x, 0);
  const maxX = Math.max(...x, 1);
  const pad = 32;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  // Map data to SVG coords
  const getX = (v: number) => pad + ((v - minX) / (maxX - minX)) * chartW;
  const getY = (v: number) => pad + chartH - ((v - minY) / (maxY - minY)) * chartH;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Backoff chart"
    >
      {/* Axes */}
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#ccc" />
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#ccc" />
      {/* Y ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = getY(minY + t * (maxY - minY));
        return (
          <g key={t}>
            <line x1={pad - 4} x2={pad} y1={y} y2={y} stroke="#bbb" />
            <text x={pad - 8} y={y + 4} fontSize={10} textAnchor="end" fill="#888">
              {(minY + t * (maxY - minY)).toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* X ticks */}
      {x.map((v, i) => {
        const xx = getX(v);
        return (
          <g key={i}>
            <line x1={xx} x2={xx} y1={height - pad} y2={height - pad + 4} stroke="#bbb" />
            <text x={xx} y={height - pad + 16} fontSize={10} textAnchor="middle" fill="#888">
              {v}
            </text>
          </g>
        );
      })}
      {/* Lines */}
      {lines.map((line) => (
        <polyline
          key={line.label}
          fill="none"
          stroke={line.color}
          strokeWidth={2}
          points={line.data.map((y, i) => `${getX(x[i])},${getY(y)}`).join(' ')}
        />
      ))}
      {/* Points */}
      {lines.map((line) =>
        line.data.map((y, i) => (
          <circle
            key={line.label + i}
            cx={getX(x[i])}
            cy={getY(y)}
            r={3}
            fill={line.color}
            stroke="#fff"
            strokeWidth={1}
          />
        )),
      )}
      {/* Legend */}
      {lines.map((line, i) => (
        <g key={line.label}>
          <rect x={pad + i * 120} y={8} width={12} height={4} fill={line.color} />
          <text x={pad + 18 + i * 120} y={14} fontSize={12} fill="#444">
            {line.label}
          </text>
        </g>
      ))}
      {/* Labels */}
      <text x={width / 2} y={height - 2} fontSize={12} textAnchor="middle" fill="#666">
        {xLabel}
      </text>
      <text
        x={8}
        y={height / 2}
        fontSize={12}
        textAnchor="middle"
        fill="#666"
        transform={`rotate(-90 8,${height / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  );
}
