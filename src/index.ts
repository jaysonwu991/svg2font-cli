import fs from 'fs'
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
    console.log(`path ${pathIndex}: ${
      svgpath(path)
      .translate((282 - 256) / 2)
      .scale(1024 / 282)
      .round(6)
      .toString()
    }`)
  })
})

// const svgstore = require('svgstore')
// const sprites = svgstore()
//     .add('unicorn', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
//     .add('rainbow', fs.readFileSync('./assets/nodejs-icon.svg', 'utf8'))
// fs.writeFileSync('./fonts/sprites.svg', sprites)
