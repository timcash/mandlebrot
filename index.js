//const gd = require('node-gd')
//const chroma = require('chroma-js')
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
//const colors = [chocolate,yellowOrange,lightTeal,deepOcean]
//const colors = [deepBlue,gold,burntOrange,gold,deepBlue]
const C_SCALE = chroma.scale('Spectral').domain([1,0])
//const C_SCALE = chroma.bezier(colors);
//const C_SCALE = chroma.scale(colors.reverse())
//const C_SCALE = chroma.scale(colors.reverse())
let pi2 = 2 * Math.PI
// const CANVAS_HEIGHT = 10 * 36
// const CANVAS_WIDTH = 10 * 24
const CANVAS_HEIGHT = 72 * 2 * 36
const CANVAS_WIDTH = 72 * 2 * 24
const MAX_ITERS = 1500

const ln = Math.log
const floor = Math.floor
const ln2 = ln(2)
const juliaA = -0.8
const juliaB = 0.156

// center
// let CENTER = [0,0]
// let ZOOM = 3

// fish
// let ZOOM = 0.0008523688595400003
// let CENTER = [0.36330877028148983, -0.31721691316595024]

//Portal
// let ZOOM = 0.00009282296880390604
// let CENTER = [-0.7527003524317856, -0.04307864384625851]

// Desert Oasis
// let ZOOM = 0.000010108421302745368
// let CENTER = [-0.7527583370839379, -0.0430666696832828]

// Hook
// let ZOOM = 0.0025829359380000008
// let CENTER = [0.2872320833755557, -0.012069614516666667]

// lightning
// let ZOOM = 0.007827078600000002
// let CENTER = [-0.8636861242222222, -0.2732245544444446]

// swirls around mini mandle
// let ZOOM = 0.000055864611
// let CENTER = [-0.7436429465554844, -0.13182541971477443]

// const ZOOM = 0.0000034915381875
// const CENTER = [-0.7436429465554844,-0.13182541971477443]

// const ZOOM = 0.0000020690596666666664
// const CENTER = [-0.7436429465554844,-0.13182452982598443]

//julia set
const ZOOM = 0.000009003668544858957
const CENTER = [-1.7692335805601607,-0.0034126996797283586]

// const ZOOM = 1.6192669975228917e-8
// const CENTER = [-1.769233646731526,-0.0034129183486770616]

// const ZOOM = 4.46205213837408e-8
// const CENTER = [-1.7692336402519278,-0.003412913924479787]

document.addEventListener('contextmenu', event => event.preventDefault());
const WIDTH = 1280
const HEIGHT = Math.floor(WIDTH * 0.75)
makeMandles(WIDTH, HEIGHT)

function makeMandles (width, height) {
  for(let i = 0; i < 1; i++) {
    const canvasElement = document.createElement('canvas')
    canvasElement.id = `canvas${i}`
    document.body.appendChild(canvasElement)
    const canvas = document.getElementById(`canvas${i}`)
    const ctx = canvas.getContext('2d')
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.fillStyle = 'green'
    ctx.fillRect(0, 0, width, height)

    let center = CENTER
    let zoom = ZOOM / Math.pow(2, i)
    const textElement = document.createElement('div')
    textElement.innerHTML = `const ZOOM = ${zoom}</br> const CENTER = [${CENTER}]`
    document.body.appendChild(textElement)
    canvas.onmousedown = e => {

      console.log(`let ZOOM = ${zoom}\nlet CENTER = [${e.layerX}, ${e.layerY}]`)
      const [a,b] = toComplexAtCenterAndZoom(e.layerX, e.layerY, width, height, center, zoom, width / height)
      if(e.button === 0) zoom = zoom * 0.80
      if(e.button === 2) zoom = zoom * 1.33
      center = [a,b]
      console.log(`let ZOOM = ${zoom}\nlet CENTER = [${a}, ${b}]`)
      textElement.innerHTML = `const ZOOM = ${zoom}</br> const CENTER = [${center}]`
      draw(i, ctx, width, height, center, zoom, C_SCALE, MAX_ITERS)
    }
    draw(i, ctx, width, height, center, zoom, C_SCALE, MAX_ITERS)
  }
}

