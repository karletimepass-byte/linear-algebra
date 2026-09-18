import React, { useState, useMemo } from 'react';
import { Matrix } from '../types';
import { MatrixInput } from '../components/common/MatrixInput';
import { MatrixDisplay } from '../components/common/MatrixDisplay';
import {
  multiplyMatrices,
  addMatrices,
  subtractMatrices,
  scaleMatrix,
  transposeMatrix,
  calculateDeterminant,
  calculateInverse,
  formatNumber,
} from '../mathematics/matrix';
import { Calculator, Plus, Minus, X, RotateCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

type CalcOperation = 'multiply' | 'add' | 'subtract' | 'scale' | 'transpose' | 'determinant' | 'inverse';

export const MatrixCalculatorPage: React.FC = () => {
  const [operation, setOperation] = useState<CalcOperation>('multiply');

  // Matrix A
  const [matrixA, setMatrixA] = useState<Matrix>([
    [2, 1],
    [1, 3],
  ]);

  // Matrix B
  const [matrixB, setMatrixB] = useState<Matrix>([
    [1, 2],
    [3, 0],
  ]);

  // Scalar k
  const [scalarK, setScalarK] = useState<number>(2);

  // Compute Operation and Detailed Arithmetic Step
  const { resultMatrix, scalarResult, calculationSteps, error } = useMemo(() => {
    try {
      if (operation === 'multiply') {
        const res = multiplyMatrices(matrixA, matrixB);
        const steps: string[] = [];
        for (let i = 0; i < matrixA.length; i++) {
          for (let j = 0; j < matrixB[0].length; j++) {
            const rowA = matrixA[i];
            const colB = matrixB.map(r => r[j]);
            const termsStr = rowA.map((val, k) => `(${formatNumber(val)} × ${formatNumber(colB[k])})`).join(' + ');
            steps.push(`C[${i + 1},${j + 1}] = Row_${i + 1}(A) · Col_${j + 1}(B) = ${termsStr} = ${formatNumber(res[i][j])}`);
          }
        }
        return { resultMatrix: res, scalarResult: null, calculationSteps: steps, error: null };
      }

      if (operation === 'add') {
        const res = addMatrices(matrixA, matrixB);
        const steps: string[] = [];
        for (let i = 0; i < matrixA.length; i++) {
          for (let j = 0; j < matrixA[0].length; j++) {
            steps.push(`C[${i + 1},${j + 1}] = ${formatNumber(matrixA[i][j])} + ${formatNumber(matrixB[i][j])} = ${formatNumber(res[i][j])}`);
          }
        }
        return { resultMatrix: res, scalarResult: null, calculationSteps: steps, error: null };
      }

      if (operation === 'subtract') {
        const res = subtractMatrices(matrixA, matrixB);
        const steps: string[] = [];
        for (let i = 0; i < matrixA.length; i++) {
          for (let j = 0; j < matrixA[0].length; j++) {
            steps.push(`C[${i + 1},${j + 1}] = ${formatNumber(matrixA[i][j])} - (${formatNumber(matrixB[i][j])}) = ${formatNumber(res[i][j])}`);
          }
        }
        return { resultMatrix: res, scalarResult: null, calculationSteps: steps, error: null };
      }

      if (operation === 'scale') {
        const res = scaleMatrix(matrixA, scalarK);
        const steps: string[] = [];
        for (let i = 0; i < matrixA.length; i++) {
          for (let j = 0; j < matrixA[0].length; j++) {
            steps.push(`(${formatNumber(scalarK)}) × ${formatNumber(matrixA[i][j])} = ${formatNumber(res[i][j])}`);
          }
        }
        return { resultMatrix: res, scalarResult: null, calculationSteps: steps, error: null };
      }

      if (operation === 'transpose') {
        const res = transposeMatrix(matrixA);
        const steps = [
          'Swapped rows into columns: Element A[i, j] ↦ A^T[j, i].',
          `Original dimensions: ${matrixA.length}×${matrixA[0].length} ↦ Transposed: ${res.length}×${res[0].length}.`
        ];
        return { resultMatrix: res, scalarResult: null, calculationSteps: steps, error: null };
      }

      if (operation === 'determinant') {
        const det = calculateDeterminant(matrixA);
        let steps: string[] = [];
        if (matrixA.length === 2) {
          steps.push(`det(A) = (a₁₁ × a₂₂) - (a₁₂ × a₂₁)`);
          steps.push(`det(A) = (${formatNumber(matrixA[0][0])} × ${formatNumber(matrixA[1][1])}) - (${formatNumber(matrixA[0][1])} × ${formatNumber(matrixA[1][0])})`);
          steps.push(`det(A) = ${formatNumber(matrixA[0][0] * matrixA[1][1])} - ${formatNumber(matrixA[0][1] * matrixA[1][0])} = ${formatNumber(det)}`);
        } else if (matrixA.length === 3) {
          steps.push(`det(A) = a₁₁(a₂₂a₃₃ - a₂₃a₃₂) - a₁₂(a₂₁a₃₃ - a₂₃a₃₁) + a₁₃(a₂₁a₃₂ - a₂₂a₃₁)`);
          steps.push(`det(A) = ${formatNumber(det)}`);
        } else {
          steps.push(`Laplace expansion computed for ${matrixA.length}×${matrixA.length} matrix.`);
          steps.push(`det(A) = ${formatNumber(det)}`);
        }
        return { resultMatrix: null, scalarResult: det, calculationSteps: steps, error: null };
      }

      if (operation === 'inverse') {
        const det = calculateDeterminant(matrixA);
        if (Math.abs(det) < 1e-10) {
          throw new Error('Matrix is singular (det = 0) and cannot be inverted.');
        }
        const inv = calculateInverse(matrixA);
        const steps = [
          `1. Computed determinant: det(A) = ${formatNumber(det)} (Invertible since det ≠ 0)`,
          `2. Formed cofactor matrix and computed adjugate adj(A)`,
          `3. Computed A⁻¹ = (1 / det(A)) · adj(A)`,
        ];
        return { resultMatrix: inv, scalarResult: null, calculationSteps: steps, error: null };
      }

      return { resultMatrix: null, scalarResult: null, calculationSteps: [], error: null };
    } catch (err: any) {
      return { resultMatrix: null, scalarResult: null, calculationSteps: [], error: err.message };
    }
  }, [operation, matrixA, matrixB, scalarK]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Linear Algebra Matrix Calculator</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Interactive Math Engine
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Performs fundamental matrix operations with full arithmetic derivations, verifying dimensions, determinants, and invertibility.
          </p>
        </div>
      </div>

      {/* Operation Selection Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 p-1.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs">
        <button
          type="button"
          onClick={() => setOperation('multiply')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'multiply' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          A × B
        </button>
        <button
          type="button"
          onClick={() => setOperation('add')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          A + B
        </button>
        <button
          type="button"
          onClick={() => setOperation('subtract')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'subtract' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          A - B
        </button>
        <button
          type="button"
          onClick={() => setOperation('scale')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'scale' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          k · A
        </button>
        <button
          type="button"
          onClick={() => setOperation('transpose')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'transpose' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Transpose Aᵀ
        </button>
        <button
          type="button"
          onClick={() => setOperation('determinant')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'determinant' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          det(A)
        </button>
        <button
          type="button"
          onClick={() => setOperation('inverse')}
          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
            operation === 'inverse' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Inverse A⁻¹
        </button>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Matrix A Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <span className="font-bold text-slate-100 text-sm">Matrix A</span>
            <div className="flex gap-1">
              {[2, 3].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    const newMat = Array.from({ length: sz }, (_, r) =>
                      Array.from({ length: sz }, (_, c) => (r === c ? 1 : 0))
                    );
                    setMatrixA(newMat);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300 hover:text-white font-mono"
                >
                  {sz}×{sz}
                </button>
              ))}
            </div>
          </div>

          <MatrixInput
            matrix={matrixA}
            onChange={setMatrixA}
            allowResize={true}
            label="Input Matrix A"
            minRows={1}
            maxRows={4}
            minCols={1}
            maxCols={4}
          />
        </div>

        {/* Matrix B or Scalar Card */}
        {['multiply', 'add', 'subtract'].includes(operation) && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="font-bold text-slate-100 text-sm">Matrix B</span>
              <div className="flex gap-1">
                {[2, 3].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      const newMat = Array.from({ length: sz }, (_, r) =>
                        Array.from({ length: sz }, (_, c) => (r === c ? 1 : 0))
                      );
                      setMatrixB(newMat);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300 hover:text-white font-mono"
                  >
                    {sz}×{sz}
                  </button>
                ))}
              </div>
            </div>

            <MatrixInput
              matrix={matrixB}
              onChange={setMatrixB}
              allowResize={true}
              label="Input Matrix B"
              minRows={1}
              maxRows={4}
              minCols={1}
              maxCols={4}
            />
          </div>
        )}

        {operation === 'scale' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3">
            <div className="pb-2 border-b border-slate-700/60">
              <span className="font-bold text-slate-100 text-sm">Scalar Factor (k)</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono">Scalar value: {scalarK}</span>
              <input
                type="number"
                step="any"
                value={scalarK}
                onChange={e => setScalarK(parseFloat(e.target.value) || 0)}
                className="w-32 h-9 px-2 text-center font-mono text-sm bg-slate-900 text-white rounded border border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results & Arithmetic Steps Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Calculation Output & Step-by-Step Working
              </h3>
              <p className="text-xs text-slate-400">Detailed algebraic derivation</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Result Display */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/70 flex flex-wrap items-center justify-center gap-4">
              {resultMatrix && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-300">Result Matrix:</span>
                  <MatrixDisplay matrix={resultMatrix} size="lg" className="ring-1 ring-emerald-500/40 rounded p-1 bg-emerald-950/20" />
                </div>
              )}

              {scalarResult !== null && (
                <div className="flex items-center gap-2 font-mono text-base">
                  <span className="text-slate-300 font-semibold">det(A) =</span>
                  <span className="px-3 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 rounded-lg font-bold text-lg">
                    {formatNumber(scalarResult)}
                  </span>
                </div>
              )}
            </div>

            {/* Arithmetic Breakdown Steps */}
            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/90 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Derivation Steps:
              </span>
              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                {calculationSteps.map((step, idx) => (
                  <div key={idx} className="p-2 bg-slate-900/60 rounded border border-slate-800">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
