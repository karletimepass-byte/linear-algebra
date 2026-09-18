import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shape2D, TransformationStep, Matrix, Point2D } from '../types';
import { PRESET_SHAPES_2D } from '../objects/presets2d';
import { Canvas2D } from '../components/view2d/Canvas2D';
import { ObjectEditor2D } from '../components/view2d/ObjectEditor2D';
import { CombinedPipeline } from '../components/combined/CombinedPipeline';
import { OrderComparison } from '../components/combined/OrderComparison';
import { StepCalculation } from '../components/common/StepCalculation';
import { CoordinateTable2D } from '../components/view2d/CoordinateTable2D';
import {
  multiplyMatrices,
  pointsToMatrix2D,
  matrixToPoints2D,
  computeStepCalculationDetails,
} from '../mathematics/matrix';
import {
  createRotationMatrix2D,
  createScalingMatrix2D,
  createTranslationMatrix2D,
  toHomogeneous2D,
} from '../mathematics/transformations2d';
import { Sparkles, GitCompare, Layers, Split } from 'lucide-react';

export const CombinedTransformationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'order-compare'>('pipeline');

  // Selected Object (Default to House for great combined transformation visualization)
  const [shape, setShape] = useState<Shape2D>(() => {
    const house = PRESET_SHAPES_2D.find(s => s.id === 'house') || PRESET_SHAPES_2D[0];
    return { ...house, points: house.points.map(p => ({ ...p })) };
  });

  // Steps in the pipeline
  const [steps, setSteps] = useState<TransformationStep[]>([
    {
      id: 'step_1',
      name: 'Translate (-3, -2)',
      type: 'translation',
      matrix: createTranslationMatrix2D(-3, -2),
      description: 'Move house center to origin',
      isHomogeneous: true,
    },
    {
      id: 'step_2',
      name: 'Rotate 45°',
      type: 'rotation',
      matrix: toHomogeneous2D(createRotationMatrix2D(45, false)),
      description: 'Rotate 45 degrees about origin',
      isHomogeneous: true,
    },
    {
      id: 'step_3',
      name: 'Scale 1.5x',
      type: 'scaling',
      matrix: toHomogeneous2D(createScalingMatrix2D(1.5, 1.5, false)),
      description: 'Scale object by 1.5',
      isHomogeneous: true,
    },
    {
      id: 'step_4',
      name: 'Translate (+3, +2)',
      type: 'translation',
      matrix: createTranslationMatrix2D(3, 2),
      description: 'Move back from origin',
      isHomogeneous: true,
    },
  ]);

  // Highlighted vertex
  const [selectedPointLabel, setSelectedPointLabel] = useState<string | null>(null);

  // Animation state
  const [animProgress, setAnimProgress] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // Compute Combined Matrix T_combined = T_n * ... * T_2 * T_1
  const combinedMatrix = useMemo(() => {
    if (steps.length === 0) {
      return [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
    }

    // Accumulate from right to left: T_combined = (...(T3 * T2) * T1)
    // Starting with T1
    let result = steps[0].matrix;
    for (let i = 1; i < steps.length; i++) {
      // Step i is applied after: so T_new = T_i * result
      result = multiplyMatrices(steps[i].matrix, result);
    }
    return result;
  }, [steps]);

  // Points and calculations
  const { transformedPoints, originalMatrix, transformedMatrix, stepDetails } = useMemo(() => {
    const P = pointsToMatrix2D(shape.points, true);
    const PPrime = multiplyMatrices(combinedMatrix, P);
    const newPoints = matrixToPoints2D(PPrime, shape.points, true);

    const labels = shape.points.map(p => p.label);
    const details = computeStepCalculationDetails(combinedMatrix, P, labels);

    return {
      transformedPoints: newPoints,
      originalMatrix: P,
      transformedMatrix: PPrime,
      stepDetails: details,
    };
  }, [shape.points, combinedMatrix]);

  // Animation
  const startAnimation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 900;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
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

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Combined Transformations & Matrix Composition</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              P' = (T_k · ... · T_1) · P
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multiple matrix transformations can be compressed into a single combined matrix through matrix multiplication. Explore sequential pipelines and the non-commutative property (<code className="text-amber-300 font-mono">AB ≠ BA</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700/70">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Sequential Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('order-compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'order-compare'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split size={14} />
            <span>Compare Order (AB ≠ BA)</span>
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Object & Pipeline Sequence (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ObjectEditor2D
              currentShape={shape}
              onShapeChange={setShape}
              selectedPointLabel={selectedPointLabel}
              onSelectPoint={setSelectedPointLabel}
              isHomogeneous={true}
            />

            <CombinedPipeline
              steps={steps}
              onStepsChange={setSteps}
              combinedMatrix={combinedMatrix}
            />
          </div>

          {/* RIGHT: Canvas & Math (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full Sequential Transformation Result
              </span>
              <button
                type="button"
                onClick={startAnimation}
                disabled={isAnimating}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Animate Full Pipeline</span>
              </button>
            </div>

            <Canvas2D
              originalShape={shape}
              transformedPoints={transformedPoints}
              animating={isAnimating}
              animationProgress={animProgress}
              selectedPointLabel={selectedPointLabel}
              onSelectPoint={setSelectedPointLabel}
              showVectors={true}
            />

            <CoordinateTable2D
              originalPoints={shape.points}
              transformedPoints={transformedPoints}
              selectedPointLabel={selectedPointLabel}
              onSelectPoint={setSelectedPointLabel}
            />

            <StepCalculation
              transformationMatrix={combinedMatrix}
              originalMatrix={originalMatrix}
              resultMatrix={transformedMatrix}
              stepDetails={stepDetails}
              activePointLabel={selectedPointLabel}
              onSelectPoint={setSelectedPointLabel}
              isHomogeneous={true}
            />
          </div>
        </div>
      ) : (
        /* Order Comparison Tab (AB != BA) */
        <OrderComparison baseShape={shape} />
      )}
    </div>
  );
};
