// ============================================================
// Image Transform Page v2 — 3D View · Coordinates · Step Calculations
// ============================================================
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  scaling2D, rotation2D,
  reflectionX, reflectionY, reflectionOrigin, reflectionYeqX, reflectionYeqNegX,
  shearX2D, shearY2D, translation2D,
} from '../mathematics/matrixMath';
import type { Matrix } from '../mathematics/matrixMath';
import { MatrixDisplay } from '../components/MatrixComponents';
import { formatNum } from '../mathematics/matrixMath';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type TransformType = 'scaling' | 'rotation' | 'reflection' | 'shearing' | 'translation' | 'custom';
type ReflectionPreset = 'x-axis' | 'y-axis' | 'origin' | 'y=x' | 'y=-x';

// ─────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────
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
  if (M.length === 2 && M[0]?.length === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  if (M.length === 3 && M[0]?.length === 3) {
    return (
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
    );
  }
  return 1;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpMatrix(T: Matrix, p: number): Matrix {
  const id = T.length === 3 ? [[1,0,0],[0,1,0],[0,0,1]] : [[1,0],[0,1]];
  return T.map((row, r) => row.map((v, c) => lerp(id[r][c], v, p)));
}

// Apply 2D matrix T to point (x, y)
function applyMat(T: Matrix, x: number, y: number): [number, number] {
  if (T.length === 3) {
    return [T[0][0]*x + T[0][1]*y + T[0][2], T[1][0]*x + T[1][1]*y + T[1][2]];
  }
  return [T[0][0]*x + T[0][1]*y, T[1][0]*x + T[1][1]*y];
}

// Image corners in math units: A=TL, B=TR, C=BR, D=BL
function getCorners(aw: number, ah: number): [number, number][] {
  return [[-aw, ah], [aw, ah], [aw, -ah], [-aw, -ah]];
}
const CORNER_LABELS = ['A', 'B', 'C', 'D'];

// ─────────────────────────────────────────────────────────────
// Sample images & descriptions
// ─────────────────────────────────────────────────────────────
const SAMPLE_IMAGES = [
  { label: '🌆 City',   url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80' },
  { label: '🌌 Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80' },
  { label: '🦁 Lion',   url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80' },
  { label: '🌊 Ocean',  url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80' },
  { label: '🏔 Mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
];

const DESC: Record<TransformType, { short: string; formula: string; name: string }> = {
  scaling:     { name: 'Scaling',    short: 'Stretches or compresses along X and Y axes.', formula: "P' = S·P" },
  rotation:    { name: 'Rotation',   short: 'Rotates counter-clockwise around origin.',     formula: "P' = R(θ)·P" },
  reflection:  { name: 'Reflection', short: 'Mirrors across chosen axis or origin.',        formula: "P' = F·P" },
  shearing:    { name: 'Shearing',   short: 'Slants parallel to an axis. Area preserved.',  formula: "P' = H·P" },
  translation: { name: 'Translation',short: 'Shifts by (tx,ty) via homogeneous coords.',   formula: "P' = T·P" },
  custom:      { name: 'Custom',     short: 'User-defined 2×2 transformation matrix.',      formula: "P' = M·P" },
};

// ─────────────────────────────────────────────────────────────
// Three.js 3D Image Canvas
// ─────────────────────────────────────────────────────────────
interface Canvas3DProps {
  img: HTMLImageElement | null;
  T: Matrix;
  animProgress: number;
  aw: number;
  ah: number;
}

// Build Three.js geometry for the image plane
function makePlaneGeom(corners: [number, number][]): THREE.BufferGeometry {
  // corners order: TL(A), TR(B), BR(C), BL(D)
  // Three.js positions in vertex order: BL, BR, TR, TL → triangles [0,1,2, 0,2,3]
  // UVs: BL=(0,0) BR=(1,0) TR=(1,1) TL=(0,1)
  const verts = new Float32Array([
    corners[3][0], corners[3][1], 0,   // D = BL  index 0
    corners[2][0], corners[2][1], 0,   // C = BR  index 1
    corners[1][0], corners[1][1], 0,   // B = TR  index 2
    corners[0][0], corners[0][1], 0,   // A = TL  index 3
  ]);
  const uvs = new Float32Array([0,0, 1,0, 1,1, 0,1]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex([0, 1, 2, 0, 2, 3]);
  geom.computeVertexNormals();
  return geom;
}

export const ImageCanvas3D: React.FC<Canvas3DProps> = ({ img, T, animProgress, aw, ah }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js refs (mutable, no re-render)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef    = useRef<number>(0);
  const transMeshRef  = useRef<THREE.Mesh | null>(null);
  const transBorderRef = useRef<THREE.Line | null>(null);
  const origGroupRef  = useRef<THREE.Group | null>(null);
  const materialRef   = useRef<THREE.MeshBasicMaterial | null>(null);
  const texRef        = useRef<THREE.Texture | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 600, el.clientHeight || 400);
    renderer.setClearColor(0x090d18, 1);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, (el.clientWidth || 600) / (el.clientHeight || 400), 0.01, 200);
    camera.position.set(0, 3, 9);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6);
    dl.position.set(4, 6, 5);
    scene.add(dl);

    // Grid (XY plane)
    const grid = new THREE.GridHelper(20, 20, 0x1e2d4a, 0x162236);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // Axes
    scene.add(new THREE.AxesHelper(5));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Animate loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Build/rebuild original + transformed plane when aw/ah changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const origCorners = getCorners(aw, ah);

    // Remove old shape objects
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(c => { if (c.userData.imgShape) toRemove.push(c); });
    toRemove.forEach(o => scene.remove(o));

    // ── Original plane group ──
    const origGroup = new THREE.Group();
    origGroup.userData.imgShape = true;

    // Wireframe face
    const origGeom = makePlaneGeom(origCorners);
    const origFaceMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.3 });
    origGroup.add(new THREE.Mesh(origGeom, origFaceMat));

    // Border line (closed loop: A→B→C→D→A)
    const obVerts: number[] = [];
    [...origCorners, origCorners[0]].forEach(([x, y]) => obVerts.push(x, y, 0));
    const obGeom = new THREE.BufferGeometry();
    obGeom.setAttribute('position', new THREE.Float32BufferAttribute(obVerts, 3));
    origGroup.add(new THREE.Line(obGeom, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 })));

    // Corner dots + labels
    origCorners.forEach(([x, y], i) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x60a5fa })
      );
      dot.position.set(x, y, 0.02);
      origGroup.add(dot);
    });

    scene.add(origGroup);
    origGroupRef.current = origGroup;

    // ── Transformed plane ──
    const transGeom = makePlaneGeom(origCorners);  // start at identity
    // Make position buffer dynamic
    (transGeom.attributes.position as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;

    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    materialRef.current = mat;
    const transMesh = new THREE.Mesh(transGeom, mat);
    transMesh.userData.imgShape = true;
    transMesh.renderOrder = 1;
    scene.add(transMesh);
    transMeshRef.current = transMesh;

    // Transformed border
    const tbVerts = new Float32Array([...origCorners, origCorners[0]].flatMap(([x,y]) => [x, y, 0.01]));
    const tbGeom = new THREE.BufferGeometry();
    tbGeom.setAttribute('position', new THREE.BufferAttribute(tbVerts, 3));
    (tbGeom.attributes.position as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;
    const transBorder = new THREE.Line(tbGeom, new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 2 }));
    transBorder.userData.imgShape = true;
    scene.add(transBorder);
    transBorderRef.current = transBorder;

    // Corner dots for transformed
    origCorners.forEach(([x, y], i) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      dot.position.set(x, y, 0.02);
      dot.userData.imgShape = true;
      dot.userData.transCornerIdx = i;
      scene.add(dot);
    });

  }, [aw, ah]);

  // Update texture when image changes
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    if (texRef.current) { texRef.current.dispose(); texRef.current = null; }
    if (img) {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      texRef.current = tex;
      mat.map = tex;
      mat.color.set(0xffffff);
    } else {
      mat.map = null;
      mat.color.set(0x1e3a5f);
    }
    mat.needsUpdate = true;
  }, [img]);

  // Update transformed plane geometry when T or animProgress changes
  useEffect(() => {
    const scene = sceneRef.current;
    const transMesh = transMeshRef.current;
    const transBorder = transBorderRef.current;
    if (!scene || !transMesh || !transBorder) return;

    const animT = lerpMatrix(T, animProgress);
    const origCorners = getCorners(aw, ah); // A,B,C,D order
    const transCorners = origCorners.map(([x, y]) => applyMat(animT, x, y));

    // Vertex order in geometry: BL(D), BR(C), TR(B), TL(A) = index 3,2,1,0
    const posAttr = transMesh.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, transCorners[3][0], transCorners[3][1], 0);   // D=BL
    posAttr.setXYZ(1, transCorners[2][0], transCorners[2][1], 0);   // C=BR
    posAttr.setXYZ(2, transCorners[1][0], transCorners[1][1], 0);   // B=TR
    posAttr.setXYZ(3, transCorners[0][0], transCorners[0][1], 0);   // A=TL
    posAttr.needsUpdate = true;
    transMesh.geometry.computeBoundingSphere();

    // Update border: A→B→C→D→A
    const bAttr = transBorder.geometry.attributes.position as THREE.BufferAttribute;
    [...transCorners, transCorners[0]].forEach(([x, y], i) => {
      bAttr.setXYZ(i, x, y, 0.01);
    });
    bAttr.needsUpdate = true;

    // Update corner dots
    scene.children.forEach(obj => {
      if (obj.userData.transCornerIdx !== undefined) {
        const i = obj.userData.transCornerIdx as number;
        const tc = transCorners[i];
        (obj as THREE.Mesh).position.set(tc[0], tc[1], 0.02);
      }
    });
  }, [T, animProgress, aw, ah]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        background: 'rgba(9,13,24,0.88)', backdropFilter: 'blur(6px)',
        borderRadius: 8, padding: '8px 12px', fontSize: 11,
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 14, height: 2.5, background: '#3b82f6', opacity: 0.7 }} />
          <span style={{ color: 'var(--text-3)' }}>Original</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 14, height: 2.5, background: '#f97316' }} />
          <span style={{ color: 'var(--text-3)' }}>Transformed</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          Drag · Scroll · Right-click pan
        </div>
      </div>

      {/* Camera hint */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(9,13,24,0.82)', backdropFilter: 'blur(4px)',
        borderRadius: 6, padding: '5px 9px', fontSize: 10.5, color: 'var(--text-3)',
        border: '1px solid var(--border)',
      }}>
        3D Orbit view · Camera ≠ Transformation
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Coordinate Table
// ─────────────────────────────────────────────────────────────
interface CoordTableProps {
  origCorners: [number, number][];
  transCorners: [number, number][];
}

