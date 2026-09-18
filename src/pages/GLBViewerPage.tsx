// ============================================================
// GLB / GLTF 3D Model Viewer — Upload · Transform · Inspect
// ============================================================
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MatrixDisplay } from '../components/MatrixComponents';
import { formatNum } from '../mathematics/matrixMath';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** THREE.Matrix4 (column-major storage) → row-major number[][] for display */
function m4toArr(m: THREE.Matrix4): number[][] {
  const e = m.elements;
  return [
    [e[0], e[4], e[8],  e[12]],
    [e[1], e[5], e[9],  e[13]],
    [e[2], e[6], e[10], e[14]],
    [e[3], e[7], e[11], e[15]],
  ];
}

const D2R = Math.PI / 180;

// ─────────────────────────────────────────────────────────────
// Sample models — KhronosGroup glTF-Sample-Assets (CORS ✓)
// ─────────────────────────────────────────────────────────────
const SAMPLES = [
  { label: '📦 Box',     url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb' },
  { label: '🦆 Duck',    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb' },
  { label: '🥑 Avocado', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb' },
  { label: '🏺 Camera',  url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb' },
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface ModelInfo {
  name: string;
  vertices: number;
  triangles: number;
  materials: number;
  bbox: THREE.Box3;
}

// ─────────────────────────────────────────────────────────────
// Sub-component: labelled slider row
// ─────────────────────────────────────────────────────────────
const SliderRow: React.FC<{
  label: string; val: number; min: number; max: number;
  step: number; color: string; unit?: string;
  setter: (v: number) => void;
}> = ({ label, val, min, max, step, color, unit = '', setter }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
      <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{label}</label>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>
        {Number.isInteger(val) ? val : formatNum(val, 2)}{unit}
      </span>
    </div>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input type="number" className="field"
        style={{ fontFamily: 'var(--font-mono)', width: 64, padding: '3px 5px', fontSize: 11.5 }}
        value={val} step={step}
        onChange={e => setter(parseFloat(e.target.value) || 0)} />
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => setter(parseFloat(e.target.value))} style={{ flex: 1 }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export const GLBViewerPage: React.FC = () => {

  // ── Upload / model state ──────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [modelInfo, setModelInfo]   = useState<ModelInfo | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Transform state ────────────────────────────────────────
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [rz, setRz] = useState(0);
  const [sx, setSx] = useState(1);
  const [sy, setSy] = useState(1);
  const [sz, setSz] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [tz, setTz] = useState(0);

  // ── Three.js refs ─────────────────────────────────────────
  const mountRef          = useRef<HTMLDivElement>(null);
  const rendererRef       = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef          = useRef<THREE.Scene | null>(null);
  const cameraRef         = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef       = useRef<OrbitControls | null>(null);
  const frameRef          = useRef<number>(0);
  const transformGroupRef = useRef<THREE.Group | null>(null);

  // ── Derived matrices for display ──────────────────────────
  const scaleMat = useMemo((): number[][] => [
    [sx, 0,  0,  0],
    [0,  sy, 0,  0],
    [0,  0,  sz, 0],
    [0,  0,  0,  1],
  ], [sx, sy, sz]);

  const translateMat = useMemo((): number[][] => [
    [1, 0, 0, tx],
    [0, 1, 0, ty],
    [0, 0, 1, tz],
    [0, 0, 0, 1],
  ], [tx, ty, tz]);

  const rotMat = useMemo(() =>
    m4toArr(new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rx * D2R, ry * D2R, rz * D2R, 'XYZ')
    ))
  , [rx, ry, rz]);

  const combinedMat = useMemo(() => {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(tx, ty, tz),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx * D2R, ry * D2R, rz * D2R, 'XYZ')
      ),
      new THREE.Vector3(sx, sy, sz)
    );
    return m4toArr(m);
  }, [rx, ry, rz, sx, sy, sz, tx, ty, tz]);

  // ── Initialize Three.js scene ─────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 600, el.clientHeight || 400);
    renderer.setClearColor(0x0d1120);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1120, 0.025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, (el.clientWidth || 600) / (el.clientHeight || 400), 0.01, 500);
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.0);
    sunLight.position.set(8, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.45);
    fillLight.position.set(-8, -4, -8);
    scene.add(fillLight);
    scene.add(new THREE.HemisphereLight(0x334466, 0x112233, 0.5));

    // Grid floor
    const grid = new THREE.GridHelper(40, 40, 0x1e2d4a, 0x141f33);
    scene.add(grid);

    // Shadow catcher
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Axes helper
    scene.add(new THREE.AxesHelper(4));

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
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

  // ── Apply transform whenever sliders change ───────────────
  useEffect(() => {
    const group = transformGroupRef.current;
    if (!group) return;
    group.position.set(tx, ty, tz);
    group.rotation.set(rx * D2R, ry * D2R, rz * D2R, 'XYZ');
    group.scale.set(sx, sy, sz);
  }, [rx, ry, rz, sx, sy, sz, tx, ty, tz]);

  // ── Load GLB / GLTF ───────────────────────────────────────
  const loadGLB = useCallback((source: string | File) => {
    const scene = sceneRef.current;
    if (!scene) return;

    setLoading(true);
    setProgress(0);
    setLoadError(null);
    setModelInfo(null);

    // Dispose & remove previous model
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(c => { if (c.userData.glbModel) toRemove.push(c); });
    toRemove.forEach(obj => {
      scene.remove(obj);
      obj.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => m?.dispose());
        }
      });
    });
    transformGroupRef.current = null;

    const loader = new GLTFLoader();

    const onLoad = (gltf: { scene: THREE.Group; userData: Record<string, unknown> }) => {
      const root = gltf.scene;

      // Enable shadows
      root.traverse(node => {
        if ((node as THREE.Mesh).isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Center + normalize: fit into ~3-unit cube
      const box3 = new THREE.Box3().setFromObject(root);
      const center = box3.getCenter(new THREE.Vector3());
      const size3  = box3.getSize(new THREE.Vector3());
      const maxDim = Math.max(size3.x, size3.y, size3.z);
      const norm   = maxDim > 0 ? 3 / maxDim : 1;

      root.position.sub(center);     // move centroid to origin

      const innerGroup = new THREE.Group();  // handles normalization
      innerGroup.scale.setScalar(norm);
      innerGroup.add(root);

      const transformGroup = new THREE.Group();  // handles user's transform
      transformGroup.add(innerGroup);
      transformGroup.userData.glbModel = true;
      scene.add(transformGroup);
      transformGroupRef.current = transformGroup;

      // Reset all sliders to identity on new load
      setRx(0); setRy(0); setRz(0);
      setSx(1); setSy(1); setSz(1);
      setTx(0); setTy(0); setTz(0);

      // Compute normalized bounding box
      const normBox = new THREE.Box3().setFromObject(innerGroup);

      // Blue wireframe box = original bounds
      const bboxHelper = new THREE.Box3Helper(normBox, new THREE.Color(0x3b82f6));
      (bboxHelper.material as THREE.LineBasicMaterial).opacity = 0.5;
      (bboxHelper.material as THREE.LineBasicMaterial).transparent = true;
      bboxHelper.userData.glbModel = true;
      scene.add(bboxHelper);

      // Collect stats
      let vertices = 0, triangles = 0;
      const matSet = new Set<string>();
      root.traverse(node => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          vertices  += mesh.geometry?.attributes?.position?.count ?? 0;
          const idx  = mesh.geometry?.index;
          triangles += idx ? idx.count / 3 : (mesh.geometry?.attributes?.position?.count ?? 0) / 3;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => { if (m) matSet.add(m.uuid); });
        }
      });

      setModelInfo({
        name: root.name || 'GLB Model',
        vertices: Math.round(vertices),
        triangles: Math.round(triangles),
        materials: matSet.size,
        bbox: normBox,
      });

      // Fit camera to model
      const cam  = cameraRef.current;
      const ctrl = controlsRef.current;
      if (cam && ctrl) {
        const len = normBox.getSize(new THREE.Vector3()).length();
        cam.position.set(len * 1.1, len * 0.85, len * 1.7);
        cam.lookAt(0, 0, 0);
        ctrl.target.set(0, 0, 0);
        ctrl.update();
      }

      setProgress(100);
      setLoading(false);
    };

    const onProgress = (e: ProgressEvent) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    const onError = (err: unknown) => {
      console.error('GLB load error:', err);
      setLoadError('Failed to load model. Check the file format and CORS policy for remote URLs.');
      setLoading(false);
    };

    if (typeof source === 'string') {
      loader.load(source, onLoad, onProgress, onError);
    } else {
      const url = URL.createObjectURL(source);
      loader.load(
        url,
        gltf => { URL.revokeObjectURL(url); onLoad(gltf); },
        onProgress,
        err  => { URL.revokeObjectURL(url); onError(err); }
      );
    }
  }, []);

  const handleFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
      setLoadError('Only .glb and .gltf files are supported.');
      return;
    }
    loadGLB(file);
  };

  const resetTransform = () => {
    setRx(0); setRy(0); setRz(0);
    setSx(1); setSy(1); setSz(1);
    setTx(0); setTy(0); setTz(0);
  };

  const hasModel = !!modelInfo;

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr 380px',
      gap: 12,
      height: 'calc(100vh - 120px)',
      minHeight: 0,
    }}>

      {/* ═══════════════════════════════════════════════════
          LEFT — Upload + Transform Controls
      ═══════════════════════════════════════════════════ */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>

        {/* Upload panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            1. Load GLB / GLTF
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e  => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={e => {
              e.preventDefault(); setDraggingOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${draggingOver ? 'var(--blue)' : loading ? 'var(--purple)' : 'var(--border-2)'}`,
              borderRadius: 10, padding: '18px 12px', textAlign: 'center', cursor: 'pointer',
              background: draggingOver ? 'rgba(59,130,246,0.07)' : 'var(--bg-1)',
              transition: 'all 0.2s', marginBottom: 10,
            }}
          >
            {loading ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 6, animation: 'spin 1.2s linear infinite' }}>⟳</div>
                <div style={{ fontSize: 12, color: 'var(--purple)' }}>Loading model… {progress > 0 ? `${progress}%` : ''}</div>
                {progress > 0 && (
                  <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--purple)', transition: 'width 0.3s', borderRadius: 4 }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 34, marginBottom: 6 }}>🧊</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                  {hasModel ? '✓ Model loaded — click to replace' : 'Drop .glb / .gltf file here'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>
                  or click to browse
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef} type="file" accept=".glb,.gltf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* Error message */}
          {loadError && (
            <div style={{
              fontSize: 11.5, color: 'var(--red)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, padding: '7px 10px', marginBottom: 8,
            }}>
              ⚠ {loadError}
            </div>
          )}

          {/* Sample models */}
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            Sample models:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SAMPLES.map(s => (
              <button key={s.label}
                className="btn btn-ghost btn-xs"
                onClick={() => loadGLB(s.url)}
                disabled={loading}
                style={{ fontSize: 10.5 }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 7, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Free GLB models: <span style={{ color: 'var(--blue-2)' }}>sketchfab.com</span> · <span style={{ color: 'var(--blue-2)' }}>poly.pizza</span> · <span style={{ color: 'var(--blue-2)' }}>market.pmnd.rs</span>
          </div>
        </div>

        {/* Transform controls */}
        <div className="panel" style={{ opacity: hasModel ? 1 : 0.45, pointerEvents: hasModel ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--purple)' }} />
            2. 3D Transform
            {!hasModel && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>Load a model first</span>}
          </div>

          {/* Rotation */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              ↺ Rotation (Euler XYZ degrees)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <SliderRow label="Rx" val={rx} min={-360} max={360} step={5}   color="#ef4444" unit="°" setter={setRx} />
              <SliderRow label="Ry" val={ry} min={-360} max={360} step={5}   color="#22c55e" unit="°" setter={setRy} />
              <SliderRow label="Rz" val={rz} min={-360} max={360} step={5}   color="#3b82f6" unit="°" setter={setRz} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {[0, 45, 90, 180, -90].map(v => (
                <button key={v} className="btn btn-ghost btn-xs" onClick={() => setRy(v)} style={{ fontSize: 10 }}>{v}°Y</button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              ⟷ Scale
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <SliderRow label="Sx" val={sx} min={0.05} max={5} step={0.05} color="var(--orange)" setter={setSx} />
              <SliderRow label="Sy" val={sy} min={0.05} max={5} step={0.05} color="var(--orange)" setter={setSy} />
              <SliderRow label="Sz" val={sz} min={0.05} max={5} step={0.05} color="var(--orange)" setter={setSz} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {[0.5, 1, 1.5, 2, 3].map(v => (
                <button key={v} className="btn btn-ghost btn-xs" onClick={() => { setSx(v); setSy(v); setSz(v); }} style={{ fontSize: 10 }}>×{v}</button>
              ))}
            </div>
          </div>

          {/* Translation */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              ↔ Translation
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <SliderRow label="Tx" val={tx} min={-6} max={6} step={0.1} color="var(--teal)" setter={setTx} />
              <SliderRow label="Ty" val={ty} min={-6} max={6} step={0.1} color="var(--teal)" setter={setTy} />
              <SliderRow label="Tz" val={tz} min={-6} max={6} step={0.1} color="var(--teal)" setter={setTz} />
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={resetTransform} style={{ width: '100%' }}>
            ↺ Reset to Identity
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CENTER — 3D Viewport
      ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

        {/* 3D canvas panel */}
        <div className="panel" style={{ flex: 1, padding: 8, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🧊 GLB 3D Viewport
            </div>
            <code style={{ fontSize: 10.5, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
              V' = M × [x, y, z, 1]ᵀ
            </code>
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
            {/* Empty state overlay */}
            {!hasModel && !loading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(9,13,24,0.72)', backdropFilter: 'blur(3px)',
                zIndex: 2, gap: 12, padding: 24,
              }}>
                <div style={{ fontSize: 56 }}>🧊</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>No 3D model loaded</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                  Upload a .glb file or try a sample
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {SAMPLES.slice(0, 2).map(s => (
                    <button key={s.label} className="btn btn-ghost btn-sm" onClick={() => loadGLB(s.url)} disabled={loading}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Legend strip */}
        <div className="panel" style={{ padding: '9px 14px' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', fontSize: 11.5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
              Axes:
            </span>
            {[{ c: '#ef4444', l: 'X' }, { c: '#22c55e', l: 'Y' }, { c: '#3b82f6', l: 'Z' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 18, height: 3, background: c, borderRadius: 2 }} />
                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{l}-axis</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
              <div style={{ width: 18, height: 2, background: '#3b82f6', opacity: 0.6 }} />
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Original bounds</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>
              Drag · Scroll · Right-click pan
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT — Model Info + Matrix Decomposition
      ═══════════════════════════════════════════════════ */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Model info */}
        {modelInfo && (
          <div className="panel">
            <div className="panel-header">
              <div className="dot" style={{ background: 'var(--blue)' }} />
              Model Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: 'Vertices',  val: modelInfo.vertices.toLocaleString(),  color: 'var(--blue-2)' },
                { label: 'Triangles', val: modelInfo.triangles.toLocaleString(), color: 'var(--teal)' },
                { label: 'Materials', val: modelInfo.materials.toString(),        color: 'var(--purple)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Normalized Bounding Box
              </div>
              {(['min', 'max'] as const).map(key => {
                const v = key === 'min' ? modelInfo.bbox.min : modelInfo.bbox.max;
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-3)' }}>{key}:</span>
                    <span style={{ color: key === 'min' ? 'var(--blue-2)' : 'var(--orange)' }}>
                      ({formatNum(v.x, 2)}, {formatNum(v.y, 2)}, {formatNum(v.z, 2)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Combined 4×4 matrix */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--orange)' }} />
            Combined 4×4 Transform Matrix
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
            M = T × R × S
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MatrixDisplay matrix={combinedMat} color="var(--orange)" decimals={3} />
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: 7 }}>
            Each vertex: <code style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>V' = M × [x, y, z, 1]ᵀ</code>
          </div>
        </div>

        {/* Step-by-step decomposition */}
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--green)' }} />
            Step-by-Step Decomposition
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Step 1 — Scale */}
            <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--orange)', marginBottom: 7 }}>
                Step 1 — Scale (S)
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                Sx={formatNum(sx,2)} · Sy={formatNum(sy,2)} · Sz={formatNum(sz,2)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MatrixDisplay matrix={scaleMat} color="var(--orange)" decimals={2} small />
              </div>
              <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--text-3)' }}>
                x→{formatNum(sx,2)}x · y→{formatNum(sy,2)}y · z→{formatNum(sz,2)}z
              </div>
            </div>

            {/* Step 2 — Rotation */}
            <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--purple)', marginBottom: 7 }}>
                Step 2 — Rotation (R)
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                Rx={rx}° · Ry={ry}° · Rz={rz}° (Euler XYZ)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MatrixDisplay matrix={rotMat} color="var(--purple)" decimals={3} small />
              </div>
              <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--text-3)' }}>
                Applied after scaling — rotates around world origin
              </div>
            </div>

            {/* Step 3 — Translation */}
            <div style={{ background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)', marginBottom: 7 }}>
                Step 3 — Translation (T)
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                tx={formatNum(tx,2)} · ty={formatNum(ty,2)} · tz={formatNum(tz,2)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MatrixDisplay matrix={translateMat} color="var(--teal)" decimals={2} small />
              </div>
              <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--text-3)' }}>
                Shifts model in world space (applied last)
              </div>
            </div>

            {/* Result */}
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)', marginBottom: 7 }}>
                Result — M = T × R × S
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MatrixDisplay matrix={combinedMat} color="var(--green)" decimals={3} small />
              </div>
              <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--text-3)' }}>
                det(M) ≈ {formatNum(sx * sy * sz, 3)} (volume change factor)
              </div>
              <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {sx === sy && sy === sz ? (
                  <div style={{ fontSize: 10.5, color: 'var(--teal)' }}>✓ Uniform scale — shape preserved</div>
                ) : (
                  <div style={{ fontSize: 10.5, color: 'var(--orange)' }}>⚠ Non-uniform scale — shape distorted</div>
                )}
                {rx === 0 && ry === 0 && rz === 0 ? (
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>• No rotation applied</div>
                ) : (
                  <div style={{ fontSize: 10.5, color: 'var(--blue-2)' }}>✓ Rotation applied (orthogonal matrix R)</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
