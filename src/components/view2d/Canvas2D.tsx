import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point2D, Shape2D } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Eye } from 'lucide-react';
import { formatNumber } from '../../mathematics/matrix';

interface Canvas2DProps {
  originalShape: Shape2D;
  transformedPoints: Point2D[];
  animating?: boolean;
  animationProgress?: number; // 0 to 1
  selectedPointLabel?: string | null;
  onSelectPoint?: (label: string) => void;
  showVectors?: boolean;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  originalShape,
  transformedPoints,
  animating = false,
  animationProgress = 1,
  selectedPointLabel,
  onSelectPoint,
  showVectors = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport camera: scale = pixels per mathematical unit; center = mathematical coordinates at canvas center
  const [scale, setScale] = useState<number>(45); // 45px per math unit
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // offset in math units
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPointLabel, setHoveredPointLabel] = useState<string | null>(null);

  // Auto-fit function
  const autoFit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const allPoints = [...originalShape.points, ...transformedPoints];
    if (allPoints.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    allPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // Also include origin (0,0) in viewport for educational clarity
    minX = Math.min(minX, -1);
    maxX = Math.max(maxX, 1);
    minY = Math.min(minY, -1);
    maxY = Math.max(maxY, 1);

    const padding = 2.5; // math units
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    const rect = canvas.getBoundingClientRect();
    const pixelWidth = rect.width;
    const pixelHeight = rect.height;

    const scaleX = pixelWidth / width;
    const scaleY = pixelHeight / height;
    const newScale = Math.max(15, Math.min(120, Math.min(scaleX, scaleY)));

    setScale(newScale);
    setPan({
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    });
  }, [originalShape.points, transformedPoints]);

  const resetView = () => {
    setScale(45);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(s => Math.min(s * 1.25, 200));
  const zoomOut = () => setScale(s => Math.max(s / 1.25, 10));

  // Export Canvas as PNG
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `matrix-lab-2d-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Convert math coord (x, y) to canvas screen coords (px, py)
  const mathToScreen = useCallback(
    (mx: number, my: number, canvasWidth: number, canvasHeight: number) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const sx = centerX + (mx - pan.x) * scale;
      const sy = centerY - (my - pan.y) * scale; // Y inverted in screen coords
      return { x: sx, y: sy };
    },
    [pan, scale]
  );

  // Convert screen coords (sx, sy) to math coords (mx, my)
  const screenToMath = useCallback(
    (sx: number, sy: number, canvasWidth: number, canvasHeight: number) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const mx = (sx - centerX) / scale + pan.x;
      const my = (centerY - sy) / scale + pan.y;
      return { x: mx, y: my };
    },
    [pan, scale]
  );

  // Mouse pan & zoom handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setPan(prev => ({ x: prev.x - dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Check hover on vertices
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found: string | null = null;
      const threshold = 12; // pixel radius

      // Check transformed points
      transformedPoints.forEach(p => {
        const screen = mathToScreen(p.x, p.y, rect.width, rect.height);
        const dist = Math.hypot(screen.x - mouseX, screen.y - mouseY);
        if (dist <= threshold) found = p.label;
      });

      // Check original points
      originalShape.points.forEach(p => {
        const screen = mathToScreen(p.x, p.y, rect.width, rect.height);
        const dist = Math.hypot(screen.x - mouseX, screen.y - mouseY);
        if (dist <= threshold) found = p.label;
      });

      setHoveredPointLabel(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPointLabel && onSelectPoint) {
      onSelectPoint(hoveredPointLabel);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale(s => Math.max(10, Math.min(220, s * factor)));
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, w, h);

    // 1. Draw Grid
    const step = scale < 25 ? 2 : scale > 80 ? 0.5 : 1;
    const bounds = {
      min: screenToMath(0, h, w, h),
      max: screenToMath(w, 0, w, h),
    };

    const startX = Math.floor(bounds.min.x / step) * step;
    const endX = Math.ceil(bounds.max.x / step) * step;
    const startY = Math.floor(bounds.min.y / step) * step;
    const endY = Math.ceil(bounds.max.y / step) * step;

    // Minor Gridlines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      const p1 = mathToScreen(x, bounds.min.y, w, h);
      const p2 = mathToScreen(x, bounds.max.y, w, h);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    for (let y = startY; y <= endY; y += step) {
      const p1 = mathToScreen(bounds.min.x, y, w, h);
      const p2 = mathToScreen(bounds.max.x, y, w, h);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // 2. Draw Axes
    const origin = mathToScreen(0, 0, w, h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569'; // slate-600
    ctx.beginPath();
    // X Axis
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    // Y Axis
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Axis Labels and Ticks
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X Ticks
    for (let x = startX; x <= endX; x += step) {
      if (Math.abs(x) < 1e-9) continue; // Skip origin
      const p = mathToScreen(x, 0, w, h);
      if (p.x >= 10 && p.x <= w - 10) {
        ctx.beginPath();
        ctx.strokeStyle = '#64748b';
        ctx.moveTo(p.x, origin.y - 3);
        ctx.lineTo(p.x, origin.y + 3);
        ctx.stroke();
        ctx.fillText(formatNumber(x, 2), p.x, origin.y + 6);
      }
    }

    // Y Ticks
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startY; y <= endY; y += step) {
      if (Math.abs(y) < 1e-9) continue;
      const p = mathToScreen(0, y, w, h);
      if (p.y >= 10 && p.y <= h - 10) {
        ctx.beginPath();
        ctx.strokeStyle = '#64748b';
        ctx.moveTo(origin.x - 3, p.y);
        ctx.lineTo(origin.x + 3, p.y);
        ctx.stroke();
        ctx.fillText(formatNumber(y, 2), origin.x - 6, p.y);
      }
    }

    // Origin crosshair & (0,0) label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText('0', origin.x - 6, origin.y + 6);

    // 3. Draw Directional Transformation Vectors (Original -> Transformed)
    if (showVectors && transformedPoints.length === originalShape.points.length) {
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#a855f770'; // purple transparent

      originalShape.points.forEach((pOrig, idx) => {
        const pTrans = transformedPoints[idx];
        const sOrig = mathToScreen(pOrig.x, pOrig.y, w, h);
        const sTrans = mathToScreen(pTrans.x, pTrans.y, w, h);

        ctx.beginPath();
        ctx.moveTo(sOrig.x, sOrig.y);
        ctx.lineTo(sTrans.x, sTrans.y);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(sTrans.y - sOrig.y, sTrans.x - sOrig.x);
        const headLen = 6;
        if (Math.hypot(sTrans.x - sOrig.x, sTrans.y - sOrig.y) > 12) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.fillStyle = '#a855f7aa';
          ctx.moveTo(sTrans.x, sTrans.y);
          ctx.lineTo(
            sTrans.x - headLen * Math.cos(angle - Math.PI / 6),
            sTrans.y - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            sTrans.x - headLen * Math.cos(angle + Math.PI / 6),
            sTrans.y - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.setLineDash([]);
    }

    // 4. Draw Original Shape (Subtle Blue/Indigo, Dashed outline)
    const drawPolygon = (
      points: Point2D[],
      edges: [number, number][] | undefined,
      isClosed: boolean | undefined,
      strokeColor: string,
      fillColor: string,
      isDashed: boolean = false
    ) => {
      if (points.length === 0) return;

      ctx.save();
      if (isDashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = 2.5;

      if (edges && edges.length > 0) {
        // Draw individual specified edges
        edges.forEach(([i1, i2]) => {
          if (points[i1] && points[i2]) {
            const p1 = mathToScreen(points[i1].x, points[i1].y, w, h);
            const p2 = mathToScreen(points[i2].x, points[i2].y, w, h);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      } else if (points.length > 1) {
        // Sequential outline
        ctx.beginPath();
        const start = mathToScreen(points[0].x, points[0].y, w, h);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
          const pt = mathToScreen(points[i].x, points[i].y, w, h);
          ctx.lineTo(pt.x, pt.y);
        }
        if (isClosed) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    // Draw Original Object
    drawPolygon(
      originalShape.points,
      originalShape.edges,
      originalShape.isClosed,
      '#38bdf888', // light blue with alpha
      '#0284c722',
      true
    );

    // Compute Animated Interp Points
    const currentTransformedPoints: Point2D[] = transformedPoints.map((tp, idx) => {
      const orig = originalShape.points[idx] || tp;
      const interpX = orig.x + (tp.x - orig.x) * animationProgress;
      const interpY = orig.y + (tp.y - orig.y) * animationProgress;
      return {
        ...tp,
        x: interpX,
        y: interpY,
      };
    });

    // Draw Transformed Shape (Vibrant Emerald Solid)
    drawPolygon(
      currentTransformedPoints,
      originalShape.edges,
      originalShape.isClosed,
      '#10b981', // vibrant emerald
      '#10b98133',
      false
    );

    // 5. Draw Vertices and Labels
    const drawVertices = (
      points: Point2D[],
      color: string,
      isTransformed: boolean = false
    ) => {
      points.forEach(pt => {
        const screen = mathToScreen(pt.x, pt.y, w, h);
        const isTarget = pt.label === selectedPointLabel || pt.label === hoveredPointLabel;

        // Vertex Circle
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, isTarget ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = isTarget ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Label Badge
        const labelText = isTransformed ? `${pt.label}'` : pt.label;
        const coordText = `(${formatNumber(pt.x)}, ${formatNumber(pt.y)})`;

        ctx.font = isTarget ? 'bold 12px "Fira Code", monospace' : '11px "Fira Code", monospace';
        ctx.fillStyle = isTarget ? '#ffffff' : color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Draw shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(labelText, screen.x + 8, screen.y - 8);

        if (isTarget) {
          ctx.font = '10px "Fira Code", monospace';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(coordText, screen.x + 8, screen.y + 7);
        }
        ctx.shadowBlur = 0;
      });
    };

    // Draw Original Vertices
    drawVertices(originalShape.points, '#38bdf8', false);
    // Draw Transformed Vertices
    drawVertices(currentTransformedPoints, '#10b981', true);

  }, [
    scale,
    pan,
    originalShape,
    transformedPoints,
    animationProgress,
    selectedPointLabel,
    hoveredPointLabel,
    showVectors,
    mathToScreen,
    screenToMath,
  ]);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Viewport Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={zoomIn}
          title="Zoom In (+)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom Out (-)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Reset View (Center Origin)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={autoFit}
          title="Auto-Fit Objects"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 size={16} />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={exportPNG}
          title="Export Canvas as PNG"
          className="p-1.5 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/40 rounded transition-colors"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Aspect Ratio & Scale indicator */}
      <div className="absolute bottom-3 right-3 px-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-[11px] font-mono text-slate-400 backdrop-blur-md">
        1:1 Aspect Ratio | Scale: {Math.round(scale)}px/unit
      </div>

      {/* Interactive Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 shadow-lg backdrop-blur-md text-xs space-y-1.5 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-1.5 border-t-2 border-dashed border-sky-400 rounded-sm" />
          <span className="text-sky-300 font-medium">Original Object (P)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-2 bg-emerald-500/30 border border-emerald-400 rounded-sm" />
          <span className="text-emerald-300 font-medium">Transformed Object (P')</span>
        </div>
        {showVectors && (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-1 border-t border-dotted border-purple-400" />
            <span className="text-purple-300 text-[11px]">Transformation Vector</span>
          </div>
        )}
      </div>

      {/* Pan & Zoom Hint */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900/70 rounded text-[10px] text-slate-400 border border-slate-800/60 pointer-events-none">
        Drag to Pan • Scroll to Zoom • Click Vertex to Inspect
      </div>
    </div>
  );
};
