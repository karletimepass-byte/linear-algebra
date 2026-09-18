import { Matrix, Point2D, Point3D, StepCalculationDetail } from '../types';

/**
 * Rounds a number to avoid floating-point inaccuracies like 6.123233995736766e-17.
 * Cleans up negative zeros and nearly-integer values.
 */
export function cleanNumber(num: number, precision: number = 4): number {
  if (Math.abs(num) < 1e-10) {
    return 0;
  }
  const rounded = Number(num.toFixed(precision));
  // Avoid -0
  if (Object.is(rounded, -0) || Math.abs(rounded) < 1e-10) {
    return 0;
  }
  return rounded;
}

export function formatNumber(num: number, precision: number = 4): string {
  const cleaned = cleanNumber(num, precision);
  if (Number.isInteger(cleaned)) {
    return cleaned.toString();
  }
  return cleaned.toFixed(precision).replace(/\.?0+$/, '');
}

export function createMatrix(rows: number, cols: number, defaultValue: number = 0): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(defaultValue));
}

export function cloneMatrix(A: Matrix): Matrix {
  return A.map(row => [...row]);
}

export function matrixDimensions(A: Matrix): { rows: number; cols: number } {
  if (!A || A.length === 0) return { rows: 0, cols: 0 };
  return { rows: A.length, cols: A[0].length };
}

/**
 * Standard Matrix Multiplication C = A * B
 * Column vector convention: P' = T * P
 */
