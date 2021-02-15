const EventListener = require('events')
const path = require('path')
const fse = require('fs-extra')
const Logger = require('./Logger')
const md5File = require('md5-file')

class FileCopier extends EventListener {
  constructor () {
    super()

    this._fileQueue = []
    this._duplicatesDirName = '_duplicates'
    this._queueActive = false
    this._queueEmptyTimeout = -1
  }

  /**
   * This is not a full path, just the name of the directory
   */
  set duplicatesDirName (dirName) {
    this._duplicatesDirName = dirName
  }

  get duplicatesDirName () {
    return this._duplicatesDirName
  }

  /**
   * Formats a file queue item, adding the target path
   * Optionally will update the item in-place instead of appending
   * @param {string} source
   * @param {string} destination file name or folder to copy/move to
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

    if (!this._queueActive) this._continueQueue()

    return item
  }

  /**
   * Starts or steps through queue
   */
  async _continueQueue () {
    this._queueActive = true

    if (this._fileQueue.length > 0) {
      const success = await this._processQueueItem(this._fileQueue[0])
      if (success) this._fileQueue.shift()
    }

    if (this._fileQueue.length === 0) {
      this._waitToEmptyQueue()
    } else {
      process.nextTick(() => this._continueQueue())
    }
  }

  /**
   * Wait for 1 second before emptying the queue, which allows
   * for some delays in adding items to the queue race conditions
   */
  _waitToEmptyQueue () {
    clearTimeout(this._queueEmptyTimeout)

    this._queueEmptyTimeout = setTimeout(() => {
      if (this._fileQueue.length === 0) {
        this._onQueueEmptied()
      } else {
        this._continueQueue()
      }
    }, 1000)
  }

  /**
   * All done
   */
  _onQueueEmptied () {
    this._queueActive = false
    this.emit(FileCopier.EVENT_QUEUE_COMPLETE)
  }

  /**
   * Processes a single queued file item
   * @param {object} queueItem
   */
  async _processQueueItem (queueItem) {
    Logger.info(`Processing ${queueItem.source} -> ${queueItem.destination}`, 'FileCopier')

    let processSuccess = false

    try {
      // Either perform a move or copy
      // Copy would be used to go from an SD card
      if (queueItem.moveFile) {
        await fse.move(queueItem.source, queueItem.destination, {
          overwrite: false
        })
      } else {
        await fse.copy(queueItem.source, queueItem.destination, {
          overwrite: false,
          errorOnExist: true,
          preserveTimestamps: true
        })
      }

      processSuccess = true
    } catch (error) {
      if (error.message.match(/already exists/)) {
        // Verify that the destination is truly a dupe
        if (queueItem.preserveDuplicate) {
          // These are the same hash, move to dupes folder
          // and overwrite any existing dupes
          if (this._compareFiles(queueItem.source, queueItem.destination)) {
            // create dupes dir
            const dupesFullDirPath = path.join(path.dirname(queueItem.source), this._duplicatesDirName)
            fse.mkdirpSync(dupesFullDirPath)

            this.addToQueue(
              queueItem.source,
              dupesFullDirPath,
              queueItem.moveFile,
              false,
              queueItem
            )
          } else {
            // Files were different hashes, but same filename. Increment filename.
            const newDestination = this._incrementFilename(queueItem.destination)
            this.addToQueue(
              queueItem.source,
              newDestination,
              queueItem.moveFile,
              queueItem.preserveDuplicate,
              queueItem
            )
          }
        } else {
          // Destination is a dupe, but don't need to preserve, so consider a success
          processSuccess = true
        }
      } else {
        Logger.error('Could not copy file', 'FileCopier', error)
        processSuccess = true
      }
    }

    this.emit(FileCopier.EVENT_QUEUE_ITEM_PROCESSED, processSuccess)
    return processSuccess
  }

  _compareFiles (fileA, fileB) {
    return md5File.sync(fileA) === md5File.sync(fileB)
  }

  _incrementFilename (filePath) {
    const parts = path.parse(filePath)
    // See if the file name before the extension contains _xx
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

FileCopier.EVENT_QUEUE_COMPLETE = 'queue_complete'
FileCopier.EVENT_QUEUE_ITEM_PROCESSED = 'queue_item_processed'

module.exports = FileCopier
