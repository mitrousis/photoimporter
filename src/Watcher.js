const chokidar = require('chokidar')
const debounce = require('throttle-debounce').debounce
const EventEmitter = require('events')
const logger = require('./Logger')

class Watcher extends EventEmitter {
  constructor () {
    super()
    this._changeTriggerDelay = 2000
    this._changePollingInterval = 10000
    this._fileList = []
  }

  watch (watchDirPath, depth = 99) {
    logger.info('Watching path:', watchDirPath)
    // One-liner for current directory
    this._chokidarWatcher = chokidar.watch(watchDirPath, {
      awaitWriteFinish: true,
      depth
      // usePolling: true,
      // interval: this._changePollingInterval,
      // binaryInterval: this._changePollingInterval
    })

    this._chokidarWatcher.on('add', (path) => {
      this._processAddedFile(path)
      // Debounce the "add" events to trigger copying process once
      debounce(this._changeTriggerDelay, () => this.emit('change', watchDirPath))()
    })
  }

  stop () {
    // Return a promise even if watcher isn't defined
    let stopPromise = Promise.resolve()

    if (this._chokidarWatcher) {
      stopPromise = this._chokidarWatcher.close()
    }

    return stopPromise
  }

  _processAddedFile (path) {
    this._fileList.push(path)
  }

  get fileList () {
    return this._fileList
  }
}

module.exports = Watcher
