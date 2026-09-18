import React, { useState } from 'react';
import { PRESET_EXAMPLES } from '../../objects/presetExamples';
import { PresetExample } from '../../types';
import {
  Grid,
  Box,
  Layers,
  Calculator,
  BookOpen,
  Presentation,
  Bookmark,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type ActiveTab = '2d' | '3d' | 'combined' | 'calculator' | 'theory';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSelectPresetExample: (example: PresetExample) => void;
  onOpenPresentation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSelectPresetExample,
  onOpenPresentation,
}) => {
  const [examplesOpen, setExamplesOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-emerald-400 text-lg">
                  [T]
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-wider text-white uppercase font-sans">
                  MATRIX GRAPHICS LAB
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0 Academic
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive Linear Algebra & Computer Graphics
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onTabChange('2d')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === '2d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Grid size={15} />
              <span>2D TRANSFORMATIONS</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('3d')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === '3d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Box size={15} />
              <span>3D TRANSFORMATIONS</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('combined')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'combined'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers size={15} />
              <span>COMBINED</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('calculator')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calculator size={15} />
              <span>MATRIX CALCULATOR</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('theory')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'theory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen size={15} />
              <span>LEARN / THEORY</span>
            </button>
          </nav>

          {/* Right Action Tools: Preset Examples Dropdown & Presentation Mode */}
          <div className="flex items-center gap-2">
            {/* Presets Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExamplesOpen(!examplesOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium shadow-sm transition-all"
              >
                <Bookmark size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Preset Examples</span>
                <ChevronDown size={13} className={`transition-transform ${examplesOpen ? 'rotate-180' : ''}`} />
              </button>

              {examplesOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ready-to-Run Lab Examples
                  </div>
                  {PRESET_EXAMPLES.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        onSelectPresetExample(ex);
                        setExamplesOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-colors group"
                    >
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                        {ex.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {ex.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Presentation Mode Button */}
            <button
              type="button"
              onClick={onOpenPresentation}
              title="Enter Presentation Mode for Projector Screen"
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Presentation size={15} />
              <span className="hidden md:inline">ENTER PRESENTATION MODE</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/80 text-xs font-medium scrollbar-none">
          <button
            type="button"
            onClick={() => onTabChange('2d')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === '2d' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            2D Mode
          </button>
          <button
            type="button"
            onClick={() => onTabChange('3d')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === '3d' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            3D Mode
          </button>
          <button
            type="button"
            onClick={() => onTabChange('combined')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'combined' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Combined
          </button>
          <button
            type="button"
            onClick={() => onTabChange('calculator')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'calculator' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Calculator
          </button>
          <button
            type="button"
            onClick={() => onTabChange('theory')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'theory' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Theory & Syllabus
          </button>
        </div>
      </div>
    </header>
  );
};
