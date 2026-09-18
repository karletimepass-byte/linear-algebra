import React, { useState, useMemo } from 'react';
import { Shape2D, Matrix, Point2D } from '../../types';
import { PRESET_SHAPES_2D } from '../../objects/presets2d';
import { Canvas2D } from '../view2d/Canvas2D';
import { MatrixDisplay } from '../common/MatrixDisplay';
import {
  multiplyMatrices,
  pointsToMatrix2D,
  matrixToPoints2D,
} from '../../mathematics/matrix';
import {
  createRotationMatrix2D,
  createScalingMatrix2D,
  createTranslationMatrix2D,
  createShearMatrix2D,
  toHomogeneous2D,
} from '../../mathematics/transformations2d';
import { GitCompare, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface OrderComparisonProps {
  baseShape?: Shape2D;
}

export const OrderComparison: React.FC<OrderComparisonProps> = ({
  baseShape = PRESET_SHAPES_2D[0],
}) => {
  // Select which pair of transformations to compare:
  // Pair 1: Rotation + Scaling
  // Pair 2: Translation + Rotation
  // Pair 3: Shearing + Reflection
  const [comparisonPreset, setComparisonPreset] = useState<'rot-scale' | 'trans-rot' | 'shear-scale'>('rot-scale');

  // Custom params
  const [rotAngle, setRotAngle] = useState<number>(45);
  const [scaleX, setScaleX] = useState<number>(2);
  const [scaleY, setScaleY] = useState<number>(0.5);
  const [transX, setTransX] = useState<number>(3);
  const [transY, setTransY] = useState<number>(1);

  // Compute Matrix A and Matrix B (3x3 homogeneous for consistency)
  const { matrixA, matrixB, nameA, nameB } = useMemo(() => {
    if (comparisonPreset === 'rot-scale') {
      const mA = toHomogeneous2D(createRotationMatrix2D(rotAngle, false));
      const mB = toHomogeneous2D(createScalingMatrix2D(scaleX, scaleY, false));
      return {
        matrixA: mA,
        matrixB: mB,
        nameA: `Rotation (${rotAngle}°)`,
        nameB: `Non-Uniform Scaling (${scaleX}x, ${scaleY}x)`,
      };
    } else if (comparisonPreset === 'trans-rot') {
      const mA = createTranslationMatrix2D(transX, transY);
      const mB = toHomogeneous2D(createRotationMatrix2D(rotAngle, false));
      return {
        matrixA: mA,
        matrixB: mB,
        nameA: `Translation (${transX}, ${transY})`,
        nameB: `Rotation (${rotAngle}°)`,
      };
    } else {
      const mA = toHomogeneous2D(createShearMatrix2D(1.2, 0, false));
      const mB = toHomogeneous2D(createScalingMatrix2D(scaleX, scaleY, false));
      return {
        matrixA: mA,
        matrixB: mB,
        nameA: 'Shearing (kx = 1.2)',
        nameB: `Scaling (${scaleX}x, ${scaleY}x)`,
      };
    }
  }, [comparisonPreset, rotAngle, scaleX, scaleY, transX, transY]);

  // Order 1: Apply B first, then A => T_order1 = A * B
  // Because P' = A * (B * P) = (A * B) * P
  const matrixOrder1 = useMemo(() => multiplyMatrices(matrixA, matrixB), [matrixA, matrixB]);

  // Order 2: Apply A first, then B => T_order2 = B * A
  // Because P'' = B * (A * P) = (B * A) * P
  const matrixOrder2 = useMemo(() => multiplyMatrices(matrixB, matrixA), [matrixA, matrixB]);

  // Check if they are equal
  const areEqual = useMemo(() => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (Math.abs(matrixOrder1[r][c] - matrixOrder2[r][c]) > 1e-5) {
          return false;
        }
      }
    }
    return true;
  }, [matrixOrder1, matrixOrder2]);

  // Points calculation for both orders
  const P_hom = useMemo(() => pointsToMatrix2D(baseShape.points, true), [baseShape.points]);
  
  const pointsOrder1: Point2D[] = useMemo(() => {
    const P1 = multiplyMatrices(matrixOrder1, P_hom);
    return matrixToPoints2D(P1, baseShape.points, true);
  }, [matrixOrder1, P_hom, baseShape.points]);

  const pointsOrder2: Point2D[] = useMemo(() => {
    const P2 = multiplyMatrices(matrixOrder2, P_hom);
    return matrixToPoints2D(P2, baseShape.points, true);
  }, [matrixOrder2, P_hom, baseShape.points]);

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <GitCompare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
              <span>Transformation Order Demonstration: Matrix Non-Commutativity</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60">
                A · B ≠ B · A
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Visual proof that the sequence in which transformations are applied alters the final geometric shape.
            </p>
          </div>
        </div>

        {/* Comparison Presets */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setComparisonPreset('rot-scale')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              comparisonPreset === 'rot-scale'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rotation vs Scaling
          </button>
          <button
            type="button"
            onClick={() => setComparisonPreset('trans-rot')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              comparisonPreset === 'trans-rot'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Translation vs Rotation
          </button>
          <button
            type="button"
            onClick={() => setComparisonPreset('shear-scale')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              comparisonPreset === 'shear-scale'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shearing vs Scaling
          </button>
        </div>
      </div>

      {/* Mathematical Principle Banner */}
      <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
        areEqual
          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
          : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
      }`}>
        {areEqual ? (
          <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
        )}
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-sm mb-0.5">
            {areEqual ? 'Commutative Case Detected (A · B = B · A)' : 'Non-Commutative Case: Matrix Multiplication is NOT Commutative'}
          </p>
          <p className="text-slate-300">
            In column-vector notation, applying transformation <code className="font-mono text-amber-300">B</code> first and then <code className="font-mono text-sky-300">A</code> results in <code className="font-mono text-white font-bold">P' = A · (B · P) = (A · B) · P</code>.
            Reversing the order applies <code className="font-mono text-sky-300">A</code> first and then <code className="font-mono text-amber-300">B</code>, yielding <code className="font-mono text-white font-bold">P'' = (B · A) · P</code>. Notice how the resulting graphics and matrices diverge!
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CASE 1: B then A => T = A * B */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Case 1: First {nameB} → Then {nameA}
              </span>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                T₁ = A · B
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono">
              P' = (A · B) · P
            </span>
          </div>

          <div className="h-64 rounded-lg overflow-hidden border border-slate-800">
            <Canvas2D
              originalShape={baseShape}
              transformedPoints={pointsOrder1}
              showVectors={true}
            />
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-sans block">Composed Matrix T₁ = A · B:</span>
            <div className="overflow-x-auto">
              <MatrixDisplay matrix={matrixOrder1} label="T₁" size="sm" />
            </div>
          </div>
        </div>

        {/* CASE 2: A then B => T = B * A */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Case 2: First {nameA} → Then {nameB}
              </span>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                T₂ = B · A
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono">
              P'' = (B · A) · P
            </span>
          </div>

          <div className="h-64 rounded-lg overflow-hidden border border-slate-800">
            <Canvas2D
              originalShape={baseShape}
              transformedPoints={pointsOrder2}
              showVectors={true}
            />
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-sans block">Composed Matrix T₂ = B · A:</span>
            <div className="overflow-x-auto">
              <MatrixDisplay matrix={matrixOrder2} label="T₂" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
