// ============================================================
// Matrix Calculator Page — Live Matrix Arithmetic & Steps
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  matMul, matAdd, matSub, scalarMul, transpose, det, inverse,
  formatNum,
} from '../mathematics/matrixMath';
import type { Matrix } from '../mathematics/matrixMath';
import { MatrixDisplay, MatrixInput } from '../components/MatrixComponents';

type CalcOp = 'mul' | 'add' | 'sub' | 'scalar' | 'transpose' | 'det' | 'inv';

const OPS: { key: CalcOp; label: string; symbol: string; needsB: boolean }[] = [
  { key: 'mul',       label: 'A × B (Multiplication)', symbol: '×',   needsB: true },
  { key: 'add',       label: 'A + B (Addition)',       symbol: '+',   needsB: true },
  { key: 'sub',       label: 'A − B (Subtraction)',    symbol: '−',   needsB: true },
  { key: 'scalar',    label: 'c · A (Scalar Multiply)',symbol: 'c·',  needsB: false },
  { key: 'transpose', label: 'Aᵀ (Transpose)',         symbol: 'ᵀ',   needsB: false },
  { key: 'det',       label: 'det(A) (Determinant)',   symbol: '|A|', needsB: false },
  { key: 'inv',       label: 'A⁻¹ (Inverse Matrix)',   symbol: '⁻¹',  needsB: false },
];

function calculate(op: CalcOp, A: Matrix, B: Matrix, scalar: number): {
  result?: Matrix | number; steps: string[]; error?: string;
} {
  try {
    switch (op) {
      case 'add': {
        const r = matAdd(A, B);
        return { result: r, steps: ['Element-wise addition: (A + B)ᵢⱼ = Aᵢⱼ + Bᵢⱼ'] };
      }
      case 'sub': {
        const r = matSub(A, B);
        return { result: r, steps: ['Element-wise subtraction: (A − B)ᵢⱼ = Aᵢⱼ − Bᵢⱼ'] };
      }
      case 'mul': {
        const r = matMul(A, B);
        const steps = [
          `Matrix A is ${A.length}×${A[0].length}, Matrix B is ${B.length}×${B[0].length} → Result is ${A.length}×${B[0].length}`,
          `(A · B)ᵢⱼ = Σₖ Aᵢₖ · Bₖⱼ`,
          '',
        ];
        for (let i = 0; i < A.length; i++) {
          for (let j = 0; j < B[0].length; j++) {
            const terms = A[i].map((a, k) => `(${formatNum(a)} × ${formatNum(B[k][j])})`).join(' + ');
            steps.push(`  (AB)[row ${i+1}, col ${j+1}] = ${terms} = ${formatNum(r[i][j])}`);
          }
        }
        return { result: r, steps };
      }
      case 'scalar': {
        const r = scalarMul(A, scalar);
        return { result: r, steps: [`Multiply every entry by scalar c = ${scalar}`] };
      }
      case 'transpose': {
        const r = transpose(A);
        return { result: r, steps: ['Transpose: rows and columns swapped → (Aᵀ)ᵢⱼ = Aⱼᵢ'] };
      }
      case 'det': {
        if (A.length !== A[0].length) return { steps: [], error: 'Determinant is only defined for square matrices (n×n).' };
        const d = det(A);
        const steps = ['Determinant calculation:'];
        if (A.length === 2) {
          steps.push(`det(A) = a₁₁·a₂₂ − a₁₂·a₂₁`);
          steps.push(`       = (${formatNum(A[0][0])} × ${formatNum(A[1][1])}) − (${formatNum(A[0][1])} × ${formatNum(A[1][0])})`);
          steps.push(`       = ${formatNum(d)}`);
        } else {
          steps.push(`Cofactor expansion yields det(A) = ${formatNum(d)}`);
        }
        return { result: d, steps };
      }
      case 'inv': {
        if (A.length !== A[0].length) return { steps: [], error: 'Inverse is only defined for square matrices (n×n).' };
        const d = det(A);
        if (Math.abs(d) < 1e-10) return { steps: [], error: `Matrix is singular because det(A) = 0. No inverse exists.` };
        const r = inverse(A);
        return { result: r, steps: [`det(A) = ${formatNum(d)} ≠ 0 (Invertible)`, `Computed via Gaussian-Jordan elimination [A | I] → [I | A⁻¹]`, `Verification check: A · A⁻¹ = Identity Matrix I`] };
      }
    }
  } catch (e: unknown) {
    return { steps: [], error: e instanceof Error ? e.message : 'Calculation error' };
  }
}

