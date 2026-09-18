import React from 'react';
import { BookOpen, Award, Cpu, Layers } from 'lucide-react';

export const LearnTheoryPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title Header */}
      <div className="text-center space-y-3 p-6 bg-slate-800/50 border border-slate-700/60 rounded-2xl backdrop-blur-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
          <BookOpen size={14} />
          <span>Educational Curriculum & Theory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Linear Algebra in Computer Graphics & Design
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Discover how foundational concepts from Linear Algebra—vectors, transformation matrices, homogeneous coordinates, and matrix composition—power modern 2D and 3D graphics rendering pipelines.
        </p>
      </div>

      {/* Coursework Connection Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-base">
          <Award size={20} />
          <h2>Why This Matters in Your Linear Algebra Coursework</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          Linear Algebra often feels abstract when studied purely symbolically. This application provides tangible geometric intuition for your syllabus topics:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans text-slate-300">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-sky-400">1. Vector Spaces & Column Vectors</span>
            <p className="text-slate-400 text-[11px]">
              Every point in a graphic is a vector v in ℝ² or ℝ³. Objects with k vertices form a coordinate matrix P in ℝ^(n×k).
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">2. Linear Mappings (T: V → W)</span>
            <p className="text-slate-400 text-[11px]">
              A transformation is linear if T(u + v) = T(u) + T(v) and T(c·v) = c·T(v). Hence, the origin remains fixed (T(0) = 0).
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">3. Matrix Composition & Non-Commutativity</span>
            <p className="text-slate-400 text-[11px]">
              Function composition (f ∘ g)(x) corresponds directly to matrix multiplication A · B. Since AB ≠ BA, graphics order strictly matters.
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">4. Determinant as Geometric Scaling</span>
            <p className="text-slate-400 text-[11px]">
              The determinant det(T) measures how area (2D) or volume (3D) scales. If det(T) is negative, orientation flips (reflection). If det(T) = 0, space collapses.
            </p>
          </div>
        </div>
      </div>

      {/* Core Concepts */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" />
          <span>Core Mathematical Concepts</span>
        </h3>

        {/* 1. Vectors & Coordinates */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-bold text-sky-300">1. Vectors & Coordinate Representation</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Cartesian space, any point A(x, y) is represented by its position vector from the origin. In this project, we consistently adopt the <strong>column-vector convention</strong>:
          </p>
          <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-center text-slate-200 border border-slate-800">
            P = [ v_A  v_B  v_C ... ] = [ [x_A, x_B, x_C, ...], [y_A, y_B, y_C, ...] ]
          </div>
          <p className="text-xs text-slate-400">
            Each column corresponds to one physical vertex of the shape.
          </p>
        </div>

        {/* 2. Transformation Matrices */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-bold text-indigo-300">2. Transformation Matrices</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            A linear transformation can be fully determined by where it maps standard basis vectors e₁ = [1, 0]^T and e₂ = [0, 1]^T. The columns of matrix T are precisely the transformed basis vectors T(e₁) and T(e₂):
          </p>
          <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-center text-slate-200 border border-slate-800">
            T = [ T(e₁)  T(e₂) ] = [ [a, b], [c, d] ]
          </div>
        </div>

        {/* 3. Homogeneous Coordinates */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-bold text-purple-300">3. Homogeneous Coordinates (Why Translation Needs an Extra Dimension)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Translation is an <em>affine transformation</em>: v' = v + t. An ordinary 2×2 matrix cannot perform translation because T · 0 = 0, meaning linear maps must keep the origin invariant.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            By embedding 2D points into 3D projective space with w = 1:
          </p>
          <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-center text-slate-200 border border-slate-800">
            [x', y', 1]^T = [ [1, 0, tx], [0, 1, ty], [0, 0, 1] ] · [x, y, 1]^T = [x + tx, y + ty, 1]^T
          </div>
          <p className="text-xs text-slate-400">
            Homogeneous coordinates unify translation, rotation, scaling, and shearing into uniform matrix multiplications!
          </p>
        </div>

        {/* 4. Composition & Non-Commutativity */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-bold text-amber-300">4. Composition of Transformations (AB ≠ BA)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Applying transformation T₁, then T₂, then T₃ is evaluated as:
          </p>
          <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-center text-slate-200 border border-slate-800">
            P' = T₃ · (T₂ · (T₁ · P)) = (T₃ · T₂ · T₁) · P
          </div>
          <p className="text-xs text-slate-400">
            Because matrix multiplication is associative, the computer multiplies (T₃ · T₂ · T₁) once into a single T_combined, and then transforms thousands of vertices in a single GPU operation.
          </p>
        </div>
      </div>

      {/* Real-World Industry Applications */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
          <Cpu size={20} />
          <h2>Real-World Applications in Computer Graphics & Industry</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">Video Games & 3D Engines</span>
            <p className="text-slate-400 text-[11px]">
              Game engines (Unity, Unreal Engine) use 4×4 Model-View-Projection (MVP) matrices to position characters, rotate cameras, and project 3D worlds onto 2D screens.
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">GPU Shaders & Vertex Pipelines</span>
            <p className="text-slate-400 text-[11px]">
              Modern graphics hardware executes billions of 4×4 matrix-vector multiplications per second in parallel vertex shaders.
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">Vector Graphic Design & CAD</span>
            <p className="text-slate-400 text-[11px]">
              SVG transforms (<code>matrix(a,b,c,d,e,f)</code>), CSS transforms, AutoCAD, and Blender use affine transformation matrices for non-destructive design editing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
