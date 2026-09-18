import React, { useState, useEffect } from 'react';
import { Matrix, TransformType3D } from '../../types';
import {
  createScalingMatrix3D,
  createRotationXMatrix3D,
  createRotationYMatrix3D,
  createRotationZMatrix3D,
  createReflectionMatrix3D,
  createShearMatrix3D,
  createTranslationMatrix3D,
  ReflectionPlane3D,
  ShearAxis3D,
} from '../../mathematics/transformations3d';
import { MatrixInput } from '../common/MatrixInput';
import { MatrixDisplay } from '../common/MatrixDisplay';
import { Sliders, Info, Box, Compass } from 'lucide-react';

interface TransformControl3DProps {
  currentMatrix: Matrix;
  onMatrixChange: (newMatrix: Matrix, isHomogeneous: boolean) => void;
  isHomogeneous: boolean;
}

export const TransformControl3D: React.FC<TransformControl3DProps> = ({
  currentMatrix,
  onMatrixChange,
  isHomogeneous,
}) => {
  const [activeType, setActiveType] = useState<TransformType3D>('scaling');

  // Scaling state
  const [scaleX, setScaleX] = useState<number>(1.5);
  const [scaleY, setScaleY] = useState<number>(1.5);
  const [scaleZ, setScaleZ] = useState<number>(1.5);
  const [uniformScale, setUniformScale] = useState<boolean>(true);

  // Rotation states
  const [rotAngle, setRotAngle] = useState<number>(45);

  // Reflection plane
  const [reflectPlane, setReflectPlane] = useState<ReflectionPlane3D>('xy-plane');

  // Shearing
  const [shearAxis, setShearAxis] = useState<ShearAxis3D>('xy');
  const [shearAmount, setShearAmount] = useState<number>(0.8);

  // Translation (4x4)
  const [transX, setTransX] = useState<number>(1);
  const [transY, setTransY] = useState<number>(1);
  const [transZ, setTransZ] = useState<number>(1);

  // Custom 3D Matrix
  const [customMat, setCustomMat] = useState<Matrix>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);

  // Update matrix whenever inputs change
  useEffect(() => {
    let mat: Matrix;
    let hom = false;

    switch (activeType) {
      case 'scaling':
        mat = createScalingMatrix3D(scaleX, scaleY, scaleZ, false);
        hom = false;
        break;
      case 'rotationX':
        mat = createRotationXMatrix3D(rotAngle, false);
        hom = false;
        break;
      case 'rotationY':
        mat = createRotationYMatrix3D(rotAngle, false);
        hom = false;
        break;
      case 'rotationZ':
        mat = createRotationZMatrix3D(rotAngle, false);
        hom = false;
        break;
      case 'reflection':
        mat = createReflectionMatrix3D(reflectPlane, false);
        hom = false;
        break;
      case 'shearing':
        mat = createShearMatrix3D(shearAxis, shearAmount, false);
        hom = false;
        break;
      case 'translation':
        mat = createTranslationMatrix3D(transX, transY, transZ);
        hom = true;
        break;
      case 'custom':
        mat = customMat;
        hom = customMat.length === 4;
        break;
      default:
        mat = createScalingMatrix3D(1, 1, 1, false);
    }

    onMatrixChange(mat, hom);
  }, [
    activeType,
    scaleX,
    scaleY,
    scaleZ,
    rotAngle,
    reflectPlane,
    shearAxis,
    shearAmount,
    transX,
    transY,
    transZ,
    customMat,
  ]);

  const handleUniformScale = (val: number) => {
    setScaleX(val);
    setScaleY(val);
    setScaleZ(val);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Box size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              3D Transformation Matrix (T)
            </h3>
            <p className="text-xs text-slate-400">3D Linear & Affine transformations</p>
          </div>
        </div>
      </div>

      {/* Preset tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveType('scaling')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'scaling' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Scaling
        </button>
        <button
          type="button"
          onClick={() => setActiveType('rotationY')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType.startsWith('rotation') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Rotation
        </button>
        <button
          type="button"
          onClick={() => setActiveType('translation')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'translation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Translation (4×4)
        </button>
        <button
          type="button"
          onClick={() => setActiveType('reflection')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'reflection' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Reflection
        </button>
        <button
          type="button"
          onClick={() => setActiveType('shearing')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'shearing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Shearing
        </button>
        <button
          type="button"
          onClick={() => setActiveType('custom')}
          className={`py-1.5 px-2 rounded-md font-medium transition-all ${
            activeType === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Controls body */}
      <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 space-y-3">
        {/* Scaling */}
        {activeType === 'scaling' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">3D Scaling</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={uniformScale}
                  onChange={e => setUniformScale(e.target.checked)}
                  className="rounded bg-slate-800 text-indigo-500"
                />
                <span>Lock Sx = Sy = Sz</span>
              </label>
            </div>

            {uniformScale ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Scale Factor (s):</span>
                  <span className="text-indigo-400 font-bold">{scaleX}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={scaleX}
                  onChange={e => handleUniformScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">Sx: {scaleX}</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={scaleX}
                    onChange={e => setScaleX(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">Sy: {scaleY}</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={scaleY}
                    onChange={e => setScaleY(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">Sz: {scaleZ}</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={scaleZ}
                    onChange={e => setScaleZ(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3D Rotation (X, Y, Z Axis selection) */}
        {activeType.startsWith('rotation') && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Axis of Rotation:</span>
              {(['rotationX', 'rotationY', 'rotationZ'] as TransformType3D[]).map(rType => (
                <button
                  key={rType}
                  type="button"
                  onClick={() => setActiveType(rType)}
                  className={`px-2.5 py-1 rounded font-mono font-semibold text-xs ${
                    activeType === rType
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {rType === 'rotationX' ? 'X Axis' : rType === 'rotationY' ? 'Y Axis' : 'Z Axis'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Angle (θ):</span>
                <span className="text-indigo-400 font-bold">{rotAngle}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="360"
                step="5"
                value={rotAngle}
                onChange={e => setRotAngle(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex gap-1.5 pt-1">
                {[45, 90, 180, 270].map(deg => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotAngle(deg)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300"
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3D Translation (4x4 Homogeneous) */}
        {activeType === 'translation' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-slate-400 font-mono block mb-1">tx: {transX}</span>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.5"
                  value={transX}
                  onChange={e => setTransX(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block mb-1">ty: {transY}</span>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.5"
                  value={transY}
                  onChange={e => setTransY(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block mb-1">tz: {transZ}</span>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.5"
                  value={transZ}
                  onChange={e => setTransZ(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="text-xs text-indigo-300/90 bg-indigo-950/40 p-2 rounded border border-indigo-800/40 flex items-start gap-1.5">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Translation in 3D requires 4×4 homogeneous coordinates, appending <code className="font-mono text-white">w=1</code> to 3D point vectors: <code className="font-mono text-white">[x, y, z, 1]^T</code>.
              </span>
            </div>
          </div>
        )}

        {/* 3D Reflection */}
        {activeType === 'reflection' && (
          <div className="space-y-2">
            <span className="text-xs text-slate-400 block">Select Reflection Plane:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReflectPlane('xy-plane')}
                className={`p-2 rounded text-left border ${
                  reflectPlane === 'xy-plane'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold">XY Plane</div>
                <div className="text-[10px] text-slate-400 font-mono">Inverts Z (x, y, -z)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectPlane('xz-plane')}
                className={`p-2 rounded text-left border ${
                  reflectPlane === 'xz-plane'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold">XZ Plane</div>
                <div className="text-[10px] text-slate-400 font-mono">Inverts Y (x, -y, z)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectPlane('yz-plane')}
                className={`p-2 rounded text-left border ${
                  reflectPlane === 'yz-plane'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold">YZ Plane</div>
                <div className="text-[10px] text-slate-400 font-mono">Inverts X (-x, y, z)</div>
              </button>

              <button
                type="button"
                onClick={() => setReflectPlane('origin')}
                className={`p-2 rounded text-left border ${
                  reflectPlane === 'origin'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold">Origin Inversion</div>
                <div className="text-[10px] text-slate-400 font-mono">(-x, -y, -z)</div>
              </button>
            </div>
          </div>
        )}

        {/* 3D Shearing */}
        {activeType === 'shearing' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-slate-400">Shear Plane:</span>
              {(['xy', 'xz', 'yx', 'yz', 'zx', 'zy'] as ShearAxis3D[]).map(ax => (
                <button
                  key={ax}
                  type="button"
                  onClick={() => setShearAxis(ax)}
                  className={`px-2 py-0.5 rounded font-mono text-xs uppercase ${
                    shearAxis === ax
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ax}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Shear Factor (k):</span>
                <span className="text-indigo-400 font-bold">{shearAmount}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={shearAmount}
                onChange={e => setShearAmount(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Custom Matrix */}
        {activeType === 'custom' && (
          <div className="space-y-2">
            <MatrixInput
              matrix={customMat}
              onChange={setCustomMat}
              label="Custom 3D Matrix (T)"
              allowResize={true}
              minRows={3}
              maxRows={4}
              minCols={3}
              maxCols={4}
            />
          </div>
        )}
      </div>

      {/* Active Matrix Display */}
      <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-700/60 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300">
            Active 3D Matrix T:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {currentMatrix.length}×{currentMatrix[0]?.length}
          </span>
        </div>
        <div className="overflow-x-auto py-1">
          <MatrixDisplay matrix={currentMatrix} label="T" size="sm" />
        </div>
      </div>
    </div>
  );
};
