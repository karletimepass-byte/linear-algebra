import React, { useState } from 'react';
import { TransformationStep, Matrix } from '../../types';
import { MatrixDisplay } from '../common/MatrixDisplay';
import {
  createRotationMatrix2D,
  createScalingMatrix2D,
  createReflectionMatrix2D,
  createShearMatrix2D,
  createTranslationMatrix2D,
  toHomogeneous2D,
} from '../../mathematics/transformations2d';
import { Plus, Trash2, ArrowUp, ArrowDown, Layers, HelpCircle } from 'lucide-react';

interface CombinedPipelineProps {
  steps: TransformationStep[];
  onStepsChange: (newSteps: TransformationStep[]) => void;
  combinedMatrix: Matrix;
}

export const CombinedPipeline: React.FC<CombinedPipelineProps> = ({
  steps,
  onStepsChange,
  combinedMatrix,
}) => {
  const [newType, setNewType] = useState<string>('rotation');

  const handleAddStep = () => {
    let stepMat: Matrix;
    let name = '';
    let desc = '';

    switch (newType) {
      case 'rotation':
        stepMat = toHomogeneous2D(createRotationMatrix2D(45, false));
        name = 'Rotate 45°';
        desc = 'Rotation by 45° CCW';
        break;
      case 'scaling':
        stepMat = toHomogeneous2D(createScalingMatrix2D(1.5, 1.5, false));
        name = 'Scale 1.5x';
        desc = 'Uniform scaling by 1.5';
        break;
      case 'translation':
        stepMat = createTranslationMatrix2D(2, 1);
        name = 'Translate (2, 1)';
        desc = 'Shift +2 on X, +1 on Y';
        break;
      case 'reflection':
        stepMat = toHomogeneous2D(createReflectionMatrix2D('x-axis', false));
        name = 'Reflect across X';
        desc = 'Flip y-coordinate';
        break;
      case 'shearing':
        stepMat = toHomogeneous2D(createShearMatrix2D(1, 0, false));
        name = 'Shear X (k=1)';
        desc = 'Horizontal shear';
        break;
      default:
        stepMat = toHomogeneous2D(createScalingMatrix2D(1, 1, false));
        name = 'Identity';
        desc = 'No transformation';
    }

    const newStep: TransformationStep = {
      id: `step_${Date.now()}_${steps.length}`,
      name,
      type: newType,
      matrix: stepMat,
      description: desc,
      isHomogeneous: true,
    };

    onStepsChange([...steps, newStep]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) return;
    onStepsChange(steps.filter(s => s.id !== id));
  };

  const handleMoveStep = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const copy = [...steps];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onStepsChange(copy);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Transformation Pipeline Sequence
            </h3>
            <p className="text-xs text-slate-400">Compose multiple transformations in order</p>
          </div>
        </div>
      </div>

      {/* Add Transformation Step Bar */}
      <div className="flex items-center gap-2">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value)}
          className="flex-1 bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
        >
          <option value="rotation">Rotation (45°)</option>
          <option value="scaling">Scaling (1.5x)</option>
          <option value="translation">Translation (+2, +1)</option>
          <option value="reflection">Reflection (X-Axis)</option>
          <option value="shearing">Shearing (k=1)</option>
        </select>

        <button
          type="button"
          onClick={handleAddStep}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition-colors"
        >
          <Plus size={14} />
          <span>Add Step</span>
        </button>
      </div>

      {/* List of Steps in Sequence */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          return (
            <div
              key={step.id}
              className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/70 space-y-2 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                    {stepNum}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {step.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (T_{stepNum})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveStep(idx, 'up')}
                    disabled={idx === 0}
                    title="Move earlier in order"
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveStep(idx, 'down')}
                    disabled={idx === steps.length - 1}
                    title="Move later in order"
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                  >
                    <ArrowDown size={13} />
                  </button>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.id)}
                      title="Remove Step"
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <MatrixDisplay matrix={step.matrix} label={`T_${stepNum}`} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Composed Matrix Summary */}
      <div className="bg-slate-900/90 rounded-xl p-3.5 border border-indigo-500/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
            Combined Transformation Matrix (T_combined)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {steps.map((_, i) => `T_${steps.length - i}`).join(' · ')}
          </span>
        </div>

        <div className="overflow-x-auto py-1">
          <MatrixDisplay matrix={combinedMatrix} label="T_combined" size="sm" />
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-start gap-1.5">
          <HelpCircle size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <span>
            <strong className="text-slate-200">Multiplication Order Notice:</strong> Because each point is a column vector, the transformation applied first is on the far right: <code className="text-indigo-300 font-mono">P' = (T_{steps.length} · ... · T_2 · T_1) · P</code>.
          </span>
        </div>
      </div>
    </div>
  );
};
