// ============================================================
// 2D Transformation Page — Live Matrices, Interactive Controls
// ============================================================
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  scaling2D, rotation2D,
  reflectionX, reflectionY, reflectionOrigin, reflectionYeqX, reflectionYeqNegX,
  shearX2D, shearY2D, translation2D,
  applyTransform2D,
} from '../mathematics/matrixMath';
import type { Matrix } from '../mathematics/matrixMath';
import { SHAPES_2D, pointsToMatrix, matrixToPoints } from '../objects/shapes';
import type { ShapeKey } from '../objects/shapes';
import { Canvas2D } from '../visualization/Canvas2D';
import { MatrixDisplay, MatrixInput } from '../components/MatrixComponents';
import { StepCalculation, CoordTable } from '../components/StepCalculation';
import { formatNum } from '../mathematics/matrixMath';

type TransformType = 'scaling' | 'rotation' | 'reflection' | 'shearing' | 'translation' | 'custom';
type ReflectionPreset = 'x-axis' | 'y-axis' | 'origin' | 'y=x' | 'y=-x';

interface Props { presentationMode?: boolean; }

function buildMatrix(
  type: TransformType,
  opts: { sx: number; sy: number; angle: number; reflPreset: ReflectionPreset; shearAxis: 'x' | 'y'; shearK: number; tx: number; ty: number; custom: Matrix }
): Matrix {
  switch (type) {
    case 'scaling':    return scaling2D(opts.sx, opts.sy);
    case 'rotation':   return rotation2D(opts.angle);
    case 'reflection': {
      if (opts.reflPreset === 'x-axis') return reflectionX();
      if (opts.reflPreset === 'y-axis') return reflectionY();
      if (opts.reflPreset === 'origin') return reflectionOrigin();
      if (opts.reflPreset === 'y=x')    return reflectionYeqX();
      return reflectionYeqNegX();
    }
    case 'shearing':   return opts.shearAxis === 'y' ? shearY2D(opts.shearK) : shearX2D(opts.shearK);
    case 'translation':return translation2D(opts.tx, opts.ty);
    case 'custom':     return opts.custom;
  }
}

function calcDet(M: Matrix): number {
  if (M.length === 2 && M[0]?.length === 2) {
    return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  }
  if (M.length === 3 && M[0]?.length === 3) {
    // Top-left 2x2 determinant for 2D affine
    return (
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
    );
  }
  return 1;
}

const DESC: Record<TransformType, { short: string; formula: string; geometric: string }> = {
  scaling: {
    short: 'Scales coordinates independently. Enlarges if |s| > 1, shrinks if |s| < 1.',
    formula: "P' = S · P",
    geometric: 'Areas scale by factor sx · sy = det(S).'
  },
  rotation: {
    short: 'Rotates points counter-clockwise by angle θ around origin (0,0). Preserves distance & area.',
    formula: "P' = R(θ) · P",
    geometric: 'Isometry: lengths and angles are preserved. det(R) = 1.'
  },
  reflection: {
    short: 'Mirrors the object across a line or origin. Inverts orientation.',
    formula: "P' = F · P",
    geometric: 'det(F) = −1 for mirror reflections across lines.'
  },
  shearing: {
    short: 'Slants the object parallel to an axis. Area is strictly conserved.',
    formula: "P' = H · P",
    geometric: 'det(H) = 1. Rectangles become parallelograms.'
  },
  translation: {
    short: 'Displaces the object by (tx, ty). Requires 3×3 homogeneous coordinates.',
    formula: "P' = T · P (Homogeneous)",
    geometric: 'Rigid body displacement: shapes and sizes are preserved.'
  },
  custom: {
    short: 'Enter any arbitrary matrix to visually explore its geometric transformation.',
    formula: "P' = M · P",
    geometric: 'Basis vectors [1, 0]ᵀ and [0, 1]ᵀ transform to the columns of M.'
  },
};

const SHAPE_LABELS: Record<ShapeKey, string> = {
  triangle: 'Triangle (3 vertices)',
  square: 'Square (4 vertices)',
  rectangle: 'Rectangle (4 vertices)',
  house: 'House (5 vertices)',
  star: 'Star (10 vertices)',
  arrow: 'Arrow (7 vertices)',
  custom: 'Custom Polygon',
};

