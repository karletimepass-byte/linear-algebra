import React, { useState, useEffect } from 'react';
import { formatNum } from '../mathematics/matrixMath';

// ============================================================
// MatrixDisplay — read-only with proper bracket rendering & labels
// ============================================================
interface DisplayProps {
  matrix: number[][];
  label?: string;
  decimals?: number;
  color?: string;
  small?: boolean;
  colHeaders?: string[];
  rowHeaders?: string[];
}

export const MatrixDisplay: React.FC<DisplayProps> = ({
  matrix,
  label,
  decimals = 4,
  color,
  small = false,
  colHeaders,
  rowHeaders,
}) => {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const fs = small ? 12 : cols > 4 ? 11.5 : cols > 2 ? 12.5 : 13.5;
  const minW = small ? 24 : cols > 4 ? 26 : cols > 2 ? 32 : 38;
  const pad = small ? '1px 2px' : cols > 3 ? '1px 3px' : '2px 5px';
  const bracketColor = color ?? 'var(--text-2)';

  if (rows === 0 || cols === 0) {
    return <div style={{ color: 'var(--text-3)', fontSize: 12 }}>[Empty Matrix]</div>;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
      {label && (
        <div style={{
          fontSize: 11,
          color: color ?? 'var(--text-3)',
          marginBottom: 6,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}

      {/* Optional column headers */}
      {colHeaders && colHeaders.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (rowHeaders ? '24px ' : '') + `repeat(${cols}, auto)`,
          gap: small ? '2px 6px' : cols > 3 ? '2px 6px' : '3px 10px',
          marginBottom: 4,
          paddingLeft: 6,
          paddingRight: 6,
        }}>
          {rowHeaders && <div />}
          {colHeaders.slice(0, cols).map((h, ci) => (
            <div key={ci} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: small ? 10 : 11,
              fontWeight: 700,
              color: 'var(--blue-2)',
              minWidth: minW,
              textAlign: 'center'
            }}>
              {h}
            </div>
          ))}
        </div>
      )}

      <div className="mx-wrap" style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
        {/* Optional row headers */}
        {rowHeaders && rowHeaders.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            marginRight: 6,
            height: '100%',
          }}>
            {rowHeaders.slice(0, rows).map((r, ri) => (
              <span key={ri} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: small ? 11 : 12,
                color: 'var(--text-3)',
                fontWeight: 600,
                textAlign: 'right',
                padding: pad,
              }}>
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Left bracket */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 7, flexShrink: 0, alignSelf: 'stretch' }}>
          <div style={{ height: 6, borderTop: `2px solid ${bracketColor}`, borderLeft: `2px solid ${bracketColor}`, borderRadius: '3px 0 0 0' }} />
          <div style={{ flex: 1, borderLeft: `2px solid ${bracketColor}` }} />
          <div style={{ height: 6, borderBottom: `2px solid ${bracketColor}`, borderLeft: `2px solid ${bracketColor}`, borderRadius: '0 0 0 3px' }} />
        </div>

        {/* Grid of numbers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, auto)`,
          gap: small ? '2px 6px' : cols > 3 ? '2px 6px' : '3px 10px',
          alignItems: 'center',
          justifyItems: 'end',
          padding: '2px 6px',
        }}>
          {matrix.map((row, i) =>
            row.map((val, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: fs,
                  color: color ?? 'var(--text)',
                  minWidth: minW,
                  textAlign: 'right',
                  padding: pad,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatNum(val, decimals)}
              </div>
            ))
          )}
        </div>

        {/* Right bracket */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 7, flexShrink: 0, alignSelf: 'stretch' }}>
          <div style={{ height: 6, borderTop: `2px solid ${bracketColor}`, borderRight: `2px solid ${bracketColor}`, borderRadius: '0 3px 0 0' }} />
          <div style={{ flex: 1, borderRight: `2px solid ${bracketColor}` }} />
          <div style={{ height: 6, borderBottom: `2px solid ${bracketColor}`, borderRight: `2px solid ${bracketColor}`, borderRadius: '0 0 3px 0' }} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MatrixInput — robust editable grid with seamless typing
// ============================================================
interface InputProps {
  matrix: number[][];
  onChange: (m: number[][]) => void;
  allowResize?: boolean;
  minRows?: number; maxRows?: number;
  minCols?: number; maxCols?: number;
  label?: string;
  accentColor?: string;
}

