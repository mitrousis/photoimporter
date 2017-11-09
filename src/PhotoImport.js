#! /usr/bin/env node

const fs        = require('fs')
const path      = require('path')
//const util      = require('util')
const exifTool  = require('exiftool-vendored').exiftool
//const async     = require('async')
const mkdirp    = require('mkdirp')
const Promise   = require('bluebird')

class PhotoImport {

  constructor() {
    this.sourcePath = null
    this.targetPath = null
    this.exifCache  = {}
  }
  
  // Main entry point for iterating over folder files and starting the move
  processFolder(sourcePath, targetPath) {

    if(!(sourcePath && targetPath)){
      throw(new Error('Source and target paths must be defined'))
    }

    this.sourcePath = sourcePath
    this.targetPath = targetPath

    this.getFileList(sourcePath)
    .then((paths) => {

      // Left off here, need to fix this since promise.all will reject all with only 1 bad apple
      let exifDataPromises = paths.map(this.readExif)

      Promise.all(exifDataPromises)
      .then((exifTagsList) => {
        exifTagsList.forEach((tags) => {
          if(tags !== null) {
            let folderDate = this.getFolderDate(tags)
            
          }
        })

        this.closeExif()
      })
    })
    .catch((err) => {
      console.log(err)
      this.closeExif()
    })
  }

  // Returns array of fully qualified paths
  getFileList(sourceDir) {
    return new Promise((resolve, reject) => {
      let fullPaths = []
      fs.readdir(sourceDir, (err, files) => {
        if(err) {
          reject(err)
        } else {
          for(let f of files){
            fullPaths.push(path.join(sourceDir, f))
          }
          resolve(fullPaths)
        } 
      })
    })
  }

  readExif(filePath) {
    return new Promise((resolve, reject) => {
      if(this.exifCache[filePath] !== undefined){
        console.log('cache hit', filePath)
        resolve(this.exifCache[filePath])
      } else {
        exifTool
        .read(filePath)
        .then((tags) => {
          let exifData = null
  
          if(tags.Error !== 'Unknown file type'){
            exifData = tags
          }
          this.exifCache[filePath] = exifData

          resolve(exifData)
        })
        .catch((err) => reject(err))
      }
    })
    
  }

  // Returns formatted folder date based on EXIF
  getFolderDate(exifTags) {
    let dateNode

    // Cascade through likely timestamps
    // Found in old AVI files
    if(exifTags.DateTimeOriginal !== undefined) {
      dateNode = exifTags.DateTimeOriginal

    // Found in recent camera and iPhone files
    } else if(exifTags.CreateDate !== undefined){
      dateNode = exifTags.CreateDate
    }

    if(dateNode){
      let yr    = dateNode.year
      let mo    = dateNode.month
      let moPad = ('00' + mo.toString()).substring(mo.toString().length)

      return `${yr}-${moPad}`

    } else {
      return null
    }
    
  }

  moveFile(sourceFile, targetFile) {
    return new Promise((resolve, reject) => {
      // Make the target path
      let targetDir = path.dirname(targetFile)
      // mkdirp - makes folders in folders if needed
      mkdirp(targetDir, (err) => {

        if(err) {
          reject(err)
        } else {
          // Check for dupe file. Might as well use 
          // EXIF tool to do the check since we'll want the
          // tags anyway, if the file is a dupe
          this.readExif(targetFile)
          // There must have been a file already here
          .then((tags) => {

          })
          // No existing file found
          .catch((err) => {

          })
          // Continue with rename, but compare EXIF too
          .then(() => {
            fs.rename(sourceFile, targetFile, (err) => {
        
              if(err){
                reject(err)
              } else {
                resolve()
              }
            })
          })
        }
      })
    })
  }

  incrementFilename(filename) {
    // Look for _1.jpg
    let reg      = /(.+)(_(\d+))(\..*)/
    let match    = filename.match(reg)
    let basePath, version, ext

    if(match){
      basePath = match[1]
      version  = (parseInt(match[3]) + 1)
      ext      = match[4]

    } else {
      // Just split the filename and add '_1'
      reg   = /(.+)(\..*)/
      match = filename.match(reg)
     
      basePath = match[1]
      version  = 1
      ext      = match[2]
    }
    
    return basePath + '_' + version + ext

  }

  closeExif() {
    exifTool.end()
  }
  
}


module.exports = PhotoImport
