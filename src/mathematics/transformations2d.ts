import { Matrix } from '../types';
import { cleanNumber } from './matrix';

export function createScalingMatrix2D(sx: number, sy: number, homogeneous: boolean = false): Matrix {
  if (homogeneous) {
    return [
      [cleanNumber(sx), 0, 0],
      [0, cleanNumber(sy), 0],
      [0, 0, 1],
    ];
  }
  return [
    [cleanNumber(sx), 0],
    [0, cleanNumber(sy)],
  ];
}

export function createRotationMatrix2D(degrees: number, homogeneous: boolean = false): Matrix {
  // Normalize angle to [0, 360)
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  
  // Exact values for common multiples of 90 degrees
  let cosVal: number;
  let sinVal: number;

  if (normalizedDegrees === 0) {
    cosVal = 1;
    sinVal = 0;
  } else if (normalizedDegrees === 90) {
    cosVal = 0;
    sinVal = 1;
  } else if (normalizedDegrees === 180) {
    cosVal = -1;
    sinVal = 0;
  } else if (normalizedDegrees === 270) {
    cosVal = 0;
    sinVal = -1;
  } else if (normalizedDegrees === 45) {
    cosVal = Math.SQRT1_2;
    sinVal = Math.SQRT1_2;
  } else if (normalizedDegrees === 135) {
    cosVal = -Math.SQRT1_2;
    sinVal = Math.SQRT1_2;
  } else if (normalizedDegrees === 225) {
    cosVal = -Math.SQRT1_2;
    sinVal = -Math.SQRT1_2;
  } else if (normalizedDegrees === 315) {
    cosVal = Math.SQRT1_2;
    sinVal = -Math.SQRT1_2;
  } else {
    const rad = (degrees * Math.PI) / 180;
    cosVal = Math.cos(rad);
    sinVal = Math.sin(rad);
  }

  cosVal = cleanNumber(cosVal);
  sinVal = cleanNumber(sinVal);

  if (homogeneous) {
    return [
      [cosVal, -sinVal, 0],
      [sinVal, cosVal, 0],
      [0, 0, 1],
    ];
  }

  return [
    [cosVal, -sinVal],
    [sinVal, cosVal],
  ];
}

export type ReflectionType2D = 'x-axis' | 'y-axis' | 'origin' | 'line-y-x';

export function createReflectionMatrix2D(type: ReflectionType2D, homogeneous: boolean = false): Matrix {
  let m2x2: Matrix;

  switch (type) {
    case 'x-axis':
      m2x2 = [
        [1, 0],
        [0, -1],
      ];
      break;
    case 'y-axis':
      m2x2 = [
        [-1, 0],
        [0, 1],
      ];
      break;
    case 'origin':
      m2x2 = [
        [-1, 0],
        [0, -1],
      ];
      break;
    case 'line-y-x':
      m2x2 = [
        [0, 1],
        [1, 0],
      ];
      break;
  }

  if (homogeneous) {
    return [
      [m2x2[0][0], m2x2[0][1], 0],
      [m2x2[1][0], m2x2[1][1], 0],
      [0, 0, 1],
    ];
  }

  return m2x2;
}

export function createShearMatrix2D(kx: number, ky: number, homogeneous: boolean = false): Matrix {
  const cleanKx = cleanNumber(kx);
  const cleanKy = cleanNumber(ky);

  if (homogeneous) {
    return [
      [1, cleanKx, 0],
      [cleanKy, 1, 0],
      [0, 0, 1],
    ];
  }

  return [
    [1, cleanKx],
    [cleanKy, 1],
  ];
}

export function createTranslationMatrix2D(tx: number, ty: number): Matrix {
  return [
    [1, 0, cleanNumber(tx)],
    [0, 1, cleanNumber(ty)],
    [0, 0, 1],
  ];
}

export function toHomogeneous2D(m2x2: Matrix): Matrix {
  if (m2x2.length === 3 && m2x2[0].length === 3) return m2x2;
  return [
    [m2x2[0][0], m2x2[0][1], 0],
    [m2x2[1][0], m2x2[1][1], 0],
    [0, 0, 1],
  ];
}
