import React from 'react';
import { MatrixDisplay } from './MatrixComponents';
import { formatNum } from '../mathematics/matrixMath';

// ============================================================
// Types
// ============================================================

export type ExplainTransformType2D =
  | 'scaling' | 'rotation' | 'reflection' | 'shearing' | 'translation' | 'custom';

export type ExplainTransformType3D =
  | 'rotationY' | 'rotationX' | 'rotationZ' | 'scaling' | 'reflection' | 'translation' | 'shearing' | 'custom';

export type ExplainTransformType = ExplainTransformType2D | ExplainTransformType3D;

export interface ExplainParams {
  sx?: number; sy?: number; sz?: number;
  angle?: number;
  tx?: number; ty?: number; tz?: number;
  shearK?: number; shearAxis?: 'x' | 'y';
  sA?: number; sB?: number;
  reflPreset?: string;
  det?: number;
  isHomogeneous?: boolean;
  is3D?: boolean;
}

// ============================================================
// Helper: build dynamic explanation sentences
// ============================================================

function buildExplanation(type: ExplainTransformType, p: ExplainParams): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const { sx = 1, sy = 1, sz = 1, angle = 0, tx = 0, ty = 0, tz = 0,
          shearK = 0, shearAxis = 'x', sA = 0, sB = 0,
          reflPreset = 'x-axis', det = 1 } = p;

  const hi = (v: React.ReactNode) => (
    <span style={{ color: 'var(--blue-2)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span>
  );
  const oran = (v: React.ReactNode) => (
    <span style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span>
  );
  const pur = (v: React.ReactNode) => (
    <span style={{ color: 'var(--purple)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span>
  );
  const teal = (v: React.ReactNode) => (
    <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span>
  );

  // -----------------------------------------------------------
  switch (type) {

    // ── 2D / 3D SCALING ────────────────────────────────────
    case 'scaling': {
      const is3D = p.is3D;
      const scaleTotal = is3D ? Math.abs(sx * sy * sz) : Math.abs(sx * sy);
      const isCollapsed = Math.abs(is3D ? sx * sy * sz : sx * sy) < 0.0001;

      blocks.push(
        <div key="s1" style={{ marginBottom: 4 }}>
          💡 <strong>In simple words:</strong> Think of zooming in or out on a picture on your phone screen.
        </div>
      );

      const bullets: React.ReactNode[] = [];

      // Width (X)
      if (sx === 1) {
        bullets.push(<li key="x"><strong>Width (X):</strong> Stays its normal size (1×).</li>);
      } else if (sx === 0) {
        bullets.push(<li key="x"><strong>Width (X):</strong> {oran('Squashed completely flat to 0')}!</li>);
      } else if (sx > 1) {
        bullets.push(<li key="x"><strong>Width (X):</strong> Stretched to be {hi(`${formatNum(sx)} times wider`)}. Every point is pushed {formatNum(sx)}× farther sideways from the center.</li>);
      } else if (sx > 0 && sx < 1) {
        bullets.push(<li key="x"><strong>Width (X):</strong> Squished down to {hi(`${formatNum(sx)}× of its normal width`)}.</li>);
      } else {
        bullets.push(<li key="x"><strong>Width (X):</strong> {pur('Flipped backwards')} (left becomes right) and stretched by {hi(`${formatNum(Math.abs(sx))}×`)}.</li>);
      }

      // Height (Y)
      if (sy === 1) {
        bullets.push(<li key="y"><strong>Height (Y):</strong> Stays its normal size (1×).</li>);
      } else if (sy === 0) {
        bullets.push(<li key="y"><strong>Height (Y):</strong> {oran('Squashed completely flat to 0')}!</li>);
      } else if (sy > 1) {
        bullets.push(<li key="y"><strong>Height (Y):</strong> Stretched to be {hi(`${formatNum(sy)} times taller`)}. Every point is pushed {formatNum(sy)}× farther up and down from the center.</li>);
      } else if (sy > 0 && sy < 1) {
        bullets.push(<li key="y"><strong>Height (Y):</strong> Squished down to {hi(`${formatNum(sy)}× of its normal height`)}.</li>);
      } else {
        bullets.push(<li key="y"><strong>Height (Y):</strong> {pur('Flipped upside-down')} and stretched by {hi(`${formatNum(Math.abs(sy))}×`)}.</li>);
      }

      // Depth (Z) if 3D
      if (is3D) {
        if (sz === 1) {
          bullets.push(<li key="z"><strong>Depth (Z):</strong> Stays its normal depth (1×).</li>);
        } else if (sz === 0) {
          bullets.push(<li key="z"><strong>Depth (Z):</strong> {oran('Squashed completely flat in depth (0)')}!</li>);
        } else if (sz > 1) {
          bullets.push(<li key="z"><strong>Depth (Z):</strong> Stretched {hi(`${formatNum(sz)} times deeper`)}.</li>);
        } else if (sz > 0 && sz < 1) {
          bullets.push(<li key="z"><strong>Depth (Z):</strong> Squished down to {hi(`${formatNum(sz)}× depth`)}.</li>);
        } else {
          bullets.push(<li key="z"><strong>Depth (Z):</strong> {pur('Flipped front-to-back')} and stretched by {hi(`${formatNum(Math.abs(sz))}×`)}.</li>);
        }
      }

      blocks.push(
        <ul key="s2" style={{ margin: '4px 0 6px 18px', padding: 0 }}>
          {bullets}
        </ul>
      );

      const isUniform = sx === sy && (!is3D || sz === sy);
      if (isUniform && !isCollapsed) {
        blocks.push(
          <div key="s3">
            📐 <strong>Does it distort?</strong> No! Because {is3D ? 'all 3 sides' : 'both width and height'} changed by the exact same number ({hi(`${formatNum(sx)}`)}), the shape keeps its proportions and {Math.abs(sx) === 1 ? 'stays the same size' : Math.abs(sx) > 1 ? 'just grows bigger evenly' : 'just shrinks smaller evenly'}.
          </div>
        );
      } else if (!isCollapsed) {
        blocks.push(
          <div key="s3">
            📐 <strong>Does it distort?</strong> Yes! Because width and height changed by different amounts ({hi(`${formatNum(sx)}`)} vs {hi(`${formatNum(sy)}`)}), the shape gets {oran('stretched and pulled out of shape')}.
          </div>
        );
      }

      if (isCollapsed) {
        blocks.push(
          <div key="s4">
            ⚠️ <strong>Flattened:</strong> Because one of the scales is 0, the shape lost its {is3D ? 'volume' : 'area'} and collapsed into a flat {is3D ? 'sheet or line' : 'line or dot'}.
          </div>
        );
      } else {
        blocks.push(
          <div key="s4">
            📏 <strong>Total space covered:</strong> The shape now covers {pur(`${formatNum(scaleTotal, 2)} times`)} as much {is3D ? '3D volume' : 'screen area'} ({formatNum(Math.abs(sx))} × {formatNum(Math.abs(sy))}{is3D ? ` × ${formatNum(Math.abs(sz))}` : ''} = {formatNum(scaleTotal, 2)}).
          </div>
        );
      }
      break;
    }

    // ── 2D ROTATION ────────────────────────────────────────
    case 'rotation': {
      const absAngle = Math.abs(angle);
      const dirText = angle > 0 ? 'counter-clockwise (to the left)' : angle < 0 ? 'clockwise (to the right)' : '';

      blocks.push(
        <div key="r1">
          💡 <strong>In simple words:</strong> Imagine pinning the center of the shape to the table with a thumb tack and spinning it around.
        </div>
      );

      if (absAngle === 0 || absAngle === 360) {
        blocks.push(
          <div key="r2">
            🔄 <strong>Current turn:</strong> The shape has not turned (or made a full 360° spin), so it looks exactly as it originally did.
          </div>
        );
      } else {
        blocks.push(
          <div key="r2">
            🔄 <strong>Current turn:</strong> The shape is turned by {hi(`${absAngle}°`)} {dirText} around the center point (0, 0).
            {absAngle === 90 && ' It made a clean quarter-turn onto its side.'}
            {absAngle === 180 && ' It turned completely upside-down.'}
            {absAngle === 270 && ' It made a three-quarter turn.'}
          </div>
        );
      }

      blocks.push(
        <div key="r3">
          📏 <strong>Size and shape:</strong> Stay 100% the same. Spinning never stretches, shrinks, or warps anything — only the direction the shape faces changes.
        </div>
      );
      break;
    }

    // ── 3D ROTATION X ──────────────────────────────────────
    case 'rotationX': {
      blocks.push(
        <div key="rx1">
          💡 <strong>In simple words:</strong> Think of nodding your head up and down ("yes"), or spinning a wheel on a horizontal axle.
        </div>
      );
      blocks.push(
        <div key="rx2">
          🔄 <strong>What is moving:</strong> The horizontal red line (X-axis) acts like a metal rod going straight through the shape. The shape spins around this rod by {hi(`${angle}°`)}.
        </div>
      );
      blocks.push(
        <ul key="rx3" style={{ margin: '4px 0 6px 18px', padding: 0 }}>
          <li><strong>Left & right (X):</strong> Points do not move left or right at all.</li>
          <li><strong>Top, bottom & depth (Y and Z):</strong> The shape tilts forward or backward in a circle.</li>
        </ul>
      );
      blocks.push(
        <div key="rx4">
          📏 <strong>Size:</strong> Stays 100% the same. It does not stretch or shrink — it just tilts.
        </div>
      );
      break;
    }

    // ── 3D ROTATION Y ──────────────────────────────────────
    case 'rotationY': {
      blocks.push(
        <div key="ry1">
          💡 <strong>In simple words:</strong> Think of shaking your head left and right ("no"), or a revolving carousel in an amusement park.
        </div>
      );
      blocks.push(
        <div key="ry2">
          🔄 <strong>What is moving:</strong> The vertical green line (Y-axis) acts like a pole through the middle. The shape spins around this pole by {hi(`${angle}°`)}.
        </div>
      );
      blocks.push(
        <ul key="ry3" style={{ margin: '4px 0 6px 18px', padding: 0 }}>
          <li><strong>Up & down (Y):</strong> Points do not move up or down at all.</li>
          <li><strong>Front, back, left & right (X and Z):</strong> The shape swings around in a horizontal circle.</li>
        </ul>
      );
      blocks.push(
        <div key="ry4">
          📏 <strong>Size:</strong> Stays 100% the same — only the direction it faces changes.
        </div>
      );
      break;
    }

    // ── 3D ROTATION Z ──────────────────────────────────────
    case 'rotationZ': {
      blocks.push(
        <div key="rz1">
          💡 <strong>In simple words:</strong> Think of tilting your head sideways to touch your ear to your shoulder, or turning a car's steering wheel.
        </div>
      );
      blocks.push(
        <div key="rz2">
          🔄 <strong>What is moving:</strong> The blue line (Z-axis) points straight out of the screen at you. The shape spins like a steering wheel by {hi(`${angle}°`)}.
        </div>
      );
      blocks.push(
        <ul key="rz3" style={{ margin: '4px 0 6px 18px', padding: 0 }}>
          <li><strong>Closer or farther (depth):</strong> Does not move closer or farther at all.</li>
          <li><strong>On your screen (X and Y):</strong> The shape tilts sideways in a circle.</li>
        </ul>
      );
      blocks.push(
        <div key="rz4">
          📏 <strong>Size:</strong> Stays 100% the same — it only tilts sideways on your screen.
        </div>
      );
      break;
    }

    // ── REFLECTION ─────────────────────────────────────────
    case 'reflection': {
      const presetDescriptions: Record<string, { mirror: string; moves: string }> = {
        'x-axis': {
          mirror: 'the horizontal line (the floor)',
          moves: 'The top half flips down to the bottom, and the bottom flips up to the top. Left and right stay right where they are.',
        },
        'y-axis': {
          mirror: 'the vertical line (the wall)',
          moves: 'The left side flips over to the right, and the right side flips over to the left. Top and bottom stay right where they are.',
        },
        'origin': {
          mirror: 'the center point (0, 0)',
          moves: 'Everything flips through the center dot. The shape ends up upside-down AND backwards at the same time (just like turning 180°).',
        },
        'y=x': {
          mirror: 'a 45° diagonal line',
          moves: 'Horizontal and vertical trade places! What was width becomes height, and what was height becomes width.',
        },
        'y=-x': {
          mirror: 'the opposite diagonal line',
          moves: 'Horizontal and vertical trade places and flip backwards.',
        },
        'xy-plane': {
          mirror: 'the flat computer screen',
          moves: 'Whatever was in front flips to the back, and whatever was in back flips to the front.',
        },
        'xz-plane': {
          mirror: 'the ground floor',
          moves: 'The top flips underground, and the bottom flips up into the air.',
        },
        'yz-plane': {
          mirror: 'a vertical wall from front to back',
          moves: 'The left side flips over to the right side.',
        },
      };

      const info = presetDescriptions[reflPreset] ?? {
        mirror: 'a mirror line or plane',
        moves: 'One side flips over to the other side.',
      };

      blocks.push(
        <div key="f1">
          💡 <strong>In simple words:</strong> Imagine placing a flat mirror along {hi(info.mirror)}.
        </div>
      );
      blocks.push(
        <div key="f2">
          🪞 <strong>What flips:</strong> {info.moves}
        </div>
      );
      blocks.push(
        <div key="f3">
          📏 <strong>Size & shape:</strong> The shape keeps its exact size and crispness. It does not shrink or stretch — it is simply flipped inside-out (like how your left hand looks like a right hand in a mirror).
        </div>
      );
      break;
    }

    // ── SHEARING ───────────────────────────────────────────
    case 'shearing': {
      if (p.is3D) {
        blocks.push(
          <div key="sh1">
            💡 <strong>In simple words:</strong> Think of pushing the top or sides of a cardboard box so it leans over at an angle.
          </div>
        );
        blocks.push(
          <div key="sh2">
            📐 <strong>What is moving:</strong> Points slide forward or backward in depth depending on their horizontal position (factor {hi(formatNum(sA))}) and vertical position (factor {hi(formatNum(sB))}).
          </div>
        );
        blocks.push(
          <div key="sh3">
            📏 <strong>Volume stays the same:</strong> Even though the box slants, the total 3D space it holds never changes!
          </div>
        );
      } else {
        const isX = shearAxis === 'x';
        blocks.push(
          <div key="sh1">
            💡 <strong>In simple words:</strong> Think of a deck of playing cards on a desk. If you push the top cards sideways with your hand while keeping the bottom cards on the desk, the whole stack slants over.
          </div>
        );

        if (shearK === 0) {
          blocks.push(
            <div key="sh2">
              📐 <strong>No slant:</strong> The lean factor is 0, so the shape is standing straight up.
            </div>
          );
        } else if (isX) {
          blocks.push(
            <div key="sh2">
              📐 <strong>What is moving:</strong>
              <ul style={{ margin: '4px 0 6px 18px', padding: 0 }}>
                <li>The bottom edge (sitting on the horizontal line) stays completely still.</li>
                <li>The higher up a point is, the farther it slides {shearK > 0 ? 'to the right →' : 'to the left ←'} by {hi(`${formatNum(Math.abs(shearK))}×`)} its height.</li>
                <li>A straight rectangle leans over into a slanted diamond shape.</li>
              </ul>
            </div>
          );
        } else {
          blocks.push(
            <div key="sh2">
              📐 <strong>What is moving:</strong>
              <ul style={{ margin: '4px 0 6px 18px', padding: 0 }}>
                <li>The left edge (against the vertical line) stays completely still.</li>
                <li>The farther to the right a point is, the farther it slides {shearK > 0 ? 'upwards ↑' : 'downwards ↓'} by {hi(`${formatNum(Math.abs(shearK))}×`)} its distance.</li>
                <li>A straight rectangle leans over into a slanted diamond shape.</li>
              </ul>
            </div>
          );
        }

        blocks.push(
          <div key="sh3">
            📏 <strong>Surprising fact — Area never changes:</strong> Even though the shape leans over, it covers the {teal('exact same amount of screen space')} as before (just like a slanted deck of cards still has the exact same amount of card paper!).
          </div>
        );
      }
      break;
    }

    // ── TRANSLATION ────────────────────────────────────────
    case 'translation': {
      const is3D = p.is3D;
      const noMove = tx === 0 && ty === 0 && (!is3D || tz === 0);

      blocks.push(
        <div key="t1">
          💡 <strong>In simple words:</strong> This simply slides the shape from one spot to another across the screen — like sliding a coffee mug across a table.
        </div>
      );

      if (noMove) {
        blocks.push(
          <div key="t2">
            📍 <strong>Current position:</strong> The shape hasn't moved yet (all slide values are 0).
          </div>
        );
      } else {
        const moves: React.ReactNode[] = [];
        if (tx !== 0) {
          moves.push(
            <li key="tx">
              <strong>Sideways (X):</strong> Slides {hi(`${formatNum(Math.abs(tx))} ${Math.abs(tx) === 1 ? 'unit' : 'units'} ${tx > 0 ? 'to the right →' : 'to the left ←'}`)}.
            </li>
          );
        }
        if (ty !== 0) {
          moves.push(
            <li key="ty">
              <strong>Vertical (Y):</strong> Slides {hi(`${formatNum(Math.abs(ty))} ${Math.abs(ty) === 1 ? 'unit' : 'units'} ${ty > 0 ? 'upwards ↑' : 'downwards ↓'}`)}.
            </li>
          );
        }
        if (is3D && tz !== 0) {
          moves.push(
            <li key="tz">
              <strong>Depth (Z):</strong> Slides {hi(`${formatNum(Math.abs(tz))} ${Math.abs(tz) === 1 ? 'unit' : 'units'} ${tz > 0 ? 'forward (closer)' : 'backward (farther away)'}`)}.
            </li>
          );
        }

        blocks.push(
          <div key="t2">
            📍 <strong>Where it is sliding:</strong>
            <ul style={{ margin: '4px 0 6px 18px', padding: 0 }}>
              {moves}
            </ul>
          </div>
        );
      }

      blocks.push(
        <div key="t3">
          📏 <strong>Size & shape:</strong> Stay 100% identical. Nothing stretches, shrinks, or tilts — every point moves together by the exact same distance.
        </div>
      );

      blocks.push(
        <div key="t4" style={{ fontSize: 12, opacity: 0.9, borderTop: '1px dashed var(--border)', paddingTop: 6, marginTop: 4 }}>
          ❓ <strong>Why the extra row & column with a "1"?</strong>
          <br />
          Basic matrices can only stretch or spin shapes around the center (0, 0) — they can't just slide points around. Adding a helper number ("1") is a clever math trick that allows the matrix to <em>add</em> slide distances so the shape can slide anywhere!
        </div>
      );
      break;
    }

    // ── CUSTOM ─────────────────────────────────────────────
    case 'custom': {
      const detAbs = Math.abs(det);
      blocks.push(
        <div key="c1">
          💡 <strong>In simple words:</strong> You are typing in your own math rules directly to stretch, bend, or spin the shape however you like.
        </div>
      );

      let sizeMsg: React.ReactNode;
      if (detAbs < 0.0001) {
        sizeMsg = (
          <span>
            ⚠️ {oran('Squashed Flat!')} The size multiplier is 0. The shape has been crushed completely flat into a single straight line or dot, losing all its area.
          </span>
        );
      } else if (det < 0) {
        sizeMsg = (
          <span>
            🔄 {pur('Flipped Inside-Out:')} Because the size multiplier is negative, the shape is flipped like looking in a mirror, and its total area is multiplied by {hi(`${formatNum(detAbs, 2)}×`)}.
          </span>
        );
      } else if (Math.abs(det - 1) < 0.01) {
        sizeMsg = (
          <span>
            📐 {teal('Exact Same Area:')} The shape covers 100% of its original area (multiplier is 1).
          </span>
        );
      } else if (det > 1) {
        sizeMsg = (
          <span>
            🔍 {hi('Expanded:')} The shape grew larger — it now covers {hi(`${formatNum(det, 2)} times`)} as much area as it started with.
          </span>
        );
      } else {
        sizeMsg = (
          <span>
            🔍 {hi('Shrunk:')} The shape shrank — it now covers only {hi(`${formatNum(det, 2)} of its original area`)}.
          </span>
        );
      }

      blocks.push(
        <div key="c2">
          {sizeMsg}
        </div>
      );

      blocks.push(
        <div key="c3">
          📍 <strong>Center Anchor:</strong> The center point (0, 0) stays anchored right in the middle, while all other points stretch, rotate, or slant around it.
        </div>
      );
      break;
    }

    default:
      blocks.push(<div key="d1">Adjust the controls on the left to see what happens in real time!</div>);
  }

  return blocks;
}

// ============================================================
// ExplanationBlock Component
// ============================================================

export interface SampleVertex {
  label: string;
  orig: number[];
  trans: number[];
}

interface ExplanationBlockProps {
  type: ExplainTransformType;
  params: ExplainParams;
  sampleVertex?: SampleVertex;
}

function renderInputPills(type: ExplainTransformType, p: ExplainParams) {
  const pills: React.ReactNode[] = [];
  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    fontSize: 11.5,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-1)',
    fontWeight: 600,
  };

  switch (type) {
    case 'scaling':
      pills.push(<span key="sx" style={pillStyle}>X Scale: <span style={{ color: 'var(--blue-2)' }}>{formatNum(p.sx ?? 1)}×</span></span>);
      pills.push(<span key="sy" style={pillStyle}>Y Scale: <span style={{ color: 'var(--blue-2)' }}>{formatNum(p.sy ?? 1)}×</span></span>);
      if (p.is3D) {
        pills.push(<span key="sz" style={pillStyle}>Z Scale: <span style={{ color: 'var(--blue-2)' }}>{formatNum(p.sz ?? 1)}×</span></span>);
      }
      break;

    case 'rotation':
      pills.push(<span key="ang" style={pillStyle}>Angle: <span style={{ color: 'var(--orange)' }}>{p.angle ?? 0}°</span></span>);
      pills.push(<span key="dir" style={pillStyle}>Direction: <span style={{ color: 'var(--teal)' }}>{(p.angle ?? 0) >= 0 ? 'Counter-Clockwise' : 'Clockwise'}</span></span>);
      break;

    case 'rotationX':
      pills.push(<span key="rx" style={pillStyle}>Pitch (X-Axis): <span style={{ color: 'var(--orange)' }}>{p.angle ?? 0}°</span></span>);
      break;

    case 'rotationY':
      pills.push(<span key="ry" style={pillStyle}>Yaw (Y-Axis): <span style={{ color: 'var(--orange)' }}>{p.angle ?? 0}°</span></span>);
      break;

    case 'rotationZ':
      pills.push(<span key="rz" style={pillStyle}>Roll (Z-Axis): <span style={{ color: 'var(--orange)' }}>{p.angle ?? 0}°</span></span>);
      break;

    case 'reflection':
      pills.push(<span key="refl" style={pillStyle}>Mirror: <span style={{ color: 'var(--purple)' }}>{p.reflPreset}</span></span>);
      break;

    case 'shearing':
      if (p.is3D) {
        pills.push(<span key="sa" style={pillStyle}>Factor a: <span style={{ color: 'var(--teal)' }}>{formatNum(p.sA ?? 0)}</span></span>);
        pills.push(<span key="sb" style={pillStyle}>Factor b: <span style={{ color: 'var(--teal)' }}>{formatNum(p.sB ?? 0)}</span></span>);
      } else {
        pills.push(<span key="ax" style={pillStyle}>Lean Axis: <span style={{ color: 'var(--teal)' }}>{p.shearAxis?.toUpperCase()}</span></span>);
        pills.push(<span key="k" style={pillStyle}>Lean Factor k: <span style={{ color: 'var(--blue-2)' }}>{formatNum(p.shearK ?? 0)}</span></span>);
      }
      break;

    case 'translation':
      pills.push(<span key="tx" style={pillStyle}>Slide X: <span style={{ color: 'var(--orange)' }}>{(p.tx ?? 0) >= 0 ? `+${formatNum(p.tx ?? 0)}` : formatNum(p.tx ?? 0)}</span></span>);
      pills.push(<span key="ty" style={pillStyle}>Slide Y: <span style={{ color: 'var(--orange)' }}>{(p.ty ?? 0) >= 0 ? `+${formatNum(p.ty ?? 0)}` : formatNum(p.ty ?? 0)}</span></span>);
      if (p.is3D) {
        pills.push(<span key="tz" style={pillStyle}>Slide Z: <span style={{ color: 'var(--orange)' }}>{(p.tz ?? 0) >= 0 ? `+${formatNum(p.tz ?? 0)}` : formatNum(p.tz ?? 0)}</span></span>);
      }
      break;

    case 'custom':
      pills.push(<span key="det" style={pillStyle}>Area Multiplier (det): <span style={{ color: 'var(--purple)' }}>{formatNum(p.det ?? 1, 2)}×</span></span>);
      break;
  }

  if (pills.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      marginBottom: 6,
      paddingBottom: 8,
      borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
    }}>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Your Active Inputs:
      </span>
      {pills}
    </div>
  );
}

