import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shape2D, Point2D, Matrix } from '../types';
import { PRESET_SHAPES_2D } from '../objects/presets2d';
import { Canvas2D } from '../components/view2d/Canvas2D';
import { ObjectEditor2D } from '../components/view2d/ObjectEditor2D';
import { TransformControl2D } from '../components/view2d/TransformControl2D';
import { CoordinateTable2D } from '../components/view2d/CoordinateTable2D';
import { StepCalculation } from '../components/common/StepCalculation';
import {
  pointsToMatrix2D,
  matrixToPoints2D,
  multiplyMatrices,
  computeStepCalculationDetails,
} from '../mathematics/matrix';
import { createScalingMatrix2D, toHomogeneous2D } from '../mathematics/transformations2d';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface Transformations2DPageProps {
  initialShapeId?: string;
  initialTransformation?: any;
}

export const Transformations2DPage: React.FC<Transformations2DPageProps> = ({
  initialShapeId,
  initialTransformation,
}) => {
  // Current 2D Shape
  const [shape, setShape] = useState<Shape2D>(() => {
    if (initialShapeId) {
      const found = PRESET_SHAPES_2D.find(s => s.id === initialShapeId);
      if (found) return { ...found, points: found.points.map(p => ({ ...p })) };
    }
    return { ...PRESET_SHAPES_2D[0], points: PRESET_SHAPES_2D[0].points.map(p => ({ ...p })) };
  });

  // Transformation Matrix T & Homogeneous flag
  const [matrixT, setMatrixT] = useState<Matrix>(() => createScalingMatrix2D(2, 2, false));
  const [isHomogeneous, setIsHomogeneous] = useState<boolean>(false);

  // Active highlighted vertex
  const [selectedPointLabel, setSelectedPointLabel] = useState<string | null>(null);

  // Animation state
  const [animProgress, setAnimProgress] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // Error boundary state
  const [mathError, setMathError] = useState<string | null>(null);

  // Calculate transformed points and step details
  const { transformedPoints, originalMatrix, transformedMatrix, stepDetails } = useMemo(() => {
    try {
      setMathError(null);
      let T = matrixT;
      let homogeneous = isHomogeneous;

      // Ensure dimension compatibility
      if (homogeneous && T.length === 2) {
        T = toHomogeneous2D(T);
      } else if (!homogeneous && T.length === 3) {
        homogeneous = true;
      }

      const P = pointsToMatrix2D(shape.points, homogeneous);
      const PPrime = multiplyMatrices(T, P);
      const newPoints = matrixToPoints2D(PPrime, shape.points, homogeneous);

      const labels = shape.points.map(p => p.label);
      const details = computeStepCalculationDetails(T, P, labels);

      return {
        transformedPoints: newPoints,
        originalMatrix: P,
        transformedMatrix: PPrime,
        stepDetails: details,
      };
    } catch (err: any) {
      setMathError(err.message || 'Error computing matrix multiplication.');
      return {
        transformedPoints: shape.points,
        originalMatrix: pointsToMatrix2D(shape.points, false),
        transformedMatrix: pointsToMatrix2D(shape.points, false),
        stepDetails: [],
      };
    }
  }, [shape.points, matrixT, isHomogeneous]);

  // Handle Animation Trigger
  const startAnimation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 750; // ms

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimProgress(ease);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setAnimProgress(1);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const instantApply = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setAnimProgress(1);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Academic Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>2D Geometric Transformation Workspace</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              P' = T · P
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Every 2D point is a 2×1 column vector <code className="text-indigo-300 font-mono">[x, y]^T</code>. Multiplying an object's coordinate matrix <code className="text-sky-300 font-mono">P</code> by transformation matrix <code className="text-indigo-300 font-mono">T</code> computes its transformed coordinates <code className="text-emerald-300 font-mono">P'</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startAnimation}
            disabled={isAnimating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Animate Transformation</span>
          </button>
        </div>
      </div>

      {/* Math Error Alert if any */}
      {mathError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
          <span>{mathError}</span>
        </div>
      )}

      {/* Main 3-Column / Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Object & Matrix Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ObjectEditor2D
            currentShape={shape}
            onShapeChange={setShape}
            selectedPointLabel={selectedPointLabel}
            onSelectPoint={setSelectedPointLabel}
            isHomogeneous={isHomogeneous}
          />

          <TransformControl2D
            currentMatrix={matrixT}
            onMatrixChange={(newMat, hom) => {
              setMatrixT(newMat);
              setIsHomogeneous(hom);
            }}
            onAnimateTransform={startAnimation}
            onInstantApply={instantApply}
            isAnimating={isAnimating}
            isHomogeneous={isHomogeneous}
          />
        </div>

        {/* CENTER & RIGHT: Canvas Viewport & Mathematical Results (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Central 2D Canvas */}
          <Canvas2D
            originalShape={shape}
            transformedPoints={transformedPoints}
            animating={isAnimating}
            animationProgress={animProgress}
            selectedPointLabel={selectedPointLabel}
            onSelectPoint={setSelectedPointLabel}
            showVectors={true}
          />

          {/* Coordinate Mapping Comparison Table */}
          <CoordinateTable2D
            originalPoints={shape.points}
            transformedPoints={transformedPoints}
            selectedPointLabel={selectedPointLabel}
            onSelectPoint={setSelectedPointLabel}
          />

          {/* Step-by-Step Calculation Engine */}
          <StepCalculation
            transformationMatrix={matrixT}
            originalMatrix={originalMatrix}
            resultMatrix={transformedMatrix}
            stepDetails={stepDetails}
            activePointLabel={selectedPointLabel}
            onSelectPoint={setSelectedPointLabel}
            isHomogeneous={isHomogeneous}
          />
        </div>
      </div>
    </div>
  );
};
