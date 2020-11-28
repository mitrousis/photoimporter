const EventListener = require('events')
const Watcher = require('./Watcher')
const SDWatcher = require('./SDWatcher')
const FileCopier = require('./FileCopier')
const ExifReader = require('./ExifReader')
const path = require('path')
const Logger = require('./Logger')

class FilesProcessor extends EventListener {
  /**
   * @param {Array<String>} sources Paths to process
   * @param {String} destination Target directory for copy operation
   * @param {String} duplicatesDir Path to copy any duplicates
   * @param {Array<String>} removableDiskLabels Removable disk labels to include (when attached)
   * @param {Boolean} watch Keep watching for changed files in either sources or SD cards
   */
  constructor (sources, destination, duplicatesDir, removableDiskLabels = null, watch = false) {
    super()

    this._destination = destination

    this._fileCopier = new FileCopier()
    this._fileCopier.duplicatesDir = duplicatesDir
    this._fileCopier.on(FileCopier.EVENT_QUEUE_COMPLETE, () => this.emit(FilesProcessor.EVENT_COMPLETE))

    this._exifReader = new ExifReader()

    this._watcher = new Watcher()
    this._watcher.on(Watcher.EVENT_FILE_LIST_UPDATED, async (fileList) => {
      await this._processFileList(fileList, true)

      // Watcher will emit an event when first initialized that
      // includes all the files in the dir. Thus, we can stop the
      // watcher immediately after to run just once
      if (!watch) {
        await this._watcher.stop()
      }
    })

    // Watcher accepts array or string for source
    this._watcher.watch(sources)

    // Create a watcher for SD cards outside of sources
    if (removableDiskLabels) {
      this._sdWatcher = new SDWatcher()
      this._sdWatcher.on(Watcher.EVENT_FILE_LIST_UPDATED, async (fileList) => {
        await this._processFileList(fileList, false)

        if (!watch) {
          await this._sdWatcher.stop()
        }
      })
      this._sdWatcher.watch(removableDiskLabels)
    }
  }

  async stop () {
    await this._watcher.stop()
    await this._sdWatcher.stop()
  }

  /**
   * @param {Array} fileList
   * @param {Boolean} shouldMoveFile move instead of copy
   */
  async _processFileList (fileList, shouldMoveFile = true) {
    const preserveDuplicates = shouldMoveFile

    await Promise.all(fileList.map(async (sourceFile) => {
      try {
        const dateDirName = await this._exifReader.getDateFolder(sourceFile)
        const targetDir = path.join(this._destination, '/', dateDirName)

        this._fileCopier.addToQueue(sourceFile, targetDir, shouldMoveFile, preserveDuplicates)
      } catch (e) {
        // Currently error messages are logged in their respective functions
        // and this should just skip files that error
      }
    }))
  }
}

FilesProcessor.EVENT_COMPLETE = 'event_complete'

module.exports = FilesProcessor
