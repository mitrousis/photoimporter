const chokidar = require('chokidar')
const debounce = require('throttle-debounce').debounce
const EventEmitter = require('events')

class Watcher extends EventEmitter {
  constructor () {
    super()
    this._changeTriggerDelay = 5000
    this._changePollingInterval = 10000
  }

  watch (watchDirPath) {
    // One-liner for current directory
    this._chokidarWatcher = chokidar.watch(watchDirPath, {
      awaitWriteFinish: true,
      usePolling: true,
      interval: this._changePollingInterval,
      binaryInterval: this._changePollingInterval
    })

    this._chokidarWatcher.on('add',
      debounce(this._changeTriggerDelay, (event, path) => {
        this.emit('change', watchDirPath)
      })
    )
  }

  stop () {
    if (this._chokidarWatcher) {
      this._chokidarWatcher.close()
    }
  }
}

module.exports = Watcher
