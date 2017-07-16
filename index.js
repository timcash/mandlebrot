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

let pi2 = 2 * Math.PI
const DPI = 72 * 2
// const CANVAS_HEIGHT = DPI * 36
// const CANVAS_WIDTH = DPI * 24
const CANVAS_HEIGHT = DPI * 9
const CANVAS_WIDTH = DPI * 6
const MAX_ITERS = 10 * 1000
const TOTAL_PX = CANVAS_WIDTH * CANVAS_HEIGHT
const RATIO = CANVAS_HEIGHT / CANVAS_WIDTH
const ln = Math.log
const floor = Math.floor
const ln2 = ln(2)
// const juliaA = -0.4
// const juliaB = 0.6
// let CENTER = [0,0]
// let ZOOM = 0.5

// julia
// const ZOOM = 0.000006204954835888166
const ZOOM = 0.000006202934835887166
const CENTER = [-1.7692336509013211,-0.0034128997612515775]

// fish
// let ZOOM = 0.0008523688595400003
// let CENTER = [0.36330877028148983, -0.31721691316595024]
//
//Portal
// let ZOOM = 0.00009282496880390604
// let CENTER = [-0.7527003524317856, -0.04307864384625851]
//
// Desert Oasis
// let ZOOM = 0.000010108421302745368
// let CENTER = [-0.7527583370839379, -0.0430666696832828]
//
// Hook
// let ZOOM = 0.0025829359380000008
// let CENTER = [0.2872320833755557, -0.012069614516666667]
//
// lightning
// let ZOOM = 0.007827078600000002
// let CENTER = [-0.8636861242222222, -0.2732245544444446]
//
// swirls around mini mandle
// let ZOOM = 0.000055864611
// let CENTER = [-0.7436429465554844, -0.13182541971477443]
//
// mandle center seahorses
// const ZOOM = 1.851751637425243e-8
// const CENTER = [-1.7692336411443383,-0.0034129130320693594]

// long julia forest
// const ZOOM = 6.014888640493153e-11
// const CENTER = [0.35245792654678254,-0.5823515765137375]

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
      if (counter % 100000 === 0) console.log('Index', counter)
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

function makeScale (colors) {
  let position = 0
  let inc = 1
  const cLength = colors.length
  const items = []
  const domains = [
    0,
    0.25,
    0.5,
    0.6,
    0.7,
    0.75,
    0.8,
    0.82,
    0.85,
    0.87,
    0.91,
    0.92,
    0.95,
    0.99,
    1
  ]
  for(let i = 0; i < 14; i++) {
    if(position === cLength -1) {
      inc = -1
    }
    if(position === 0) {
      inc = 1
    }
    items.push(colors[position])
    position += inc
  }
  items.push('black')
  return chroma.scale(items).mode('hsl').domain(domains)
}

function makeScaleCycle (colors) {
  const cLength = colors.length
  const items = []
  const domains = [
    0,
    0.25,
    0.5,
    0.6,
    0.7,
    0.75,
    0.8,
    0.82,
    0.85,
    0.87,
    0.91,
    0.92,
    0.95,
    0.99,
    1
  ]
  for(let i = 0; i < 14; i++) {
    items.push(colors[i % colors.length])
  }
  items.push('black')
  return chroma.scale(items).mode('hsl').domain(domains)
}

async function draw() {
  const lobster = makeScale(['#E24931','#CFB382','#BBE3D8','#8DCFCE','#102A44'])
  const forest = makeScale(['#22766A','#83C047', '#F0F4CA','#C5A14E','#9F2F29'])
  const forest2 = makeScaleCycle(['#22766A','#83C047', '#F0F4CA','#C5A14E','#9F2F29'])
  const fire = makeScale(['white', 'lightyellow', 'yellow', 'red', 'black'])
  const ocean2 = makeScale(['#ffffff','#d4e2d8','#31d4cb','#33afca','#378abf','#3067ac','#264890'])
  const ocean3 = makeScaleCycle(['#ffffff','#d4e2d8','#31d4cb','#33afca','#378abf','#3067ac','#264890'])
  const spectral = makeScale(['#cc0011','#f77105','#ffd600','#e0ff00','#acfe7a','#26e9ff','#007fff'])
  const scales = []
  while(scales.length < 7) {
    scales.push(
      makeRandomScale(
        ['#ffffff','#d4e2d8','#31d4cb','#33afca','#378abf','#3067ac','#264890'],
        randomIntFromInterval(4,15)
      )
    )
  }
  while(scales.length < 14) {
    scales.push(
      makeRandomScale(
        ['#cc0011','#f77105','#ffd600','#e0ff00','#acfe7a','#26e9ff','#007fff'],
        randomIntFromInterval(4,15)
      )
    )
  }

  const [temps, histo] = buildMandleData(CANVAS_WIDTH, CANVAS_HEIGHT, CENTER, ZOOM)
  const histoedData = histoTheData(temps, histo)
  for(let i = 0; i < scales.length; i++)
  {
    const name = `./images/${Date.now()}.png`
    const imageResult = await color(scales[i], temps, histoedData)
    const saveResult = await saveImage(imageResult, name)
    console.log(`${name} saved`)
  }
}

function color(c_scale, temps, histoedData) {
  return new Promise(function(resolve, reject) {
    gd.createTrueColor(CANVAS_WIDTH, CANVAS_HEIGHT, function(error, image) {
      const white = [255, 255, 255]
      if (error) reject(error.toString());
      for (let i = 0; i < histoedData.length; i ++) {
        if (i % 100000 === 0) console.log('coloring', i)
        const iters = temps[i]
        const temp = histoedData[i]
        let rgb = c_scale(temp).rgb()
        if (iters === MAX_ITERS) rgb = [0, 0, 0]
        const col = i % CANVAS_WIDTH
        const row = Math.floor(i / CANVAS_WIDTH)
        if (col < DPI) rgb = white
        if (col > CANVAS_WIDTH - DPI) rgb = white
        if (row < DPI) rgb = white
        if (row > CANVAS_HEIGHT - DPI) rgb = white
        image.setPixel(col, row, gd.trueColor(rgb[0], rgb[1],rgb[2]))
      }
      resolve(image)
    });
  });
}

function saveImage (image, name) {
  return new Promise(function(resolve, reject) {
    image.savePng(name, 0, function(error) {

      if (error) reject(error.toString())
      resolve()
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

function weightAverage (n, w) {

}


function makeRandomScale (colors, size) {
  const domains = randomDomainList(size)
  let items = fillRandomFrom(colors, size)
  //items[items.length -1] = 'black'
  const modes = ['lch', 'lab', 'hsl']
  const mode = modes[randomIntFromInterval(0,2)]
  console.log('Domains', domains)
  console.log('Colors', items)
  console.log('Mode', mode)
  return chroma.scale(items).mode(mode).correctLightness().domain(domains)
}

function cycleArray (a) {
  const item0 = a.shift()
  a.push(item0)
  return a
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function fillRandomFrom(original, count) {
  let final = []
  while (final.length < count) {
    const idx = randomIntFromInterval(0, original.length -1)
    final.push(original[idx])
  }
  return final
}

function randomDomainList(size) {
  let position = 0.0
  let l = [0.0]
  while (l.length < size - 2) {
    const  newPosition = getRandom(position, 0.999)
    l.push(newPosition)
    position = newPosition
  }
  l.push(1.0)
  return l
}

draw()
