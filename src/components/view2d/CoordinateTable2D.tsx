import React from 'react';
import { Point2D } from '../../types';
import { formatNumber } from '../../mathematics/matrix';
import { Table, MapPin } from 'lucide-react';

interface CoordinateTable2DProps {
  originalPoints: Point2D[];
  transformedPoints: Point2D[];
  selectedPointLabel?: string | null;
  onSelectPoint?: (label: string) => void;
}

export const CoordinateTable2D: React.FC<CoordinateTable2DProps> = ({
  originalPoints,
  transformedPoints,
  selectedPointLabel,
  onSelectPoint,
}) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Table size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Coordinate Mapping Table
            </h3>
            <p className="text-xs text-slate-400">
              Original <span className="font-mono text-sky-400">P</span> vs Transformed <span className="font-mono text-emerald-400">P'</span>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-700/70 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="pb-2 pl-2">Point</th>
              <th className="pb-2">Original (x, y)</th>
              <th className="pb-2">Transformed (x', y')</th>
              <th className="pb-2">Displacement (Δx, Δy)</th>
              <th className="pb-2 text-right pr-2">Distance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {originalPoints.map((pOrig, idx) => {
              const pTrans = transformedPoints[idx] || pOrig;
              const isSelected = pOrig.label === selectedPointLabel;
              const dx = pTrans.x - pOrig.x;
              const dy = pTrans.y - pOrig.y;
              const distance = Math.hypot(dx, dy);

              return (
                <tr
                  key={pOrig.id}
                  onClick={() => onSelectPoint && onSelectPoint(pOrig.label)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 text-white font-semibold'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 pl-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 text-[11px]">
                      {pOrig.label}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center font-bold text-emerald-400 text-[11px]">
                      {pOrig.label}'
                    </span>
                  </td>

                  <td className="py-2.5 text-sky-300">
                    ({formatNumber(pOrig.x)}, {formatNumber(pOrig.y)})
                  </td>

                  <td className="py-2.5 text-emerald-400 font-semibold">
                    ({formatNumber(pTrans.x)}, {formatNumber(pTrans.y)})
                  </td>

                  <td className="py-2.5 text-amber-300/90">
                    ({formatNumber(dx)}, {formatNumber(dy)})
                  </td>

                  <td className="py-2.5 text-right pr-2 text-slate-400">
                    {formatNumber(distance, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
