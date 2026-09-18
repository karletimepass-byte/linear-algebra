// ============================================================
// PREDEFINED GRAPHICAL OBJECTS
// Points stored as columns: each column = one (x,y) point
// ============================================================

export interface Shape2D {
  name: string;
  points: [number, number][];   // (x, y) pairs
  edges: [number, number][];    // pairs of point indices
  closed: boolean;
  description: string;
}

export type ShapeKey =
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'house'
  | 'star'
  | 'arrow'
  | 'custom';

export const SHAPES_2D: Record<ShapeKey, Shape2D> = {
  triangle: {
    name: 'Triangle',
    points: [[1,1],[4,1],[2,4]],
    edges: [[0,1],[1,2],[2,0]],
    closed: true,
    description: 'A simple triangle – the simplest polygon.',
  },
  square: {
    name: 'Square',
    points: [[-2,-2],[2,-2],[2,2],[-2,2]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    closed: true,
    description: 'A square with side length 4 centred at origin.',
  },
  rectangle: {
    name: 'Rectangle',
    points: [[-3,-1],[3,-1],[3,1],[-3,1]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    closed: true,
    description: 'A 6×2 rectangle.',
  },
  house: {
    name: 'House',
    // base: (0,0),(4,0),(4,3),(0,3); roof apex: (2,5)
    points: [[0,0],[4,0],[4,3],[2,5],[0,3]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[2,4]],   // walls + roof
    closed: true,
    description: 'A house silhouette – great for visual transformations.',
  },
  star: {
    name: 'Star (5-pointed)',
    points: (() => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 3 : 1.2;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        pts.push([parseFloat((r * Math.cos(angle)).toFixed(3)), parseFloat((r * Math.sin(angle)).toFixed(3))]);
      }
      return pts;
    })(),
    edges: Array.from({ length: 10 }, (_, i) => [i, (i + 1) % 10] as [number, number]),
    closed: true,
    description: 'A 5-pointed star.',
  },
  arrow: {
    name: 'Arrow',
    points: [[0,0],[3,0],[3,-1],[5,1],[3,3],[3,2],[0,2]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]],
    closed: true,
    description: 'A right-pointing arrow.',
  },
  custom: {
    name: 'Custom Polygon',
    points: [[0,0],[3,0],[3,3],[0,3]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    closed: true,
    description: 'Define your own coordinates.',
  },
};

// ============================================================
// 3D OBJECTS (vertex/face lists)
// ============================================================

export interface Shape3D {
  name: string;
  vertices: [number, number, number][];
  edges: [number, number][];
  faces: number[][];           // triangle indices for Three.js
  description: string;
}

export type ShapeKey3D = 'cube' | 'pyramid' | 'prism' | 'tetrahedron';

export const SHAPES_3D: Record<ShapeKey3D, Shape3D> = {
  cube: {
    name: 'Cube',
    vertices: [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ],
    faces: [
      [0,1,2],[0,2,3],
      [4,5,6],[4,6,7],
      [0,1,5],[0,5,4],
      [2,3,7],[2,7,6],
      [1,2,6],[1,6,5],
      [0,3,7],[0,7,4],
    ],
    description: 'Unit cube centred at origin.',
  },
  pyramid: {
    name: 'Pyramid',
    vertices: [
      [-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],
      [0, 2, 0],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,0],
      [0,4],[1,4],[2,4],[3,4],
    ],
    faces: [
      [0,1,2],[0,2,3],
      [0,1,4],[1,2,4],[2,3,4],[3,0,4],
    ],
    description: 'Square-base pyramid.',
  },
  prism: {
    name: 'Rectangular Prism',
    vertices: [
      [-1.5,-0.8,-0.8],[1.5,-0.8,-0.8],[1.5,0.8,-0.8],[-1.5,0.8,-0.8],
      [-1.5,-0.8, 0.8],[1.5,-0.8, 0.8],[1.5,0.8, 0.8],[-1.5,0.8, 0.8],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ],
    faces: [
      [0,1,2],[0,2,3],
      [4,5,6],[4,6,7],
      [0,1,5],[0,5,4],
      [2,3,7],[2,7,6],
      [1,2,6],[1,6,5],
      [0,3,7],[0,7,4],
    ],
    description: 'A 3×1.6×1.6 rectangular prism.',
  },
  tetrahedron: {
    name: 'Tetrahedron',
    vertices: [
      [1, 1, 1],[-1,-1, 1],[-1, 1,-1],[1,-1,-1],
    ],
    edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],
    faces: [[0,1,2],[0,1,3],[0,2,3],[1,2,3]],
    description: 'Regular tetrahedron.',
  },
};

// ---- Convert shape points to column-matrix form ----

export function pointsToMatrix(pts: [number, number][]): number[][] {
  // returns [[x0,x1,...],[y0,y1,...]]
  return [pts.map(p => p[0]), pts.map(p => p[1])];
}

export function matrixToPoints(m: number[][]): [number, number][] {
  return m[0].map((_, j) => [m[0][j], m[1][j]]);
}

export function points3DToMatrix(pts: [number, number, number][]): number[][] {
  return [pts.map(p => p[0]), pts.map(p => p[1]), pts.map(p => p[2])];
}

export function matrix3DToPoints(m: number[][]): [number, number, number][] {
  return m[0].map((_, j) => [m[0][j], m[1][j], m[2][j]]);
}
