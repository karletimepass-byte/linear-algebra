export type AppTab = '2d' | '3d' | 'glb';

export type Matrix = number[][];


export interface Point2D {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Point3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
}

export interface Shape2D {
  id: string;
  name: string;
  points: Point2D[];
  edges?: [number, number][]; // pairs of point indices to draw lines
  isClosed?: boolean;
  color?: string;
  fill?: boolean;
}

export interface Shape3D {
  id: string;
  name: string;
  points: Point3D[];
  edges: [number, number][]; // pairs of point indices
  faces?: number[][];        // point indices forming faces
  color?: string;
}

export type TransformType2D = 
  | 'scaling' 
  | 'rotation' 
  | 'reflection' 
  | 'shearing' 
  | 'translation' 
  | 'custom';

export type TransformType3D = 
  | 'scaling' 
  | 'rotationX' 
  | 'rotationY' 
  | 'rotationZ' 
  | 'reflection' 
  | 'shearing' 
  | 'translation' 
  | 'custom';

export interface TransformationStep {
  id: string;
  name: string;
  type: string;
  matrix: Matrix;
  description: string;
  isHomogeneous: boolean;
  params?: Record<string, any>;
}

export interface StepCalculationDetail {
  pointLabel: string;
  originalCoord: number[];
  matrix: Matrix;
  dotProducts: {
    row: number;
    terms: { factor1: number; factor2: number; product: number }[];
    sum: number;
  }[];
  transformedCoord: number[];
}

export interface PresetExample {
  id: string;
  title: string;
  category: '2d' | '3d' | 'combined';
  description: string;
  shapeId: string;
  transformation: any;
}
