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

  /**
   * Append more files to copy
   * @param {array|string} filePaths
   */
  addToQueue ({
    source,
    destination,
    moveFile = false,
    preserveDuplicate = false
  }) {
    // Add the passed options to the queue
    this._fileQueue = this._fileQueue.concat(...arguments)
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
    } catch (error) {
      let newDestination

      if (error.message.match(/already exists/)) {
        // Verify that the destination is truly a dupe
        if (fileParams.preserveDuplicate) {
          // These are the same hash
          if (this._compareFiles(fileParams.source, fileParams.destination)) {
            newDestination = this._duplicatesDir
          } else {
            // Files were different hashes, but same filename. Increment filename.
            newDestination = this._incrementFilename(fileParams.destination)
          }
          // Rename the destination in-place, but don't modify the array
          fileParams.destination = newDestination
          return
        }
      } else {
        // For all other reasons it couldn't be moved
        console.log('Couldnt move message')
      }
    }

    // Was successful or couldn't be moved
    fileQueue.shift()

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