export function multiplyMatrices(A: Matrix, B: Matrix): Matrix {
  const { rows: rA, cols: cA } = matrixDimensions(A);
  const { rows: rB, cols: cB } = matrixDimensions(B);

  if (cA !== rB) {
    throw new Error(
      `Matrix multiplication dimension mismatch: Cannot multiply ${rA}×${cA} matrix with ${rB}×${cB} matrix. ` +
      `The number of columns in the first matrix (${cA}) must equal the number of rows in the second matrix (${rB}).`
    );
  }

  const result: Matrix = createMatrix(rA, cB, 0);

  for (let i = 0; i < rA; i++) {
    for (let j = 0; j < cB; j++) {
      let sum = 0;
      for (let k = 0; k < cA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = cleanNumber(sum);
    }
  }

  return result;
}

export function addMatrices(A: Matrix, B: Matrix): Matrix {
  const { rows: rA, cols: cA } = matrixDimensions(A);
  const { rows: rB, cols: cB } = matrixDimensions(B);

  if (rA !== rB || cA !== cB) {
    throw new Error(`Dimension mismatch: Cannot add ${rA}×${cA} matrix and ${rB}×${cB} matrix.`);
  }

  return A.map((row, i) => row.map((val, j) => cleanNumber(val + B[i][j])));
}

export function subtractMatrices(A: Matrix, B: Matrix): Matrix {
  const { rows: rA, cols: cA } = matrixDimensions(A);
  const { rows: rB, cols: cB } = matrixDimensions(B);

  if (rA !== rB || cA !== cB) {
    throw new Error(`Dimension mismatch: Cannot subtract ${rB}×${cB} matrix from ${rA}×${cA} matrix.`);
  }

  return A.map((row, i) => row.map((val, j) => cleanNumber(val - B[i][j])));
}

export function scaleMatrix(A: Matrix, scalar: number): Matrix {
  return A.map(row => row.map(val => cleanNumber(val * scalar)));
}

export function transposeMatrix(A: Matrix): Matrix {
  const { rows, cols } = matrixDimensions(A);
  const result = createMatrix(cols, rows, 0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

/**
 * Calculates determinant of an n x n square matrix (up to 4x4)
 */
export function calculateDeterminant(A: Matrix): number {
  const { rows, cols } = matrixDimensions(A);
  if (rows !== cols) {
    throw new Error(`Determinant is only defined for square matrices. Given matrix is ${rows}×${cols}.`);
  }

  if (rows === 1) {
    return cleanNumber(A[0][0]);
  }

  if (rows === 2) {
    return cleanNumber(A[0][0] * A[1][1] - A[0][1] * A[1][0]);
  }

  if (rows === 3) {
    const det =
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    return cleanNumber(det);
  }

  // Recursive Laplace expansion for 4x4
  let det = 0;
  for (let c = 0; c < cols; c++) {
    const subMatrix = A.slice(1).map(row => row.filter((_, idx) => idx !== c));
    const sign = c % 2 === 0 ? 1 : -1;
    det += sign * A[0][c] * calculateDeterminant(subMatrix);
  }
  return cleanNumber(det);
}

/**
 * Computes inverse of an n x n square matrix
 */
export function calculateInverse(A: Matrix): Matrix {
  const { rows, cols } = matrixDimensions(A);
  if (rows !== cols) {
    throw new Error(`Matrix inverse is only defined for square matrices. Given ${rows}×${cols}.`);
  }

  const det = calculateDeterminant(A);
  if (Math.abs(det) < 1e-10) {
    throw new Error(
      `Matrix is singular (determinant = 0). A non-invertible matrix maps space to a lower dimension and cannot be inverted.`
    );
  }

  if (rows === 2) {
    const inv = [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det],
    ];
    return inv.map(r => r.map(v => cleanNumber(v)));
  }

  if (rows === 3) {
    // Adjugate matrix / det
    const adj: Matrix = createMatrix(3, 3, 0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // Minor formed by removing row i and column j
        const minor = A.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
        const cofactor = ((i + j) % 2 === 0 ? 1 : -1) * (minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0]);
        // Adjugate is the transpose of the cofactor matrix
        adj[j][i] = cofactor;
      }
    }
    return adj.map(row => row.map(val => cleanNumber(val / det)));
  }

  // Gauss-Jordan elimination for general nxn
  const n = rows;
  const augmented: Matrix = A.map((row, i) => {
    const identityRow = Array(n).fill(0);
    identityRow[i] = 1;
    return [...row, ...identityRow];
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    if (Math.abs(augmented[maxRow][i]) < 1e-10) {
      throw new Error(`Matrix is singular and cannot be inverted.`);
    }

    // Swap rows
    const temp = augmented[i];
    augmented[i] = augmented[maxRow];
    augmented[maxRow] = temp;

    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  const result: Matrix = augmented.map(row => row.slice(n).map(val => cleanNumber(val)));
  return result;
}

/**
 * Converts a list of 2D points into a coordinate matrix P
 * COLUMN-VECTOR CONVENTION:
 * P = [ x1 x2 x3 ... ]
 *     [ y1 y2 y3 ... ]
 * Or with homogeneous coordinates:
 * P = [ x1 x2 x3 ... ]
 *     [ y1 y2 y3 ... ]
 *     [ 1  1  1  ... ]
 */
export function pointsToMatrix2D(points: Point2D[], homogeneous: boolean = false): Matrix {
  if (homogeneous) {
    return [
      points.map(p => p.x),
      points.map(p => p.y),
      points.map(() => 1),
    ];
  }
  return [
    points.map(p => p.x),
    points.map(p => p.y),
  ];
}

/**
 * Converts a coordinate matrix back into 2D points
 */
export function matrixToPoints2D(M: Matrix, basePoints: Point2D[], homogeneous: boolean = false): Point2D[] {
  const numPoints = M[0].length;
  const result: Point2D[] = [];

  for (let j = 0; j < numPoints; j++) {
    const original = basePoints[j] || { id: `p${j}`, label: String.fromCharCode(65 + j) };
    let x = M[0][j];
    let y = M[1][j];

    if (homogeneous && M.length >= 3) {
      const w = M[2][j];
      if (Math.abs(w) > 1e-10 && Math.abs(w - 1) > 1e-10) {
        // Perspective divide
        x /= w;
        y /= w;
      }
    }

    result.push({
      id: original.id,
      label: original.label,
      x: cleanNumber(x),
      y: cleanNumber(y),
    });
  }

  return result;
}

/**
 * Converts a list of 3D points into a coordinate matrix P
 */
export function pointsToMatrix3D(points: Point3D[], homogeneous: boolean = false): Matrix {
  if (homogeneous) {
    return [
      points.map(p => p.x),
      points.map(p => p.y),
      points.map(p => p.z),
      points.map(() => 1),
    ];
  }
  return [
    points.map(p => p.x),
    points.map(p => p.y),
    points.map(p => p.z),
  ];
}

export function matrixToPoints3D(M: Matrix, basePoints: Point3D[], homogeneous: boolean = false): Point3D[] {
  const numPoints = M[0].length;
  const result: Point3D[] = [];

  for (let j = 0; j < numPoints; j++) {
    const original = basePoints[j] || { id: `p3d_${j}`, label: String.fromCharCode(65 + j) };
    let x = M[0][j];
    let y = M[1][j];
    let z = M[2][j];

    if (homogeneous && M.length >= 4) {
      const w = M[3][j];
      if (Math.abs(w) > 1e-10 && Math.abs(w - 1) > 1e-10) {
        x /= w;
        y /= w;
        z /= w;
      }
    }

    result.push({
      id: original.id,
      label: original.label,
      x: cleanNumber(x),
      y: cleanNumber(y),
      z: cleanNumber(z),
    });
  }

  return result;
}

/**
 * Generates detailed step-by-step arithmetic for T * v for each column vector v.
 */
export function computeStepCalculationDetails(
  T: Matrix,
  pointsMatrix: Matrix,
  pointLabels: string[]
): StepCalculationDetail[] {
  const { rows: rT, cols: cT } = matrixDimensions(T);
  const numPoints = pointsMatrix[0].length;
  const details: StepCalculationDetail[] = [];

  for (let colIdx = 0; colIdx < numPoints; colIdx++) {
    const originalVec = pointsMatrix.map(row => row[colIdx]);
    const dotProducts = [];
    const transformedCoord: number[] = [];

    for (let r = 0; r < rT; r++) {
      const terms = [];
      let sum = 0;
      for (let c = 0; c < cT; c++) {
        const factor1 = T[r][c];
        const factor2 = originalVec[c];
        const product = cleanNumber(factor1 * factor2);
        terms.push({ factor1, factor2, product });
        sum += product;
      }
      const cleanedSum = cleanNumber(sum);
      dotProducts.push({
        row: r,
        terms,
        sum: cleanedSum,
      });
      transformedCoord.push(cleanedSum);
    }

    details.push({
      pointLabel: pointLabels[colIdx] || `P${colIdx + 1}`,
      originalCoord: originalVec,
      matrix: T,
      dotProducts,
      transformedCoord,
    });
  }

  return details;
}
