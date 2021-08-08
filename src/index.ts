import path from 'path'
import svgpath from 'svgpath'
import { optimize, OptimizeOptions } from 'svgo'
import { lstatSync, readdirSync, readFileSync } from 'fs'

const getSvgPath = (target: string) => {
  let matched
  let result!: string[]
  const regx = /d="(.*?)"/g
  while ((matched = regx.exec(target))) {
    result.push(matched[1])
  }

  return result
}

const getSvgData: any = (svgPath: string) =>
  new Promise((resolve, reject) => {
    try {
      const pathData = readFileSync(svgPath)
      resolve(pathData.toString())
    } catch (err) {
      reject(err)
    }
  })

let sourceIndex!: number
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

const filepath = path.resolve(__dirname, '../nodejs-icon.svg')
const getOptimizeData = () => {
  const optimizeOptions: OptimizeOptions = {
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
      // 'removePreserveAspectRatio',
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
      'removeDimensions'
      // { name: 'removeAttrs', attrs: '(stroke|fill|preserveAspectRatio)' }
    ]
  }
  try {
    const svgString = readFileSync(filepath, 'utf8')
    return optimize(svgString, { path: filepath, plugins: optimizeOptions.plugins })
  } catch (error) {
    console.log(error)
  }
}

(async () => await getOptimizeData() )()

const assetsPath = path.resolve(__dirname, '../assets')

const files = readdirSync(assetsPath)

for (const file of files) {
  const stat = lstatSync(path.join(assetsPath, file))
  if (stat.isFile()) {
    console.log(readFileSync(path.join(assetsPath, file), 'utf-8'))
  }
}

// const svgstore = require('svgstore')
// const sprites = svgstore()
//     .add('unicorn', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
//     .add('rainbow', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
// fs.writeFileSync('./fonts/sprites.svg', sprites)
