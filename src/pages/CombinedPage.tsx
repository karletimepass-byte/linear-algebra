// ============================================================
// Combined Transformations Page — Non-Commutativity & Composition
// ============================================================
import React, { useState, useCallback } from 'react';
import {
  scaling2D, rotation2D, reflectionX, reflectionY,
  shearX2D, shearY2D, matMul, applyTransform2D,
} from '../mathematics/matrixMath';
import type { Matrix } from '../mathematics/matrixMath';
import { SHAPES_2D, pointsToMatrix, matrixToPoints } from '../objects/shapes';
import type { ShapeKey } from '../objects/shapes';
import { Canvas2D } from '../visualization/Canvas2D';
import { MatrixDisplay } from '../components/MatrixComponents';
import { CoordTable } from '../components/StepCalculation';

type StepType = 'scaling' | 'rotation' | 'reflectionX' | 'reflectionY' | 'shearX' | 'shearY';

interface StepDef {
  id: string;
  type: StepType;
  params: Record<string, number>;
  matrix: Matrix;
  label: string;
}

function makeMatrix(type: StepType, params: Record<string, number>): Matrix {
  switch (type) {
    case 'scaling':     return scaling2D(params.sx ?? 1, params.sy ?? 1);
    case 'rotation':    return rotation2D(params.angle ?? 0);
    case 'reflectionX': return reflectionX();
    case 'reflectionY': return reflectionY();
    case 'shearX':      return shearX2D(params.k ?? 0);
    case 'shearY':      return shearY2D(params.k ?? 0);
  }
}

function makeLabel(type: StepType, params: Record<string, number>): string {
  switch (type) {
    case 'scaling':     return `Scale(${params.sx}, ${params.sy})`;
    case 'rotation':    return `Rotate ${params.angle}°`;
    case 'reflectionX': return 'Reflect X-Axis';
    case 'reflectionY': return 'Reflect Y-Axis';
    case 'shearX':      return `Shear X(k=${params.k})`;
    case 'shearY':      return `Shear Y(k=${params.k})`;
  }
}

let _idCounter = 0;
const uid = () => `step-${++_idCounter}`;

const DEFAULT_STEPS: StepDef[] = [
  { id: uid(), type: 'rotation', params: { angle: 45 }, matrix: rotation2D(45), label: 'Rotate 45°' },
  { id: uid(), type: 'scaling', params: { sx: 2, sy: 1.5 }, matrix: scaling2D(2, 1.5), label: 'Scale(2, 1.5)' },
];

interface Props { presentationMode?: boolean; }