function draw (id, ctx, width, height, center, zoom, colorScale, maxIters) {
  const totalPx = width * height
  const textElement = document.getElementById(`canvas${id}`)
  const [temps, histo] = buildMandleData(width, height, center, zoom, maxIters)
  const histoedData = histoTheData(temps, histo, totalPx, maxIters)
  setMandleImageData(ctx, width, height, temps, histoedData, colorScale, maxIters)
}

function setMandleImageData(ctx, width, height, temps, histoedData, cScale, maxIters) {
  let myImageData = ctx.getImageData(0,0, width, height)
  let data = myImageData.data;
  for (let j = 0; j < histoedData.length; j += 1) {
    const iters = temps[j]
    const temp = histoedData[j]
    let rgb = cScale(temp).rgb()
    if (iters === maxIters) rgb = [0, 0, 0]
    data[j * 4]     = rgb[0];     // red
    data[j * 4 + 1] = rgb[1]; // green
    data[j * 4 + 2] = rgb[2]; // blue
  }
  ctx.putImageData(myImageData, 0, 0);
}

function loopMandle(c, maxIters) {
  let x0 = c[0]
  let y0 = c[1]
  let x = x0
  let y = y0
  let iteration = 0
  while (x * x + y * y < (1 << 16) && iteration < maxIters) {
    let xtemp = x * x - y * y + x0
    y = 2 * x * y + y0
    // let xtemp = x * x - y * y + juliaA
    // y = 2 * x * y + juliaB
    x = xtemp
    iteration += 1
  }

  if (iteration < maxIters) {
    const log_zn = ln(x * x + y * y) / 2
    const nu = ln(log_zn / ln2) / ln2
    iteration = iteration + 1 - nu
  }
  return iteration
}

function buildMandleData(width, height, center, zoom, maxIters) {
  let mData = []
  let histo = []
  let counter = 0
  const ratio = width / height

  for (let i = 0; i < maxIters; i++) {
    histo.push(0)
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [a, b] = toComplexAtCenterAndZoom(x,y, width, height, center, zoom, ratio)
      const loops = loopMandle([a, b], maxIters)
      //if (counter % 1000 === 0) console.log('Index', counter)
      histo[floor(loops)] += 1
      mData.push(loops)
      counter += 1
    }
  }
  return [mData, histo]
}

function histoTheData(temps, histo, totalPx, maxIters) {
  let palette = []
  let hues = []
  palette[0] = histo[0] / totalPx
  for (let i = 1; i < maxIters; i++) {
    palette[i] = palette[i - 1] + histo[i] / totalPx
  }
  for (let i = 0; i < temps.length; i++) {
    const t = temps[i]
    const h1 = palette[floor(t)]
    const h2 = palette[floor(t) + 1]
    hues[i] = lerp(h1, h2, t % 1)
  }
  return hues
}

// window.onmousedown = (e) => {
//   const [a,b] = toComplexAtCenterAndZoom(e.clientX,e.clientY,CANVAS_WIDTH, CANVAS_HEIGHT, CENTER,ZOOM)
//   ZOOM = ZOOM * 0.33
//   CENTER = [a,b]
//   console.log(`let ZOOM = ${ZOOM}\nlet CENTER = [${a}, ${b}]`)
//   draw()
// }

function toComplexAtCenterAndZoom(x,y,w,h,center,zoom, ratio) {
  let top = center[1] - (zoom * ratio)
  let bottom = center[1] + (zoom * ratio)
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
  const oDist = i - min
  const oMaxDist = max - min
  const p = oDist / oMaxDist
  return lerp(smin, smax, p)
}
