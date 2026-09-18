// ============================================================
// 3D Transformation Page — Interactive 3D Matrix Graphics Lab
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  scaling3D, rotationX3D, rotationY3D, rotationZ3D,
  reflectionXY, reflectionXZ, reflectionYZ,
  translation3D, applyTransform3D, shear3DXY,
} from '../mathematics/matrixMath';
import type { Matrix } from '../mathematics/matrixMath';
import { SHAPES_3D, points3DToMatrix, matrix3DToPoints } from '../objects/shapes';
import type { ShapeKey3D } from '../objects/shapes';
import { Scene3D } from '../visualization/Scene3D';
import { MatrixDisplay, MatrixInput } from '../components/MatrixComponents';
import { CoordTable3D, StepCalculation } from '../components/StepCalculation';

type TType3D = 'rotationY' | 'rotationX' | 'rotationZ' | 'scaling' | 'reflection' | 'translation' | 'shearing' | 'custom';
type Refl3D = 'xy-plane' | 'xz-plane' | 'yz-plane';

interface Props { presentationMode?: boolean; }

function build3D(
  type: TType3D,
  p: { sx: number; sy: number; sz: number; angle: number; refl: Refl3D; tx: number; ty: number; tz: number; sA: number; sB: number; custom: Matrix }
): Matrix {
  switch (type) {
    case 'scaling':    return scaling3D(p.sx, p.sy, p.sz);
    case 'rotationX':  return rotationX3D(p.angle);
    case 'rotationY':  return rotationY3D(p.angle);
    case 'rotationZ':  return rotationZ3D(p.angle);
    case 'reflection': return p.refl === 'xy-plane' ? reflectionXY() : p.refl === 'xz-plane' ? reflectionXZ() : reflectionYZ();
    case 'translation':return translation3D(p.tx, p.ty, p.tz);
    case 'shearing':   return shear3DXY(p.sA, p.sB);
    case 'custom':     return p.custom;
  }
}

const DESC3D: Record<TType3D, { label: string; desc: string; formula: string }> = {
  rotationY: {
    label: 'Rotation around Y-Axis',
    desc: 'X and Z coordinates rotate in the horizontal plane; Y height is invariant.',
    formula: "P' = Ry(θ) · P"
  },
  rotationX: {
    label: 'Rotation around X-Axis (Pitch)',
    desc: 'Y and Z coordinates rotate around the transverse X axis; X is invariant.',
    formula: "P' = Rx(θ) · P"
  },
  rotationZ: {
    label: 'Rotation around Z-Axis (Roll)',
    desc: 'X and Y coordinates rotate in the coronal plane; Z depth is invariant.',
    formula: "P' = Rz(θ) · P"
  },
  scaling: {
    label: '3D Scaling',
    desc: 'Scales dimensions along X, Y, and Z axes independently. det(S) = sx·sy·sz.',
    formula: "P' = S · P"
  },
  reflection: {
    label: '3D Plane Reflection',
    desc: 'Negates the normal coordinate component across the designated coordinate plane.',
    formula: "P' = F · P"
  },
  translation: {
    label: '3D Translation (Homogeneous)',
    desc: '4×4 homogeneous coordinates matrix multiplication to displace vertices by (tx, ty, tz).',
    formula: "P' = T · P (4×4)"
  },
  shearing: {
    label: '3D Shearing',
    desc: 'Shears coordinates parallel to planes (e.g. z\' = z + a·x + b·y).',
    formula: "P' = H · P"
  },
  custom: {
    label: 'Custom 3×3 or 4×4 Matrix',
    desc: 'Apply your custom transformation matrix directly to all 3D mesh vertices.',
    formula: "P' = M · P"
  },
};