export const CombinedPage: React.FC<Props> = ({ presentationMode = false }) => {
  const [shapeKey, setShapeKey] = useState<ShapeKey>('triangle');
  const [steps, setSteps] = useState<StepDef[]>(DEFAULT_STEPS);
  const [newType, setNewType] = useState<StepType>('rotation');
  const [newParams, setNewParams] = useState<Record<string, number>>({ angle: 90, sx: 2, sy: 2, k: 0.5 });
  const [compareMode, setCompareMode] = useState(false);
  const [compareSteps, setCompareSteps] = useState<StepDef[]>([...DEFAULT_STEPS].reverse());

  const shape = SHAPES_2D[shapeKey];
  const pts = shape.points;
  const P = pointsToMatrix(pts as [number, number][]);

  // Live preview matrix for the step being configured
  const previewStepMatrix = makeMatrix(newType, newParams);

  // Build combined matrix: apply steps right-to-left (P' = Sn·...·S1·P)
  const buildCombined = useCallback((stepList: StepDef[]): Matrix | null => {
    if (stepList.length === 0) return null;
    let combined = stepList[stepList.length - 1].matrix;
    for (let i = stepList.length - 2; i >= 0; i--) {
      combined = matMul(stepList[i].matrix, combined);
    }
    return combined;
  }, []);

  const combined = buildCombined(steps);
  const combined2 = compareMode ? buildCombined(compareSteps) : null;

  let transformedPts1: [number, number][] = pts as [number, number][];
  let transformedPts2: [number, number][] = pts as [number, number][];
  let error: string | null = null;

  try {
    if (combined) {
      const { result } = applyTransform2D(combined, P);
      transformedPts1 = matrixToPoints(result);
    }
    if (combined2) {
      const { result } = applyTransform2D(combined2, P);
      transformedPts2 = matrixToPoints(result);
    }
  } catch (e: unknown) {
    if (e instanceof Error) error = e.message;
  }

  const addStep = () => {
    const m = makeMatrix(newType, newParams);
    const step: StepDef = { id: uid(), type: newType, params: { ...newParams }, matrix: m, label: makeLabel(newType, newParams) };
    setSteps(prev => [...prev, step]);
    if (compareMode) setCompareSteps(prev => [step, ...prev]);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    setCompareSteps(prev => prev.filter(s => s.id !== id));
  };

  const moveStep = (id: string, dir: -1 | 1) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const pointLabels = pts.map((_, i) => String.fromCharCode(65 + i));
  const edges = (() => {
    const n = pts.length;
    return shape.edges.length > 0 ? shape.edges : Array.from({ length: n }, (_, i) => [i, (i + 1) % n] as [number, number]);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

      {/* Header controls */}
      <div className="panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="label" style={{ marginBottom: 0 }}>Shape</label>
          <select
            className="field"
            style={{ width: 170, padding: '5px 8px' }}
            value={shapeKey}
            onChange={e => setShapeKey(e.target.value as ShapeKey)}
          >
            {Object.entries(SHAPES_2D).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className={`btn btn-sm ${compareMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              if (!compareMode) setCompareSteps([...steps].reverse());
              setCompareMode(!compareMode);
            }}
          >
            {compareMode ? '◀ Close Order Comparison' : '⇄ Compare Matrix Order (AB vs BA)'}
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          Convention: P' = T<sub>k</sub> ··· T<sub>2</sub> · T<sub>1</sub> · P (Right-to-Left)
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: compareMode ? '1fr 1fr' : '310px 1fr',
        gap: 14,
        minHeight: 0,
        height: presentationMode ? 'auto' : 'calc(100vh - 188px)'
      }}>

        {/* LEFT COLUMN: Transformation Sequence Builder */}
        {!compareMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

            {/* Add New Step */}
            <div className="panel">
              <div className="panel-header">
                <div className="dot" style={{ background: 'var(--blue)' }} />
                Add Transformation Step
              </div>

              <label className="label">Step Type</label>
              <select
                className="field"
                value={newType}
                onChange={e => setNewType(e.target.value as StepType)}
                style={{ marginBottom: 10 }}
              >
                <option value="rotation">Rotation</option>
                <option value="scaling">Scaling</option>
                <option value="reflectionX">Reflection (X-axis)</option>
                <option value="reflectionY">Reflection (Y-axis)</option>
                <option value="shearX">Shear X</option>
                <option value="shearY">Shear Y</option>
              </select>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {newType === 'rotation' && (
                  <div>
                    <label className="label">Angle θ (°)</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="field"
                        value={newParams.angle ?? 90}
                        onChange={e => setNewParams(p => ({ ...p, angle: parseFloat(e.target.value) || 0 }))}
                        step="5"
                        style={{ width: 80, fontFamily: 'var(--font-mono)' }}
                      />
                      <input
                        type="range"
                        min={-360} max={360} step={5}
                        value={newParams.angle ?? 90}
                        onChange={e => setNewParams(p => ({ ...p, angle: parseInt(e.target.value) }))}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                )}

                {newType === 'scaling' && (
                  <>
                    <div>
                      <label className="label">Scale X (sx)</label>
                      <input
                        type="number"
                        className="field"
                        value={newParams.sx ?? 1}
                        onChange={e => setNewParams(p => ({ ...p, sx: parseFloat(e.target.value) || 1 }))}
                        step="0.1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                    <div>
                      <label className="label">Scale Y (sy)</label>
                      <input
                        type="number"
                        className="field"
                        value={newParams.sy ?? 1}
                        onChange={e => setNewParams(p => ({ ...p, sy: parseFloat(e.target.value) || 1 }))}
                        step="0.1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </>
                )}

                {(newType === 'shearX' || newType === 'shearY') && (
                  <div>
                    <label className="label">Factor k</label>
                    <input
                      type="number"
                      className="field"
                      value={newParams.k ?? 0.5}
                      onChange={e => setNewParams(p => ({ ...p, k: parseFloat(e.target.value) || 0 }))}
                      step="0.1"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                )}
              </div>

              {/* Live Preview of Step Matrix */}
              <div style={{
                marginTop: 10,
                padding: '8px 10px',
                background: 'var(--bg-1)',
                borderRadius: 6,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600 }}>Step Matrix:</span>
                <MatrixDisplay matrix={previewStepMatrix} color="var(--purple)" small decimals={2} />
              </div>

              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={addStep}>
                + Add Step To Sequence
              </button>
            </div>

            {/* Sequence list */}
            <div className="panel" style={{ flex: 1 }}>
              <div className="panel-header">
                <div className="dot" style={{ background: 'var(--purple)' }} />
                Sequence ({steps.length} steps)
              </div>

              {steps.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>No steps added yet. Add a step above.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {steps.map((step, i) => (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        background: 'var(--bg-1)',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--font-mono)', width: 22 }}>
                        T{steps.length - i}
                      </span>
                      <span style={{ flex: 1, fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                        {step.label}
                      </span>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => moveStep(step.id, -1)}
                        disabled={i === 0}
                        title="Move Earlier in execution"
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => moveStep(step.id, 1)}
                        disabled={i === steps.length - 1}
                        title="Move Later in execution"
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => removeStep(step.id)}
                        title="Delete Step"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {steps.length > 1 && (
                <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 10, lineHeight: 1.5 }}>
                  ⚠️ Matrix multiplication is NOT commutative: changing the order of steps completely changes the final result!
                </div>
              )}
            </div>

            {/* Combined Net Matrix */}
            {combined && (
              <div className="panel">
                <div className="panel-header">
                  <div className="dot" style={{ background: 'var(--orange)' }} />
                  Net Combined Matrix [T_net]
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <MatrixDisplay matrix={combined} color="var(--orange)" decimals={3} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CENTER / RIGHT: Visualizer & Compare Mode */}
        {!compareMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
            <div className="panel" style={{ flex: 1, padding: 8, minHeight: 0 }}>
              <Canvas2D
                originalPts={pts as [number, number][]}
                transformedPts={error ? (pts as [number, number][]) : transformedPts1}
                edges={edges}
                presentationMode={presentationMode}
              />
            </div>

            {/* Coordinate Table */}
            <div className="panel">
              <div className="panel-header">
                <div className="dot" style={{ background: 'var(--teal)' }} />
                Result Coordinates
              </div>
              <CoordTable
                pointLabels={pointLabels}
                original={pts as [number, number][]}
                transformed={error ? (pts as [number, number][]) : transformedPts1}
              />
            </div>
          </div>
        ) : (
          /* COMPARISON MODE (ORDER A vs ORDER B) */
          <>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue-2)' }}>
                Sequence A: {steps.map(s => s.label).join(' → ')}
              </div>
              <div style={{ flex: 1, minHeight: 250 }}>
                <Canvas2D
                  originalPts={pts as [number, number][]}
                  transformedPts={transformedPts1}
                  edges={edges}
                />
              </div>
              {combined && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Net Matrix A</div>
                  <MatrixDisplay matrix={combined} color="var(--blue-2)" small decimals={2} />
                </div>
              )}
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--orange)' }}>
                Sequence B (Reversed): {compareSteps.map(s => s.label).join(' → ')}
              </div>
              <div style={{ flex: 1, minHeight: 250 }}>
                <Canvas2D
                  originalPts={pts as [number, number][]}
                  transformedPts={transformedPts2}
                  edges={edges}
                />
              </div>
              {combined2 && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Net Matrix B</div>
                  <MatrixDisplay matrix={combined2} color="var(--orange)" small decimals={2} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
