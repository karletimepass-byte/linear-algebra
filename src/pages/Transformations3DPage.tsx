import React, { useState, useMemo } from 'react';
import { Shape3D, Matrix, Point3D } from '../types';
import { PRESET_SHAPES_3D } from '../objects/presets3d';
import { Viewport3D } from '../components/view3d/Viewport3D';
import { TransformControl3D } from '../components/view3d/TransformControl3D';
import { CoordinateTable3D } from '../components/view3d/CoordinateTable3D';
import { StepCalculation } from '../components/common/StepCalculation';
import {
  pointsToMatrix3D,
  matrixToPoints3D,
  multiplyMatrices,
  computeStepCalculationDetails,
} from '../mathematics/matrix';
import { createRotationYMatrix3D, toHomogeneous3D } from '../mathematics/transformations3d';
import { Box, Layers, AlertCircle } from 'lucide-react';

export const Transformations3DPage: React.FC = () => {
  // Preset shape
  const [shape, setShape] = useState<Shape3D>(() => {
    return { ...PRESET_SHAPES_3D[0], points: PRESET_SHAPES_3D[0].points.map(p => ({ ...p })) };
  });

  // 3D Matrix
  const [matrixT, setMatrixT] = useState<Matrix>(() => createRotationYMatrix3D(45, false));
  const [isHomogeneous, setIsHomogeneous] = useState<boolean>(false);

  // Selected vertex
  const [selectedPointLabel, setSelectedPointLabel] = useState<string | null>(null);

  // Math error
  const [mathError, setMathError] = useState<string | null>(null);

  // Calculate transformed points & step details
  const { transformedPoints, originalMatrix, transformedMatrix, stepDetails } = useMemo(() => {
    try {
      setMathError(null);
      let T = matrixT;
      let hom = isHomogeneous;

      if (hom && T.length === 3) {
        T = toHomogeneous3D(T);
      } else if (!hom && T.length === 4) {
        hom = true;
      }

      const P = pointsToMatrix3D(shape.points, hom);
      const PPrime = multiplyMatrices(T, P);
      const newPoints = matrixToPoints3D(PPrime, shape.points, hom);

      const labels = shape.points.map(p => p.label);
      const details = computeStepCalculationDetails(T, P, labels);

      return {
        transformedPoints: newPoints,
        originalMatrix: P,
        transformedMatrix: PPrime,
        stepDetails: details,
      };
    } catch (err: any) {
      setMathError(err.message || 'Error in 3D matrix multiplication.');
      return {
        transformedPoints: shape.points,
        originalMatrix: pointsToMatrix3D(shape.points, false),
        transformedMatrix: pointsToMatrix3D(shape.points, false),
        stepDetails: [],
      };
    }
  }, [shape.points, matrixT, isHomogeneous]);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_SHAPES_3D.find(s => s.id === presetId);
    if (found) {
      setShape({
        ...found,
        points: found.points.map(p => ({ ...p })),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>3D Geometric Transformation Workspace</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              P' = T · P (Three.js WebGL)
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            3D graphics represent vertices as 3×1 column vectors <code className="text-blue-300 font-mono">[x, y, z]^T</code> or 4×1 homogeneous vectors <code className="text-blue-300 font-mono">[x, y, z, 1]^T</code>. Interact with the 3D scene independently from object transformations.
          </p>
        </div>
      </div>

      {mathError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
          <span>{mathError}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3D Object & Matrix Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Shape Selector */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Box size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">3D Geometric Objects</h3>
                <p className="text-xs text-slate-400">Choose 3D model preset</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_SHAPES_3D.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectPreset(s.id)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-left border transition-all ${
                    shape.id === s.id
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-[10px] opacity-70 font-mono mt-0.5">
                    {s.points.length} vertices
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Matrix Controls */}
          <TransformControl3D
            currentMatrix={matrixT}
            onMatrixChange={(newMat, hom) => {
              setMatrixT(newMat);
              setIsHomogeneous(hom);
            }}
            isHomogeneous={isHomogeneous}
          />
        </div>

        {/* RIGHT COLUMN: Three.js Viewport & Mathematical Results (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Three.js 3D Viewport */}
          <Viewport3D
            originalShape={shape}
            transformedPoints={transformedPoints}
            selectedPointLabel={selectedPointLabel}
            onSelectPoint={setSelectedPointLabel}
            showVectors={true}
          />

          {/* 3D Coordinate Mapping Table */}
          <CoordinateTable3D
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
