// ============================================================
// 3D Visualization using Three.js — Modern Cinematic Studio
// ============================================================
import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Shape3DViewerProps {
  originalVertices: [number, number, number][];
  transformedVertices: [number, number, number][];
  edges: [number, number][];
  faces?: number[][];
  presentationMode?: boolean;
}

export const Scene3D: React.FC<Shape3DViewerProps> = ({
  originalVertices,
  transformedVertices,
  edges,
  faces = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presentationMode: _pm = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);

  // Interactive Viewport Toggles
  const [showFaces, setShowFaces] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(5, 4, 6);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  // Build 3D Shape Meshes
  const buildGeometry = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old shape elements (preserve environment/axes/grid)
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(c => {
      if (c.userData.isShape) toRemove.push(c);
    });
    toRemove.forEach(o => scene.remove(o));

    // ── 1. SOLID TRANSLUCENT FACES (Glass / Crystal Shading) ──
    const drawSolidFaces = (
      verts: [number, number, number][],
      triangles: number[][],
      color: number,
      opacity: number,
      emissive: number
    ) => {
      if (!triangles || triangles.length === 0) return;
      const positions: number[] = [];
      triangles.forEach(tri => {
        const v0 = verts[tri[0]];
        const v1 = verts[tri[1]];
        const v2 = verts[tri[2]];
        if (!v0 || !v1 || !v2) return;
        positions.push(v0[0], v0[1], v0[2]);
        positions.push(v1[0], v1[1], v1[2]);
        positions.push(v2[0], v2[1], v2[2]);
      });

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();

      const mat = new THREE.MeshPhysicalMaterial({
        color,
        emissive,
        emissiveIntensity: 0.22,
        roughness: 0.12,
        metalness: 0.15,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.isShape = true;
      scene.add(mesh);
    };

    // ── 2. EDGES & VERTEX JEWELS ──
    const drawEdgesAndVerts = (
      verts: [number, number, number][],
      edgeColor: number,
      vertColor: number,
      vertEmissive: number,
      opacity: number,
      vertSize = 0.08
    ) => {
      // Crisp lines
      const positions: number[] = [];
      edges.forEach(([a, b]) => {
        const va = verts[a], vb = verts[b];
        if (!va || !vb) return;
        positions.push(va[0], va[1], va[2], vb[0], vb[1], vb[2]);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: opacity < 1,
        opacity,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.userData.isShape = true;
      scene.add(lines);

      // Smooth polished vertex beads
      const sg = new THREE.SphereGeometry(vertSize, 24, 24);
      const sm = new THREE.MeshStandardMaterial({
        color: vertColor,
        emissive: vertEmissive,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.4,
        transparent: opacity < 1,
        opacity,
      });
      verts.forEach(v => {
        const mesh = new THREE.Mesh(sg, sm);
        mesh.position.set(v[0], v[1], v[2]);
        mesh.userData.isShape = true;
        scene.add(mesh);
      });
    };

    // ── 3. DISPLACEMENT VECTORS (Original → Transformed) ──
    const drawDisplacementVectors = () => {
      const positions: number[] = [];
      for (let i = 0; i < Math.min(originalVertices.length, transformedVertices.length); i++) {
        const o = originalVertices[i];
        const t = transformedVertices[i];
        if (o && t) {
          const distSq = (o[0] - t[0]) ** 2 + (o[1] - t[1]) ** 2 + (o[2] - t[2]) ** 2;
          if (distSq > 0.001) {
            positions.push(o[0], o[1], o[2], t[0], t[1], t[2]);
          }
        }
      }

      if (positions.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.LineDashedMaterial({
          color: 0xc084fc, // vibrant neon purple
          dashSize: 0.15,
          gapSize: 0.08,
          transparent: true,
          opacity: 0.75,
        });
        const lines = new THREE.LineSegments(geo, mat);
        lines.computeLineDistances();
        lines.userData.isShape = true;
        scene.add(lines);
      }
    };

    // Draw Original (Ghost Blueprint)
    if (showOriginal) {
      if (showFaces && faces.length > 0) {
        drawSolidFaces(originalVertices, faces, 0x38bdf8, 0.16, 0x0284c7);
      }
      drawEdgesAndVerts(originalVertices, 0x38bdf8, 0x38bdf8, 0x0284c7, 0.55, 0.065);
    }

    // Draw Transformed (Warm Glowing Jewel)
    if (showFaces && faces.length > 0) {
      drawSolidFaces(transformedVertices, faces, 0xf97316, 0.42, 0x7c2d12);
    }
    drawEdgesAndVerts(transformedVertices, 0xffa033, 0xffba55, 0xf97316, 1.0, 0.085);

    // Draw Trajectory Vectors
    if (showVectors) {
      drawDisplacementVectors();
    }
  }, [originalVertices, transformedVertices, edges, faces, showFaces, showVectors, showOriginal]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x0c101c, 1);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene with atmospheric depth fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c101c, 0.035);
    sceneRef.current = scene;

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── STUDIO LIGHTING ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-6, 3, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf97316, 0.55);
    rimLight.position.set(2, -4, -6);
    scene.add(rimLight);

    // ── GROUND GRID ──
    const gridHelper = new THREE.GridHelper(12, 12, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach(m => { m.transparent = true; m.opacity = 0.35; });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.35;
    }
    scene.add(gridHelper);

    // ── 3D CYLINDRICAL ARROW AXES ──
    const createAxisArrow = (dir: THREE.Vector3, color: number, length = 4.5, radius = 0.02) => {
      const group = new THREE.Group();
      const bodyLen = length - 0.3;
      const cylGeo = new THREE.CylinderGeometry(radius, radius, bodyLen, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.25,
        metalness: 0.4,
      });
      const cylinder = new THREE.Mesh(cylGeo, mat);
      cylinder.position.y = bodyLen / 2;
      group.add(cylinder);

      const coneGeo = new THREE.ConeGeometry(radius * 2.8, 0.3, 16);
      const cone = new THREE.Mesh(coneGeo, mat);
      cone.position.y = bodyLen + 0.15;
      group.add(cone);

      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      return group;
    };

    // +X (Red), +Y (Green), +Z (Blue)
    scene.add(createAxisArrow(new THREE.Vector3(1, 0, 0), 0xef4444));
    scene.add(createAxisArrow(new THREE.Vector3(0, 1, 0), 0x22c55e));
    scene.add(createAxisArrow(new THREE.Vector3(0, 0, 1), 0x3b82f6));

    // Subtle negative axis lines
    const drawNegAxis = (dir: THREE.Vector3, color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(4)]);
      const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.15, gapSize: 0.1, transparent: true, opacity: 0.3 });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      scene.add(line);
    };
    drawNegAxis(new THREE.Vector3(-1, 0, 0), 0xef4444);
    drawNegAxis(new THREE.Vector3(0, -1, 0), 0x22c55e);
    drawNegAxis(new THREE.Vector3(0, 0, -1), 0x3b82f6);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Animation Loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const ro = new ResizeObserver(() => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
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

  // Sync geometry whenever data or visibility toggles change
  useEffect(() => {
    buildGeometry();
  }, [buildGeometry]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8 }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* ── TOP-RIGHT INTERACTIVE CONTROLS HUD ── */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        gap: 6,
        background: 'rgba(12, 16, 28, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: '4px 6px',
        zIndex: 10,
      }}>
        <button
          className={`btn btn-xs ${showFaces ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFaces(!showFaces)}
          title="Toggle translucent 3D solid faces"
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          {showFaces ? '✓ Solid Faces' : '+ Solid Faces'}
        </button>
        <button
          className={`btn btn-xs ${showVectors ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowVectors(!showVectors)}
          title="Toggle displacement trajectory lines (Original → Transformed)"
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          {showVectors ? '✓ Trajectories' : '+ Trajectories'}
        </button>
        <button
          className={`btn btn-xs ${showOriginal ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowOriginal(!showOriginal)}
          title="Toggle ghost blueprint of original shape"
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          {showOriginal ? '✓ Original' : '+ Original'}
        </button>
        <button
          className="btn btn-ghost btn-xs"
          onClick={handleResetCamera}
          title="Reset 3D camera to default viewpoint"
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          ↺ Reset View
        </button>
      </div>

      {/* ── BOTTOM-LEFT SLEEK LEGEND ── */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(12, 16, 28, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11.5,
        color: 'var(--text-2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
          <span style={{ fontWeight: 600 }}>Original Object (Ghost)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px #f97316' }} />
          <span style={{ fontWeight: 600, color: '#f97316' }}>Transformed Object (Solid)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>+X</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>+Y</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
            <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>+Z</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          Drag to rotate · Scroll to zoom · Right-click to pan
        </div>
      </div>
    </div>
  );
};
