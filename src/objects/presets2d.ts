import { Shape2D } from '../types';

export const PRESET_SHAPES_2D: Shape2D[] = [
  {
    id: 'triangle',
    name: 'Triangle (Default)',
    points: [
      { id: 'p0', label: 'A', x: 1, y: 1 },
      { id: 'p1', label: 'B', x: 4, y: 1 },
      { id: 'p2', label: 'C', x: 2, y: 3 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    isClosed: true,
    color: '#3b82f6',
    fill: true,
  },
  {
    id: 'point',
    name: 'Single Point',
    points: [
      { id: 'p0', label: 'A', x: 2, y: 3 },
    ],
    edges: [],
    isClosed: false,
    color: '#3b82f6',
    fill: false,
  },
  {
    id: 'line',
    name: 'Line Segment',
    points: [
      { id: 'p0', label: 'A', x: 1, y: 1 },
      { id: 'p1', label: 'B', x: 4, y: 3 },
    ],
    edges: [
      [0, 1],
    ],
    isClosed: false,
    color: '#3b82f6',
    fill: false,
  },
  {
    id: 'square',
    name: 'Square',
    points: [
      { id: 'p0', label: 'A', x: 1, y: 1 },
      { id: 'p1', label: 'B', x: 3, y: 1 },
      { id: 'p2', label: 'C', x: 3, y: 3 },
      { id: 'p3', label: 'D', x: 1, y: 3 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    isClosed: true,
    color: '#3b82f6',
    fill: true,
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    points: [
      { id: 'p0', label: 'A', x: 1, y: 1 },
      { id: 'p1', label: 'B', x: 5, y: 1 },
      { id: 'p2', label: 'C', x: 5, y: 3 },
      { id: 'p3', label: 'D', x: 1, y: 3 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    isClosed: true,
    color: '#3b82f6',
    fill: true,
  },
  {
    id: 'house',
    name: 'House Structure',
    points: [
      { id: 'p0', label: 'A', x: 1, y: 0 },
      { id: 'p1', label: 'B', x: 5, y: 0 },
      { id: 'p2', label: 'C', x: 5, y: 3 },
      { id: 'p3', label: 'D', x: 3, y: 5 }, // Roof peak
      { id: 'p4', label: 'E', x: 1, y: 3 },
      // Door
      { id: 'p5', label: 'F', x: 2.5, y: 0 },
      { id: 'p6', label: 'G', x: 3.5, y: 0 },
      { id: 'p7', label: 'H', x: 3.5, y: 1.8 },
      { id: 'p8', label: 'I', x: 2.5, y: 1.8 },
    ],
    edges: [
      // Outer walls & roof
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      // Ceiling divider
      [4, 2],
      // Door outline
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 5],
    ],
    isClosed: false,
    color: '#3b82f6',
    fill: false,
  },
  {
    id: 'star',
    name: '5-Point Star',
    points: [
      { id: 'p0', label: 'A', x: 0, y: 3 },
      { id: 'p1', label: 'B', x: 0.8, y: 1.2 },
      { id: 'p2', label: 'C', x: 2.8, y: 1.0 },
      { id: 'p3', label: 'D', x: 1.3, y: -0.3 },
      { id: 'p4', label: 'E', x: 1.8, y: -2.2 },
      { id: 'p5', label: 'F', x: 0, y: -1.0 },
      { id: 'p6', label: 'G', x: -1.8, y: -2.2 },
      { id: 'p7', label: 'H', x: -1.3, y: -0.3 },
      { id: 'p8', label: 'I', x: -2.8, y: 1.0 },
      { id: 'p9', label: 'J', x: -0.8, y: 1.2 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [5, 6], [6, 7], [7, 8], [8, 9], [9, 0],
    ],
    isClosed: true,
    color: '#3b82f6',
    fill: true,
  },
];
