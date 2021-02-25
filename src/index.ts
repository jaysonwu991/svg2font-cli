import fs from 'fs'
import path from 'path'
import svgpath from 'svgpath'

const getSvgPath = (target: string) => {
  const result = []
  const regx = /d="(.*?)"/g
  let matched = []
  while ((matched = regx.exec(target))) {
    result.push(matched[1])
  }

  return result
}

const getSvgData: any = (svgPath: string) =>
  new Promise((resolve, reject) => {
    try {
      const data = fs.readFileSync(svgPath)
      resolve(data.toString())
    } catch (err) {
      reject(err)
    }
  })

let sourceIndex: number
process.argv.forEach((item: string, index: number) => {
  item.substring(2) === 'source' && (sourceIndex = index)
})

const svgPath: string = process.argv[sourceIndex + 1]
let sourceData: string
getSvgData(svgPath).then((svgData: string) => {
  sourceData = svgData
  // TODO: Optimize Source Data
  // TODO: Get ViewBox Data
  const pathArr = getSvgPath(sourceData)
  // console.log('pathArr: ', pathArr)
  pathArr.forEach((path: string, pathIndex: number) => {
    console.log(
      `path ${pathIndex}: ${svgpath(path)
        .translate((282 - 256) / 2)
        .scale(1024 / 282)
        .round(6)
        .toString()}`
    )
  })
})

const svgo = require('svgo')
const filepath = path.resolve(__dirname, '../nodejs-icon.svg')
const config = {
  plugins: [
    'cleanupAttrs',
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeTitle',
    'removeDesc',
    'removeUselessDefs',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyContainers',
    // 'removeViewBox',
    'removeXMLNS',
    'removePreserveAspectRatio',
    'cleanupEnableBackground',
    'convertStyleToAttrs',
    'convertColors',
    'convertPathData',
    'convertTransform',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeUnusedNS',
    'cleanupIDs',
    'cleanupNumericValues',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    // 'removeRasterImages',
    'mergePaths',
    'convertShapeToPath',
    'sortAttrs',
    'removeDimensions',
    { name: 'removeAttrs', attrs: '(stroke|fill|preserveAspectRatio)' }
  ]
}

fs.readFile(filepath, 'utf8', function (err, data) {
  if (err) {
    throw err
  }

  const result = svgo.optimize(data, { path: filepath, ...config })

  console.log(result)
})

/**
 * Promise all
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 */
function promiseAllP(items, block) {
  var promises = []
  items.forEach(function (item, index) {
    promises.push(
      ((item, _i) => {
        return new Promise((resolve, reject) => {
          return block.apply(this, [item, index, resolve, reject])
        })
      })(item, index)
    )
  })
  return Promise.all(promises)
}

/**
 * read files
 * @param dirname string
 * @return Promise
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 *
 */
function readFiles(dirname) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, function (err, filenames) {
      if (err) return reject(err)
      promiseAllP(filenames, (filename, index, resolve, reject) => {
        console.log()
        fs.readFile(path.resolve(dirname, filename), 'utf-8', function (err, content) {
          if (err) return reject(err)
          return resolve({ filename, content })
        })
      })
        .then((results) => {
          return resolve(results)
        })
        .catch((error) => {
          return reject(error)
        })
    })
  })
}

readFiles(path.resolve(__dirname, '../assets'))
  .then((files: [{ filename: string; content: string }]) => {
    console.log('loaded ', files.length)
    files.forEach((item, index) => {
      console.log('index: ', index, 'filename: ', item.filename, 'content: ', item.content)
    })
  })
  .catch((error) => {
    console.log(error)
  })

// const svgstore = require('svgstore')
// const sprites = svgstore()
//     .add('unicorn', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
//     .add('rainbow', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
// fs.writeFileSync('./fonts/sprites.svg', sprites)
