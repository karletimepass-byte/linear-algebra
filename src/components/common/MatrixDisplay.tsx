import React from 'react';
import { Matrix } from '../../types';
import { formatNumber } from '../../mathematics/matrix';

interface MatrixDisplayProps {
  matrix: Matrix;
  label?: string;
  subscript?: string;
  size?: 'sm' | 'md' | 'lg';
  highlightCells?: [number, number][];
  className?: string;
}

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({
  matrix,
  label,
  subscript,
  size = 'md',
  highlightCells = [],
  className = '',
}) => {
  if (!matrix || matrix.length === 0) return null;

  const numRows = matrix.length;
  const numCols = matrix[0]?.length || 0;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-semibold',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 font-mono ${className}`}>
      {label && (
        <span className="text-slate-300 font-semibold select-none flex items-center">
          {label}
          {subscript && <sub className="text-xs text-slate-400 ml-0.5">{subscript}</sub>}
          <span className="mx-1.5 text-slate-400">=</span>
        </span>
      )}

      {/* Bracketed Matrix Box */}
      <div className="relative inline-flex items-center px-1.5">
        {/* Left bracket */}
        <div className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-indigo-400 rounded-l-sm" />

        {/* Matrix grid cells */}
        <div
          className="grid gap-x-2 gap-y-1 my-1"
          style={{
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
          }}
        >
          {matrix.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const isHighlighted = highlightCells.some(([r, c]) => r === rIdx && c === cIdx);
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`text-center font-mono ${sizeClasses} rounded transition-colors ${
                    isHighlighted
                      ? 'bg-blue-600/40 text-blue-200 ring-1 ring-blue-400'
                      : 'text-slate-200'
                  }`}
                >
                  {formatNumber(val)}
                </div>
              );
            })
          )}
        </div>

        {/* Right bracket */}
        <div className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-indigo-400 rounded-r-sm" />
      </div>

      <span className="text-[10px] text-slate-500 font-sans ml-0.5">
        {numRows}×{numCols}
      </span>
    </div>
  );
};