export const MatrixInput: React.FC<InputProps> = ({
  matrix, onChange,
  allowResize = false,
  minRows = 1, maxRows = 6,
  minCols = 1, maxCols = 6,
  label,
  accentColor = 'var(--purple)',
}) => {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  // Keep internal text state so typing '-', '.', '0.' is smooth and not interrupted
  const [textGrid, setTextGrid] = useState<string[][]>(() =>
    matrix.map(row => row.map(v => String(v)))
  );

  // Synchronize internal text state if external matrix shape or numbers change from outside
  useEffect(() => {
    setTextGrid(prev => {
      if (prev.length !== matrix.length || (prev[0]?.length ?? 0) !== (matrix[0]?.length ?? 0)) {
        return matrix.map(row => row.map(v => String(v)));
      }
      return matrix.map((row, i) =>
        row.map((val, j) => {
          const currentParsed = parseFloat(prev[i]?.[j] ?? '');
          return currentParsed === val ? (prev[i]?.[j] ?? String(val)) : String(val);
        })
      );
    });
  }, [matrix]);

  const handleCellChange = (i: number, j: number, text: string) => {
    const nextGrid = textGrid.map((row, ri) =>
      row.map((cell, ci) => (ri === i && ci === j ? text : cell))
    );
    setTextGrid(nextGrid);

    const parsed = parseFloat(text);
    if (!isNaN(parsed) && isFinite(parsed)) {
      const nextMatrix = matrix.map((row, ri) =>
        row.map((cell, ci) => (ri === i && ci === j ? parsed : cell))
      );
      onChange(nextMatrix);
    }
  };

  const handleBlur = (i: number, j: number) => {
    const text = textGrid[i]?.[j]?.trim() ?? '';
    const parsed = parseFloat(text);
    const validVal = isNaN(parsed) ? 0 : parsed;
    const nextGrid = textGrid.map((row, ri) =>
      row.map((cell, ci) => (ri === i && ci === j ? String(validVal) : cell))
    );
    setTextGrid(nextGrid);
    const nextMatrix = matrix.map((row, ri) =>
      row.map((cell, ci) => (ri === i && ci === j ? validVal : cell))
    );
    onChange(nextMatrix);
  };

  const addRow = () => {
    if (rows < maxRows) {
      const newRow = Array(cols).fill(0);
      onChange([...matrix, newRow]);
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

  const setToIdentity = () => {
    const dim = Math.min(rows, cols);
    const id = Array.from({ length: dim }, (_, r) =>
      Array.from({ length: dim }, (_, c) => (r === c ? 1 : 0))
    );
    onChange(id);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      {label && <span className="label">{label}</span>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Left bracket */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 9, alignSelf: 'stretch' }}>
          <div style={{ height: 10, borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, borderRadius: '4px 0 0 0' }} />
          <div style={{ flex: 1, borderLeft: `2px solid ${accentColor}` }} />
          <div style={{ height: 10, borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, borderRadius: '0 0 0 4px' }} />
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 58px)`,
          gap: 6,
          padding: '6px 4px'
        }}>
          {matrix.map((row, i) =>
            row.map((_, j) => (
              <input
                key={`${i}-${j}`}
                type="text"
                inputMode="decimal"
                className="field"
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 4px',
                  borderColor: 'var(--border-2)',
                  background: 'var(--bg-1)',
                  color: 'var(--text)',
                }}
                value={textGrid[i]?.[j] ?? '0'}
                onChange={e => handleCellChange(i, j, e.target.value)}
                onBlur={() => handleBlur(i, j)}
                onFocus={e => e.target.select()}
                placeholder="0"
              />
            ))
          )}
        </div>

        {/* Right bracket */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 9, alignSelf: 'stretch' }}>
          <div style={{ height: 10, borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, borderRadius: '0 4px 0 0' }} />
          <div style={{ flex: 1, borderRight: `2px solid ${accentColor}` }} />
          <div style={{ height: 10, borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, borderRadius: '0 0 4px 0' }} />
        </div>

        {allowResize && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 6 }}>
            <button className="btn btn-ghost btn-xs" onClick={addCol} disabled={cols >= maxCols} title="Add Column">+col</button>
            <button className="btn btn-ghost btn-xs" onClick={removeCol} disabled={cols <= minCols} title="Remove Column">−col</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {rows} × {cols} matrix
        </div>
        {allowResize && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-ghost btn-xs" onClick={addRow} disabled={rows >= maxRows}>+row</button>
            <button className="btn btn-ghost btn-xs" onClick={removeRow} disabled={rows <= minRows}>−row</button>
            {rows === cols && (
              <button className="btn btn-ghost btn-xs" onClick={setToIdentity} title="Reset to Identity matrix">
                I
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
