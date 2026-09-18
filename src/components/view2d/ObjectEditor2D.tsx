import React, { useState } from 'react';
import { Shape2D, Point2D } from '../../types';
import { PRESET_SHAPES_2D } from '../../objects/presets2d';
import { Plus, Trash2, HelpCircle, AlertCircle, Layers } from 'lucide-react';
import { pointsToMatrix2D } from '../../mathematics/matrix';
import { MatrixDisplay } from '../common/MatrixDisplay';

interface ObjectEditor2DProps {
  currentShape: Shape2D;
  onShapeChange: (newShape: Shape2D) => void;
  selectedPointLabel?: string | null;
  onSelectPoint?: (label: string) => void;
  isHomogeneous?: boolean;
}

export const ObjectEditor2D: React.FC<ObjectEditor2DProps> = ({
  currentShape,
  onShapeChange,
  selectedPointLabel,
  onSelectPoint,
  isHomogeneous = false,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_SHAPES_2D.find(s => s.id === presetId);
    if (found) {
      setErrorMsg(null);
      onShapeChange({
        ...found,
        points: found.points.map(p => ({ ...p })), // deep copy
      });
    }
  };

  const handleCoordinateChange = (pointId: string, axis: 'x' | 'y', valueStr: string) => {
    setErrorMsg(null);
    const parsed = parseFloat(valueStr);
    if (isNaN(parsed)) {
      // Don't crash; let user type freely, fallback or flag
    }

    const updatedPoints = currentShape.points.map(p => {
      if (p.id === pointId) {
        return {
          ...p,
          [axis]: isNaN(parsed) ? 0 : parsed,
        };
      }
      return p;
    });

    onShapeChange({
      ...currentShape,
      points: updatedPoints,
    });
  };

  const handleAddPoint = () => {
    setErrorMsg(null);
    const newIdx = currentShape.points.length;
    if (newIdx >= 12) {
      setErrorMsg('Maximum 12 vertices allowed for optimal educational demonstration.');
      return;
    }

    const label = String.fromCharCode(65 + newIdx);
    const lastPoint = currentShape.points[newIdx - 1] || { x: 1, y: 1 };
    const newPoint: Point2D = {
      id: `custom_p_${Date.now()}_${newIdx}`,
      label,
      x: lastPoint.x + 1,
      y: lastPoint.y + 1,
    };

    const newPoints = [...currentShape.points, newPoint];
    // If closed polygon, adjust edges
    const newEdges: [number, number][] = [];
    for (let i = 0; i < newPoints.length; i++) {
      newEdges.push([i, (i + 1) % newPoints.length]);
    }

    onShapeChange({
      ...currentShape,
      id: 'custom-polygon',
      name: 'Custom Polygon',
      points: newPoints,
      edges: currentShape.isClosed ? newEdges : undefined,
    });
  };

  const handleDeletePoint = (pointId: string) => {
    if (currentShape.points.length <= 1) {
      setErrorMsg('At least one vertex is required to represent a geometric object.');
      return;
    }
    setErrorMsg(null);

    const filtered = currentShape.points
      .filter(p => p.id !== pointId)
      .map((p, idx) => ({
        ...p,
        label: String.fromCharCode(65 + idx),
      }));

    const newEdges: [number, number][] = [];
    for (let i = 0; i < filtered.length; i++) {
      newEdges.push([i, (i + 1) % filtered.length]);
    }

    onShapeChange({
      ...currentShape,
      id: 'custom-polygon',
      name: 'Custom Polygon',
      points: filtered,
      edges: currentShape.isClosed ? newEdges : undefined,
    });
  };

  const matrixRep = pointsToMatrix2D(currentShape.points, isHomogeneous);

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Graphical Object & Coordinates
            </h3>
            <p className="text-xs text-slate-400">Choose preset or edit vertices</p>
          </div>
        </div>
      </div>

      {/* Preset Selector Buttons */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
          Select Object Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_SHAPES_2D.map(shape => {
            const isSelected = currentShape.id === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => handleSelectPreset(shape.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                <span className="truncate">{shape.name}</span>
                <span className="text-[10px] opacity-70 font-mono ml-1">
                  {shape.points.length}p
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Internal Matrix Representation Notice */}
      <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-700/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-sky-300 flex items-center gap-1">
            <HelpCircle size={13} />
            Coordinate Matrix Representation (P)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {matrixRep.length} × {matrixRep[0].length}
          </span>
        </div>
        <div className="overflow-x-auto py-1">
          <MatrixDisplay matrix={matrixRep} label="P" size="sm" />
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          <strong className="text-slate-200">Column-Vector Convention:</strong> Each column in matrix{' '}
          <code className="text-sky-300 font-mono font-semibold">P</code> represents one vertex vector{' '}
          <code className="text-sky-300 font-mono">[x_i, y_i]^T</code>.
        </p>
      </div>

      {/* Vertices Coordinate Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Vertices ({currentShape.points.length})
          </span>
          <button
            type="button"
            onClick={handleAddPoint}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/60 rounded-md transition-colors"
          >
            <Plus size={13} />
            Add Point
          </button>
        </div>

        {errorMsg && (
          <div className="p-2 mb-2 bg-rose-950/40 border border-rose-800/60 rounded text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {currentShape.points.map((p, idx) => {
            const isSelected = p.label === selectedPointLabel;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPoint && onSelectPoint(p.label)}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                    : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <span className="w-6 text-center font-mono font-bold text-xs text-sky-400">
                  {p.label}
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-mono">X:</span>
                  <input
                    type="number"
                    step="any"
                    value={p.x}
                    onChange={e => handleCoordinateChange(p.id, 'x', e.target.value)}
                    className="w-16 h-7 px-1.5 text-center font-mono text-xs bg-slate-800 text-white rounded border border-slate-700 focus:border-sky-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-mono">Y:</span>
                  <input
                    type="number"
                    step="any"
                    value={p.y}
                    onChange={e => handleCoordinateChange(p.id, 'y', e.target.value)}
                    className="w-16 h-7 px-1.5 text-center font-mono text-xs bg-slate-800 text-white rounded border border-slate-700 focus:border-sky-500 outline-none"
                  />
                </div>

                {currentShape.points.length > 1 && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeletePoint(p.id);
                    }}
                    title="Delete Point"
                    className="ml-auto p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
