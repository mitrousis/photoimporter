const chokidar = require('chokidar')
const debounce = require('throttle-debounce').debounce
const EventEmitter = require('events')
const path = require('path')
const drivelist = require('drivelist')

class Watcher extends EventEmitter {
  constructor () {
    super()
    this._changeTriggerDelay = 5000
    this._changePollingInterval = 10000

    this._sdCardPollingInterval = 4000
    this._sdCardPollingTimeoutRef = null
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

  pollForSDCard () {
    this._sdCardPollingTimeoutRef = setTimeout(() => {

    })
  }

  listSDCards () {
    return drivelist.list()
      .then((drives) => {
        return drives.reduce((sdDrives, drive) => {
          if (drive.isCard) {
            return sdDrives.concat({

            })
          }
        }, [])

        forEach((drive) => {
          if (drive.isCard) {
            console.log(JSON.stringify(drive.mountpoints, null, 1))
          }
        })
      })
  }
}

module.exports = Watcher

drivelist.list()
  .then((drives) => {
    drives.forEach((drive) => {
      console.log(JSON.stringify(drive.mountpoints, null, 1))
    })
  })
