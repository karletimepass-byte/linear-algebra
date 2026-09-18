import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Shape3D, Point3D } from '../../types';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Camera, Eye } from 'lucide-react';
import { formatNumber } from '../../mathematics/matrix';

interface Viewport3DProps {
  originalShape: Shape3D;
  transformedPoints: Point3D[];
  selectedPointLabel?: string | null;
  onSelectPoint?: (label: string) => void;
  showVectors?: boolean;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  originalShape,
  transformedPoints,
  selectedPointLabel,
  onSelectPoint,
  showVectors = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Dynamic mesh references
  const origMeshGroupRef = useRef<THREE.Group | null>(null);
  const transMeshGroupRef = useRef<THREE.Group | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit State
  const cameraStateRef = useRef({
    radius: 8,
    theta: Math.PI / 4, // Horizontal angle (azimuth)
    phi: Math.PI / 3,   // Vertical angle (polar)
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    dragButton: 0, // 0: left (rotate), 2: right (pan)
    startX: 0,
    startY: 0,
  });

  const updateCameraPosition = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { radius, theta, phi, target } = cameraStateRef.current;

    // Convert spherical to cartesian
    cam.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cam.position.y = target.y + radius * Math.cos(phi);
    cam.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cam.lookAt(target);
  };

  const resetCamera = () => {
    cameraStateRef.current.radius = 8;
    cameraStateRef.current.theta = Math.PI / 4;
    cameraStateRef.current.phi = Math.PI / 3;
    cameraStateRef.current.target.set(0, 0, 0);
    updateCameraPosition();
  };

  const zoomCamera = (factor: number) => {
    cameraStateRef.current.radius = Math.max(2, Math.min(25, cameraStateRef.current.radius * factor));
    updateCameraPosition();
  };

  // Build Meshes and Wireframes helper
  const createShapeObjects = (points: Point3D[], edges: [number, number][], faces: number[][] | undefined, colorHex: number, isOriginal: boolean) => {
    const group = new THREE.Group();

    // 1. Vertices (Spheres)
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });

    points.forEach((pt) => {
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(pt.x, pt.y, pt.z);
      group.add(sphere);
    });

    // 2. Edges (Lines)
    if (edges && edges.length > 0) {
      const linePositions: number[] = [];
      edges.forEach(([i1, i2]) => {
        if (points[i1] && points[i2]) {
          linePositions.push(points[i1].x, points[i1].y, points[i1].z);
          linePositions.push(points[i2].x, points[i2].y, points[i2].z);
        }
      });

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        linewidth: 2,
        transparent: true,
        opacity: isOriginal ? 0.6 : 0.95,
      });
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      group.add(lines);
    }

    // 3. Faces (Translucent Mesh)
    if (faces && faces.length > 0) {
      const facePositions: number[] = [];
      faces.forEach(faceIndices => {
        // Simple fan triangulation for convex 3D polygon face
        for (let i = 1; i < faceIndices.length - 1; i++) {
          const p0 = points[faceIndices[0]];
          const p1 = points[faceIndices[i]];
          const p2 = points[faceIndices[i + 1]];
          if (p0 && p1 && p2) {
            facePositions.push(p0.x, p0.y, p0.z);
            facePositions.push(p1.x, p1.y, p1.z);
            facePositions.push(p2.x, p2.y, p2.z);
          }
        }
      });

      if (facePositions.length > 0) {
        const faceGeo = new THREE.BufferGeometry();
        faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(facePositions, 3));
        faceGeo.computeVertexNormals();

        const faceMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          transparent: true,
          opacity: isOriginal ? 0.2 : 0.45,
          side: THREE.DoubleSide,
          roughness: 0.3,
          metalness: 0.2,
        });

        const faceMesh = new THREE.Mesh(faceGeo, faceMat);
        group.add(faceMesh);
      }
    }

    return group;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // slate-950
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Helpers: Grid & Axes
    const gridHelper = new THREE.GridHelper(10, 10, 0x475569, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Custom 3D Axis with Red (X), Green (Y), Blue (Z)
    const axesHelper = new THREE.AxesHelper(4);
    scene.add(axesHelper);

    // Groups for shapes
    const origGroup = new THREE.Group();
    const transGroup = new THREE.Group();
    const vectGroup = new THREE.Group();
    scene.add(origGroup);
    scene.add(transGroup);
    scene.add(vectGroup);
    origMeshGroupRef.current = origGroup;
    transMeshGroupRef.current = transGroup;
    vectorsGroupRef.current = vectGroup;

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry when Points Change
  useEffect(() => {
    if (!origMeshGroupRef.current || !transMeshGroupRef.current || !vectorsGroupRef.current) return;

    // Clear old children
    while (origMeshGroupRef.current.children.length > 0) {
      origMeshGroupRef.current.remove(origMeshGroupRef.current.children[0]);
    }
    while (transMeshGroupRef.current.children.length > 0) {
      transMeshGroupRef.current.remove(transMeshGroupRef.current.children[0]);
    }
    while (vectorsGroupRef.current.children.length > 0) {
      vectorsGroupRef.current.remove(vectorsGroupRef.current.children[0]);
    }

    // 1. Original Shape (Blue 0x38bdf8)
    const origObj = createShapeObjects(
      originalShape.points,
      originalShape.edges,
      originalShape.faces,
      0x38bdf8,
      true
    );
    origMeshGroupRef.current.add(origObj);

    // 2. Transformed Shape (Emerald/Amber 0x10b981)
    const transObj = createShapeObjects(
      transformedPoints,
      originalShape.edges,
      originalShape.faces,
      0x10b981,
      false
    );
    transMeshGroupRef.current.add(transObj);

    // 3. Transformation displacement vectors
    if (showVectors && transformedPoints.length === originalShape.points.length) {
      const linePositions: number[] = [];
      originalShape.points.forEach((pOrig, i) => {
        const pTrans = transformedPoints[i];
        if (pTrans) {
          linePositions.push(pOrig.x, pOrig.y, pOrig.z);
          linePositions.push(pTrans.x, pTrans.y, pTrans.z);
        }
      });

      if (linePositions.length > 0) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineDashedMaterial({
          color: 0xc084fc, // purple-400
          dashSize: 0.15,
          gapSize: 0.1,
          transparent: true,
          opacity: 0.7,
        });
        const vectorLines = new THREE.LineSegments(lineGeo, lineMat);
        vectorLines.computeLineDistances();
        vectorsGroupRef.current.add(vectorLines);
      }
    }
  }, [originalShape, transformedPoints, showVectors]);

  // Mouse Orbit Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    cameraStateRef.current.isDragging = true;
    cameraStateRef.current.dragButton = e.button;
    cameraStateRef.current.startX = e.clientX;
    cameraStateRef.current.startY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraStateRef.current.isDragging) return;

    const deltaX = e.clientX - cameraStateRef.current.startX;
    const deltaY = e.clientY - cameraStateRef.current.startY;
    cameraStateRef.current.startX = e.clientX;
    cameraStateRef.current.startY = e.clientY;

    if (cameraStateRef.current.dragButton === 0) {
      // Left Click: Rotate Azimuth (theta) & Polar (phi)
      cameraStateRef.current.theta -= deltaX * 0.008;
      cameraStateRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, cameraStateRef.current.phi - deltaY * 0.008)
      );
    } else if (cameraStateRef.current.dragButton === 2) {
      // Right Click: Pan Camera Target
      const panSpeed = 0.006 * cameraStateRef.current.radius;
      cameraStateRef.current.target.x -= deltaX * panSpeed * Math.cos(cameraStateRef.current.theta);
      cameraStateRef.current.target.z += deltaX * panSpeed * Math.sin(cameraStateRef.current.theta);
      cameraStateRef.current.target.y += deltaY * panSpeed;
    }

    updateCameraPosition();
  };

  const handleMouseUp = () => {
    cameraStateRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.9 : 1.1;
    zoomCamera(factor);
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl select-none">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating 3D Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => zoomCamera(0.85)}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomCamera(1.15)}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Educational Notice on Camera vs Object Rotation */}
      <div className="absolute top-3 left-3 bg-slate-900/85 border border-slate-700/80 rounded-lg p-2.5 shadow-lg backdrop-blur-md text-xs space-y-1 max-w-xs">
        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
          <Camera size={14} />
          <span>Camera Controls Notice</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-tight">
          <strong>Left Drag:</strong> Rotate Camera Orbit • <strong>Right Drag:</strong> Pan • <strong>Wheel:</strong> Zoom
        </p>
        <p className="text-amber-400/90 font-mono text-[10px]">
          Note: Camera rotation ≠ Object transformation.
        </p>
      </div>

      {/* 3D Legend and Axis Helper */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 shadow-lg backdrop-blur-md text-xs space-y-1.5 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-sky-400/40 border border-sky-400 rounded-sm" />
          <span className="text-sky-300 font-medium">Original 3D Object (P)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500/40 border border-emerald-400 rounded-sm" />
          <span className="text-emerald-300 font-medium">Transformed 3D Object (P')</span>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-slate-800 text-[11px] font-mono">
          <span className="text-rose-400 font-bold">X: Red</span>
          <span className="text-emerald-400 font-bold">Y: Green</span>
          <span className="text-blue-400 font-bold">Z: Blue</span>
        </div>
      </div>
    </div>
  );
};
