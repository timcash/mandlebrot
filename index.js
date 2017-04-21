let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')
ctx.font = '24px sans-serif'
ctx.fillStyle = '#ccc'
let pi2 = 2 * Math.PI
const canvas_size = 1000

function numberMap(i, min, max, smin, smax) {
  const p = (i + min) / max
  const sDist = smax - smin
  return p * sDist + smin
}

function magnitudeSquare(c) {
  return c[0] * c[0] + c[1] * c[1]
}

function mandle(z, c) {
  return complexAdd(complexSquare(z), c)
}

function complexSquare(c) {
  let a = c[0]
  let b = c[1]
  let a2 = a * a - b * b
  let b2 = a * b + a * b
  return [a2, b2]
}

function complexAdd(c1, c2) {
  return [c1[0] + c2[0], c1[1] + c2[1]]
}

function loopMandle(c) {
  let z = [0, 0]
  const max_iter = 255 * 3
  for (let i = 0; i < max_iter; i++) {
    z = mandle(z, c)
    if (magnitudeSquare(z) > 4) return i
  }
  return 0
}

function buildMandleData(size, rmin, rmax) {
  let mData = []
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const a = numberMap(j, 0, size, -0.5, 0)
      const b = numberMap(i, 0, size, 0.5, 1)
      const loops = loopMandle([a, b])
      mData.push(loops)
    }
  }
  return mData
}

function remove255(n) {
  const rest = n - 255
  if (rest <= 0) return [n, 0]
  return [255, rest]
}

function draw() {
  ctx.fillStyle = 'rgb(255,50,255)'
  ctx.fillRect(0, 0, canvas_size, canvas_size)
  let imageData = ctx.getImageData(0, 0, canvas_size, canvas_size)
  const mData = buildMandleData(canvas_size, -2.0, 2.0)
  for (let i = 0; i < imageData.data.length; i += 4) {
    let brightness = mData[i / 4]
    let red = remove255(brightness)
    imageData.data[i] = red[0]
    let green = remove255(red[1])
    imageData.data[i + 1] = green[0]
    let blue = remove255(green[1])
    imageData.data[i + 2] = blue[0]
  }
  ctx.putImageData(imageData, 0, 0)
}

draw()

window.draw = draw
