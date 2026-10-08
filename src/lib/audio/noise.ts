export function fillWhite(buffer: Float32Array): void {
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] = Math.random() * 2 - 1
  }
}

export function fillPink(buffer: Float32Array): void {
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0

  for (let i = 0; i < buffer.length; i += 1) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
    buffer[i] = pink
  }

  normalizePeak(buffer)
}

export function fillBrown(buffer: Float32Array): void {
  let value = 0

  for (let i = 0; i < buffer.length; i += 1) {
    value = (value + (Math.random() * 2 - 1) * 0.02) / 1.02
    buffer[i] = value
  }

  normalizePeak(buffer)
}

export function fillStereoNoise(
  left: Float32Array,
  right: Float32Array,
  fill: (buffer: Float32Array) => void,
): void {
  if (left.length !== right.length) {
    throw new RangeError('Stereo noise channels must have matching lengths')
  }
  fill(left)
  fill(right)
}

function normalizePeak(buffer: Float32Array): void {
  let peak = 0
  for (const sample of buffer) {
    peak = Math.max(peak, Math.abs(sample))
  }
  if (peak === 0) return

  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] /= peak
  }
}
