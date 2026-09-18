import { Matrix } from '../types';
import { cleanNumber } from './matrix';

export function createScalingMatrix3D(sx: number, sy: number, sz: number, homogeneous: boolean = false): Matrix {
  const cleanSx = cleanNumber(sx);
  const cleanSy = cleanNumber(sy);
  const cleanSz = cleanNumber(sz);

  if (homogeneous) {
    return [
      [cleanSx, 0, 0, 0],
      [0, cleanSy, 0, 0],
      [0, 0, cleanSz, 0],
      [0, 0, 0, 1],
    ];
  }

  return [
    [cleanSx, 0, 0],
    [0, cleanSy, 0],
    [0, 0, cleanSz],
  ];
}

function getExactTrig(degrees: number) {
  const normalized = ((degrees % 360) + 360) % 360;
  let cosVal: number;
  let sinVal: number;

  if (normalized === 0) {
    cosVal = 1;
    sinVal = 0;
  } else if (normalized === 90) {
    cosVal = 0;
    sinVal = 1;
  } else if (normalized === 180) {
    cosVal = -1;
    sinVal = 0;
  } else if (normalized === 270) {
    cosVal = 0;
    sinVal = -1;
  } else {
    const rad = (degrees * Math.PI) / 180;
    cosVal = Math.cos(rad);
    sinVal = Math.sin(rad);
  }

  return {
    cos: cleanNumber(cosVal),
    sin: cleanNumber(sinVal),
  };
}

export function createRotationXMatrix3D(degrees: number, homogeneous: boolean = false): Matrix {
  const { cos, sin } = getExactTrig(degrees);

  if (homogeneous) {
    return [
      [1, 0, 0, 0],
      [0, cos, -sin, 0],
      [0, sin, cos, 0],
      [0, 0, 0, 1],
    ];
  }

  return [
    [1, 0, 0],
    [0, cos, -sin],
    [0, sin, cos],
  ];
}

export function createRotationYMatrix3D(degrees: number, homogeneous: boolean = false): Matrix {
  const { cos, sin } = getExactTrig(degrees);

  if (homogeneous) {
    return [
      [cos, 0, sin, 0],
      [0, 1, 0, 0],
      [-sin, 0, cos, 0],
      [0, 0, 0, 1],
    ];
  }

  return [
    [cos, 0, sin],
    [0, 1, 0],
    [-sin, 0, cos],
  ];
}

export function createRotationZMatrix3D(degrees: number, homogeneous: boolean = false): Matrix {
  const { cos, sin } = getExactTrig(degrees);

  if (homogeneous) {
    return [
      [cos, -sin, 0, 0],
      [sin, cos, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  return [
    [cos, -sin, 0],
    [sin, cos, 0],
    [0, 0, 1],
  ];
}

export type ReflectionPlane3D = 'xy-plane' | 'xz-plane' | 'yz-plane' | 'origin';

export function createReflectionMatrix3D(plane: ReflectionPlane3D, homogeneous: boolean = false): Matrix {
  let m3x3: Matrix;

  switch (plane) {
    case 'xy-plane': // Inverts z
      m3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, -1],
      ];
      break;
    case 'xz-plane': // Inverts y
      m3x3 = [
        [1, 0, 0],
        [0, -1, 0],
        [0, 0, 1],
      ];
      break;
    case 'yz-plane': // Inverts x
      m3x3 = [
        [-1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      break;
    case 'origin':
      m3x3 = [
        [-1, 0, 0],
        [0, -1, 0],
        [0, 0, -1],
      ];
      break;
  }

  if (homogeneous) {
    return [
      [...m3x3[0], 0],
      [...m3x3[1], 0],
      [...m3x3[2], 0],
      [0, 0, 0, 1],
    ];
  }

  return m3x3;
}

export type ShearAxis3D = 'xy' | 'xz' | 'yx' | 'yz' | 'zx' | 'zy';

export function createShearMatrix3D(axis: ShearAxis3D, amount: number, homogeneous: boolean = false): Matrix {
  const k = cleanNumber(amount);
  const I: Matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  if (axis === 'xy') I[0][1] = k; // x sheared by y
  if (axis === 'xz') I[0][2] = k; // x sheared by z
  if (axis === 'yx') I[1][0] = k; // y sheared by x
  if (axis === 'yz') I[1][2] = k; // y sheared by z
  if (axis === 'zx') I[2][0] = k; // z sheared by x
  if (axis === 'zy') I[2][1] = k; // z sheared by y

  if (homogeneous) {
    return [
      [...I[0], 0],
      [...I[1], 0],
      [...I[2], 0],
      [0, 0, 0, 1],
    ];
  }

  return I;
}

export function createTranslationMatrix3D(tx: number, ty: number, tz: number): Matrix {
  return [
    [1, 0, 0, cleanNumber(tx)],
    [0, 1, 0, cleanNumber(ty)],
    [0, 0, 1, cleanNumber(tz)],
    [0, 0, 0, 1],
  ];
}

export function toHomogeneous3D(m3x3: Matrix): Matrix {
  if (m3x3.length === 4 && m3x3[0].length === 4) return m3x3;
  return [
    [...m3x3[0], 0],
    [...m3x3[1], 0],
    [...m3x3[2], 0],
    [0, 0, 0, 1],
  ];
}
