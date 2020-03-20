const Configstore = require('configstore')
const { argv } = require('yargs')
const Logger = require('./Logger')
const fse = require('fs-extra')

class AppConfig {
  constructor () {
    const configStore = new Configstore('photoimporter')

    /** @type {String|Array} */
    let source = argv.source || argv.s || configStore.get('source') || []
    const destination = argv.destination || argv.d || configStore.get('destination') || null
    const watch = argv.watch || configStore.get('watch') || false

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

    configStore.set('source', source)
    configStore.set('destination', destination)
    configStore.set('watch', watch)
  }
}

module.exports = new AppConfig()