export const CalculatorPage: React.FC = () => {
  const [op, setOp] = useState<CalcOp>('mul');
  const [A, setA] = useState<Matrix>([[1, 2], [3, 4]]);
  const [B, setB] = useState<Matrix>([[2, 0], [1, 2]]);
  const [scalar, setScalar] = useState(2);

  const needsB = OPS.find(o => o.key === op)?.needsB ?? false;

  // Live computation on every keystroke
  const calc = useMemo(() => calculate(op, A, B, scalar), [op, A, B, scalar]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

      {/* Operation selector bar */}
      <div className="panel" style={{ padding: '12px 16px' }}>
        <div className="panel-header" style={{ marginBottom: 10 }}>
          <div className="dot" style={{ background: 'var(--purple)' }} />
          Select Operation
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {OPS.map(o => (
            <button
              key={o.key}
              className={`btn btn-sm ${op === o.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setOp(o.key)}
            >
              <span style={{ fontFamily: 'var(--font-mono)', marginRight: 4, fontSize: 13, fontWeight: 700 }}>{o.symbol}</span>
              {o.label}
            </button>
          ))}
        </div>

        {op === 'scalar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <label className="label" style={{ margin: 0 }}>Scalar multiplier c =</label>
            <input
              type="number"
              className="field"
              style={{ width: 90, fontFamily: 'var(--font-mono)', padding: '4px 8px' }}
              value={scalar}
              step="0.5"
              onChange={e => setScalar(parseFloat(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {/* Matrix Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: needsB ? '1fr 1fr' : '1fr', gap: 14 }}>
        <div className="panel">
          <div className="panel-header">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            Matrix A ({A.length}×{A[0]?.length ?? 0})
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MatrixInput
              matrix={A}
              onChange={setA}
              allowResize
              minRows={1} maxRows={6}
              minCols={1} maxCols={6}
              accentColor="var(--blue-2)"
            />
          </div>
        </div>

        {needsB && (
          <div className="panel">
            <div className="panel-header">
              <div className="dot" style={{ background: 'var(--orange)' }} />
              Matrix B ({B.length}×{B[0]?.length ?? 0})
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MatrixInput
                matrix={B}
                onChange={setB}
                allowResize
                minRows={1} maxRows={6}
                minCols={1} maxCols={6}
                accentColor="var(--orange)"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Result & Computation Steps */}
      <div className="panel">
        <div className="panel-header">
          <div className="dot" style={{ background: 'var(--green)' }} />
          Live Result & Step-by-Step Breakdown
        </div>

        {calc.error ? (
          <div className="error-banner">{calc.error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}>
            {/* Result matrix */}
            <div style={{ padding: '8px 12px', background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {typeof calc.result === 'number' ? (
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Scalar Result
                  </div>
                  <div style={{ fontSize: 36, fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontWeight: 800 }}>
                    {formatNum(calc.result, 4)}
                  </div>
                </div>
              ) : calc.result ? (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Output Matrix ({calc.result.length}×{calc.result[0]?.length ?? 0})
                  </div>
                  <MatrixDisplay matrix={calc.result as Matrix} color="var(--orange)" decimals={3} />
                  {op === 'inv' && (
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                        Verification: A · A⁻¹ = I
                      </div>
                      <MatrixDisplay matrix={matMul(A, calc.result as Matrix)} color="var(--green)" small decimals={2} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Steps */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Calculation Breakdown
              </div>
              <div className="calc-box" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {calc.steps.map((s, i) => (
                  <div key={i} style={{ color: s === '' ? undefined : s.startsWith('  ') ? 'var(--text)' : 'var(--blue-2)', lineHeight: 1.7 }}>
                    {s || '\u200b'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fundamental Linear Algebra Properties */}
      <div className="panel">
        <div className="panel-header">
          <div className="dot" style={{ background: 'var(--teal)' }} />
          Fundamental Matrix Properties
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            ['Associative Property', '(A · B) · C = A · (B · C)'],
            ['Non-Commutative', 'A · B ≠ B · A (in general)'],
            ['Identity Element', 'A · I = I · A = A'],
            ['Invertibility Condition', 'A · A⁻¹ = I  (if det(A) ≠ 0)'],
            ['Product Transpose', '(A · B)ᵀ = Bᵀ · Aᵀ'],
            ['Multiplicative Determinant', 'det(A · B) = det(A) · det(B)'],
          ].map(([title, formula]) => (
            <div key={title} style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-2)', fontSize: 12.5 }}>{formula}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
