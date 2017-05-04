const gd = require('node-gd')
const chroma = require('chroma-js')
const burntOrange = '#892513'
const orangeBrown = '#AC4315'
const yellowOrange = '#F0BB64'
const lightTeal = '#EFFCFD'
const deepBlue = '#0C277E'
const deepOcean = '#001B5B'
const lightBlue = '#B7D7F0'
const chocolate = '#D2691E'
const gold = '#F8DC57'
const black = 'black'
const white = 'white'
//const colors = [deepBlue,gold,burntOrange,gold,deepBlue]
//const C_SCALE = chroma.scale('Spectral').domain([1,0])
//const C_SCALE = chroma.bezier(colors);
//const C_SCALE = chroma.scale(colors.reverse())
const colors = [chocolate,yellowOrange,lightTeal,deepOcean]
const C_SCALE = chroma.scale(colors.reverse())
let pi2 = 2 * Math.PI
// const CANVAS_HEIGHT = 10 * 36
// const CANVAS_WIDTH = 10 * 24
const CANVAS_HEIGHT = 72 * 2 * 36
const CANVAS_WIDTH = 72 * 2 * 24
const MAX_ITERS = 1500
const TOTAL_PX = CANVAS_WIDTH * CANVAS_HEIGHT
const RATIO = CANVAS_HEIGHT / CANVAS_WIDTH
const ln = Math.log
const floor = Math.floor
const ln2 = ln(2)
const juliaA = -0.8
const juliaB = 0.156
// let CENTER = [0,0]
// let ZOOM = 2

// fish
// let ZOOM = 0.0008523688595400003
// let CENTER = [0.36330877028148983, -0.31721691316595024]

// Portal
// let ZOOM = 0.00009282296880390604
// let CENTER = [-0.7527003524317856, -0.04307864384625851]

// Desert Oasis
// let ZOOM = 0.000010108421302745368
// let CENTER = [-0.7527583370839379, -0.0430666696832828]

// Hook
let ZOOM = 0.0025829359380000008
let CENTER = [0.2872320833755557, -0.012069614516666667]

// lightning
// let ZOOM = 0.007827078600000002
// let CENTER = [-0.8636861242222222, -0.2732245544444446]

// swirls around mini mandle
// let ZOOM = 0.000055864611
// let CENTER = [-0.7436429465554844, -0.13182541971477443]

function loopMandle(c) {
  let x0 = c[0]
  let y0 = c[1]
  let x = x0
  let y = y0
  let iteration = 0
  while (x * x + y * y < (1 << 16) && iteration < MAX_ITERS) {
    let xtemp = x * x - y * y + x0
    y = 2 * x * y + y0
    // let xtemp = x * x - y * y + juliaA
    // y = 2 * x * y + juliaB
    x = xtemp
    iteration += 1
  }

  if (iteration < MAX_ITERS) {
    const log_zn = ln(x * x + y * y) / 2
    const nu = ln(log_zn / ln2) / ln2
    iteration = iteration + 1 - nu
  }
  return iteration
}

function buildMandleData(width, height, center, zoom) {
  let mData = []
  let histo = []
  let counter = 0

  for (let i = 0; i < MAX_ITERS; i++) {
    histo.push(0)
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [a, b] = toComplexAtCenterAndZoom(x,y, width, height, center, zoom)
      const loops = loopMandle([a, b])
      if (counter % 1000 === 0) console.log('Index', counter)
      histo[floor(loops)] += 1
      mData.push(loops)
      counter += 1
    }
  }
  return [mData, histo]
}

function histoTheData(temps, histo) {
  let palette = []
  let hues = []
  palette[0] = histo[0] / TOTAL_PX
  for (let i = 1; i < MAX_ITERS; i++) {
    palette[i] = palette[i - 1] + histo[i] / TOTAL_PX
  }
  for (let i = 0; i < temps.length; i++) {
    const t = temps[i]
    const h1 = palette[floor(t)]
    const h2 = palette[floor(t) + 1]
    hues[i] = lerp(h1, h2, t % 1)
  }
  return hues
}

function draw() {
  const [temps, histo] = buildMandleData(CANVAS_WIDTH, CANVAS_HEIGHT, CENTER, ZOOM)
  const histoedData = histoTheData(temps, histo)

  gd.createTrueColor(CANVAS_WIDTH, CANVAS_HEIGHT, function(error, image) {
    if (error) throw error;
    for (let i = 0; i < histoedData.length; i ++) {
      const iters = temps[i]
      const temp = histoedData[i]
      let rgb = C_SCALE(temp).rgb()
      if (iters === MAX_ITERS) rgb = [0, 0, 0]
      const col = i % CANVAS_WIDTH
      const row = Math.floor(i / CANVAS_WIDTH)
      image.setPixel(col, row, gd.trueColor(rgb[0], rgb[1],rgb[2]))
    }

    image.savePng('./test.png', 0, function(error) {
      if (error) throw error;
      image.destroy();
    })
  });
}

function toComplexAtCenterAndZoom(x,y,w,h,center,zoom) {
  let top = center[1] - (zoom * RATIO)
  let bottom = center[1] + (zoom * RATIO)
  let left = center[0] - zoom
  let right = center[0] + zoom
  const a = numberMap(x, 0, w, left, right)
  const b = numberMap(y, 0, h, top, bottom)
  return [a,b]
}

function hslToRgb(h, s, l) {
  var r, g, b

  if (s == 0) {
    r = g = b = l // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s
    var p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function lerp(a, b, f) {
  return a * (1.0 - f) + b * f
}

function numberMap(i, min, max, smin, smax) {
  const p = (i + min) / max
  const sDist = smax - smin
  return p * sDist + smin
}

draw()
