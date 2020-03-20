const EventListener = require('events')
const Watcher = require('./Watcher')
const SDWatcher = require('./SDWatcher')
const FileCopier = require('./FileCopier')
const AppConfig = require('./AppConfig')
const Logger = require('./Logger')

class PhotoImporter extends EventListener {
  constructor () {
    super()

    // this._watcher = new Watcher()
    // this._sdWatcher = new SDWatcher()
    // this._fileCopier = new FileCopier()
  }
}

module.exports = new PhotoImporter()
