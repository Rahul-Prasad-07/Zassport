// VK alpha from circuit
const vk_x = '0abae31a56d09a4b15e5ad8b913bf5f72a0ce81e0ba18323850ebfb545cfc73e';
const vk_y = '05a15229b9c45b6acb3eb01728fbb87867660c6c8a3732e910172a28398c151f';

// VK alpha from Rust
const rust_vk = [
  10, 186, 227, 26, 86, 208, 154, 75, 21, 229, 173, 139, 145, 59, 245, 247,
  42, 12, 232, 30, 11, 161, 131, 35, 133, 14, 191, 181, 69, 207, 199, 62,
  5, 161, 82, 41, 185, 196, 91, 106, 203, 62, 176, 23, 40, 251, 184, 120,
  103, 102, 12, 108, 138, 55, 50, 233, 16, 23, 42, 40, 57, 140, 21, 31
];

const expected = Buffer.from(vk_x + vk_y, 'hex');
const actual = Buffer.from(rust_vk);

console.log('VK Match:', expected.equals(actual) ? '✓ YES' : '✗ NO');
if (!expected.equals(actual)) {
  console.log('Expected:', expected.toString('hex'));
  console.log('Actual:  ', actual.toString('hex'));
}

// Public inputs from circuit
const expectedInputs = [
  '2e24ebb11a20259b9a88e7996f614a107397f5737cdb4c42dd74aad009b19ce4',
  '0fa7f510ca32c2453413c550a163c74e88abaa9a5711c27f2b8f87bded378df8',
  '0000000000000000000000000000000000000000000000000000000065920080',
  '0000000000000000000000000000000000000000000000000000000000000015',
  '0000000000000000000000000000000000000000000000000000000000000041'
];

// Public inputs from Rust
const rust_inputs = [
  [46, 36, 235, 177, 26, 32, 37, 155, 154, 136, 231, 153, 111, 97, 74, 16, 115, 151, 245, 115, 124, 219, 76, 66, 221, 116, 170, 208, 9, 177, 156, 228],
  [15, 167, 245, 16, 202, 50, 194, 69, 52, 19, 197, 80, 161, 99, 199, 78, 136, 171, 170, 154, 87, 17, 194, 127, 43, 143, 135, 189, 237, 55, 141, 248],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 101, 146, 0, 128],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65]
];

console.log('\n=== Public Inputs ===');
let allMatch = true;
expectedInputs.forEach((exp, i) => {
  const expBuf = Buffer.from(exp, 'hex');
  const actBuf = Buffer.from(rust_inputs[i]);
  const match = expBuf.equals(actBuf);
  console.log(`Input[${i}]: ${match ? '✓' : '✗'}`);
  if (!match) {
    console.log('  Expected:', exp);
    console.log('  Actual:  ', actBuf.toString('hex'));
    allMatch = false;
  }
});

console.log('\nAll Public Inputs Match:', allMatch ? '✓ YES' : '✗ NO');