export const Transform2DPage: React.FC<Props> = ({ presentationMode = false }) => {
  // Shape
  const [shapeKey, setShapeKey] = useState<ShapeKey>('triangle');
  const [customPts, setCustomPts] = useState<[number, number][]>([...SHAPES_2D.triangle.points]);

  // Transform params
  const [type, setType] = useState<TransformType>('scaling');
  const [sx, setSx] = useState(2);
  const [sy, setSy] = useState(2);
  const [angle, setAngle] = useState(45);
  const [reflPreset, setReflPreset] = useState<ReflectionPreset>('x-axis');
  const [shearAxis, setShearAxis] = useState<'x' | 'y'>('x');
  const [shearK, setShearK] = useState(0.8);
  const [tx, setTx] = useState(2);
  const [ty, setTy] = useState(1);
  const [customMatrix, setCustomMatrix] = useState<Matrix>([[1.5, 0.5], [0, 1.2]]);

  // UI state
  const [highlightVertex, setHighlightVertex] = useState<number | null>(null);
  const [showVectors, setShowVectors] = useState(true);
  const [animProgress, setAnimProgress] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>(0);

  // Sync shape points when shapeKey changes
  useEffect(() => {
    setCustomPts([...SHAPES_2D[shapeKey].points]);
  }, [shapeKey]);

  // LIVE computation via useMemo
  const { T, P, resultPts, transformedPts, isHomogeneous, det, error } = useMemo(() => {
    try {
      const T = buildMatrix(type, { sx, sy, angle, reflPreset, shearAxis, shearK, tx, ty, custom: customMatrix });
      const P = pointsToMatrix(customPts);
      const { result, isHomogeneous } = applyTransform2D(T, P);
      const det = calcDet(T);
      return { T, P, resultPts: result, transformedPts: matrixToPoints(result), isHomogeneous, det, error: null };
    } catch (e) {
      const P = pointsToMatrix(customPts);
      const T = buildMatrix(type, { sx, sy, angle, reflPreset, shearAxis, shearK, tx, ty, custom: customMatrix });
      return { T, P, resultPts: P, transformedPts: customPts, isHomogeneous: false, det: 1, error: (e as Error).message };
    }
  }, [type, sx, sy, angle, reflPreset, shearAxis, shearK, tx, ty, customMatrix, customPts]);

  const pointLabels = customPts.map((_, i) => String.fromCharCode(65 + i));
  const shape = SHAPES_2D[shapeKey];
  const edges = customPts.length === shape.points.length
    ? shape.edges
    : Array.from({ length: customPts.length }, (_, i) => [i, (i + 1) % customPts.length] as [number, number]);

  // Animation
  const animate = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimProgress(0);
    const start = performance.now();
    const dur = 900;
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setAnimProgress(ease);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setAnimProgress(1);
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const resetAnim = () => {
    cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setAnimProgress(1);
  };

  const exportPng = () => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return;
    const a = document.createElement('a');
    a.download = 'matrix-graphics-lab.png';
    a.href = c.toDataURL();
    a.click();
  };

  const updatePoint = (i: number, coord: 'x' | 'y', val: string) => {
    const v = parseFloat(val);
    if (isNaN(v)) return;
    const next = [...customPts] as [number, number][];
    next[i] = coord === 'x' ? [v, next[i][1]] : [next[i][0], v];
    setCustomPts(next);
  };

  const desc = DESC[type];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: presentationMode ? '280px 1fr' : '285px 1fr 360px',
      gap: 14,
      height: presentationMode ? 'auto' : 'calc(100vh - 120px)',
      minHeight: 0,
    }}>

      {/* ════════════════════════════════ LEFT COLUMN: INPUT CONTROLS & LIVE MATRICES ════════════════════════════════ */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 2 }}>

        {/* ── 1. OBJECT GEOMETRY & OBJECT MATRIX [P] ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            1. Graphical Object
          </div>

          <label className="label">Base Geometry</label>
          <select
            className="field"
            value={shapeKey}
            onChange={e => setShapeKey(e.target.value as ShapeKey)}
            style={{ marginBottom: 12 }}
          >
            {(Object.keys(SHAPES_2D) as ShapeKey[]).map(k => (
              <option key={k} value={k}>{SHAPE_LABELS[k]}</option>
            ))}
          </select>

          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Vertices (X, Y)</span>
            <span>{customPts.length} points</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {customPts.map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 12.5,
                  color: highlightVertex === i ? 'white' : 'var(--blue-2)',
                  background: highlightVertex === i ? 'var(--blue)' : 'rgba(59,130,246,0.12)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  width: 24,
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="number"
                  className="field"
                  style={{ padding: '4px 8px', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
                  value={pt[0]}
                  onChange={e => updatePoint(i, 'x', e.target.value)}
                  step="0.5"
                  title={`X-coordinate of ${String.fromCharCode(65 + i)}`}
                />
                <input
                  type="number"
                  className="field"
                  style={{ padding: '4px 8px', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
                  value={pt[1]}
                  onChange={e => updatePoint(i, 'y', e.target.value)}
                  step="0.5"
                  title={`Y-coordinate of ${String.fromCharCode(65 + i)}`}
                />
                <button
                  className="btn btn-danger"
                  style={{ padding: '3px 7px' }}
                  onClick={() => { if (customPts.length > 2) setCustomPts(customPts.filter((_, idx) => idx !== i)); }}
                  title="Remove vertex"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="btn btn-ghost btn-xs"
              style={{ marginTop: 4, alignSelf: 'flex-start' }}
              onClick={() => setCustomPts([...customPts, [0, 0]])}
            >
              + Add Vertex
            </button>
          </div>

          {/* LIVE OBJECT MATRIX DISPLAY */}
          <div style={{
            marginTop: 12,
            padding: '10px 10px',
            background: 'var(--bg-1)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--blue-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Object Matrix [P]
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {P.length}×{P[0]?.length ?? 0}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
              <MatrixDisplay
                matrix={P}
                color="var(--blue-2)"
                small
                colHeaders={pointLabels}
                rowHeaders={['x', 'y']}
                decimals={2}
              />
            </div>
          </div>
        </div>

        {/* ── 2. TRANSFORMATION CONTROLS & LIVE MATRIX [T] ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--purple)' }} />
            2. Transformation Matrix
          </div>

          <label className="label">Operation</label>
          <select
            className="field"
            value={type}
            onChange={e => setType(e.target.value as TransformType)}
            style={{ marginBottom: 12 }}
          >
            <option value="scaling">Scaling</option>
            <option value="rotation">Rotation</option>
            <option value="reflection">Reflection</option>
            <option value="shearing">Shearing</option>
            <option value="translation">Translation (Homogeneous)</option>
            <option value="custom">Custom Matrix</option>
          </select>

          {/* Scaling */}
          {type === 'scaling' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'sx (horizontal scale)', val: sx, setter: setSx },
                { label: 'sy (vertical scale)', val: sy, setter: setSy },
              ].map(({ label, val, setter }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <label className="label" style={{ marginBottom: 0 }}>{label}</label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--purple)' }}>{val}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="field"
                      style={{ fontFamily: 'var(--font-mono)', width: 75, padding: '4px 6px' }}
                      value={val}
                      step="0.1"
                      onChange={e => setter(parseFloat(e.target.value) || 1)}
                    />
                    <input
                      type="range"
                      min={-4} max={4} step={0.1}
                      value={val}
                      onChange={e => setter(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                {[0.5, 1, 1.5, 2, 3, -1].map(v => (
                  <button
                    key={v}
                    className="btn btn-ghost btn-xs"
                    onClick={() => { setSx(v); setSy(v); }}
                  >
                    ×{v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rotation */}
          {type === 'rotation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Angle θ (degrees)</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--purple)' }}>{angle}°</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    className="field"
                    style={{ fontFamily: 'var(--font-mono)', width: 75, padding: '4px 6px' }}
                    value={angle}
                    step="5"
                    onChange={e => setAngle(parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="range"
                    min={-360} max={360} step={5}
                    value={angle}
                    onChange={e => setAngle(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[30, 45, 60, 90, 180, 270, -90].map(a => (
                  <button key={a} className="btn btn-ghost btn-xs" onClick={() => setAngle(a)}>
                    {a}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reflection */}
          {type === 'reflection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                ['x-axis',  'Across X-axis (y → −y)'],
                ['y-axis',  'Across Y-axis (x → −x)'],
                ['origin',  'Through Origin (x,y → −x,−y)'],
                ['y=x',     'Across line y = x'],
                ['y=-x',    'Across line y = −x'],
              ] as [ReflectionPreset, string][]).map(([p, lbl]) => (
                <button
                  key={p}
                  className={`btn btn-sm ${reflPreset === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setReflPreset(p)}
                  style={{ textAlign: 'left', fontSize: 12, justifyContent: 'flex-start' }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}

          {/* Shearing */}
          {type === 'shearing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="label">Shear Axis</label>
                <div className="pill-group" style={{ width: '100%', display: 'flex' }}>
                  <button
                    className={`pill-btn ${shearAxis === 'x' ? 'active' : ''}`}
                    onClick={() => setShearAxis('x')}
                    style={{ flex: 1 }}
                  >
                    Shear X (x' = x + ky)
                  </button>
                  <button
                    className={`pill-btn ${shearAxis === 'y' ? 'active' : ''}`}
                    onClick={() => setShearAxis('y')}
                    style={{ flex: 1 }}
                  >
                    Shear Y (y' = y + kx)
                  </button>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Factor k</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--purple)' }}>{shearK}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    className="field"
                    style={{ fontFamily: 'var(--font-mono)', width: 75, padding: '4px 6px' }}
                    value={shearK}
                    step="0.1"
                    onChange={e => setShearK(parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="range"
                    min={-3} max={3} step={0.1}
                    value={shearK}
                    onChange={e => setShearK(parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Translation */}
          {type === 'translation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="info-box">
                Translation requires 3×3 homogeneous coordinates so displacement acts via matrix multiplication.
              </div>
              {[
                { label: 'tx (horizontal shift)', val: tx, setter: setTx },
                { label: 'ty (vertical shift)', val: ty, setter: setTy },
              ].map(({ label, val, setter }) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="field"
                      style={{ fontFamily: 'var(--font-mono)', width: 75, padding: '4px 6px' }}
                      value={val}
                      step="0.5"
                      onChange={e => setter(parseFloat(e.target.value) || 0)}
                    />
                    <input
                      type="range"
                      min={-8} max={8} step={0.5}
                      value={val}
                      onChange={e => setter(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Matrix */}
          {type === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="info-box">
                Edit any cell to define your own 2×2 or 3×3 affine matrix.
              </div>
              <MatrixInput
                matrix={customMatrix}
                onChange={setCustomMatrix}
                allowResize
                minRows={2} maxRows={3}
                minCols={2} maxCols={3}
                accentColor="var(--purple)"
              />
            </div>
          )}

          {/* LIVE TRANSFORMATION MATRIX [T] DISPLAY (Prominently shown on input change) */}
          <div style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'var(--bg-1)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Transformation Matrix [T]
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {T.length}×{T[0]?.length ?? 0}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <MatrixDisplay
                matrix={T}
                color="var(--purple)"
                decimals={3}
                rowHeaders={isHomogeneous ? ['x\'', 'y\'', 'w\''] : ['x\'', 'y\'']}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 8,
              paddingTop: 6,
              borderTop: '1px solid var(--border)',
              fontSize: 11
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-3)' }}>Determinant:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: Math.abs(det) < 0.0001 ? 'var(--red)' : 'var(--teal)' }}>
                  det(T) = {formatNum(det, 3)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.4 }}>
                {Math.abs(det) < 0.0001
                  ? '⚠️ Singular: 2D plane collapsed into a line/point'
                  : det < 0
                  ? `Orientation inverted (Mirror). Area scaled ×${Math.abs(det).toFixed(2)}`
                  : Math.abs(det - 1) < 0.0001
                  ? 'Area strictly conserved (1:1 Isometry/Shear)'
                  : `Area scaled by factor ×${det.toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Animation & Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-purple" onClick={animate} disabled={isAnimating} style={{ flex: 1 }}>
            {isAnimating ? '⟳ Animating…' : '▶ Animate Transition'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetAnim} title="Reset animation">
            ↺ Reset
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportPng} title="Export Canvas as PNG">
            ⬇ Export
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
      </div>

      {/* ════════════════════════════════ CENTER COLUMN: INTERACTIVE VISUALIZER & EQUATION ════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>

        {/* 2D Canvas */}
        <div className="panel" style={{ flex: 1, padding: 8, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Canvas Toolbar with educational toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 4px', flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>2D Viewport</span>
              <span>·</span>
              <span className="hide-sm">Click any vertex to inspect calculation</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-xs ${showVectors ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setShowVectors(!showVectors)}
                title="Toggle displacement arrows from original to transformed vertices (A → A')"
              >
                {showVectors ? '✓ Vectors (A→A\')' : '+ Vectors (A→A\')'}
              </button>
            </div>
          </div>

          <div style={{ height: '100%', minHeight: 260 }}>
            <Canvas2D
              originalPts={customPts}
              transformedPts={error ? customPts : transformedPts}
              edges={edges}
              progress={animProgress}
              animated={isAnimating}
              onVertexClick={setHighlightVertex}
              highlightVertex={highlightVertex}
              presentationMode={presentationMode}
              showVectors={showVectors}
              T={T}
            />
          </div>
        </div>

        {/* LIVE MATRIX EQUATION DISPLAY */}
        <div className="panel" style={{ padding: '12px 16px' }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <div className="dot" style={{ background: 'var(--orange)' }} />
            Live Matrix Multiplication Equation: P' = T · P
          </div>

          <div className="eq-row" style={{ overflowX: 'auto', padding: '4px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                TRANSFORMATION [T]
              </div>
              <MatrixDisplay matrix={T} color="var(--purple)" small />
            </div>

            <div className="eq-op">×</div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                OBJECT [P] {isHomogeneous ? '(homogeneous)' : ''}
              </div>
              <MatrixDisplay
                matrix={isHomogeneous ? [...P, Array(P[0].length).fill(1)] : P}
                color="var(--blue-2)"
                small
                colHeaders={pointLabels}
              />
            </div>

            <div className="eq-op">=</div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                RESULT [P']
              </div>
              <MatrixDisplay
                matrix={resultPts}
                color="var(--orange)"
                small
                colHeaders={pointLabels.map(l => l + "'")}
              />
            </div>
          </div>

          <div style={{
            marginTop: 8,
            fontSize: 11.5,
            color: 'var(--text-3)',
            lineHeight: 1.5,
            borderTop: '1px solid var(--border)',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <span style={{ color: 'var(--text-2)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{desc.formula}</span>
              {' — '}{desc.short}
            </div>
            <div style={{ color: 'var(--teal)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {desc.geometric}
            </div>
          </div>
        </div>

        {/* COORDINATE MAPPING TABLE */}
        <div className="panel" style={{ padding: '12px 16px' }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <div className="dot" style={{ background: 'var(--teal)' }} />
            Coordinate Mapping Table (P → P')
          </div>
          <CoordTable
            pointLabels={pointLabels}
            original={customPts}
            transformed={error ? customPts : transformedPts}
            highlightRow={highlightVertex}
            onRowClick={setHighlightVertex}
          />
        </div>
      </div>

      {/* ════════════════════════════════ RIGHT COLUMN: STEP-BY-STEP MATHEMATICAL ARITHMETIC ════════════════════════════════ */}
      {!presentationMode && (
        <div style={{ overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
          <div className="panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="dot" style={{ background: 'var(--green)' }} />
              Step-by-Step Calculation
            </div>
            <StepCalculation
              T={T}
              P={P}
              result={resultPts}
              pointLabels={pointLabels}
              isHomogeneous={isHomogeneous}
              explainType={type}
              explainParams={{
                sx, sy,
                angle,
                tx, ty,
                shearK, shearAxis,
                reflPreset,
                det,
                isHomogeneous,
                is3D: false,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
