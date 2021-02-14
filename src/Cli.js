
const yargs = require('yargs/yargs')

const parsed = yargs(process.argv.slice(2))
  .options({
    watchFolders: {
      describe: 'Directories to watch',
      demandOption: false,
      type: 'array'
    },
    watchDrives: {
      describe: 'Removable drive labels to watch',
      demandOption: false,
      type: 'array'
    },
    target: {
      describe: 'Target directory for copying',
      type: 'string',
      demandOption: true
    },
    watch: {
      describe: 'Continue watching directories/drives for changes',
      default: false,
      type: 'boolean'
    }
  })
  .check((argv) => {
    // Ensure watch folders or watch drives is avail
    let hasSources = false
    if (argv.watchDrives && argv.watchDrives.length) hasSources = true
    if (argv.watchFolders && argv.watchFolders.length) hasSources = true

    if (!hasSources) {
      throw new Error('At least one of watchFolders or watchDrives must be provided')
    }

    return hasSources
  })
  .help()
  .argv

module.exports = parsed
