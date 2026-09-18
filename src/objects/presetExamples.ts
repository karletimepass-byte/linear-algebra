import { PresetExample } from '../types';

export const PRESET_EXAMPLES: PresetExample[] = [
  {
    id: 'ex-triangle-scale',
    title: 'Example 1: Triangle + Uniform Scaling (s = 2)',
    category: '2d',
    description: 'Demonstrates scaling an object by doubling each coordinate vector: P\' = 2P.',
    shapeId: 'triangle',
    transformation: {
      type: 'scaling',
      sx: 2,
      sy: 2,
      uniform: true,
      homogeneous: false,
    },
  },
  {
    id: 'ex-triangle-rot90',
    title: 'Example 2: Triangle + 90° Rotation',
    category: '2d',
    description: 'Rotates coordinate vectors counter-clockwise about the origin by 90°. Notice [cos(90), -sin(90); sin(90), cos(90)] = [0, -1; 1, 0].',
    shapeId: 'triangle',
    transformation: {
      type: 'rotation',
      degrees: 90,
      homogeneous: false,
    },
  },
  {
    id: 'ex-square-reflect',
    title: 'Example 3: Square + Reflection across X-axis',
    category: '2d',
    description: 'Inverts the y-coordinate while keeping x invariant: (x, y) ↦ (x, -y).',
    shapeId: 'square',
    transformation: {
      type: 'reflection',
      reflectType: 'x-axis',
      homogeneous: false,
    },
  },
  {
    id: 'ex-rect-shear',
    title: 'Example 4: Rectangle + Horizontal Shearing (k = 1.2)',
    category: '2d',
    description: 'Displaces points parallel to the x-axis by an amount proportional to their y-coordinate: x\' = x + ky.',
    shapeId: 'rectangle',
    transformation: {
      type: 'shearing',
      kx: 1.2,
      ky: 0,
      homogeneous: false,
    },
  },
  {
    id: 'ex-house-combined',
    title: 'Example 5: House + Combined Transformation',
    category: 'combined',
    description: 'Demonstrates a sequence of transformations (Translation → Rotation → Scaling) on a multi-vertex house using homogeneous coordinates.',
    shapeId: 'house',
    transformation: {
      steps: [
        { type: 'translation', tx: -3, ty: -2, name: 'Translate to Origin' },
        { type: 'rotation', degrees: 45, name: 'Rotate 45°' },
        { type: 'scaling', sx: 1.5, sy: 1.5, name: 'Scale 1.5x' },
        { type: 'translation', tx: 3, ty: 2, name: 'Translate Back' },
      ],
    },
  },
  {
    id: 'ex-cube-rot3d',
    title: 'Example 6: Cube + 3D Y-Axis Rotation (45°)',
    category: '3d',
    description: 'Rotates a 3D unit cube around the Y-axis using the 3D rotation matrix.',
    shapeId: 'cube',
    transformation: {
      type: 'rotationY',
      degrees: 45,
      homogeneous: false,
    },
  },
];
