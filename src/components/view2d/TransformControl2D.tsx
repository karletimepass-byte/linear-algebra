import React, { useState, useEffect } from 'react';
import { Matrix, TransformType2D } from '../../types';
import {
  createScalingMatrix2D,
  createRotationMatrix2D,
  createReflectionMatrix2D,
  createShearMatrix2D,
  createTranslationMatrix2D,
  ReflectionType2D,
} from '../../mathematics/transformations2d';
import { MatrixInput } from '../common/MatrixInput';
import { MatrixDisplay } from '../common/MatrixDisplay';
import { Play, Zap, Sliders, Info, Compass, FlipHorizontal, Maximize, Move } from 'lucide-react';

interface TransformControl2DProps {
  currentMatrix: Matrix;
  onMatrixChange: (newMatrix: Matrix, isHomogeneous: boolean) => void;
  onAnimateTransform: () => void;
  onInstantApply: () => void;
  isAnimating: boolean;
  isHomogeneous: boolean;
}

export const TransformControl2D: React.FC<TransformControl2DProps> = ({
  currentMatrix,
  onMatrixChange,
  onAnimateTransform,
  onInstantApply,
  isAnimating,
  isHomogeneous,
}) => {
  const [activeType, setActiveType] = useState<TransformType2D>('scaling');

  // Scaling state
  const [scaleX, setScaleX] = useState<number>(2);
  const [scaleY, setScaleY] = useState<number>(2);
  const [uniformScale, setUniformScale] = useState<boolean>(true);

  // Rotation state
  const [angleDegrees, setAngleDegrees] = useState<number>(90);

  // Reflection state
  const [reflectType, setReflectType] = useState<ReflectionType2D>('x-axis');

  // Shearing state
  const [shearX, setShearX] = useState<number>(1);
  const [shearY, setShearY] = useState<number>(0);

  // Translation state (homogeneous 3x3)
  const [transX, setTransX] = useState<number>(2);
  const [transY, setTransY] = useState<number>(3);

  // Custom matrix state
  const [customMat, setCustomMat] = useState<Matrix>([
    [2, 0],
    [0, 2],
  ]);
  const [customHomogeneous, setCustomHomogeneous] = useState<boolean>(false);

  // Recompute matrix whenever preset parameters change
  useEffect(() => {
    let mat: Matrix;
    let homogeneous = false;

    switch (activeType) {
      case 'scaling':
        mat = createScalingMatrix2D(scaleX, scaleY, false);
        homogeneous = false;
        break;
      case 'rotation':
        mat = createRotationMatrix2D(angleDegrees, false);
        homogeneous = false;
        break;
      case 'reflection':
        mat = createReflectionMatrix2D(reflectType, false);
        homogeneous = false;
        break;
      case 'shearing':
        mat = createShearMatrix2D(shearX, shearY, false);
        homogeneous = false;
        break;
      case 'translation':
        mat = createTranslationMatrix2D(transX, transY);
        homogeneous = true;
        break;
      case 'custom':
        mat = customMat;
        homogeneous = customHomogeneous || customMat.length === 3;
        break;
      default:
        mat = createScalingMatrix2D(1, 1, false);
    }

    onMatrixChange(mat, homogeneous);
  }, [
    activeType,
    scaleX,
    scaleY,
    angleDegrees,
    reflectType,
    shearX,
    shearY,
    transX,
    transY,
    customMat,
    customHomogeneous,
  ]);

  const handleUniformScaleChange = (val: number) => {
    setScaleX(val);
    setScaleY(val);
  };

  const getExplanation = (): string => {
    switch (activeType) {
      case 'scaling':
        return 'The scaling matrix changes the magnitude of the coordinate vectors, making the object larger or smaller.';
      case 'rotation':
        return 'The rotation matrix changes the direction of each coordinate vector while preserving distance from the origin.';
      case 'reflection':
        return 'The reflection matrix flips the object across the selected axis or plane.';
      case 'shearing':
        return 'Shearing changes one coordinate in proportion to another, causing the object to slant.';
      case 'translation':
        return 'Translation changes the position of the object. Homogeneous coordinates allow translation to be represented using matrix multiplication.';
      case 'custom':
        return 'Enter any arbitrary transformation matrix to examine its geometric distortion, stretching, shearing, or reflection.';
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Transformation Matrix (T)
            </h3>
            <p className="text-xs text-slate-400">Choose transformation preset or custom</p>
          </div>
        </div>
      </div>

      {/* Preset Category Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveType('scaling')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'scaling'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scaling
        </button>
        <button
          type="button"
          onClick={() => setActiveType('rotation')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'rotation'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rotation
        </button>
        <button
          type="button"
          onClick={() => setActiveType('reflection')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'reflection'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Reflection
        </button>
        <button
          type="button"
          onClick={() => setActiveType('shearing')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'shearing'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Shearing
        </button>
        <button
          type="button"
          onClick={() => setActiveType('translation')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'translation'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Translation
        </button>
        <button
          type="button"
          onClick={() => setActiveType('custom')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'custom'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Preset Controls Body */}
      <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 space-y-3">
        {/* 1. Scaling Controls */}
        {activeType === 'scaling' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Uniform Scaling</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={uniformScale}
                  onChange={e => setUniformScale(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                />
                <span>Lock Sx = Sy</span>
              </label>
            </div>

            {uniformScale ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Scale Factor (s):</span>
                  <span className="text-indigo-400 font-bold">{scaleX}</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="4"
                  step="0.25"
                  value={scaleX}
                  onChange={e => handleUniformScaleChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex gap-1.5 pt-1">
                  {[-1, 0.5, 1.5, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleUniformScaleChange(v)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300"
                    >
                      {v}x
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">Scale X (sx): {scaleX}</span>
                  <input
                    type="range"
                    min="-3"
                    max="4"
                    step="0.25"
                    value={scaleX}
                    onChange={e => setScaleX(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">Scale Y (sy): {scaleY}</span>
                  <input
                    type="range"
                    min="-3"
                    max="4"
                    step="0.25"
                    value={scaleY}
                    onChange={e => setScaleY(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Rotation Controls */}
        {activeType === 'rotation' && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Counter-Clockwise Angle (θ):</span>
              <span className="text-indigo-400 font-bold">{angleDegrees}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="360"
              step="5"
              value={angleDegrees}
              onChange={e => setAngleDegrees(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex flex-wrap gap-1.5">
              {[45, 90, 180, 270, -90].map(deg => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setAngleDegrees(deg)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    angleDegrees === deg
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {deg > 0 ? `${deg}°` : `${deg}°`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Reflection Controls */}
        {activeType === 'reflection' && (
          <div className="space-y-2">
            <span className="text-xs text-slate-400 block mb-1">Select Reflection Plane / Axis:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReflectType('x-axis')}
                className={`p-2 rounded text-xs text-left border transition-all ${
                  reflectType === 'x-axis'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">Across X-Axis</div>
                <div className="text-[10px] text-slate-400 font-mono">(x, y) ↦ (x, -y)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectType('y-axis')}
                className={`p-2 rounded text-xs text-left border transition-all ${
                  reflectType === 'y-axis'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">Across Y-Axis</div>
                <div className="text-[10px] text-slate-400 font-mono">(x, y) ↦ (-x, y)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectType('origin')}
                className={`p-2 rounded text-xs text-left border transition-all ${
                  reflectType === 'origin'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">Through Origin</div>
                <div className="text-[10px] text-slate-400 font-mono">(x, y) ↦ (-x, -y)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectType('line-y-x')}
                className={`p-2 rounded text-xs text-left border transition-all ${
                  reflectType === 'line-y-x'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">Across Line y = x</div>
                <div className="text-[10px] text-slate-400 font-mono">(x, y) ↦ (y, x)</div>
              </button>
            </div>
          </div>
        )}

        {/* 4. Shearing Controls */}
        {activeType === 'shearing' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-400 font-mono block mb-1">
                Shear along X (kx): {shearX}
              </span>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.2"
                value={shearX}
                onChange={e => setShearX(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">x' = x + kx · y</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block mb-1">
                Shear along Y (ky): {shearY}
              </span>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.2"
                value={shearY}
                onChange={e => setShearY(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">y' = y + ky · x</span>
            </div>
          </div>
        )}

        {/* 5. Translation Controls (Homogeneous 3x3) */}
        {activeType === 'translation' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 font-mono block mb-1">Shift X (tx): {transX}</span>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={transX}
                  onChange={e => setTransX(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block mb-1">Shift Y (ty): {transY}</span>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={transY}
                  onChange={e => setTransY(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
            <div className="p-2 bg-indigo-950/40 border border-indigo-800/50 rounded text-xs text-indigo-300 flex items-start gap-1.5">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Translation is an affine transformation. Standard 2×2 linear matrices cannot shift the origin (T · 0 = 0). Homogeneous 3×3 coordinates embed 2D space into ℝ³ at w = 1, converting translation into matrix multiplication!
              </span>
            </div>
          </div>
        )}

        {/* 6. Custom Matrix Input */}
        {activeType === 'custom' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Direct Matrix Editor</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomHomogeneous(false);
                    setCustomMat([
                      [2, 1],
                      [0, 2],
                    ]);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    !customHomogeneous
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  2×2 Linear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomHomogeneous(true);
                    setCustomMat([
                      [1, 0, 2],
                      [0, 1, 3],
                      [0, 0, 1],
                    ]);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    customHomogeneous
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  3×3 Homogeneous
                </button>
              </div>
            </div>

            <MatrixInput
              matrix={customMat}
              onChange={setCustomMat}
              allowResize={false}
              label="Custom Transformation Matrix (T)"
            />
          </div>
        )}
      </div>

      {/* Numerical Matrix Display & Explanation */}
      <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300">
            Active Numerical Matrix T:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {currentMatrix.length}×{currentMatrix[0]?.length}
          </span>
        </div>
        <div className="overflow-x-auto py-1">
          <MatrixDisplay matrix={currentMatrix} label="T" size="sm" />
        </div>
        <div className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded border border-slate-800 flex items-start gap-1.5">
          <Info size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <span>{getExplanation()}</span>
        </div>
      </div>

      {/* Action Buttons: Animate & Instant */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onAnimateTransform}
          disabled={isAnimating}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Play size={15} className={isAnimating ? 'animate-spin' : ''} />
          <span>{isAnimating ? 'Transforming...' : 'TRANSFORM (ANIMATE)'}</span>
        </button>

        <button
          type="button"
          onClick={onInstantApply}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-slate-700/80 hover:bg-slate-600 text-slate-100 border border-slate-600 active:scale-[0.98] transition-all"
        >
          <Zap size={15} className="text-amber-400" />
          <span>Instant Apply</span>
        </button>
      </div>
    </div>
  );
};
