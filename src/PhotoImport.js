#! /usr/bin/env node

const fs        = require('fs')
const path      = require('path')
const util      = require('util')
const exifTool  = require('exiftool-vendored').exiftool
const async     = require('async')
const mkdirp    = require('mkdirp')


class PhotoImport {

  constructor() {
    this.sourcePath = null
    this.targetPath = null
  }
  
  processFolder(sourcePath, targetPath) {

    if(!(sourcePath && targetPath)){
      throw(new Error('Source and target paths must be defined'))
      return
    }

    this.sourcePath = sourcePath
    this.targetPath = targetPath

    this.getFileList(sourcePath)
    .then((paths) => {

      let exifDataPromises = paths.map(this.readExif)

      Promise.all(exifDataPromises)
      .then((exifTagsList) => {
        exifTagsList.forEach((tags) => {
          if(tags !== null) {
            let folderDate = this.getFolderDate(tags)
            console.log(folderDate)
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
      exifTool
      .read(filePath)
      .then((tags) => {
          let exifData = null

          if(tags.Error !== 'Unknown file type'){
            exifData = tags
          }
          resolve(exifData)
      })
      .catch(err => {
        reject(err)
      })
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

      mkdirp(targetDir, (err) => {

        if(err) reject(err)

        fs.rename(sourceFile, targetFile, (err) => {
          
          console.log(err)

          if(err){
            reject(err)
          } else {
            resolve()
          }
          
        })

      })
    })
  }

  closeExif() {
    exifTool.end()
  }
  
}


module.exports = PhotoImport
