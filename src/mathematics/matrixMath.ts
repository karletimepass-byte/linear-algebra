// ============================================================
// CORE MATHEMATICAL ENGINE
// Convention: Column vectors → P' = T·P
// ============================================================

export type Matrix = number[][];
export type Vector = number[];

// ---- Basic utilities ----

export function round(x: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(x * factor) / factor;
}

export function cleanNum(x: number, decimals = 4): number {
  const r = round(x, decimals);
  if (Math.abs(r) < 1e-10) return 0;
  return r;
}

export function formatNum(x: number, decimals = 4): string {
  const c = cleanNum(x, decimals);
  if (Number.isInteger(c)) return c.toString();
  const s = c.toFixed(Math.min(decimals, 4));
  return s.replace(/\.?0+$/, '');
}

// ---- Matrix creation ----

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export function zeros(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

// ---- Matrix operations ----

export function matMul(A: Matrix, B: Matrix): Matrix {
  const rowsA = A.length, colsA = A[0].length;
  const rowsB = B.length, colsB = B[0].length;
  if (colsA !== rowsB) throw new Error(
    `Dimension mismatch: (${rowsA}×${colsA}) · (${rowsB}×${colsB}). Columns of first matrix (${colsA}) must equal rows of second matrix (${rowsB}).`
  );
  const C = zeros(rowsA, colsB);
  for (let i = 0; i < rowsA; i++)
    for (let j = 0; j < colsB; j++)
      for (let k = 0; k < colsA; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C.map(row => row.map(v => cleanNum(v)));
}

export function matAdd(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0].length !== B[0].length)
    throw new Error('Matrix dimensions must match for addition.');
  return A.map((row, i) => row.map((v, j) => cleanNum(v + B[i][j])));
}

export function matSub(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0].length !== B[0].length)
    throw new Error('Matrix dimensions must match for subtraction.');
  return A.map((row, i) => row.map((v, j) => cleanNum(v - B[i][j])));
}

export function scalarMul(A: Matrix, s: number): Matrix {
  return A.map(row => row.map(v => cleanNum(v * s)));
}

export function transpose(A: Matrix): Matrix {
  return A[0].map((_, j) => A.map(row => row[j]));
}

export function matVecMul(A: Matrix, v: Vector): Vector {
  if (A[0].length !== v.length) throw new Error(
    `Dimension mismatch: matrix has ${A[0].length} columns but vector has ${v.length} elements.`
  );
  return A.map(row => cleanNum(row.reduce((s, a, k) => s + a * v[k], 0)));
}

// ---- Determinant ----

export function det(A: Matrix): number {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return cleanNum(A[0][0] * A[1][1] - A[0][1] * A[1][0]);
  if (n === 3) {
    const [a, b, c] = A[0], [d, e, f] = A[1], [g, h, i] = A[2];
    return cleanNum(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g));
  }
  // General: cofactor expansion
  let sum = 0;
  for (let j = 0; j < n; j++) {
    const minor = A.slice(1).map(row => row.filter((_, k) => k !== j));
    sum += A[0][j] * Math.pow(-1, j) * det(minor);
  }
  return cleanNum(sum);
}

// ---- Inverse ----

export function inverse(A: Matrix): Matrix {
  const n = A.length;
  if (A[0].length !== n) throw new Error('Matrix must be square to find the inverse.');
  const d = det(A);
  if (Math.abs(d) < 1e-10) throw new Error('Matrix is singular (determinant = 0). The inverse does not exist.');

  if (n === 2) {
    const [[a, b], [c, dd]] = A;
    return [
      [cleanNum(dd / d), cleanNum(-b / d)],
      [cleanNum(-c / d), cleanNum(a / d)],
    ];
  }

  // General: augmented matrix → row reduction
  const aug: number[][] = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n).map(v => cleanNum(v)));
}

// ============================================================
// 2D TRANSFORMATION MATRICES
// All produce column-major matrices: P' = T·P
// ============================================================

export function scaling2D(sx: number, sy: number): Matrix {
  return [[sx, 0], [0, sy]];
}

export function rotation2D(angleDeg: number): Matrix {
  const rad = (angleDeg * Math.PI) / 180;
  return [
    [cleanNum(Math.cos(rad)), cleanNum(-Math.sin(rad))],
    [cleanNum(Math.sin(rad)),  cleanNum(Math.cos(rad))],
  ];
}

export function reflectionX(): Matrix  { return [[1, 0], [0, -1]]; }
export function reflectionY(): Matrix  { return [[-1, 0], [0, 1]]; }
export function reflectionOrigin(): Matrix { return [[-1, 0], [0, -1]]; }
export function reflectionYeqX(): Matrix   { return [[0, 1], [1, 0]]; }
export function reflectionYeqNegX(): Matrix { return [[0, -1], [-1, 0]]; }

