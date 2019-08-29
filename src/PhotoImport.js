'use strict'

const path = require('path')
const fs = require('fs')
const exifTool = require('exiftool-vendored').exiftool
const recursiveReadDir = require('recursive-readdir')
const Promise = require('bluebird')
const logger = require('./Logger')
const childProcess = require('child_process')

const mkdirp = Promise.promisify(require('mkdirp'))
const hashFiles = Promise.promisify(require('hash-files'))

class PhotoImport {
  constructor () {
    this.sourcePath = null
    this.targetPath = null
    this.duplicatesPath = null
  }

  // Main entry point for iterating over folder files and starting the move
  processFolder (sourcePath, targetPath) {
    if (!(sourcePath && targetPath)) {
      logger.error('Source and target paths must be defined')
      return
    }

    this.sourcePath = sourcePath
    this.targetPath = targetPath
    // Duplicates are always saved outside source path
    this.duplicatesPath = path.join(this.sourcePath, '../duplicates')

    return this.getFileList(sourcePath)
      .then((paths) => {
        return Promise.each(paths, (filePath) => {
          return this.readExif(filePath)
            .then((exifData) => {
              if (exifData !== null) {
                const dateFolder = this.getFolderFromDate(exifData)
                const fileName = path.basename(filePath)
                const fullTargetPath = path.join(this.targetPath, dateFolder, fileName)

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
        logger.error('processFolder > ', err.message)
        this.closeExif()
      })
  }

  // Returns array of fully qualified paths
  getFileList (sourceDir) {
    // Note - ignoring some files
    return recursiveReadDir(sourceDir, ['.DS_Store'])
      .catch((err) => {
        logger.error(`getFileList > ${sourceDir}`)
        return err
      })
  }

  readExif (filePath) {
    return new Promise((resolve, reject) => {
      exifTool.read(filePath)
        .then((tags) => {
          let exifData = null

          if (tags.Error !== 'Unknown file type') {
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
  getFolderFromDate (exifTags) {
    const date = this.getCreationDate(exifTags)
    const yr = date.getFullYear()
    const mo = date.getMonth() + 1
    const moPad = ('00' + mo.toString()).substring(mo.toString().length)

    return `${yr}-${moPad}`
  }

  moveFile (sourceFile, targetFile, duplicatesFolder) {
    if (sourceFile === targetFile) {
      logger.warn(`moveFile > files are the same, skipping: ${sourceFile}`)
      return Promise.resolve()
    }
    // Make the target path
    const targetDir = path.dirname(targetFile)
    // let isDuplicate = false

    // mkdirp - makes folders in folders if needed
    return mkdirp(targetDir)
    // Problem with making dir
      .catch((mkdirError) => {
        logger.error(`mkdir > ${targetDir}`)
      })
      .then(() => {
        return this.execMove(sourceFile, targetFile)
      })
    // An error here is most likely existing file
      .catch((copyError) => {
        if (copyError.code === 'EEXIST') {
        // Is same file hash
          return this.isSameFile(sourceFile, targetFile)
            .then((isSameFile) => {
              let newTargetFile

              // Send to duplicates
              if (isSameFile) {
                logger.info(`moveFile > found duplicate: ${sourceFile}`)

                // The target file now points to /duplicates
                newTargetFile = path.join(duplicatesFolder, path.basename(sourceFile))
              } else {
                logger.info(`moveFile > filename exists, but different data: ${sourceFile}`)
                // Is just same name, so increment target file name
                newTargetFile = this.incrementFilename(targetFile)
              }

              return this.moveFile(sourceFile, newTargetFile, duplicatesFolder)
            })
          // Some other copy error, bubble
        } else {
          return copyError
        }
      })
    // Successful move
      .then(() => {
        logger.info(`moveFile > ${sourceFile} -> ${targetFile}`)
      })
  }

  // Used to ensure that the properties of the file (birthtime / mtime) are preserved
  execMove (sourceFile, targetFile) {
    return new Promise((resolve, reject) => {
      childProcess.execFile('cp', ['-pnv', sourceFile, targetFile], (error, stdout, stderr) => {
        // Errors will be thrown if file exists as well
        if (error) {
          if (stdout.indexOf('not overwritten') > -1) {
            const exists = new Error()
            exists.code = 'EEXIST'

            reject(exists)
          } else {
            reject(error)
          }
        } else {
          fs.unlink(sourceFile, (error) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        }
      })
    })
  }

  incrementFilename (filename) {
    // Look for _1.jpg
    let reg = /(.+)(_(\d+))(\..*)/
    let match = filename.match(reg)
    let basePath, version, ext

    if (match) {
      basePath = match[1]
      version = (parseInt(match[3]) + 1)
      ext = match[4]
    } else {
      // Just split the filename and add '_1'
      reg = /(.+)(\..*)/
      match = filename.match(reg)

      basePath = match[1]
      version = 1
      ext = match[2]
    }

    return basePath + '_' + version + ext
  }

  // Check multiple sources for creation date
  // Convert exif library's values into Date object
  getCreationDate (exifTags) {
    let dateNode

    // Cascade through likely timestamps
    // Found in old AVI files
    if (exifTags.DateTimeOriginal !== undefined) {
      dateNode = exifTags.DateTimeOriginal

    // Found in recent camera and iPhone files
    } else if (exifTags.CreateDate !== undefined) {
      dateNode = exifTags.CreateDate
    } else if (exifTags.FileModifyDate !== undefined) {
      dateNode = exifTags.FileModifyDate
    }

    return new Date(dateNode.year, dateNode.month - 1, dateNode.day, dateNode.hour, dateNode.minute, dateNode.second)
  }

  isSameFile (fileA, fileB) {
    return new Promise((resolve, reject) => {
      hashFiles({ files: [fileA], algorithm: 'md5' })
        .then((hashA) => {
          hashFiles({ files: [fileB], algorithm: 'md5' })
            .then((hashB) => {
              resolve(hashA === hashB)
            })
        })
    })
  }

  closeExif () {
    exifTool.end()
  }
}

module.exports = PhotoImport
