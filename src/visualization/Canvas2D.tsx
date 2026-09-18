// ============================================================
// 2D Canvas Coordinate Plane — High-Precision Visualizer
// ============================================================
import React, { useRef, useEffect, useCallback } from 'react';

interface Shape2DCanvasProps {
  originalPts: [number, number][];
  transformedPts: [number, number][];
  edges: [number, number][];
  animated?: boolean;
  progress?: number;
  onVertexClick?: (index: number) => void;
  highlightVertex?: number | null;
  presentationMode?: boolean;
  showVectors?: boolean;
  showBasis?: boolean;
  T?: number[][];
}

const COLORS = {
  original: '#38bdf8',       // Cyan blueprint
  transformed: '#f97316',    // Vibrant orange
  vector: '#a855f7',         // Purple motion vector
  basisI: '#ef4444',         // Red i-hat
  basisJ: '#22c55e',         // Green j-hat
  grid: '#16233b',
  gridMajor: '#203354',
  axis: '#475569',
  text: '#94a3b8',
  bg: '#090d18',
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function drawArrowhead(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, size = 7) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(toX, toY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.5);
  ctx.lineTo(-size * 0.7, 0);
  ctx.lineTo(-size, size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBadgeRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
}

export const Canvas2D: React.FC<Shape2DCanvasProps> = ({
  originalPts,
  transformedPts,
  edges,
  animated = false,
  progress = 1,
  onVertexClick,
  highlightVertex,
  presentationMode = false,
  showVectors = true,
  showBasis = false,
  T,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deviceRatio = window.devicePixelRatio ?? 1;

  // Compute viewport bounds
  const computeBounds = useCallback(() => {
    let allPts = [...originalPts, ...transformedPts];
    if (showBasis) {
      allPts.push([1, 0], [0, 1]);
      if (T && T.length >= 2 && T[0]?.length >= 2) {
        allPts.push([T[0][0], T[1][0]], [T[0][1], T[1][1]]);
      }
    }
    if (allPts.length === 0) return { minX: -6, maxX: 6, minY: -6, maxY: 6 };
    let minX = Math.min(...allPts.map(p => p[0]));
    let maxX = Math.max(...allPts.map(p => p[0]));
    let minY = Math.min(...allPts.map(p => p[1]));
    let maxY = Math.max(...allPts.map(p => p[1]));

    const padX = Math.max(1.8, (maxX - minX) * 0.3);
    const padY = Math.max(1.8, (maxY - minY) * 0.3);
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    // Always include origin (0, 0) with a buffer
    minX = Math.min(minX, -2); maxX = Math.max(maxX, 2);
    minY = Math.min(minY, -2); maxY = Math.max(maxY, 2);

    // Keep square aspect ratio
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const range = Math.max(maxX - minX, maxY - minY);
    return {
      minX: cx - range / 2,
      maxX: cx + range / 2,
      minY: cy - range / 2,
      maxY: cy + range / 2,
    };
  }, [originalPts, transformedPts, showBasis, T]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / deviceRatio;
    const H = canvas.height / deviceRatio;
    ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);

    const bounds = computeBounds();
    const { minX, maxX, minY, maxY } = bounds;

    const toCanvasX = (x: number) => ((x - minX) / (maxX - minX)) * W;
    const toCanvasY = (y: number) => H - ((y - minY) / (maxY - minY)) * H;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Adaptive Grid Steps
    const range = maxX - minX;
    const rawStep = range / 12;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;

    // Grid lines
    const startX = Math.floor(minX / step) * step;
    for (let x = startX; x <= maxX + step; x += step) {
      const cx = toCanvasX(x);
      const isMajor = Math.abs(x % (step * 5)) < 0.001;
      ctx.strokeStyle = isMajor ? COLORS.gridMajor : COLORS.grid;
      ctx.lineWidth = isMajor ? 1 : 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.stroke();
    }

    const startY = Math.floor(minY / step) * step;
    for (let y = startY; y <= maxY + step; y += step) {
      const cy = toCanvasY(y);
      const isMajor = Math.abs(y % (step * 5)) < 0.001;
      ctx.strokeStyle = isMajor ? COLORS.gridMajor : COLORS.grid;
      ctx.lineWidth = isMajor ? 1 : 0.6;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();
    }

    // Axes
    const ox = toCanvasX(0), oy = toCanvasY(0);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    if (ox >= 0 && ox <= W) {
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
    }
    if (oy >= 0 && oy <= H) {
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
    }

    // Origin indicator
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // Axis labels
    ctx.fillStyle = COLORS.text;
    ctx.font = `600 ${presentationMode ? 13 : 11}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('+X', W - 10, oy - 6);
    ctx.textAlign = 'left';
    ctx.fillText('+Y', ox + 8, 16);
    ctx.fillText('(0,0)', ox + 6, oy + 14);

    // Numbering along axes (with safe margin clipping to prevent bottom collisions)
    ctx.font = `${presentationMode ? 11 : 9.5}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#475569';

    for (let x = startX; x <= maxX + step; x += step) {
      if (Math.abs(x) < step * 0.01) continue;
      const rounded = parseFloat(x.toFixed(4));
      const cx = toCanvasX(x);
      if (cx < 24 || cx > W - 24) continue;
      ctx.textAlign = 'center';
      const textY = Math.min(Math.max(oy + 13, 14), H - 42);
      ctx.fillText(rounded.toString(), cx, textY);
    }

    for (let y = startY; y <= maxY + step; y += step) {
      if (Math.abs(y) < step * 0.01) continue;
      const rounded = parseFloat(y.toFixed(4));
      const cy = toCanvasY(y);
      if (cy < 18 || cy > H - 42) continue;
      ctx.textAlign = 'right';
      const textX = Math.min(Math.max(ox - 6, 26), W - 12);
      ctx.fillText(rounded.toString(), textX, cy + 3.5);
    }

    // Interpolated animated points
    const displayPts: [number, number][] = originalPts.map((p, i) => {
      const tp = transformedPts[i] ?? p;
      return [lerp(p[0], tp[0], progress), lerp(p[1], tp[1], progress)];
    });

    // ── DRAW MOTION / DISPLACEMENT VECTORS (P -> P') ──
    if (showVectors && originalPts.length > 0 && transformedPts.length > 0) {
      originalPts.forEach((p, i) => {
        const tp = transformedPts[i];
        if (!tp) return;
        const x1 = toCanvasX(p[0]), y1 = toCanvasY(p[1]);
        const x2 = toCanvasX(tp[0]), y2 = toCanvasY(tp[1]);
        const isHigh = highlightVertex === i;

        ctx.save();
        ctx.strokeStyle = isHigh ? '#c084fc' : 'rgba(168, 85, 247, 0.45)';
        ctx.fillStyle = isHigh ? '#c084fc' : 'rgba(168, 85, 247, 0.7)';
        ctx.lineWidth = isHigh ? 2 : 1.2;
        ctx.setLineDash([4, 3]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
        drawArrowhead(ctx, x1, y1, x2, y2, isHigh ? 8 : 6);
        ctx.restore();
      });
    }

    // ── DRAW BASIS VECTORS (i-hat, j-hat) ──
    if (showBasis) {
      const drawBasisVec = (vx: number, vy: number, color: string, label: string, dashed = false) => {
        const tx = toCanvasX(vx), ty = toCanvasY(vy);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.2;
        if (dashed) ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowhead(ctx, ox, oy, tx, ty, 8);

        // Label pill for basis vectors
        ctx.font = `bold 10.5px 'JetBrains Mono', monospace`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(9, 13, 24, 0.88)';
        ctx.strokeStyle = color;
        drawBadgeRect(ctx, tx + 4, ty - 14, tw + 6, 15, 3);
        ctx.fillStyle = color;
        ctx.fillText(label, tx + 7, ty - 3);
        ctx.restore();
      };

      // Standard unit basis vectors
      drawBasisVec(1, 0, 'rgba(239, 68, 68, 0.6)', 'i (1,0)', true);
      drawBasisVec(0, 1, 'rgba(34, 197, 94, 0.6)', 'j (0,1)', true);

      // Transformed basis vectors (columns of T)
      if (T && T.length >= 2 && T[0]?.length >= 2) {
        drawBasisVec(T[0][0], T[1][0], COLORS.basisI, "i' [col 1]");
        drawBasisVec(T[0][1], T[1][1], COLORS.basisJ, "j' [col 2]");
      }
    }

    // ── DRAW POLYGON SHAPES ──
    const drawShape = (
      pts: [number, number][],
      color: string,
      fillAlpha: number,
      dashed: boolean,
      labelPrefix: string,
      showLabels: boolean
    ) => {
      if (pts.length === 0) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = presentationMode ? 2.5 : 2;
      if (dashed) ctx.setLineDash([5, 4]);

      // Fill polygon area
      if (edges.length > 0) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(pts[0][0]), toCanvasY(pts[0][1]));
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(toCanvasX(pts[i][0]), toCanvasY(pts[i][1]));
        }
        ctx.closePath();
        ctx.fillStyle = color + Math.round(fillAlpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Stroke edges
        ctx.beginPath();
        edges.forEach(([a, b]) => {
          const pa = pts[a], pb = pts[b];
          if (!pa || !pb) return;
          ctx.moveTo(toCanvasX(pa[0]), toCanvasY(pa[1]));
          ctx.lineTo(toCanvasX(pb[0]), toCanvasY(pb[1]));
        });
        ctx.stroke();
      }

      // Draw vertex circles
      pts.forEach((p, i) => {
        const cx = toCanvasX(p[0]), cy = toCanvasY(p[1]);
        const isHigh = highlightVertex === i;

        ctx.beginPath();
        ctx.arc(cx, cy, isHigh ? 7 : (presentationMode ? 5 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = isHigh ? color : 'transparent';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // ── NON-OVERLAPPING VERTEX COORDINATE BADGES ──
      if (showLabels) {
        ctx.font = `600 ${presentationMode ? 12 : 10.5}px 'JetBrains Mono', monospace`;
        ctx.setLineDash([]);

        pts.forEach((p, i) => {
          const isTrans = labelPrefix !== 'orig';
          const letter = String.fromCharCode(65 + i);
          const tag = isTrans ? `${letter}'` : letter;
          const text = `${tag}(${p[0].toFixed(1)}, ${p[1].toFixed(1)})`;
          const textW = ctx.measureText(text).width;
          const isHigh = highlightVertex === i;

          const cx = toCanvasX(p[0]);
          const cy = toCanvasY(p[1]);

          // Offset original points to the bottom-left, transformed points to top-right
          // so even when p and p' are coincident, their labels NEVER overlap!
          const badgeW = textW + 8;
          const badgeH = 16;
          const offsetX = isTrans ? 8 : -(badgeW + 8);
          const offsetY = isTrans ? -10 : 16;

          const badgeX = cx + offsetX;
          const badgeY = cy + offsetY - 11;

          ctx.save();
          // Opaque dark badge background prevents grid lines and text from colliding
          ctx.fillStyle = isHigh
            ? 'rgba(30, 41, 59, 0.96)'
            : isTrans
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(8, 11, 20, 0.92)';

          ctx.strokeStyle = isHigh
            ? '#ffffff'
            : isTrans
            ? 'rgba(249, 115, 22, 0.6)'
            : 'rgba(56, 189, 248, 0.6)';

          ctx.lineWidth = isHigh ? 1.5 : 1;
          drawBadgeRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);

          ctx.fillStyle = isHigh ? '#ffffff' : isTrans ? '#fb923c' : '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(text, badgeX + 4, badgeY + 11.5);
          ctx.restore();
        });
      }
      ctx.restore();
    };

    if (animated || progress < 1) {
      drawShape(originalPts, COLORS.original, 0.08, true, 'orig', false);
      drawShape(displayPts, COLORS.transformed, 0.22, false, 'trans', true);
    } else {
      drawShape(originalPts, COLORS.original, 0.1, true, 'orig', true);
      drawShape(transformedPts, COLORS.transformed, 0.25, false, 'trans', true);
    }
  }, [
    originalPts, transformedPts, edges, progress, animated,
    highlightVertex, computeBounds, deviceRatio, presentationMode,
    showVectors, showBasis, T
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * deviceRatio;
      canvas.height = parent.clientHeight * deviceRatio;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [draw, deviceRatio]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onVertexClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const bounds = computeBounds();
    const { minX, maxX, minY, maxY } = bounds;
    const W = rect.width, H = rect.height;
    const toCanvasX = (x: number) => ((x - minX) / (maxX - minX)) * W;
    const toCanvasY = (y: number) => H - ((y - minY) / (maxY - minY)) * H;
    let closest = -1, minDist = 22;
    transformedPts.forEach((p, i) => {
      const dx = toCanvasX(p[0]) - mx, dy = toCanvasY(p[1]) - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; closest = i; }
    });
    if (closest < 0) {
      originalPts.forEach((p, i) => {
        const dx = toCanvasX(p[0]) - mx, dy = toCanvasY(p[1]) - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; closest = i; }
      });
    }
    if (closest >= 0) onVertexClick(closest);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: onVertexClick ? 'pointer' : 'default'
        }}
        title="Click any vertex to inspect its step-by-step dot product calculation"
      />

      {/* ── CLEAN FROSTED OVERLAY LEGEND (Never collides with canvas grid/axes) ── */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(9, 13, 24, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-2)',
        borderRadius: 6,
        padding: '5px 10px',
        pointerEvents: 'none',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-2)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 9, height: 9, background: COLORS.original, borderRadius: 2 }} />
          <span style={{ color: COLORS.original }}>Original [P]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 9, height: 9, background: COLORS.transformed, borderRadius: 2 }} />
          <span style={{ color: COLORS.transformed }}>Transformed [P']</span>
        </div>

        {showVectors && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 2, background: COLORS.vector }} />
            <span style={{ color: COLORS.vector }}>Vector A→A'</span>
          </div>
        )}

        {showBasis && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.basisI }} />
            <span style={{ color: COLORS.basisI }}>î, ĵ Basis</span>
          </div>
        )}
      </div>
    </div>
  );
};
