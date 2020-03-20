const chokidar = require('chokidar')
const { debounce } = require('throttle-debounce')
const EventEmitter = require('events')
const Logger = require('./Logger')

class Watcher extends EventEmitter {
  constructor () {
    super()
    this._changeTriggerDelay = 2000
    // this._changePollingInterval = 10000
    this._lastFileList = []

    this._onFileListUpdatedDebounced = debounce(this._changeTriggerDelay, this._onFileListUpdated)
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
      // usePolling: true,
      // interval: this._changePollingInterval,
      // binaryInterval: this._changePollingInterval
      })

      this._chokidarWatcher.on('add', (path) => {
        this._lastFileList.push(path)
        this._onFileListUpdatedDebounced()
      })
    }
  }

  stop () {
    // Return a promise even if watcher isn't defined
    let stopPromise = Promise.resolve()

    if (this._chokidarWatcher) {
      stopPromise = this._chokidarWatcher.close()
    }

    return stopPromise
  }

  /**
   * Emits all the last updated files, then resets the list
   * Debounce the "add" events to trigger copying process once
   */
  _onFileListUpdated () {
    this.emit(Watcher.EVENT_FILE_LIST_UPDATED, this._lastFileList)
    this._lastFileList = []
  }

  get fileList () {
    return this._fileList
  }
}

Watcher.EVENT_FILE_LIST_UPDATED = 'file_list_updated'

module.exports = Watcher
