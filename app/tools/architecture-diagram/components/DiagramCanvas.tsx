/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useDiagramStore } from '../store/diagram-store';

const COMPONENT_COLORS: Record<string, string> = {
  server: '#3B82F6', // blue-500
  database: '#10B981', // green-500
  api: '#8B5CF6', // purple-500
  cache: '#F59E0B', // orange-500
  queue: '#EAB308', // yellow-500
  gateway: '#06B6D4', // cyan-500
  function: '#EC4899', // pink-500
  user: '#6B7280', // gray-500
  storage: '#6366F1', // indigo-500
  'load-balancer': '#14B8A6', // teal-500
  firewall: '#EF4444', // red-500
  cdn: '#A855F7', // violet-500
  dns: '#84CC16', // lime-500
  container: '#0EA5E9', // sky-500
  vm: '#2563EB', // blue-600
  'cloud-service': '#7C3AED', // violet-600
  'external-service': '#9CA3AF', // gray-400
  custom: '#64748B', // slate-500
};

export function DiagramCanvas() {
  const {
    components,
    connections,
    selectComponent,
    selectedComponentIds,
    addComponent,
    addConnection,
  } = useDiagramStore();

  const [connectingState, setConnectingState] = useState<{
    isConnecting: boolean;
    startComponentId: string | null;
    startPoint: { x: number; y: number } | null;
    currentPoint: { x: number; y: number } | null;
  }>({
    isConnecting: false,
    startComponentId: null,
    startPoint: null,
    currentPoint: null,
  });

  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  const handleComponentClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!connectingState.isConnecting) {
      selectComponent(id, event.shiftKey);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const componentType = event.dataTransfer.getData('component-type');
    const componentLabel = event.dataTransfer.getData('component-label');

    if (!componentType) return;

    // Get drop position relative to element
    // We need to account for the transform (pan/zoom)
    // simpler to just use the raw client offsets relative to the container for now
    // or better, calculate relative to the SVG 0,0

    // NOTE: This drop logic places at raw mouse coordinates inside SVG
    // For a robust implementation with zoom/pan, we would need to inverse transform.
    // However, keeping consistent with existing logic for now.
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // In a real app with zoom, we'd adjust x/y by scale factor.
    // Assuming initial scale 1 for simplicity or that direct drop works "okay".

    const id = `${componentType}-${Date.now()}`;
    addComponent({
      id,
      type: componentType as any,
      label: componentLabel,
      position: { x, y: y - 40 }, // Center vertically-ish
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const startConnection = (
    e: React.MouseEvent,
    componentId: string,
    position: { x: number; y: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingState({
      isConnecting: true,
      startComponentId: componentId,
      startPoint: position,
      currentPoint: position,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (connectingState.isConnecting) {
      // Calculate SVG-relative coordinates

      // We also need to account for the pan/zoom transform technically if we want absolute precision,
      // but since we are rendering inside the TransformComponent, the mouse events are raw DOM events.
      // Wait, <svg> is inside TransformComponent.
      // If we move mouse over SVG, the coordinates will be local to the SVG if we used clientX/Y properly mapped.
      // Easiest handling: map mouse directly to SVG coordinate space.

      // Since SVG is scaled/panned, event.nativeEvent.offsetX / offsetY is often reliable for local coords
      // IF the target is the SVG/g itself.
      // Let's rely on standard logic:
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;

      setConnectingState((prev) => ({
        ...prev,
        currentPoint: { x, y },
      }));
    }
  };

  const onMouseUp = (_e: React.MouseEvent) => {
    if (connectingState.isConnecting) {
      // If dropped on a valid target (handled by component mouse up? or global check?)
      // Global check is safer if we know boundaries.
      // But easier: check if specific handle was clicked?
      // Or simplified: if we mouse up over a component.
      // Let's use internal state tracking if we are hovering a component.

      if (hoveredComponentId && hoveredComponentId !== connectingState.startComponentId) {
        addConnection({
          id: `conn-${Date.now()}`,
          from: connectingState.startComponentId!,
          to: hoveredComponentId,
          type: 'default' as any,
        });
      }

      setConnectingState({
        isConnecting: false,
        startComponentId: null,
        startPoint: null,
        currentPoint: null,
      });
    }
  };

  // Helper to render connection points
  const RenderHandles = ({ component, isVisible }: { component: any; isVisible: boolean }) => {
    if (!isVisible) return null;

    const { x, y } = component.position || { x: 0, y: 0 };
    const w = 120;
    const h = 80;

    // Top, Right, Bottom, Left
    const handles = [
      { x: x + w / 2, y: y, dir: 'top' },
      { x: x + w, y: y + h / 2, dir: 'right' },
      { x: x + w / 2, y: y + h, dir: 'bottom' },
      { x: x, y: y + h / 2, dir: 'left' },
    ];

    return (
      <g>
        {handles.map((handle, i) => (
          <circle
            key={i}
            cx={handle.x}
            cy={handle.y}
            r={6}
            className="fill-primary stroke-background cursor-crosshair hover:scale-125 transition-transform"
            strokeWidth={2}
            onMouseDown={(e) => startConnection(e, component.id, { x: handle.x, y: handle.y })}
          />
        ))}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full bg-background">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={4}
        centerOnInit
        disabled={connectingState.isConnecting} // Disable pan/zoom while connecting
      >
        <TransformComponent wrapperClass="w-full h-full">
          <svg
            width="4000"
            height="3000"
            className="w-full h-full"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted-foreground opacity-10"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Existing Connections */}
            <g>
              {connections.map((conn) => {
                const fromComp = components.find((c) => c.id === conn.from);
                const toComp = components.find((c) => c.id === conn.to);
                if (!fromComp || !toComp) return null;

                // Simple center-to-center for MVP
                // Phase 3 can do smart pathing
                const fromX = (fromComp.position?.x || 0) + 60;
                const fromY = (fromComp.position?.y || 0) + 40;
                const toX = (toComp.position?.x || 0) + 60;
                const toY = (toComp.position?.y || 0) + 40;

                return (
                  <g key={conn.id}>
                    <line
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
            </g>

            {/* Pending Connection Line */}
            {connectingState.isConnecting &&
              connectingState.startPoint &&
              connectingState.currentPoint && (
                <line
                  x1={connectingState.startPoint.x}
                  y1={connectingState.startPoint.y}
                  x2={connectingState.currentPoint.x}
                  y2={connectingState.currentPoint.y}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-primary pointer-events-none"
                  markerEnd="url(#arrowhead)"
                />
              )}

            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill="currentColor"
                  className="text-muted-foreground"
                />
              </marker>
            </defs>

            {/* Components */}
            <g>
              {components.map((component) => {
                const x = component.position?.x || 100;
                const y = component.position?.y || 100;
                const isSelected = selectedComponentIds.includes(component.id);
                const isHovered = hoveredComponentId === component.id;
                const color = COMPONENT_COLORS[component.type] || '#64748B';

                return (
                  <g
                    key={component.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={(e) => handleComponentClick(component.id, e)}
                    onMouseEnter={() => setHoveredComponentId(component.id)}
                    onMouseLeave={() => setHoveredComponentId(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="80"
                      rx="8"
                      fill={color}
                      fillOpacity="0.1"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all"
                    />
                    {isSelected && (
                      <rect
                        x="-4"
                        y="-4"
                        width="128"
                        height="88"
                        rx="10"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )}
                    <text
                      x="60"
                      y="30"
                      className="text-sm font-medium fill-foreground"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {component.label}
                    </text>
                    <text
                      x="60"
                      y="50"
                      className="text-xs fill-muted-foreground"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {component.type}
                    </text>

                    {/* Render handles if selected or hovered or connecting */}
                    {(isSelected || isHovered || connectingState.isConnecting) && (
                      <foreignObject width="1" height="1" style={{ overflow: 'visible' }}>
                        {/* Trying to use pure SVG circles instead of React component to avoid nesting issues if possible,
                                 but RenderHandles is fine if returns <g> elements.
                                 Wait, foreignObject is for HTML. We can just call the function.
                              */}
                      </foreignObject>
                    )}
                  </g>
                );
              })}

              {/* Separate pass for handles so they are on top?
                  Or just render them inside the loop. The loop is easier.
               */}
              {components.map((component) => (
                <RenderHandles
                  key={component.id + '-handles'}
                  component={component}
                  isVisible={
                    hoveredComponentId === component.id ||
                    selectedComponentIds.includes(component.id) ||
                    (connectingState.isConnecting && hoveredComponentId === component.id)
                  }
                />
              ))}
            </g>
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Empty state */}
      {components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No components yet</p>
            <p className="text-sm mt-2">Drag components from the left panel to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
