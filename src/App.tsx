import { useState } from 'react';
import type { AppTab } from './types';
import { Transform2DPage } from './pages/Transform2DPage';
import { Transform3DPage } from './pages/Transform3DPage';
import { GLBViewerPage } from './pages/GLBViewerPage';

const TABS: { key: AppTab; label: string; icon: string }[] = [
  { key: '2d',  label: '2D Transformations', icon: '⬡' },
  { key: '3d',  label: '3D Transformations', icon: '⬢' },
  { key: 'glb', label: '3D Model Viewer',    icon: '🧊' },
];

export default function App() {
  const [tab, setTab] = useState<AppTab>('2d');
  const [presentation, setPresentation] = useState(false);

  if (presentation) {
    document.body.classList.add('presentation');
  } else {
    document.body.classList.remove('presentation');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="app-header-inner">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-mark">M</div>
            <div className="logo-text">
              <div className="logo-title">MATRIX GRAPHICS LAB</div>
              <div className="logo-sub">Use of Matrices in Graphic Designing · Linear Algebra</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="nav">
            {TABS.map(t => (
              <button key={t.key} className={`nav-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <span>{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Presentation button */}
          <button
            className={`btn btn-sm ${presentation ? 'btn-primary pres-btn-glow' : 'btn-ghost'}`}
            onClick={() => setPresentation(p => !p)}
            title="Presentation mode for college demo"
          >
            {presentation ? '✕ Exit Presentation' : '⛶ Present'}
          </button>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, padding: presentation ? '20px 28px' : '14px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Computer Graphics Transformation Pipeline */}
        {!presentation && (
          <div className="convention-strip" style={{ overflowX: 'auto', padding: '7px 14px', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Graphic Pipeline</span>
              <span style={{ color: 'var(--border-2)' }}>|</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--blue-2)', background: 'rgba(59,130,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                1. Object
              </span>
              <span style={{ color: 'var(--text-3)' }}>➔</span>
              <span style={{ color: 'var(--blue-2)', background: 'rgba(59,130,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                2. Coord Matrix [P]
              </span>
              <span style={{ color: 'var(--text-3)' }}>➔</span>
              <span style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                3. Transform [T]
              </span>
              <span style={{ color: 'var(--text-3)' }}>➔</span>
              <span style={{ color: 'var(--teal)', background: 'rgba(20,184,166,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                4. Multiply [T·P]
              </span>
              <span style={{ color: 'var(--text-3)' }}>➔</span>
              <span style={{ color: 'var(--orange)', background: 'rgba(249,115,22,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                5. New Coords [P']
              </span>
              <span style={{ color: 'var(--text-3)' }}>➔</span>
              <span style={{ color: 'var(--orange)', background: 'rgba(249,115,22,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                6. Rendered Graphic
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ fontSize: 11.5, color: 'var(--blue-2)', background: 'rgba(59,130,246,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                P' = T · P
              </code>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }} className="hide-sm">
                Column-Vector Convention
              </span>
            </div>
          </div>
        )}

        {/* Presentation header */}
        {presentation && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(90deg, var(--blue-2), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Matrix Graphics Lab
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
              Linear Algebra Project — Use of Matrices in Graphic Designing
            </div>
          </div>
        )}

        {/* Pages */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {tab === '2d'  && <Transform2DPage presentationMode={presentation} />}
          {tab === '3d'  && <Transform3DPage presentationMode={presentation} />}
          {tab === 'glb' && <GLBViewerPage />}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '8px 28px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-1)' }}>
        <span>Matrix Graphics Lab · Linear Algebra Project</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>P' = T · P</span>
        <span>React + TypeScript + Three.js</span>
      </footer>
    </div>
  );
}