export const Transform3DPage: React.FC<Props> = ({ presentationMode = false }) => {
  const [shapeKey, setShapeKey] = useState<ShapeKey3D>('cube');
  const [type, setType] = useState<TType3D>('rotationY');
  const [sx, setSx] = useState(1.5);
  const [sy, setSy] = useState(1.5);
  const [sz, setSz] = useState(1.5);
  const [angle, setAngle] = useState(45);
  const [refl, setRefl] = useState<Refl3D>('xy-plane');
  const [tx, setTx] = useState(2);
  const [ty, setTy] = useState(1);
  const [tz, setTz] = useState(0);
  const [sA, setSA] = useState(0.5);
  const [sB, setSB] = useState(0);
  const [custom, setCustom] = useState<Matrix>([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);

  const shape = SHAPES_3D[shapeKey];

  const { T, P, transformedVerts, subP, subResult, vLabels, isHomogeneous, error } = useMemo(() => {
    const T = build3D(type, { sx, sy, sz, angle, refl, tx, ty, tz, sA, sB, custom });
    const P = points3DToMatrix(shape.vertices as [number, number, number][]);
    const isHomogeneous = T.length === 4;

    let transformedVerts: [number, number, number][] = shape.vertices as [number, number, number][];
    let error: string | null = null;
    try {
      const r = applyTransform3D(T, P);
      transformedVerts = matrix3DToPoints(r);
    } catch (e: unknown) {
      error = (e as Error).message;
    }

    const MAX = Math.min(shape.vertices.length, 5);
    const subP = (isHomogeneous ? [...P, Array(P[0].length).fill(1)] : P).map(r => r.slice(0, MAX));
    let subResult = P.map(r => r.slice(0, MAX));
    try {
      const r = applyTransform3D(T, P);
      subResult = (r.length === 4 ? r.slice(0, 3) : r).map(row => row.slice(0, MAX));
    } catch { /* skip */ }

    const vLabels = shape.vertices.slice(0, MAX).map((_, i) => `V${i}`);

    return { T, P, transformedVerts, subP, subResult, vLabels, isHomogeneous, error };
  }, [type, sx, sy, sz, angle, refl, tx, ty, tz, sA, sB, custom, shapeKey, shape]);

  const desc = DESC3D[type];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: presentationMode ? '270px 1fr' : '280px 1fr 350px',
      gap: 14,
      height: presentationMode ? 'auto' : 'calc(100vh - 120px)',
      minHeight: 0,
    }}>

      {/* ════════════════════════════════ LEFT: INPUTS & LIVE MATRICES ════════════════════════════════ */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 2 }}>

        {/* 3D Geometry */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            1. 3D Mesh Object
          </div>
          <label className="label">Select 3D Shape</label>
          <select
            className="field"
            value={shapeKey}
            onChange={e => setShapeKey(e.target.value as ShapeKey3D)}
            style={{ marginBottom: 10 }}
          >
            {Object.entries(SHAPES_3D).map(([k, s]) => (
              <option key={k} value={k}>{s.name} ({s.vertices.length} vertices)</option>
            ))}
          </select>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4, marginBottom: 10 }}>
            {shape.description}
          </div>

          {/* 3D Object Coordinate Matrix [P] Preview */}
          <div style={{
            padding: '8px 10px',
            background: 'var(--bg-1)',
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--blue-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Object Coordinates [P]
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                3×{shape.vertices.length}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
              <MatrixDisplay
                matrix={P.map(r => r.slice(0, 5))}
                color="var(--blue-2)"
                small
                rowHeaders={['x', 'y', 'z']}
                colHeaders={shape.vertices.slice(0, 5).map((_, i) => `V${i}`)}
                decimals={1}
              />
            </div>
            {shape.vertices.length > 5 && (
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>
                (Showing first 5 of {shape.vertices.length} vertices)
              </div>
            )}
          </div>
        </div>

        {/* 3D Transformation Controls */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--purple)' }} />
            2. 3D Transformation
          </div>

          <label className="label">Operation</label>
          <select
            className="field"
            value={type}
            onChange={e => setType(e.target.value as TType3D)}
            style={{ marginBottom: 12 }}
          >
            <option value="rotationY">Rotation around Y-axis (Yaw)</option>
            <option value="rotationX">Rotation around X-axis (Pitch)</option>
            <option value="rotationZ">Rotation around Z-axis (Roll)</option>
            <option value="scaling">3D Scaling (sx, sy, sz)</option>
            <option value="reflection">3D Plane Reflection</option>
            <option value="translation">3D Translation (4×4 Homogeneous)</option>
            <option value="shearing">3D Shearing</option>
            <option value="custom">Custom 3×3 / 4×4 Matrix</option>
          </select>

          {/* Rotations */}
          {(type === 'rotationX' || type === 'rotationY' || type === 'rotationZ') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Angle θ</label>
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
                {[30, 45, 60, 90, 180, -45, -90].map(a => (
                  <button key={a} className="btn btn-ghost btn-xs" onClick={() => setAngle(a)}>
                    {a}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scaling */}
          {type === 'scaling' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'sx (X scale)', val: sx, setter: setSx },
                { label: 'sy (Y scale)', val: sy, setter: setSy },
                { label: 'sz (Z scale)', val: sz, setter: setSz },
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
                      min={-3} max={3} step={0.1}
                      value={val}
                      onChange={e => setter(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reflection */}
          {type === 'reflection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['xy-plane', 'xz-plane', 'yz-plane'] as Refl3D[]).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${refl === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setRefl(p)}
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  Reflect across {p}
                </button>
              ))}
            </div>
          )}

          {/* Translation */}
          {type === 'translation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-box">
                4×4 homogeneous coordinates enable 3D translation via matrix multiplication.
              </div>
              {[
                { label: 'tx (shift X)', val: tx, setter: setTx },
                { label: 'ty (shift Y)', val: ty, setter: setTy },
                { label: 'tz (shift Z)', val: tz, setter: setTz },
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
                      min={-6} max={6} step={0.5}
                      value={val}
                      onChange={e => setter(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Shearing */}
          {type === 'shearing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                z' = z + a·x + b·y
              </div>
              {[
                { label: 'Factor a', val: sA, setter: setSA },
                { label: 'Factor b', val: sB, setter: setSB },
              ].map(({ label, val, setter }) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    className="field"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    value={val}
                    step="0.1"
                    onChange={e => setter(parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Custom Matrix */}
          {type === 'custom' && (
            <MatrixInput
              matrix={custom}
              onChange={setCustom}
              allowResize
              minRows={3} maxRows={4}
              minCols={3} maxCols={4}
              accentColor="var(--purple)"
            />
          )}

          {/* LIVE 3D TRANSFORMATION MATRIX [T] */}
          <div style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'var(--bg-1)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
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
                small={T.length === 4}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
              {desc.desc}
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
      </div>

      {/* ════════════════════════════════ CENTER: 3D VIEWPORT & MATRIX EQUATION ════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
        <div className="panel" style={{ flex: 1, padding: 8, minHeight: 0 }}>
          <div style={{ height: presentationMode ? 420 : '100%', minHeight: 280 }}>
            <Scene3D
              originalVertices={shape.vertices as [number, number, number][]}
              transformedVertices={transformedVerts}
              edges={shape.edges}
              faces={shape.faces}
            />
          </div>
        </div>

        {/* Live Equation */}
        <div className="panel" style={{ padding: '12px 16px' }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <div className="dot" style={{ background: 'var(--orange)' }} />
            3D Transformation Equation: P' = T · P
          </div>
          <div className="eq-row" style={{ overflowX: 'auto', padding: '4px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                3D MATRIX [T]
              </div>
              <MatrixDisplay matrix={T} color="var(--purple)" small />
            </div>
            <div className="eq-op">×</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                OBJECT [P] (first 4)
              </div>
              <MatrixDisplay matrix={subP} color="var(--blue-2)" small colHeaders={vLabels} />
            </div>
            <div className="eq-op">=</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>
                TRANSFORMED [P']
              </div>
              <MatrixDisplay matrix={subResult} color="var(--orange)" small colHeaders={vLabels.map(l => l + "'")} />
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="panel" style={{ padding: '12px 16px' }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <div className="dot" style={{ background: 'var(--teal)' }} />
            3D Coordinate Mapping (first {vLabels.length} vertices)
          </div>
          <CoordTable3D
            pointLabels={vLabels}
            original={shape.vertices.slice(0, vLabels.length) as [number, number, number][]}
            transformed={transformedVerts.slice(0, vLabels.length)}
          />
        </div>
      </div>

      {/* ════════════════════════════════ RIGHT: 3D STEP CALCULATION ════════════════════════════════ */}
      {!presentationMode && (
        <div style={{ overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
          <div className="panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="dot" style={{ background: 'var(--green)' }} />
              Step-by-Step Calculation
            </div>
            <StepCalculation
              T={T}
              P={subP}
              result={subResult}
              pointLabels={vLabels}
              isHomogeneous={isHomogeneous}
              explainType={type}
              explainParams={{
                sx, sy, sz,
                angle,
                tx, ty, tz,
                sA, sB,
                reflPreset: refl,
                det: (() => {
                  if (T.length === 3 && T[0]?.length === 3) {
                    return (
                      T[0][0] * (T[1][1] * T[2][2] - T[1][2] * T[2][1]) -
                      T[0][1] * (T[1][0] * T[2][2] - T[1][2] * T[2][0]) +
                      T[0][2] * (T[1][0] * T[2][1] - T[1][1] * T[2][0])
                    );
                  }
                  return 1;
                })(),
                isHomogeneous,
                is3D: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
