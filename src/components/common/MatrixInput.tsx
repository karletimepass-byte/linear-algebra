import React from 'react';
import { Matrix } from '../../types';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { createMatrix } from '../../mathematics/matrix';

interface MatrixInputProps {
  matrix: Matrix;
  onChange: (newMatrix: Matrix) => void;
  label?: string;
  allowResize?: boolean;
  minRows?: number;
  maxRows?: number;
  minCols?: number;
  maxCols?: number;
  disabled?: boolean;
  className?: string;
}

export const MatrixInput: React.FC<MatrixInputProps> = ({
  matrix,
  onChange,
  label,
  allowResize = false,
  minRows = 1,
  maxRows = 4,
  minCols = 1,
  maxCols = 6,
  disabled = false,
  className = '',
}) => {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  const handleCellChange = (rIdx: number, cIdx: number, valStr: string) => {
    const newMatrix = matrix.map(r => [...r]);
    const parsed = parseFloat(valStr);
    newMatrix[rIdx][cIdx] = isNaN(parsed) ? 0 : parsed;
    onChange(newMatrix);
  };

  const addRow = () => {
    if (rows < maxRows) {
      onChange([...matrix, Array(cols).fill(0)]);
    }
  };

  const removeRow = () => {
    if (rows > minRows) {
      onChange(matrix.slice(0, -1));
    }
  };

  const addCol = () => {
    if (cols < maxCols) {
      onChange(matrix.map(r => [...r, 0]));
    }
  };

  const removeCol = () => {
    if (cols > minCols) {
      onChange(matrix.map(r => r.slice(0, -1)));
    }
  };

  const resetIdentity = () => {
    const size = Math.min(rows, cols);
    const idMat = createMatrix(rows, cols, 0);
    for (let i = 0; i < size; i++) {
      idMat[i][i] = 1;
    }
    onChange(idMat);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          {label && <span>{label}</span>}
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">
            {rows} × {cols}
          </span>
        </div>

        {allowResize && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              <span className="text-[10px] text-slate-400">Rows:</span>
              <button
                type="button"
                onClick={removeRow}
                disabled={rows <= minRows}
                title="Remove Row"
                className="p-0.5 text-slate-300 hover:text-rose-400 disabled:opacity-30"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={addRow}
                disabled={rows >= maxRows}
                title="Add Row"
                className="p-0.5 text-slate-300 hover:text-emerald-400 disabled:opacity-30"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              <span className="text-[10px] text-slate-400">Cols:</span>
              <button
                type="button"
                onClick={removeCol}
                disabled={cols <= minCols}
                title="Remove Column"
                className="p-0.5 text-slate-300 hover:text-rose-400 disabled:opacity-30"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={addCol}
                disabled={cols >= maxCols}
                title="Add Column"
                className="p-0.5 text-slate-300 hover:text-emerald-400 disabled:opacity-30"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              type="button"
              onClick={resetIdentity}
              title="Reset to Identity Matrix"
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-indigo-400 bg-slate-800 border border-slate-700 rounded transition-colors"
            >
              <RotateCcw size={10} />
              Identity
            </button>
          </div>
        )}
      </div>

      {/* Styled Matrix Brackets & Inputs */}
      <div className="relative inline-block self-start p-2">
        {/* Left bracket */}
        <div className="absolute left-0 top-1 bottom-1 w-2.5 border-l-2 border-t-2 border-b-2 border-indigo-400 rounded-l-md pointer-events-none" />

        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {matrix.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <input
                key={`${rIdx}-${cIdx}`}
                type="number"
                step="any"
                value={Number.isFinite(val) ? val : 0}
                disabled={disabled}
                onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                className="w-14 sm:w-16 h-9 px-1 text-center font-mono text-sm bg-slate-900/90 text-white rounded border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:border-slate-600 disabled:opacity-50"
              />
            ))
          )}
        </div>

        {/* Right bracket */}
        <div className="absolute right-0 top-1 bottom-1 w-2.5 border-r-2 border-t-2 border-b-2 border-indigo-400 rounded-r-md pointer-events-none" />
      </div>
    </div>
  );
};
