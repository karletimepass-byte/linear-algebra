import {
  multiplyMatrices,
  addMatrices,
  subtractMatrices,
  calculateDeterminant,
  calculateInverse,
  cleanNumber,
} from './src/mathematics/matrix';
import {
  createScalingMatrix2D,
  createRotationMatrix2D,
  createReflectionMatrix2D,
  createShearMatrix2D,
  createTranslationMatrix2D,
} from './src/mathematics/transformations2d';
import {
  createRotationYMatrix3D,
} from './src/mathematics/transformations3d';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`PASS: ${message}`);
  }
}

console.log('--- RUNNING MATHEMATICAL ENGINE TESTS ---');

// Test 1: Scaling
// [2 0; 0 2] * [1; 2] = [2; 4]
const S = createScalingMatrix2D(2, 2, false);
const v1 = [[1], [2]];
const r1 = multiplyMatrices(S, v1);
assert(r1[0][0] === 2 && r1[1][0] === 4, 'Scaling [2, 0; 0, 2] * [1; 2] = [2; 4]');

// Test 2: Rotation 90°
// [0 -1; 1 0] * [1; 0] = [0; 1]
const R90 = createRotationMatrix2D(90, false);
const v2 = [[1], [0]];
const r2 = multiplyMatrices(R90, v2);
assert(r2[0][0] === 0 && r2[1][0] === 1, 'Rotation 90° * [1; 0] = [0; 1]');

// Test 3: Reflection across X
// [1 0; 0 -1] * [2; 3] = [2; -3]
const RefX = createReflectionMatrix2D('x-axis', false);
const v3 = [[2], [3]];
const r3 = multiplyMatrices(RefX, v3);
assert(r3[0][0] === 2 && r3[1][0] === -3, 'Reflection across X * [2; 3] = [2; -3]');

// Test 4: Shearing along X (k = 1)
// [1 1; 0 1] * [2; 3] = [5; 3]
const Sh = createShearMatrix2D(1, 0, false);
const v4 = [[2], [3]];
const r4 = multiplyMatrices(Sh, v4);
assert(r4[0][0] === 5 && r4[1][0] === 3, 'Shearing X (k=1) * [2; 3] = [5; 3]');

// Test 5: Homogeneous Translation
// [1 0 3; 0 1 4; 0 0 1] * [2; 1; 1] = [5; 5; 1]
const T = createTranslationMatrix2D(3, 4);
const v5 = [[2], [1], [1]];
const r5 = multiplyMatrices(T, v5);
assert(r5[0][0] === 5 && r5[1][0] === 5 && r5[2][0] === 1, 'Translation (3,4) in homogeneous coords = [5; 5; 1]');

// Test 6: 3D Rotation Y 90°
// [0 0 1; 0 1 0; -1 0 0] * [1; 0; 0] = [0; 0; -1]
const R3D_Y = createRotationYMatrix3D(90, false);
const v6 = [[1], [0], [0]];
const r6 = multiplyMatrices(R3D_Y, v6);
assert(r6[0][0] === 0 && r6[1][0] === 0 && r6[2][0] === -1, '3D Rotation Y 90° * [1; 0; 0] = [0; 0; -1]');

// Test 7: Combined Non-Commutativity AB != BA
const A = createRotationMatrix2D(45, false);
const B = createScalingMatrix2D(2, 0.5, false);
const AB = multiplyMatrices(A, B);
const BA = multiplyMatrices(B, A);
const isNonCommutative = (AB[0][0] !== BA[0][0]) || (AB[0][1] !== BA[0][1]);
assert(isNonCommutative, 'Non-commutativity confirmed: A * B != B * A for Rotation and Non-uniform Scaling');

// Test 8: Determinant and Inverse
const M = [
  [3, 2],
  [1, 4],
];
const detM = calculateDeterminant(M);
assert(detM === 10, 'Determinant of [[3, 2], [1, 4]] is 10');
const invM = calculateInverse(M);
const identityTest = multiplyMatrices(M, invM);
assert(
  Math.abs(identityTest[0][0] - 1) < 1e-6 &&
  Math.abs(identityTest[1][1] - 1) < 1e-6 &&
  Math.abs(identityTest[0][1]) < 1e-6 &&
  Math.abs(identityTest[1][0]) < 1e-6,
  'M * M^-1 = Identity Matrix'
);

console.log('ALL MATHEMATICAL VERIFICATION TESTS PASSED SUCCESSFULLY!');
