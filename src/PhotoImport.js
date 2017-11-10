#! /usr/bin/env node

const fs        = require('fs')
const path      = require('path')
const exifTool  = require('exiftool-vendored').exiftool

const Promise   = require('bluebird')

const mkdirp        = Promise.promisify(require('mkdirp'))
const hashFiles     = Promise.promisify(require('hash-files'))
const lstatPromise  = Promise.promisify(fs.lstat)
const renamePromise = Promise.promisify(fs.rename)

class PhotoImport {

  constructor() {
    this.sourcePath     = null
    this.targetPath     = null
    this.duplicatesPath = null
  }
  
  // Main entry point for iterating over folder files and starting the move
  processFolder(sourcePath, targetPath) {

    if(!(sourcePath && targetPath)){
      throw(new Error('Source and target paths must be defined'))
    }

    this.sourcePath     = sourcePath
    this.targetPath     = targetPath
    this.duplicatesPath = path.join(this.sourcePath, '/duplicates')

    return this.getFileList(sourcePath)
    .then((paths) => {

      Promise.each(paths, (filePath) => {
        this.readExif(filePath)
        // Swallow any errors - maybe report
        .catch((err) => {
          console.log('!', err)
          return
        })
        .then((exifData) => {
          let dateFolder      = this.getFolderDate(exifData)
          let fileName       = path.basename(filePath)
          let fullTargetPath = path.join(this.targetPath, dateFolder, fileName)
          // Move
          return this.moveFile(
            filePath,
            fullTargetPath,
            this.duplicatesPath
          )
        })
        /*.then(() => {
          success?
        }*/
      })
      .then(() => {
        console.log('all done!')
        this.closeExif()
      })
    })
    .catch((err) => {
      console.log('getFileList error', err)
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
      .catch((err) => reject(err))
    })
    
  }

  // Returns formatted folder date based on EXIF
  getFolderDate(exifTags) {
    let date  = this.getCreationDate(exifTags)
    let yr    = date.getFullYear()
    let mo    = date.getMonth() + 1
    let moPad = ('00' + mo.toString()).substring(mo.toString().length)

    return `${yr}-${moPad}`
  }

  moveFile(sourceFile, targetFile, duplicatesFolder) {

    // Make the target path
    let targetDir   = path.dirname(targetFile)

    // mkdirp - makes folders in folders if needed
    return mkdirp(targetDir)
    // Problem with making dir
    .catch((mkdirError) => {
      console.log('mkdir error')
    })
    .then(() => {
      return lstatPromise(targetFile)
    })
    // File exists
    .then((stats) => {
      // Checkif actually the same file
      return this.isSameFile(sourceFile, targetFile)
    })
    .then((isSameFile) => {
      if(isSameFile){
        // Make us a duplicates folder
        return mkdirp(duplicatesFolder)
        .then(() => {
          // The target file now points to /duplicates
          return path.join(duplicatesFolder, path.basename(sourceFile))
        })
      } else {
        // Is just same name, so increment target file name
        return this.incrementFilename(targetFile)
      }
    })
    // No existing file found
    .catch(() => {
      return targetFile
    })
    // Continue with rename, using transformed filename
    .then((newTargetFile) => {
      return renamePromise(sourceFile, newTargetFile)
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

  // Check multiple sources for creation date
  // Convert exif library's values into Date object
  getCreationDate(exifTags){
    let dateNode
    
    // Cascade through likely timestamps
    // Found in old AVI files
    if(exifTags.DateTimeOriginal !== undefined) {
      dateNode = exifTags.DateTimeOriginal

    // Found in recent camera and iPhone files
    } else if(exifTags.CreateDate !== undefined){
      dateNode = exifTags.CreateDate
    }

    return new Date(dateNode.year, dateNode.month-1, dateNode.day, dateNode.hour, dateNode.minute, dateNode.second)
    
  }

  isSameFile(fileA, fileB) {
    return new Promise((resolve, reject) => {
      hashFiles({files : [fileA], algorithm: 'md5'})
      .then((hashA) => {
        hashFiles({files : [fileB], algorithm: 'md5'})
        .then((hashB) => {
          resolve(hashA == hashB)
        })
      })
    })
  }


  closeExif() {
    exifTool.end()
  }
  
}


module.exports = PhotoImport
