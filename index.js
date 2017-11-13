#! /usr/bin/env node
'use strict'

const argv        = require('yargs').argv
const PhotoImport = require('./src/PhotoImport')
const config      = require('config')
const path        = require('path')
const logger      = require('./src/Logger')
const fs          = require('fs')

let pi = new PhotoImport()

let sourcePath
let targetPath

// Pull from config
if (!(argv.source && argv.target)){ 
  sourcePath = config.get('sourcePath') 
  targetPath = config.get('targetPath') 

  if(!(sourcePath && targetPath)){
    logger.error('Config paths not set')
    process.exit()
  }

} else {
  // Pull from args
  sourcePath = path.resolve(argv.source)
  targetPath = path.resolve(argv.target)

  // Save if toggled
  if(argv.save){
    let cfgJson = {
      sourcePath,
      targetPath
    }

    logger.info('Saving config paths')
    fs.writeFileSync(path.resolve('./config/default.json'), JSON.stringify(cfgJson))
  }
}

logger.info(`Processing images start at ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}
  source: ${sourcePath} 
  target: ${targetPath}`)
  
  pi.processFolder(sourcePath, targetPath)