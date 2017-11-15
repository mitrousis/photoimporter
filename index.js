#!/usr/bin/env node
'use strict'

const argv        = require('yargs').argv
const PhotoImport = require('./src/PhotoImport')
const path        = require('path')
const logger      = require('./src/Logger')
const fs          = require('fs')

// We're handling the config error messaging, don't need default
process.env.SUPPRESS_NO_CONFIG_WARNING = true
process.env.NODE_CONFIG_DIR = path.join(__dirname, '/config/')

const config      = require('config')

let pi = new PhotoImport()

let sourcePath
let targetPath

// Pull from config
if (!(argv.source && argv.target)){ 

  if(!(config.has('sourcePath') && config.has('targetPath'))){
    logger.error('Config paths not set')
    process.exit()
  }

  sourcePath = config.get('sourcePath') 
  targetPath = config.get('targetPath') 

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
    fs.writeFileSync(path.resolve(__dirname, './config/default.json'), JSON.stringify(cfgJson))
  }
}

logger.info(`Processing images start at ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}
  source: ${sourcePath} 
  target: ${targetPath}`)
  
pi.processFolder(sourcePath, targetPath)