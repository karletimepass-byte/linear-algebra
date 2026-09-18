// ============================================================
// Learn / Theory Page — Linear Algebra & Computer Graphics
// ============================================================
import React, { useState } from 'react';

interface Topic {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const topics: Topic[] = [
  {
    id: 'vectors',
    title: 'Vectors & Coordinate Points',
    icon: '→',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>A <strong>vector</strong> represents a geometric quantity in space. In 2D computer graphics, a position vector <strong>v</strong> = [x, y]ᵀ represents the location of a vertex relative to the Cartesian origin (0,0).</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--blue-2)', fontSize: 13, lineHeight: 1.6 }}>
          v = [ x ]  ← x-coordinate (horizontal displacement){'\n'}
              [ y ]  ← y-coordinate (vertical displacement)
        </div>
        <p>In this lab, each <strong>column</strong> of the coordinate matrix corresponds to one point vector. By arranging multiple vertices side by side, an entire 2D or 3D object is represented as a single matrix.</p>
      </div>
    ),
  },
  {
    id: 'matrices',
    title: 'Matrices in Graphic Design',
    icon: '⊞',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>A <strong>matrix</strong> is an m×n rectangular array of numbers. In computer graphics, matrices act as linear operators on geometric objects:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--purple)', fontSize: 13, lineHeight: 1.6 }}>
          A = [ a₁₁  a₁₂ ]   ← transforms the basis vector i = [1, 0]ᵀ into [a₁₁, a₂₁]ᵀ{'\n'}
              [ a₂₁  a₂₂ ]   ← transforms the basis vector j = [0, 1]ᵀ into [a₁₂, a₂₂]ᵀ
        </div>
        <p>Transformation matrices encode geometric operations like rotation, magnification, mirroring, and skewing into compact algebraic structures that can be calculated in parallel by graphics processing units (GPUs).</p>
      </div>
    ),
  },
  {
    id: 'coords',
    title: 'Coordinate Matrix Representation',
    icon: '📍',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>A graphical polygon (e.g. Triangle with vertices A, B, C) is represented as a <strong>2×N coordinate matrix</strong> using the <strong>column-vector convention</strong>:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--blue-2)', fontSize: 13, lineHeight: 1.7 }}>
          Vertices: A(1,1), B(4,1), C(2,4){'\n\n'}
              A   B   C{'\n'}
          P = [ 1   4   2 ]  ← Row 1: X-coordinates{'\n'}
              [ 1   1   4 ]  ← Row 2: Y-coordinates
        </div>
        <p>This formulation allows a single matrix multiplication <code>P' = T · P</code> to transform <strong>all vertices simultaneously</strong> in one single mathematical operation!</p>
      </div>
    ),
  },
  {
    id: 'matmul',
    title: 'Matrix Multiplication Mechanics',
    icon: '×',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>To multiply an m×k transformation matrix T by a k×n coordinate matrix P, the resulting matrix P' is m×n where each entry is a dot product of a row from T and a column from P:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontSize: 13, lineHeight: 1.6 }}>
          (T · P)ᵢⱼ = Σₖ Tᵢₖ · Pₖⱼ
        </div>
        <p>Crucial Algebraic Properties:</p>
        <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
          <li><strong>Associative:</strong> (A · B) · C = A · (B · C) — enables pre-combining multiple transformation matrices into one net matrix.</li>
          <li><strong>Non-Commutative:</strong> A · B ≠ B · A in general! Rotating then translating yields a totally different picture than translating then rotating.</li>
          <li><strong>Distributive:</strong> T · (P₁ + P₂) = T · P₁ + T · P₂.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'linear',
    title: 'Linear Transformations',
    icon: 'ƒ',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>A mapping T: ℝⁿ → ℝⁿ is called a <strong>linear transformation</strong> if and only if it preserves vector addition and scalar multiplication:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontSize: 13, lineHeight: 1.6 }}>
          1. T(u + v) = T(u) + T(v)    (Additivity){'\n'}
          2. T(c · u) = c · T(u)        (Homogeneity)
        </div>
        <p>Geometric consequence: Under any linear transformation, <strong>the origin (0,0) remains fixed at (0,0)</strong>, and straight lines remain straight lines (parallel lines remain parallel).</p>
        <p>Examples: <strong>Scaling, Rotation, Reflection, Shearing</strong> are all linear transformations. <em>Translation is NOT linear in 2D</em> (it moves the origin), which is why computer graphics uses homogeneous coordinates.</p>
      </div>
    ),
  },
  {
    id: 'homogeneous',
    title: 'Homogeneous Coordinates & Affine Space',
    icon: '∿',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>Because translation moves the origin (T(0) ≠ 0), it cannot be expressed by a 2×2 matrix multiplication. To solve this, graphics engineers augment coordinates into <strong>homogeneous coordinates</strong>:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--blue-2)', fontSize: 13, lineHeight: 1.7 }}>
          Cartesian [x, y]ᵀ  →  Homogeneous [x, y, 1]ᵀ{'\n\n'}
          [ 1  0  tx ]   [ x ]   [ x + tx ]{'\n'}
          [ 0  1  ty ] · [ y ] = [ y + ty ]{'\n'}
          [ 0  0   1 ]   [ 1 ]   [   1    ]
        </div>
        <p>This elegant mathematical formulation unifies all affine transformations (translation, rotation, scaling, shearing, projection) into standard matrix multiplications. This is the cornerstone of modern graphics pipelines such as OpenGL, DirectX, Vulkan, and Metal.</p>
      </div>
    ),
  },
  {
    id: 'determinant',
    title: 'Determinants & Area Scaling',
    icon: '∆',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p>The <strong>determinant</strong> of a 2×2 transformation matrix det(T) = ad − bc has a direct physical and geometric meaning:</p>
        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontSize: 13, lineHeight: 1.7 }}>
          New Area = |det(T)| × Original Area{'\n\n'}
          • det(T) &gt; 0 : Orientation preserved (e.g. standard rotation, positive scaling).{'\n'}
          • det(T) &lt; 0 : Orientation reversed (mirror reflection).{'\n'}
          • det(T) = 0 : Degenerate / Singular! Collapses 2D area into a 1D line or 0D point.
        </div>
      </div>
    ),
  },
  {
    id: 'applications',
    title: 'Real-World Graphics Applications',
    icon: '🌐',
    content: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { title: 'Graphic Design Tools', desc: 'Adobe Illustrator, Photoshop, and Figma use 2D affine transformation matrices for scaling, rotating, and vector warping.', icon: '🎨' },
            { title: 'Video Game Engines', desc: 'Unity and Unreal Engine execute millions of 4×4 matrix multiplications per frame on the GPU to project 3D models onto screens.', icon: '🎮' },
            { title: '3D CGI & Animation', desc: 'Pixar and Blender use hierarchical matrix scene graphs: moving a character’s torso propagates transforms down to the arms and fingers.', icon: '🎬' },
            { title: 'Computer Vision & AR', desc: 'Perspective projection matrices map camera sensors to real-world coordinates for augmented reality object placement.', icon: '🥽' },
            { title: 'Robotics & Kinematics', desc: 'Denavit-Hartenberg matrices compute robot arm joint positions through chained coordinate system transformations.', icon: '🤖' },
            { title: 'Image Processing & Filters', desc: 'Affine warp, perspective correction, and neural network convolutional kernels rely heavily on matrix operations.', icon: '🖼️' },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export const LearnPage: React.FC = () => {
  const [active, setActive] = useState('vectors');
  const topic = topics.find(t => t.id === active) ?? topics[0];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: 16,
      maxWidth: 1100,
      margin: '0 auto',
      height: 'calc(100vh - 140px)',
      minHeight: 0
    }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        {topics.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${active === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActive(t.id)}
            style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '9px 12px', fontSize: 12.5 }}
          >
            <span style={{ marginRight: 8, fontSize: 14 }}>{t.icon}</span>
            {t.title}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="panel" style={{ overflowY: 'auto', padding: 24, lineHeight: 1.7, fontSize: 13.5, color: 'var(--text-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <span style={{ fontSize: 32 }}>{topic.icon}</span>
          <h2 style={{ fontSize: 20, color: 'var(--text)', fontWeight: 800 }}>{topic.title}</h2>
        </div>
        {topic.content}
      </div>
    </div>
  );
};
