const EventListener = require('events')
const Watcher = require('./Watcher')
const SDWatcher = require('./SDWatcher')
const FileCopier = require('./FileCopier')
const AppConfig = require('./AppConfig')
const Logger = require('./Logger')

class PhotoImporter extends EventListener {
  constructor () {
    super()

    this._watcher = new Watcher()
    this._watcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (fileList) => {
      console.log(fileList)

      // Watcher will emit an event when first initialized that
      // includes all the files in the dir. Thus, we can stop the
      // watcher immediately after to run just once
      if (!AppConfig.shouldWatch) {
        this._watcher.stop()
        process.exit()
      }
    })
    this._watcher.watch(AppConfig.source)

    // this._sdWatcher = new SDWatcher()
    // this._fileCopier = new FileCopier()
  }
}

module.exports = new PhotoImporter()
