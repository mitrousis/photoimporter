const chokidar = require('chokidar')
const { debounce } = require('throttle-debounce')
const EventEmitter = require('events')
const Logger = require('./Logger')

class Watcher extends EventEmitter {
  constructor () {
    super()

    // This should be 3000 or more, since chokidar will
    // use 2000 to ensure that file is done being written
    this._changeTriggerDelay = 3000
    this._lastFileList = []

    this._onFileListUpdatedDebounced = debounce(this._changeTriggerDelay, false, this._onFileListUpdated)
  }

  /**
   * Listens for changes via chokidar
   * then will update the file list once changes stop
   * @param {string|array} watchDirPath
   * @param {number} depth
   */
  watch (watchDirPath, depth = 99) {
    Logger.info(`Watching path ${watchDirPath}`, 'Watcher')
    // If the chokidar instance exists, call 'add'
    if (this._chokidarWatcher) {
      this._chokidarWatcher.add(watchDirPath)
    } else {
      this._chokidarWatcher = chokidar.watch(watchDirPath, {
        awaitWriteFinish: true,
        depth
      })

      this._chokidarWatcher.on('add', (path) => {
        this._lastFileList.push(path)
        this._onFileListUpdatedDebounced()
      })

      // This ensures that even if a folder is empty when it is
      // added, we trigger the updated event
      this._chokidarWatcher.on('ready', () => {
        this._onFileListUpdatedDebounced()
      })
    }
  }

  /**
   * @returns {Promise}
   */
  async stop () {
    // Return a promise even if watcher isn't defined
    if (this._chokidarWatcher) {
      await this._chokidarWatcher.close()
    }
  }

  /**
   * Emits all the last updated files, then resets the list
   * Debounce the "add" events to trigger copying process once
   */
  _onFileListUpdated () {
    Logger.verbose(`File list updated, ${this._lastFileList.length} new files`, 'Watcher')

    this.emit(Watcher.EVENT_FILE_LIST_UPDATED, this._lastFileList)
    this._lastFileList = []
  }

  get fileList () {
    return this._fileList
  }
}

Watcher.EVENT_FILE_LIST_UPDATED = 'file_list_updated'

module.exports = Watcher
