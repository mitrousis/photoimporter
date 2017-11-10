const fs               = require('fs')
const path             = require('path')
const exifTool         = require('exiftool-vendored').exiftool
const winston          = require('winston')
const recursiveReadDir = require('recursive-readdir')
const Promise          = require('bluebird')

const mkdirp        = Promise.promisify(require('mkdirp'))
const hashFiles     = Promise.promisify(require('hash-files'))
const lstatPromise  = Promise.promisify(fs.lstat)
const renamePromise = Promise.promisify(fs.rename)


let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
})

class PhotoImport {

  constructor() {
    this.sourcePath     = null
    this.targetPath     = null
    this.duplicatesPath = null
  }
  
  // Main entry point for iterating over folder files and starting the move
  processFolder(sourcePath, targetPath) {

    logger.info(`Processing folder, ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()} ${sourcePath}`)

    if(!(sourcePath && targetPath)){
      logger.error('Source and target paths must be defined')
      return
    }

    this.sourcePath     = sourcePath
    this.targetPath     = targetPath
    // Duplicates are always saved outside source path
    this.duplicatesPath = path.join(this.sourcePath, '../duplicates')

    return this.getFileList(sourcePath)
    .then((paths) => {
      return Promise.each(paths, (filePath) => {
        return this.readExif(filePath)
        .then((exifData) => {
          if(exifData !== null){
            let dateFolder     = this.getFolderFromDate(exifData)
            let fileName       = path.basename(filePath)
            let fullTargetPath = path.join(this.targetPath, dateFolder, fileName)
            
            return this.moveFile(
              filePath,
              fullTargetPath,
              this.duplicatesPath
            )
          }
        })
      })
      .then(() => {
        this.closeExif()
      })
    })
    // Catch all errors - these are logged more specifically in supporting methods
    .catch((err) => {
      logger.error('processFolder > error')
      this.closeExif()
    })
  }

  // Returns array of fully qualified paths
  getFileList(sourceDir) {
    // Note - ignoring some files
    return recursiveReadDir(sourceDir, ['.DS_Store'])
    .catch((err) => {
      logger.error(`getFileList > ${sourceDir}`)
      return err
    })
      
  }
      /*fs.readdir(sourceDir, (err, files) => {
        if(err) {
          logger.error(`getFileList > ${sourceDir}`)
          reject(err)
        } else {
          for(let f of files){
            fullPaths.push(path.join(sourceDir, f))
          }
          resolve(fullPaths)
        } 
      })*/
    //})
  //}

  readExif(filePath) {
    return new Promise((resolve, reject) => {
      exifTool.read(filePath)
      .then((tags) => {
        let exifData = null

        if(tags.Error !== 'Unknown file type'){
          exifData = tags
        } else {
          logger.error(`readExif > no data: ${filePath}`)
        }
        resolve(exifData)
      })
      .catch((err) => {
        logger.error(`readExif > bad path: ${filePath}`)
        reject(err)
      })
    })
    
  }

  // Returns formatted folder date based on EXIF
  getFolderFromDate(exifTags) {
    let date  = this.getCreationDate(exifTags)
    let yr    = date.getFullYear()
    let mo    = date.getMonth() + 1
    let moPad = ('00' + mo.toString()).substring(mo.toString().length)

    return `${yr}-${moPad}`
  }

  moveFile(sourceFile, targetFile, duplicatesFolder) {
    // Make the target path
    let targetDir   = path.dirname(targetFile)
    let isDuplicate = false

    // mkdirp - makes folders in folders if needed
    return mkdirp(targetDir)
    // Problem with making dir
    .catch((mkdirError) => {
      logger.error(`mkdir > ${targetDir}`)
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
          // Just used for logging
          isDuplicate = true
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
      if(isDuplicate){
        logger.info(`moveFile > duplicate: ${sourceFile}`)
      } else {
        logger.info(`moveFile > ${sourceFile} -> ${newTargetFile}`)
      }
      
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
