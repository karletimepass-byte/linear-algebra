import { Shape3D } from '../types';

export const PRESET_SHAPES_3D: Shape3D[] = [
  {
    id: 'cube',
    name: 'Cube (Default)',
    points: [
      { id: 'p0', label: 'A', x: -1, y: -1, z: -1 },
      { id: 'p1', label: 'B', x: 1, y: -1, z: -1 },
      { id: 'p2', label: 'C', x: 1, y: 1, z: -1 },
      { id: 'p3', label: 'D', x: -1, y: 1, z: -1 },
      { id: 'p4', label: 'E', x: -1, y: -1, z: 1 },
      { id: 'p5', label: 'F', x: 1, y: -1, z: 1 },
      { id: 'p6', label: 'G', x: 1, y: 1, z: 1 },
      { id: 'p7', label: 'H', x: -1, y: 1, z: 1 },
    ],
    edges: [
      // Bottom face
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Top face
      [4, 5], [5, 6], [6, 7], [7, 4],
      // Vertical pillars
      [0, 4], [1, 5], [2, 6], [3, 7],
    ],
    faces: [
      [0, 1, 2, 3], // back
      [4, 5, 6, 7], // front
      [0, 1, 5, 4], // bottom
      [2, 3, 7, 6], // top
      [0, 3, 7, 4], // left
      [1, 2, 6, 5], // right
    ],
    color: '#3b82f6',
  },
  {
    id: 'rectangular-prism',
    name: 'Rectangular Prism',
    points: [
      { id: 'p0', label: 'A', x: -2, y: -1, z: -0.8 },
      { id: 'p1', label: 'B', x: 2, y: -1, z: -0.8 },
      { id: 'p2', label: 'C', x: 2, y: 1, z: -0.8 },
      { id: 'p3', label: 'D', x: -2, y: 1, z: -0.8 },
      { id: 'p4', label: 'E', x: -2, y: -1, z: 0.8 },
      { id: 'p5', label: 'F', x: 2, y: -1, z: 0.8 },
      { id: 'p6', label: 'G', x: 2, y: 1, z: 0.8 },
      { id: 'p7', label: 'H', x: -2, y: 1, z: 0.8 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ],
    faces: [
      [0, 1, 2, 3], [4, 5, 6, 7],
      [0, 1, 5, 4], [2, 3, 7, 6],
      [0, 3, 7, 4], [1, 2, 6, 5],
    ],
    color: '#3b82f6',
  },
  {
    id: 'pyramid',
    name: 'Square Pyramid',
    points: [
      { id: 'p0', label: 'A', x: -1, y: -1, z: -1 },
      { id: 'p1', label: 'B', x: 1, y: -1, z: -1 },
      { id: 'p2', label: 'C', x: 1, y: -1, z: 1 },
      { id: 'p3', label: 'D', x: -1, y: -1, z: 1 },
      { id: 'p4', label: 'Apex', x: 0, y: 1.5, z: 0 },
    ],
    edges: [
      // Base
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Sides to apex
      [0, 4], [1, 4], [2, 4], [3, 4],
    ],
    faces: [
      [0, 1, 2, 3], // base
      [0, 1, 4],    // front
      [1, 2, 4],    // right
      [2, 3, 4],    // back
      [3, 0, 4],    // left
    ],
    color: '#3b82f6',
  },
  {
    id: 'line3d',
    name: '3D Line',
    points: [
      { id: 'p0', label: 'A', x: -1.5, y: -1, z: -1 },
      { id: 'p1', label: 'B', x: 1.5, y: 1.5, z: 1.2 },
    ],
    edges: [
      [0, 1],
    ],
    color: '#3b82f6',
  },
  {
    id: 'point3d',
    name: '3D Point',
    points: [
      { id: 'p0', label: 'A', x: 1.5, y: 1.5, z: 1.5 },
    ],
    edges: [],
    color: '#3b82f6',
  },
];
