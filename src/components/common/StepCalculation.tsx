import React, { useState } from 'react';
import { Matrix, StepCalculationDetail } from '../../types';
import { MatrixDisplay } from './MatrixDisplay';
import { formatNumber } from '../../mathematics/matrix';
import { ChevronDown, ChevronUp, Calculator, Info, Sparkles } from 'lucide-react';

interface StepCalculationProps {
  transformationMatrix: Matrix;
  originalMatrix: Matrix;
  resultMatrix: Matrix;
  stepDetails: StepCalculationDetail[];
  activePointLabel?: string | null;
  onSelectPoint?: (label: string) => void;
  transformationName?: string;
  isHomogeneous?: boolean;
}

export const StepCalculation: React.FC<StepCalculationProps> = ({
  transformationMatrix,
  originalMatrix,
  resultMatrix,
  stepDetails,
  activePointLabel,
  onSelectPoint,
  transformationName = 'Linear Transformation',
  isHomogeneous = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);

  // If external activePointLabel is provided, sync with it
  React.useEffect(() => {
    if (activePointLabel) {
      const idx = stepDetails.findIndex(d => d.pointLabel === activePointLabel);
      if (idx !== -1) {
        setSelectedPointIndex(idx);
      }
    }
  }, [activePointLabel, stepDetails]);

  const activeDetail = stepDetails[selectedPointIndex] || stepDetails[0];

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Step-by-Step Mathematical Calculation
            </h3>
            <p className="text-xs text-slate-400">
              Column-vector multiplication: <span className="font-mono text-indigo-300 font-medium">P' = T · P</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          title={expanded ? 'Collapse calculation' : 'Expand calculation'}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Top Formula Overview */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/50 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-mono py-1">
              <span className="text-emerald-400 font-bold">P'</span>
              <span className="text-slate-400">=</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-sans mb-0.5">Transformation Matrix (T)</span>
                <MatrixDisplay matrix={transformationMatrix} size="sm" />
              </div>
              <span className="text-slate-400">·</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-sans mb-0.5">Object Matrix (P)</span>
                <MatrixDisplay matrix={originalMatrix} size="sm" />
              </div>
              <span className="text-slate-400">=</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-400 font-sans mb-0.5">Transformed Matrix (P')</span>
                <MatrixDisplay matrix={resultMatrix} size="sm" className="ring-1 ring-emerald-500/40 rounded bg-emerald-950/20" />
              </div>
            </div>
            
            {isHomogeneous && (
              <div className="mt-2 text-center text-xs text-indigo-300/80 bg-indigo-950/30 py-1 px-2 rounded border border-indigo-800/40 flex items-center justify-center gap-1.5">
                <Info size={13} />
                <span>Computed using <strong>Homogeneous Coordinates</strong> to support affine translation via matrix multiplication.</span>
              </div>
            )}
          </div>

          {/* Vertex Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Individual Column Calculations ({stepDetails.length} Points)
              </span>
              <span className="text-xs text-slate-500">
                Click a vertex to inspect arithmetic
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {stepDetails.map((detail, idx) => {
                const isSelected = selectedPointIndex === idx;
                return (
                  <button
                    key={detail.pointLabel}
                    type="button"
                    onClick={() => {
                      setSelectedPointIndex(idx);
                      if (onSelectPoint) onSelectPoint(detail.pointLabel);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                        : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50'
                    }`}
                  >
                    <span>{detail.pointLabel}</span>
                    <span className="text-[10px] opacity-75">
                      ({formatNumber(detail.originalCoord[0])}, {formatNumber(detail.originalCoord[1])})
                    </span>
                    <span className="text-indigo-300 text-[10px]">→</span>
                    <span className="text-emerald-300 font-semibold">
                      {detail.pointLabel}'
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Row-by-Column Breakdown for Selected Vertex */}
          {activeDetail && (
            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-indigo-500/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-sm">
                    Vertex {activeDetail.pointLabel}
                  </span>
                  <span className="text-xs text-slate-400">
                    Transforming column vector <span className="font-mono text-slate-200">v_{activeDetail.pointLabel}</span>
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>
                    {activeDetail.pointLabel}' = ({formatNumber(activeDetail.transformedCoord[0])}, {formatNumber(activeDetail.transformedCoord[1])}
                    {activeDetail.transformedCoord.length > 2 && !isHomogeneous ? `, ${formatNumber(activeDetail.transformedCoord[2])}` : ''})
                  </span>
                </div>
              </div>

              {/* Matrix x Column Vector Layout */}
              <div className="space-y-3 font-mono text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2 text-slate-300">
                  <span className="font-semibold text-indigo-400">
                    {activeDetail.pointLabel}' = T · {activeDetail.pointLabel}
                  </span>
                  <span className="text-slate-500">=</span>
                  <MatrixDisplay matrix={transformationMatrix} size="sm" />
                  <span className="text-slate-500">·</span>
                  <MatrixDisplay
                    matrix={activeDetail.originalCoord.map(val => [val])}
                    size="sm"
                  />
                </div>

                {/* Arithmetic Dot-product expansions */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] font-sans font-medium text-slate-400 uppercase tracking-wide">
                    Row-by-Column Inner Products:
                  </div>

                  {activeDetail.dotProducts.map((dp, rowIdx) => {
                    const rowLabel = rowIdx === 0 ? "x' (Row 1)" : rowIdx === 1 ? "y' (Row 2)" : rowIdx === 2 ? "z' / w (Row 3)" : "w (Row 4)";
                    const termsStr = dp.terms
                      .map(t => `(${formatNumber(t.factor1)} × ${formatNumber(t.factor2)})`)
                      .join(' + ');
                    const evaluatedTermsStr = dp.terms
                      .map(t => formatNumber(t.product))
                      .join(' + ');

                    return (
                      <div key={rowIdx} className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <div className="flex flex-wrap items-baseline gap-1 text-slate-200">
                          <span className="text-indigo-300 font-semibold w-24 flex-shrink-0 text-xs font-sans">
                            {rowLabel}:
                          </span>
                          <span className="text-slate-400">{termsStr}</span>
                          <span className="text-slate-500">=</span>
                          <span className="text-amber-300">{evaluatedTermsStr}</span>
                          <span className="text-slate-500">=</span>
                          <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            {formatNumber(dp.sum)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