export function shearX2D(k: number): Matrix { return [[1, k], [0, 1]]; }
export function shearY2D(k: number): Matrix { return [[1, 0], [k, 1]]; }

// Homogeneous for 2D translation
export function translation2D(tx: number, ty: number): Matrix {
  return [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
}

export function toHomogeneous2D(pts: Matrix): Matrix {
  return [...pts, Array(pts[0].length).fill(1)];
}
export function fromHomogeneous2D(pts: Matrix): Matrix {
  return pts.slice(0, 2);
}

// ============================================================
// 3D TRANSFORMATION MATRICES
// ============================================================

export function scaling3D(sx: number, sy: number, sz: number): Matrix {
  return [[sx, 0, 0], [0, sy, 0], [0, 0, sz]];
}

export function rotationX3D(angleDeg: number): Matrix {
  const r = (angleDeg * Math.PI) / 180;
  return [
    [1, 0, 0],
    [0, cleanNum(Math.cos(r)), cleanNum(-Math.sin(r))],
    [0, cleanNum(Math.sin(r)),  cleanNum(Math.cos(r))],
  ];
}

export function rotationY3D(angleDeg: number): Matrix {
  const r = (angleDeg * Math.PI) / 180;
  return [
    [ cleanNum(Math.cos(r)), 0, cleanNum(Math.sin(r))],
    [0, 1, 0],
    [cleanNum(-Math.sin(r)), 0, cleanNum(Math.cos(r))],
  ];
}

export function rotationZ3D(angleDeg: number): Matrix {
  const r = (angleDeg * Math.PI) / 180;
  return [
    [cleanNum(Math.cos(r)), cleanNum(-Math.sin(r)), 0],
    [cleanNum(Math.sin(r)),  cleanNum(Math.cos(r)), 0],
    [0, 0, 1],
  ];
}

export function translation3D(tx: number, ty: number, tz: number): Matrix {
  return [
    [1, 0, 0, tx],
    [0, 1, 0, ty],
    [0, 0, 1, tz],
    [0, 0, 0, 1],
  ];
}

export function reflectionXY(): Matrix { return [[1, 0, 0], [0, 1, 0], [0, 0, -1]]; }
export function reflectionXZ(): Matrix { return [[1, 0, 0], [0, -1, 0], [0, 0, 1]]; }
export function reflectionYZ(): Matrix { return [[-1, 0, 0], [0, 1, 0], [0, 0, 1]]; }

export function shear3DXY(a: number, b: number): Matrix {
  return [[1, 0, a], [0, 1, b], [0, 0, 1]];
}

// ============================================================
// APPLY TRANSFORMATION TO OBJECT POINTS
// Points stored as columns: P[i] = column i = (x, y) or (x, y, z)
// ============================================================

export function applyTransform2D(T: Matrix, pts: Matrix): { result: Matrix; isHomogeneous: boolean } {
  const rows = T.length;
  const cols = T[0].length;
  const ptRows = pts.length;

  if (rows === 3 && cols === 3 && ptRows === 2) {
    // Homogeneous translation
    const homoPts = toHomogeneous2D(pts);
    const result = matMul(T, homoPts);
    return { result: fromHomogeneous2D(result), isHomogeneous: true };
  }

  if (cols !== ptRows) throw new Error(
    `Cannot multiply: transformation is ${rows}×${cols} but point matrix has ${ptRows} rows.`
  );
  return { result: matMul(T, pts), isHomogeneous: false };
}

export function applyTransform3D(T: Matrix, pts: Matrix): Matrix {
  const rows = T.length;
  const cols = T[0].length;
  const ptRows = pts.length;

  if (rows === 4 && cols === 4 && ptRows === 3) {
    // Homogeneous 3D
    const homoPts = [...pts, Array(pts[0].length).fill(1)];
    const result = matMul(T, homoPts);
    return result.slice(0, 3);
  }
  return matMul(T, pts);
}

// ============================================================
// GENERATE STEP-BY-STEP MULTIPLICATION EXPLANATION
// ============================================================

export interface CalcStep {
  label: string;
  matrix: Matrix;
}

export function generateMultiplicationSteps(T: Matrix, P: Matrix): {
  steps: CalcStep[];
  result: Matrix;
  pointResults: { index: number; col: Vector; transformed: Vector }[];
} {
  const result = matMul(T, P);
  const pointResults = P[0].map((_, j) => ({
    index: j,
    col: P.map(row => row[j]),
    transformed: result.map(row => row[j]),
  }));

  return {
    steps: [
      { label: 'Transformation Matrix T', matrix: T },
      { label: 'Coordinate Matrix P', matrix: P },
      { label: "Result P' = T·P", matrix: result },
    ],
    result,
    pointResults,
  };
}
