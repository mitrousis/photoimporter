const Configstore = require('configstore')
const yargs = require('yargs/yargs')
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

    const parsed = yargs(process.argv.slice(2))
      .options({
        directories: {
          describe: 'Directories to import/watch',
          demandOption: false,
          type: 'array'
        },
        drives: {
          describe: 'Removable drive labels to import/watch',
          demandOption: false,
          type: 'array'
        },
        destination: {
          describe: 'Target directory for copying',
          type: 'string',
          demandOption: false
        },
        watch: {
          describe: 'Continue watching directories/drives for changes',
          default: null,
          type: 'boolean'
        }
      })
      .check((argv) => {
        // Ensure watch folders or watch drives is avail
        let hasValidArguments = false
        if (argv.directories && argv.directories.length) hasValidArguments = true
        if (argv.drives && argv.drives.length) hasValidArguments = true
        if (this._configStore.get('directories') && this._configStore.get('directories').length) hasValidArguments = true
        if (this._configStore.get('drives') && this._configStore.get('drives').length) hasValidArguments = true

        if (!hasValidArguments) {
          throw new Error('At least one of directories or drives must be provided or present in stored config')
        }

        // Check for destination
        hasValidArguments = false
        if (argv.destination) hasValidArguments = true
        if (this._configStore.get('destination')) hasValidArguments = true

        if (!hasValidArguments) {
          throw new Error('Destination must be provided or present in stored config')
        }

        return true
      })
      .help()
      .argv

    let { directories, drives, destination, watch } = parsed

    directories = directories || this._configStore.get('directories') || []
    drives = drives || this._configStore.get('drives') || []
    destination = destination || this._configStore.get('destination')

    // '--watch' must be explicitly set to 'false' to stop watching
    watch = (watch === null) ? !!this._configStore.get('watch') : watch

    directories.forEach((dir) => {
      if (!fse.existsSync(dir)) {
        Logger.error(`Source directory: ${dir} does not exist`, 'AppConfig')
        process.exit(1)
      }
    })

    if (!fse.existsSync(destination)) {
      Logger.error(`Destination directory: ${destination} does not exist`, 'AppConfig')
      process.exit(1)
    }

    this._configStore.set('directories', directories)
    this._configStore.set('drives', drives)
    this._configStore.set('destination', destination)
    this._configStore.set('watch', watch)

    Logger.verbose(`Using source directory(s): ${directories.join(', ')}`, 'AppConfig')
    Logger.verbose(`Using source drive(s): ${drives.join(', ')}`, 'AppConfig')
    Logger.verbose(`Using destination directory: ${destination}`, 'AppConfig')
    Logger.verbose(`Watch for changes: ${watch}`, 'AppConfig')
  }

  /**
   * @returns {Array} Array of source folders
   */
  get directories () {
    return this._configStore.get('directories')
  }

  get drives () {
    return this._configStore.get('drives')
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
