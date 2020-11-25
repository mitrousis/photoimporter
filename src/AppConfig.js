const Configstore = require('configstore')
const { argv } = require('yargs')
const Logger = require('./Logger')
const fse = require('fs-extra')

/**
 * @class AppConfig
 * This is a singleton
 */
class AppConfig {
  constructor () {
    // This is currently only used for testing and shouldn't be changed for general use
    const configPath = process.env.CONFIG_PATH || null

    this._configStore = new Configstore('photoimporter', null, {
      configPath
    })

    // A file must have one of these exif tags to be considered
    // a valid image file and processed. This is due to the exif
    // tool processing any file without reporting if it's an image/video or not
    if (!this._configStore.has('validExifTags')) {
      this._configStore.set('validExifTags',
        [
          'ImageWidth'
        ])
    }

    /** @type {String|Array} */
    let source = argv.source || argv.s || this._configStore.get('source') || []
    const destination = argv.destination || argv.d || this._configStore.get('destination') || null

    // '--watch' must be explicitly set to 'false' to stop watching
    let watch = this._configStore.get('watch') || false
    if (argv.watch === 'false') watch = false
    if (argv.watch === true || argv.watch === 'true') watch = true

    if (typeof source === 'string') source = [].concat(source.split(','))

    if (source.length === 0) {
      Logger.error('Must have at least one source directory', 'AppConfig')
      process.exit(1)
    }

    source.forEach((sourceDir) => {
      if (!fse.existsSync(sourceDir)) {
        Logger.error(`Source directory "${sourceDir}" doesn't exist`, 'AppConfig')
        process.exit(1)
      }
    })

    if (destination === null) {
      Logger.error('Must have an import destination', 'AppConfig')
      process.exit(1)
    }

    if (!fse.existsSync(destination)) {
      Logger.error(`Destination directory "${destination}" doesn't exist`, 'AppConfig')
      process.exit(1)
    }

    Logger.verbose(`Using source directories: ${source.join(', ')}`, 'AppConfig')
    Logger.verbose(`Using destination directory: ${destination}`, 'AppConfig')
    Logger.verbose(`Watch for changes: ${watch}`, 'AppConfig')

    this._configStore.set('source', source)
    this._configStore.set('destination', destination)
    this._configStore.set('watch', watch)
  }

  get source () {
    return this._configStore.get('source')
  }

  get destination () {
    return this._configStore.get('destination')
  }

  get shouldWatch () {
    return this._configStore.get('watch')
  }

  get validExifTags () {
    return this._configStore.get('validExifTags')
  }
}

module.exports = new AppConfig()
