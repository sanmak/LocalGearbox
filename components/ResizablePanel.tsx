/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * ResizablePanel - Flexible panel layout with draggable dividers
 * Allows users to resize sections dynamically with mouse drag
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  JSX,
} from 'react';

// Context for passing resize state to children
interface ResizableContextType {
  isResizing: boolean;
}

const ResizableContext = createContext<ResizableContextType>({
  isResizing: false,
});

export const useResizable = () => useContext(ResizableContext);

// Direction of the resizable panels
type Direction = 'horizontal' | 'vertical';

interface ResizablePanelGroupProps {
  direction: Direction;
  children: ReactNode;
  className?: string;
  onLayoutChange?: (sizes: number[]) => void;
}

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  className?: string;
  id?: string;
}

interface ResizeHandleProps {
  direction?: Direction;
  className?: string;
  onDoubleClick?: () => void;
}

// Panel Group Component - contains multiple panels with resize handles
export function ResizablePanelGroup({
  direction,
  children,
  className = '',
  onLayoutChange,
}: ResizablePanelGroupProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  // Count panels by filtering valid elements
  const childArray = React.Children.toArray(children);
  const panelCount = childArray.filter(
    (child) =>
      React.isValidElement(child) &&
      (child.type === ResizablePanel ||
        (typeof child.type === 'function' && child.type.name === 'ResizablePanel')),
  ).length;

  // Initialize sizes
  useEffect(() => {
    if (sizes.length === 0 && panelCount > 0) {
      const defaultSize = 100 / panelCount;
      setSizes(Array(panelCount).fill(defaultSize));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelCount]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      setActiveHandle(index);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSizesRef.current = [...sizes];

      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, sizes],
  );

  // Handle mouse move during resize
  useEffect(() => {
    if (!isResizing || activeHandle === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const deltaPercent = (delta / containerSize) * 100;

      const newSizes = [...startSizesRef.current];
      const leftIndex = activeHandle;
      const rightIndex = activeHandle + 1;

      if (rightIndex >= newSizes.length) return;

      // Calculate new sizes
      let newLeft = newSizes[leftIndex] + deltaPercent;
      let newRight = newSizes[rightIndex] - deltaPercent;

      // Enforce min/max constraints (default 10% min, 90% max)
      const minSize = 10;
      const maxSize = 90;

      if (newLeft < minSize) {
        newRight += newLeft - minSize;
        newLeft = minSize;
      }
      if (newRight < minSize) {
        newLeft += newRight - minSize;
        newRight = minSize;
      }
      if (newLeft > maxSize) {
        newRight -= newLeft - maxSize;
        newLeft = maxSize;
      }
      if (newRight > maxSize) {
        newLeft -= newRight - maxSize;
        newRight = maxSize;
      }

      newSizes[leftIndex] = newLeft;
      newSizes[rightIndex] = newRight;

      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (onLayoutChange) {
        onLayoutChange(sizes);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeHandle, direction, onLayoutChange, sizes]);

  // Render children with proper sizing
  const renderChildren = (): ReactNode => {
    const result: ReactNode[] = [];
    let panelIndex = 0;
    let handleIndex = 0;

    React.Children.forEach(children, (child, index) => {
      if (!React.isValidElement(child)) return;

      const childType = child.type;

      // Check if it's a ResizablePanel
      if (
        childType === ResizablePanel ||
        (typeof childType === 'function' && childType.name === 'ResizablePanel')
      ) {
        const size = sizes[panelIndex] || 100 / panelCount;
        const props = child.props as {
          className?: string;
          children?: ReactNode;
        };

        result.push(
          <div
            key={`panel-${index}`}
            className={props.className || ''}
            style={{
              [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
              flexShrink: 0,
              flexGrow: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {props.children}
          </div>,
        );
        panelIndex++;
      }
      // Check if it's a ResizeHandle
      else if (
        childType === ResizeHandle ||
        (typeof childType === 'function' && childType.name === 'ResizeHandle')
      ) {
        const currentHandleIndex = handleIndex;
        result.push(
          <ResizeHandle
            key={`handle-${index}`}
            direction={direction}
            onMouseDown={(e: React.MouseEvent) => handleMouseDown(currentHandleIndex, e)}
          />,
        );
        handleIndex++;
      }
    });

    return result;
  };

  return (
    <ResizableContext.Provider value={{ isResizing }}>
      <div
        ref={containerRef}
        className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} ${className}`}
        style={{ position: 'relative' }}
      >
        {renderChildren()}
      </div>
    </ResizableContext.Provider>
  );
}

// Individual Panel Component - just a wrapper for children
export function ResizablePanel({
  children,
  className: _className = '',
}: ResizablePanelProps): JSX.Element {
  // This component is mainly a marker for the parent
  // The actual rendering is done by the parent
  return <>{children}</>;
}

// Resize Handle Component
export function ResizeHandle({
  direction = 'horizontal',
  className = '',
  onMouseDown,
  onDoubleClick,
}: ResizeHandleProps & {
  onMouseDown?: (e: React.MouseEvent) => void;
}): JSX.Element {
  const { isResizing } = useResizable();

  return (
    <div
      className={`
        relative group
        ${direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isResizing ? 'bg-accent' : 'bg-border hover:bg-accent/50'}
        transition-colors
        ${className}
      `}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {/* Handle grip indicator */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isResizing ? 'opacity-100' : ''}
        `}
      >
        <div
          className={`
            flex gap-0.5
            ${direction === 'horizontal' ? 'flex-col' : 'flex-row'}
          `}
        >
          <div className="w-1 h-1 rounded-full bg-accent" />
          <div className="w-1 h-1 rounded-full bg-accent" />
          <div className="w-1 h-1 rounded-full bg-accent" />
        </div>
      </div>
      {/* Extended hit area */}
      <div
        className={`
          absolute
          ${
            direction === 'horizontal' ? '-left-1 -right-1 inset-y-0' : '-top-1 -bottom-1 inset-x-0'
          }
        `}
      />
    </div>
  );
}

export default ResizablePanelGroup;
