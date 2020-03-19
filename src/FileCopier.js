const EventListener = require('events')
const path = require('path')
const fse = require('fs-extra')
const logger = require('./Logger')
const md5File = require('md5-file')

class FileCopier extends EventListener {
  constructor () {
    super()

    this._fileQueue = []
    this._duplicatesDir = ''
  }

  set duplicatesDir (dirPath) {
    fse.mkdirpSync(dirPath)
    this._duplicatesDir = dirPath
  }

  get duplicatesDir () {
    return this._duplicatesDir
  }

  /**
   * Formats a file queue item, adding the target path
   * Optionally will update the item in-place instead of appending
   * @param {string} source
   * @param {string} destination
   * @param {boolean} moveFile
   * @param {boolean} preserveDuplicate
   * @param {object} updateInPlace
   * @returns {object}
   */
  addToQueue (
    source,
    destination,
    moveFile = false,
    preserveDuplicate = false,
    updateInPlace = null
  ) {
    // If destination is a folder, append a file name
    // This is mostly to keep all the logic in processing the same
    // and always expect a file in the destination
    const sourceDetails = path.parse(source)
    const destDetails = path.parse(destination)

    // No extension, assume a dir
    if (destDetails.ext === '') {
      destination = path.join(destination, sourceDetails.base)
    }

    const item = {
      source,
      destination,
      moveFile,
      preserveDuplicate
    }

    if (updateInPlace) {
      Object.assign(updateInPlace, item)
    } else {
      this._fileQueue.push(item)
    }

    return item
  }

  /**
   *
   * @param {array} fileQueue
   */
  async _processNextFile (fileQueue) {
    if (fileQueue.length === 0) {
      logger.info('FileCopier queue empty.')
      return
    }

    const fileParams = fileQueue[0]

    try {
      // Either perform a move or copy
      // Copy would be used to go from an SD card
      if (fileParams.moveFile) {
        await fse.move(fileParams.source, fileParams.destination, {
          overwrite: false
        })
      } else {
        await fse.copy(fileParams.source, fileParams.destination, {
          overwrite: false,
          errorOnExist: true,
          preserveTimestamps: true
        })
      }

      fileQueue.shift()
      return true
    } catch (error) {
      if (error.message.match(/already exists/)) {
        // Verify that the destination is truly a dupe
        if (fileParams.preserveDuplicate) {
          // These are the same hash, move to dupes folder
          // and overwrite any existing dupes
          if (this._compareFiles(fileParams.source, fileParams.destination)) {
            this.addToQueue(
              fileParams.source,
              this._duplicatesDir,
              fileParams.moveFile,
              false,
              fileParams
            )
          } else {
            // Files were different hashes, but same filename. Increment filename.
            const newDestination = this._incrementFilename(fileParams.destination)
            this.addToQueue(
              fileParams.source,
              newDestination,
              fileParams.moveFile,
              fileParams.preserveDuplicate,
              fileParams
            )
          }
          return false
        }
      } else {
        // For all other reasons it couldn't be moved
        throw error
      }
    }

    // Was successful or couldn't be moved

    // fse.copySync(from, to, {
    //   overwrite: false

    // })

    // const nextPath = this._fileQueue[0]

    // Get target path
    // Check for dupe file name
    // Verify is actually dupe via hash
    // Rename appropriately
    // Continue
  }

  _compareFiles (fileA, fileB) {
    return md5File.sync(fileA) === md5File.sync(fileB)
  }

  _incrementFilename (filePath) {
    const parts = path.parse(filePath)
    // See if the file name before the extension contains _xxxx
    const versionMatch = parts.name.match(/(.*)_([0-9]{2}$)/)

    let base = parts.name
    let nextVersion = 0

    if (versionMatch) {
      base = versionMatch[1]
      nextVersion = parseInt(versionMatch[2] + 1)
    }

    // Create a new name like image_01
    parts.name = `${base}_${String(nextVersion).padStart(2, '0')}`
    parts.base = null

    // Reconstitute the file
    return path.format(parts)
  }
}

module.exports = FileCopier