function renderVertexExample(type: ExplainTransformType, p: ExplainParams, sample?: SampleVertex) {
  if (!sample || !sample.orig || sample.orig.length < 2) return null;
  const is3D = p.is3D;
  const lbl = sample.label;
  const ox = sample.orig[0];
  const oy = sample.orig[1];
  const oz = is3D ? sample.orig[2] ?? 0 : 0;

  const tx = sample.trans[0];
  const ty = sample.trans[1];
  const tz = is3D ? sample.trans[2] ?? 0 : 0;

  const origStr = is3D ? `(${formatNum(ox)}, ${formatNum(oy)}, ${formatNum(oz)})` : `(${formatNum(ox)}, ${formatNum(oy)})`;
  const transStr = is3D ? `(${formatNum(tx)}, ${formatNum(ty)}, ${formatNum(tz)})` : `(${formatNum(tx)}, ${formatNum(ty)})`;

  let mathBreakdown: React.ReactNode = null;

  switch (type) {
    case 'scaling':
      mathBreakdown = (
        <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
          <div>• New X = {formatNum(ox)} × <strong style={{ color: 'var(--blue-2)' }}>{formatNum(p.sx ?? 1)}</strong> (your X scale) = <strong style={{ color: 'var(--orange)' }}>{formatNum(tx)}</strong></div>
          <div>• New Y = {formatNum(oy)} × <strong style={{ color: 'var(--blue-2)' }}>{formatNum(p.sy ?? 1)}</strong> (your Y scale) = <strong style={{ color: 'var(--orange)' }}>{formatNum(ty)}</strong></div>
          {is3D && <div>• New Z = {formatNum(oz)} × <strong style={{ color: 'var(--blue-2)' }}>{formatNum(p.sz ?? 1)}</strong> (your Z scale) = <strong style={{ color: 'var(--orange)' }}>{formatNum(tz)}</strong></div>}
        </div>
      );
      break;

    case 'translation':
      mathBreakdown = (
        <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
          <div>• New X = {formatNum(ox)} + (<strong style={{ color: 'var(--orange)' }}>{formatNum(p.tx ?? 0)}</strong>) = <strong style={{ color: 'var(--blue-2)' }}>{formatNum(tx)}</strong></div>
          <div>• New Y = {formatNum(oy)} + (<strong style={{ color: 'var(--orange)' }}>{formatNum(p.ty ?? 0)}</strong>) = <strong style={{ color: 'var(--blue-2)' }}>{formatNum(ty)}</strong></div>
          {is3D && <div>• New Z = {formatNum(oz)} + (<strong style={{ color: 'var(--orange)' }}>{formatNum(p.tz ?? 0)}</strong>) = <strong style={{ color: 'var(--blue-2)' }}>{formatNum(tz)}</strong></div>}
        </div>
      );
      break;

    case 'shearing':
      if (!is3D) {
        const isX = p.shearAxis === 'x';
        mathBreakdown = (
          <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
            {isX ? (
              <div>• New X = {formatNum(ox)} + (<strong style={{ color: 'var(--teal)' }}>{formatNum(p.shearK ?? 0)}</strong> × {formatNum(oy)}) = <strong style={{ color: 'var(--orange)' }}>{formatNum(tx)}</strong>, New Y stays <strong style={{ color: 'var(--blue-2)' }}>{formatNum(ty)}</strong></div>
            ) : (
              <div>• New X stays <strong style={{ color: 'var(--blue-2)' }}>{formatNum(tx)}</strong>, New Y = {formatNum(oy)} + (<strong style={{ color: 'var(--teal)' }}>{formatNum(p.shearK ?? 0)}</strong> × {formatNum(ox)}) = <strong style={{ color: 'var(--orange)' }}>{formatNum(ty)}</strong></div>
            )}
          </div>
        );
      }
      break;

    case 'rotation':
      mathBreakdown = (
        <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
          <div>• Swung by <strong style={{ color: 'var(--orange)' }}>{p.angle ?? 0}°</strong> in a circle around the center (0, 0)</div>
        </div>
      );
      break;

    case 'reflection':
      mathBreakdown = (
        <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
          <div>• Mirrored across <strong style={{ color: 'var(--purple)' }}>{p.reflPreset}</strong></div>
        </div>
      );
      break;

    default:
      break;
  }

  return (
    <div style={{
      marginTop: 8,
      padding: '8px 12px',
      borderRadius: 6,
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        👉 Applied directly to Point {lbl}:
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
        Original <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-2)', fontWeight: 600 }}>{origStr}</span> → New position <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontWeight: 700 }}>{transStr}</span>
      </div>
      {mathBreakdown}
    </div>
  );
}

export const ExplanationBlock: React.FC<ExplanationBlockProps> = ({ type, params, sampleVertex }) => {
  const paragraphs = buildExplanation(type, params);

  return (
    <div style={{
      marginTop: 20,
      borderTop: '1px solid var(--border)',
      paddingTop: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--blue-2), var(--purple))',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-1)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          What's Happening — Simple Explanation
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 8,
        padding: '12px 14px',
      }}>
        {renderInputPills(type, params)}

        {paragraphs.map((node, i) => (
          <div key={i} style={{
            fontSize: 12.5,
            color: 'var(--text-2)',
            lineHeight: 1.6,
          }}>
            {node}
          </div>
        ))}

        {renderVertexExample(type, params, sampleVertex)}
      </div>
    </div>
  );
};