const CoordTable: React.FC<CoordTableProps> = ({ origCorners, transCorners }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
      <thead>
        <tr>
          <th style={{ padding: '5px 10px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Vertex</th>
          <th style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--blue-2)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Original (x, y)</th>
          <th style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--orange)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Transformed (x', y')</th>
          <th style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--text-3)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>Δ (change)</th>
        </tr>
      </thead>
      <tbody>
        {CORNER_LABELS.map((lbl, i) => {
          const [ox, oy] = origCorners[i];
          const [tx, ty] = transCorners[i];
          const dx = tx - ox;
          const dy = ty - oy;
          return (
            <tr key={lbl} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 10px' }}>
                <span style={{ fontWeight: 800, color: 'white', background: 'rgba(59,130,246,0.25)', borderRadius: 4, padding: '2px 7px' }}>{lbl}</span>
              </td>
              <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--blue-2)' }}>
                ({formatNum(ox, 3)}, {formatNum(oy, 3)})
              </td>
              <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--orange)' }}>
                ({formatNum(tx, 3)}, {formatNum(ty, 3)})
              </td>
              <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-3)', fontSize: 11.5 }}>
                ({dx >= 0 ? '+' : ''}{formatNum(dx, 2)}, {dy >= 0 ? '+' : ''}{formatNum(dy, 2)})
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Step-by-Step Calculation Panel
// ─────────────────────────────────────────────────────────────
interface StepCalcProps {
  T: Matrix;
  origCorners: [number, number][];
  transCorners: [number, number][];
  type: TransformType;
}

const StepCalcPanel: React.FC<StepCalcProps> = ({ T, origCorners, transCorners, type }) => {
  const isHom = T.length === 3;
  const desc = DESC[type];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 4 }}>{desc.name} — {desc.formula}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{desc.short}</div>
      </div>

      {/* For each corner */}
      {CORNER_LABELS.map((lbl, i) => {
        const [x, y] = origCorners[i];
        const [rx, ry] = transCorners[i];

        return (
          <div key={lbl} style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 14px',
          }}>
            {/* Vertex label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontWeight: 800, fontSize: 14, color: 'white',
                background: 'rgba(59,130,246,0.3)', borderRadius: 5, padding: '2px 9px',
              }}>{lbl}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue-2)' }}>
                Original: ({formatNum(x, 3)}, {formatNum(y, 3)})
              </span>
            </div>

            {/* Matrix equation */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>

              {/* 2×2 case */}
              {!isHom && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  {/* T matrix col */}
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>T</div>
                    <MatrixDisplay matrix={T} color="var(--purple)" decimals={3} small />
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 8 }}>×</div>
                  {/* Input vector */}
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>{lbl}</div>
                    <MatrixDisplay matrix={[[x], [y]]} color="var(--blue-2)" decimals={3} small />
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 8 }}>=</div>
                  {/* Arithmetic expansion */}
                  <div style={{ alignSelf: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      {/* Row 0: x' */}
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>x' = </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[0][0], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(x, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[0][1], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(y, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> = </span>
                        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatNum(rx, 3)}</span>
                      </div>
                      {/* Row 1: y' */}
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>y' = </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[1][0], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(x, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[1][1], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(y, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> = </span>
                        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatNum(ry, 3)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 8 }}>=</div>
                  {/* Result vector */}
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>{lbl}'</div>
                    <MatrixDisplay matrix={[[rx], [ry]]} color="var(--orange)" decimals={3} small />
                  </div>
                </div>
              )}

              {/* 3×3 homogeneous case */}
              {isHom && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>T (Homogeneous)</div>
                    <MatrixDisplay matrix={T} color="var(--purple)" decimals={3} small />
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 10 }}>×</div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>{lbl}</div>
                    <MatrixDisplay matrix={[[x], [y], [1]]} color="var(--blue-2)" decimals={3} small />
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 10 }}>=</div>
                  <div style={{ alignSelf: 'center', marginTop: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>x' = </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[0][0], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(x, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[0][1], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(y, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[0][2], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> = </span>
                        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatNum(rx, 3)}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>y' = </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[1][0], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(x, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[1][1], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}>×</span>
                        <span style={{ color: 'var(--blue-2)' }}>{formatNum(y, 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> + </span>
                        <span style={{ color: 'var(--purple)' }}>{formatNum(T[1][2], 3)}</span>
                        <span style={{ color: 'var(--text-3)' }}> = </span>
                        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatNum(ry, 3)}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>w = 1</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 18, marginTop: 10 }}>=</div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 9.5, marginBottom: 4, textAlign: 'center' }}>{lbl}'</div>
                    <MatrixDisplay matrix={[[rx], [ry], [1]]} color="var(--orange)" decimals={3} small />
                  </div>
                </div>
              )}

              {/* Result summary */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <span style={{ color: 'var(--blue-2)' }}>
                  {lbl} ({formatNum(x,3)}, {formatNum(y,3)})
                </span>
                <span style={{ color: 'var(--text-3)' }}>→</span>
                <span style={{ color: 'var(--orange)', fontWeight: 700 }}>
                  {lbl}' ({formatNum(rx,3)}, {formatNum(ry,3)})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export const ImageTransformPage: React.FC = () => {
  // Image state
  const [img, setImg]     = useState<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transform params
  const [type, setType]           = useState<TransformType>('scaling');
  const [sx, setSx]               = useState(1.5);
  const [sy, setSy]               = useState(1.5);
  const [angle, setAngle]         = useState(45);
  const [reflPreset, setReflPreset] = useState<ReflectionPreset>('x-axis');
  const [shearAxis, setShearAxis] = useState<'x' | 'y'>('x');
  const [shearK, setShearK]       = useState(0.5);
  const [tx, setTx]               = useState(1.5);
  const [ty, setTy]               = useState(1.0);
  const [customMatrix, setCustomMatrix] = useState<Matrix>([[1.2, 0.4], [0, 1]]);

  // Animation
  const [animProgress, setAnimProgress] = useState(1);
  const [isAnimating, setIsAnimating]   = useState(false);
  const animRef = useRef<number>(0);

  // Derived: image aspect → half-width, half-height in math units
  const { aw, ah } = useMemo(() => {
    if (!img) return { aw: 2, ah: 1.5 };
    const ar = img.naturalWidth / img.naturalHeight;
    const aw = 2;
    const ah = aw / ar;
    return { aw, ah };
  }, [img]);

  // Build transformation matrix
  const T = useMemo(() =>
    buildMatrix(type, { sx, sy, angle, reflPreset, shearAxis, shearK, tx, ty, custom: customMatrix }),
    [type, sx, sy, angle, reflPreset, shearAxis, shearK, tx, ty, customMatrix]
  );

  // Compute corners
  const origCorners = useMemo(() => getCorners(aw, ah), [aw, ah]);
  const transCorners = useMemo(() => {
    const animT = lerpMatrix(T, animProgress);
    return origCorners.map(([x, y]) => applyMat(animT, x, y)) as [number, number][];
  }, [origCorners, T, animProgress]);

  const det = useMemo(() => calcDet(T), [T]);

  // Image loading
  const loadImage = useCallback((src: string) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { setImg(image); setImgSrc(src); };
    image.onerror = () => alert('Failed to load image.');
    image.src = src;
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => { if (e.target?.result) loadImage(e.target.result as string); };
    reader.readAsDataURL(file);
  };

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
      if (t < 1) { animRef.current = requestAnimationFrame(step); }
      else { setAnimProgress(1); setIsAnimating(false); }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const resetAnim = () => {
    cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setAnimProgress(1);
  };

  const desc = DESC[type];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 380px', gap: 12, height: 'calc(100vh - 120px)', minHeight: 0 }}>

      {/* ══════════ LEFT: Controls ══════════ */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>

        {/* Image loader */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            1. Load Image
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={e => { e.preventDefault(); setDraggingOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${draggingOver ? 'var(--blue)' : 'var(--border-2)'}`,
              borderRadius: 10, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
              background: draggingOver ? 'rgba(59,130,246,0.06)' : 'var(--bg-1)',
              transition: 'all 0.2s', marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
              {imgSrc ? '✓ Loaded — click to replace' : 'Drop image or click to browse'}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {imgSrc && (
            <div style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 8, border: '1px solid var(--border)' }}>
              <img src={imgSrc} alt="loaded" style={{ width: '100%', maxHeight: 80, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Samples:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SAMPLE_IMAGES.map(s => (
              <button key={s.label} className="btn btn-ghost btn-xs" onClick={() => loadImage(s.url)} style={{ fontSize: 10.5 }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Transform controls */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--purple)' }} />
            2. Transformation
          </div>

          <label className="label">Operation</label>
          <select className="field" value={type} onChange={e => setType(e.target.value as TransformType)} style={{ marginBottom: 10 }}>
            <option value="scaling">Scaling</option>
            <option value="rotation">Rotation</option>
            <option value="reflection">Reflection</option>
            <option value="shearing">Shearing</option>
            <option value="translation">Translation</option>
            <option value="custom">Custom Matrix</option>
          </select>

          {type === 'scaling' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ label: 'sx', val: sx, setter: setSx }, { label: 'sy', val: sy, setter: setSy }].map(({ label, val, setter }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <label className="label" style={{ marginBottom: 0 }}>{label}</label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--purple)' }}>{val}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="number" className="field" style={{ fontFamily: 'var(--font-mono)', width: 65, padding: '3px 5px' }} value={val} step="0.1" onChange={e => setter(parseFloat(e.target.value) || 1)} />
                    <input type="range" min={-4} max={4} step={0.1} value={val} onChange={e => setter(parseFloat(e.target.value))} style={{ flex: 1 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[0.5, 1, 1.5, 2, -1].map(v => <button key={v} className="btn btn-ghost btn-xs" onClick={() => { setSx(v); setSy(v); }}>×{v}</button>)}
              </div>
            </div>
          )}

          {type === 'rotation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Angle θ</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--purple)' }}>{angle}°</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" className="field" style={{ fontFamily: 'var(--font-mono)', width: 65, padding: '3px 5px' }} value={angle} step="5" onChange={e => setAngle(parseFloat(e.target.value) || 0)} />
                  <input type="range" min={-360} max={360} step={5} value={angle} onChange={e => setAngle(parseInt(e.target.value))} style={{ flex: 1 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[30, 45, 90, 180, -90].map(a => <button key={a} className="btn btn-ghost btn-xs" onClick={() => setAngle(a)}>{a}°</button>)}
              </div>
            </div>
          )}

          {type === 'reflection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {([
                ['x-axis', 'X-axis (y → −y)'],
                ['y-axis', 'Y-axis (x → −x)'],
                ['origin', 'Origin'],
                ['y=x',   'Line y = x'],
                ['y=-x',  'Line y = −x'],
              ] as [ReflectionPreset, string][]).map(([p, lbl]) => (
                <button key={p} className={`btn btn-sm ${reflPreset === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setReflPreset(p)} style={{ textAlign: 'left', fontSize: 11.5, justifyContent: 'flex-start' }}>{lbl}</button>
              ))}
            </div>
          )}

          {type === 'shearing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="pill-group" style={{ display: 'flex' }}>
                <button className={`pill-btn ${shearAxis === 'x' ? 'active' : ''}`} onClick={() => setShearAxis('x')} style={{ flex: 1 }}>Shear X</button>
                <button className={`pill-btn ${shearAxis === 'y' ? 'active' : ''}`} onClick={() => setShearAxis('y')} style={{ flex: 1 }}>Shear Y</button>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" className="field" style={{ fontFamily: 'var(--font-mono)', width: 65, padding: '3px 5px' }} value={shearK} step="0.1" onChange={e => setShearK(parseFloat(e.target.value) || 0)} />
                <input type="range" min={-3} max={3} step={0.1} value={shearK} onChange={e => setShearK(parseFloat(e.target.value))} style={{ flex: 1 }} />
              </div>
            </div>
          )}

          {type === 'translation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-box" style={{ fontSize: 11 }}>Uses 3×3 homogeneous matrix. Values are in math units.</div>
              {[{ label: 'tx', val: tx, setter: setTx }, { label: 'ty', val: ty, setter: setTy }].map(({ label, val, setter }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <label className="label" style={{ marginBottom: 0 }}>{label}</label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--purple)' }}>{val}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="number" className="field" style={{ fontFamily: 'var(--font-mono)', width: 65, padding: '3px 5px' }} value={val} step="0.5" onChange={e => setter(parseFloat(e.target.value) || 0)} />
                    <input type="range" min={-6} max={6} step={0.5} value={val} onChange={e => setter(parseFloat(e.target.value))} style={{ flex: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-box" style={{ fontSize: 11 }}>Edit cells to define your own 2×2 matrix.</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {customMatrix.map((row, r) => row.map((val, c) => (
                    <input key={`${r}-${c}`} type="number" step="0.1" className="field"
                      style={{ fontFamily: 'var(--font-mono)', padding: '4px 6px', width: 78, textAlign: 'center' }}
                      value={val}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        setCustomMatrix(prev => prev.map((row2, ri) => row2.map((cell, ci) => ri === r && ci === c ? v : cell)));
                      }} />
                  )))}
                </div>
              </div>
            </div>
          )}

          {/* Live T matrix + det */}
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Matrix [T]</span>
              <span style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{T.length}×{T[0]?.length ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MatrixDisplay matrix={T} color="var(--purple)" decimals={3} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 11 }}>
              <span style={{ color: 'var(--text-3)' }}>det(T) =</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: Math.abs(det) < 0.0001 ? 'var(--red)' : 'var(--teal)' }}>
                {formatNum(det, 3)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-purple" onClick={animate} disabled={isAnimating} style={{ flex: 1 }}>
            {isAnimating ? '⟳ Animating…' : '▶ Animate'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetAnim}>↺</button>
        </div>
      </div>

      {/* ══════════ CENTER: 3D Canvas + Coord Table ══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

        {/* 3D canvas */}
        <div className="panel" style={{ flex: 1, padding: 8, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              3D Image Viewport
            </div>
            <code style={{ color: 'var(--blue-2)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{desc.formula}</code>
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {!img ? (
              <div style={{
                width: '100%', height: '100%', minHeight: 280,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-1)', borderRadius: 10, border: '2px dashed var(--border-2)',
                gap: 10, color: 'var(--text-3)',
              }}>
                <div style={{ fontSize: 48 }}>🖼</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>No image loaded</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {SAMPLE_IMAGES.slice(0, 3).map(s => (
                    <button key={s.label} className="btn btn-ghost btn-sm" onClick={() => loadImage(s.url)}>{s.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <ImageCanvas3D img={img} T={T} animProgress={animProgress} aw={aw} ah={ah} />
            )}
          </div>
        </div>

        {/* Coordinate table */}
        <div className="panel" style={{ padding: '12px 16px' }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <div className="dot" style={{ background: 'var(--teal)' }} />
            Corner Coordinates: Original → Transformed
          </div>
          <CoordTable origCorners={origCorners} transCorners={transCorners} />

          {/* Equation summary row */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, overflowX: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>T</div>
              <MatrixDisplay matrix={T} color="var(--purple)" small decimals={3} />
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0 }}>×</div>
            <div style={{ textAlign: 'center', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>PIXEL P</div>
              <code style={{ color: 'var(--blue-2)' }}>{T.length === 3 ? '[x, y, 1]ᵀ' : '[x, y]ᵀ'}</code>
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0 }}>=</div>
            <div style={{ textAlign: 'center', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 700 }}>RESULT P'</div>
              <code style={{ color: 'var(--orange)' }}>{T.length === 3 ? "[x', y', 1]ᵀ" : "[x', y']ᵀ"}</code>
            </div>
            <div style={{ marginLeft: 'auto', padding: '7px 12px', background: 'var(--bg-1)', borderRadius: 7, border: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginBottom: 2 }}>det(T)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: Math.abs(det) < 0.0001 ? 'var(--red)' : 'var(--teal)' }}>
                {formatNum(det, 3)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>
                {Math.abs(det) < 0.0001 ? 'Collapsed!' : det < 0 ? 'Mirrored' : Math.abs(det - 1) < 0.001 ? 'Area preserved' : `×${Math.abs(det).toFixed(2)} area`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT: Step-by-step calculation ══════════ */}
      <div style={{ overflowY: 'auto' }}>
        <div className="panel" style={{ height: '100%' }}>
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--green)' }} />
            Step-by-Step Calculation
          </div>
          <StepCalcPanel T={T} origCorners={origCorners} transCorners={transCorners} type={type} />
        </div>
      </div>

    </div>
  );
};
