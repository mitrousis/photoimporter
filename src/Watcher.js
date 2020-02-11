const chokidar = require('chokidar')
const debounce = require('throttle-debounce').debounce
const EventEmitter = require('events')

class Watcher extends EventEmitter {
  constructor () {
    super()
    this._changeTriggerDelay = 2000
    this._changePollingInterval = 10000
    this._fileList = []
  }

  watch (watchDirPath, depth = 99) {
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

  // This is just a test currently
  // watchForMountedVolume (volumeName) {
  //   // One-liner for current directory
  //   const watchVolumePath = path.join('/Volumes/')

  //   this._chokidarWatcher = chokidar.watch(watchVolumePath, {
  //     usePolling: true,
  //     interval: 1000,
  //     depth: 0
  //   })

  //   this._chokidarWatcher.on('addDir', (event, path) => {
  //     console.log(event, path)
  //   })
  // }
}

module.exports = Watcher
