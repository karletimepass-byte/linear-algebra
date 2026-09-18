import React from 'react';
import { Shape2D, Point2D, Matrix, StepCalculationDetail } from '../../types';
import { Canvas2D } from '../view2d/Canvas2D';
import { MatrixDisplay } from '../common/MatrixDisplay';
import { formatNumber } from '../../mathematics/matrix';
import { X, Presentation, Sparkles, HelpCircle } from 'lucide-react';

interface PresentationOverlayProps {
  onClose: () => void;
  shape: Shape2D;
  transformedPoints: Point2D[];
  matrixT: Matrix;
  originalMatrix: Matrix;
  transformedMatrix: Matrix;
  stepDetails: StepCalculationDetail[];
  isHomogeneous: boolean;
}

export const PresentationOverlay: React.FC<PresentationOverlayProps> = ({
  onClose,
  shape,
  transformedPoints,
  matrixT,
  originalMatrix,
  transformedMatrix,
  stepDetails,
  isHomogeneous,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 text-slate-100 flex flex-col p-6 overflow-y-auto">
      {/* Presentation Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <Presentation size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>MATRIX GRAPHICS LAB</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                Presentation Mode
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive College Project Demonstration • Linear Algebra in Graphic Designing
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
        >
          <X size={16} />
          <span>EXIT PRESENTATION MODE</span>
        </button>
      </div>

      {/* Main High-Contrast Projector View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto pt-6 items-center">
        {/* Left: Huge Clear Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="h-[520px] rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl">
            <Canvas2D
              originalShape={shape}
              transformedPoints={transformedPoints}
              showVectors={true}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
            <span>Original Object: Blue (P)</span>
            <span>Transformed Object: Emerald (P')</span>
            <span>Aspect Ratio: 1:1 Strict Cartesian</span>
          </div>
        </div>

        {/* Right: Enlarged Mathematical Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Key Formula Card */}
          <div className="bg-slate-900/95 rounded-2xl p-5 border border-indigo-500/50 shadow-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Fundamental Matrix Transformation
            </span>

            <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-base py-2">
              <span className="text-emerald-400 font-bold text-lg">P'</span>
              <span className="text-slate-400">=</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-sans mb-1">Matrix (T)</span>
                <MatrixDisplay matrix={matrixT} size="md" />
              </div>
              <span className="text-slate-400">·</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-sans mb-1">Object (P)</span>
                <MatrixDisplay matrix={originalMatrix} size="md" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-300">Result P' =</span>
                <MatrixDisplay matrix={transformedMatrix} size="md" className="ring-2 ring-emerald-500/60 rounded bg-emerald-950/30" />
              </div>
            </div>
          </div>

          {/* Vertex Mapping Highlights */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Vertex Coordinates Transformation
            </span>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {shape.points.map((pOrig, idx) => {
                const pTrans = transformedPoints[idx] || pOrig;
                return (
                  <div key={pOrig.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-sky-400 font-bold">{pOrig.label}</span>
                      <span>→</span>
                      <span className="text-emerald-400 font-bold">{pOrig.label}'</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>({formatNumber(pOrig.x)}, {formatNumber(pOrig.y)})</span>
                      <span className="text-emerald-300 font-semibold">
                        ({formatNumber(pTrans.x)}, {formatNumber(pTrans.y)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