// ============================================================
// Step-by-Step Calculation Display
// ============================================================
interface StepCalcProps {
  T: number[][];
  P: number[][];
  result: number[][];
  pointLabels: string[];
  isHomogeneous?: boolean;
  presentationMode?: boolean;
  explainType?: ExplainTransformType;
  explainParams?: ExplainParams;
}

export const StepCalculation: React.FC<StepCalcProps> = ({
  T, P, result, pointLabels, isHomogeneous = false, explainType, explainParams,
}) => {
  const is3D = P.length === 3 || (isHomogeneous && P.length === 2);
  const Pdisplay = isHomogeneous ? [...P, Array(P[0].length).fill(1)] : P;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Convention note */}
      <div className="info-box" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <span style={{ color: 'var(--blue-2)', fontWeight: 700 }}>P' = T · P</span>
        <span style={{ color: 'var(--text-3)', marginLeft: 10 }}>
          Column vectors · Each column = one point
          {isHomogeneous && ' · Homogeneous coordinates for translation'}
        </span>
      </div>

      {/* T = ... */}
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Transformation Matrix
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 13, flexShrink: 0 }}>T =</span>
          <MatrixDisplay matrix={T} color="var(--purple)" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-3)', fontSize: 20, fontWeight: 300 }}>×</div>

      {/* P = ... */}
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Coordinate Matrix {isHomogeneous && <span style={{ color: 'var(--blue)' }}>(with homogeneous row)</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 13, flexShrink: 0 }}>P =</span>
          <MatrixDisplay matrix={Pdisplay} color="var(--blue-2)" />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
          Each column = one point [{is3D ? 'x, y, z' : 'x, y'}]ᵀ
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-3)', fontSize: 20, fontWeight: 300 }}>=</div>

      {/* P' = ... */}
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Result P' = T · P
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 13, flexShrink: 0 }}>P' =</span>
          <MatrixDisplay matrix={result} color="var(--orange)" />
        </div>
      </div>

      {/* Per-point breakdown */}
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Point-by-Point
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {P[0].map((_, j) => {
            const lbl = pointLabels[j] ?? String.fromCharCode(65 + j);
            const orig = P.map(row => row[j]);
            const trans = result.map(row => row[j]);
            return (
              <div key={j} className="calc-box">
                <div style={{ color: 'var(--text-2)', marginBottom: 5, fontSize: 12 }}>
                  Point <span style={{ color: 'var(--blue-2)', fontWeight: 700 }}>{lbl}</span>
                  {' '}= ({orig.map(v => formatNum(v)).join(', ')})
                </div>
                {T.map((tRow, i) => {
                  const terms = orig.map((v, k) => `${formatNum(tRow[k])}×${formatNum(v)}`).join(' + ');
                  return (
                    <div key={i} style={{ color: 'var(--text-3)', marginBottom: 2, fontSize: 12 }}>
                      {'  '}[{i + 1}]: {terms}{' '}
                      = <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatNum(trans[i])}</span>
                    </div>
                  );
                })}
                <div style={{ color: 'var(--orange)', marginTop: 6, fontWeight: 600 }}>
                  ∴ {lbl}' = ({trans.slice(0, is3D ? 3 : 2).map(v => formatNum(v)).join(', ')})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── EXPLANATION BLOCK ── */}
      {explainType && explainParams && (
        <ExplanationBlock
          type={explainType}
          params={explainParams}
          sampleVertex={{
            label: pointLabels[0] ?? 'A',
            orig: P.map(row => row[0]),
            trans: result.map(row => row[0]),
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// 2D Coordinate Table
// ============================================================
interface CoordTableProps {
  pointLabels: string[];
  original: [number, number][];
  transformed: [number, number][];
  highlightRow?: number | null;
  onRowClick?: (i: number) => void;
}

export const CoordTable: React.FC<CoordTableProps> = ({
  pointLabels, original, transformed, highlightRow, onRowClick,
}) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="data-table">
      <thead>
        <tr>
          <th>Point</th>
          <th style={{ color: 'var(--blue-2)' }}>Original (x, y)</th>
          <th style={{ color: 'var(--orange)' }}>Transformed (x', y')</th>
        </tr>
      </thead>
      <tbody>
        {original.map((pt, i) => (
          <tr key={i}
            className={highlightRow === i ? 'row-highlight' : ''}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            onClick={() => onRowClick?.(i)}>
            <td style={{ fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {pointLabels[i] ?? String.fromCharCode(65 + i)}
            </td>
            <td style={{ color: 'var(--blue-2)' }}>
              ({formatNum(pt[0])}, {formatNum(pt[1])})
            </td>
            <td style={{ color: 'var(--orange)' }}>
              ({formatNum(transformed[i]?.[0] ?? pt[0])}, {formatNum(transformed[i]?.[1] ?? pt[1])})
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================================
// 3D Coordinate Table
// ============================================================
export const CoordTable3D: React.FC<{
  pointLabels: string[];
  original: [number, number, number][];
  transformed: [number, number, number][];
}> = ({ pointLabels, original, transformed }) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="data-table">
      <thead>
        <tr>
          <th>Vertex</th>
          <th style={{ color: 'var(--blue-2)' }}>Original (x, y, z)</th>
          <th style={{ color: 'var(--orange)' }}>Transformed (x', y', z')</th>
        </tr>
      </thead>
      <tbody>
        {original.map((pt, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {pointLabels[i] ?? `V${i}`}
            </td>
            <td style={{ color: 'var(--blue-2)' }}>
              ({formatNum(pt[0])}, {formatNum(pt[1])}, {formatNum(pt[2])})
            </td>
            <td style={{ color: 'var(--orange)' }}>
              ({formatNum(transformed[i]?.[0] ?? pt[0])}, {formatNum(transformed[i]?.[1] ?? pt[1])}, {formatNum(transformed[i]?.[2] ?? pt[2])})
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
