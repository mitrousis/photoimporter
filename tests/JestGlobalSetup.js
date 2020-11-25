const fse = require('fs-extra')
const path = require('path')

// Some global setup before any tests
module.exports = async () => {
  const appConfigTestFolder = path.join(__dirname, './_fixtures/appConfigTest/')

  const appConfigPath = process.env.CONFIG_PATH = path.join(appConfigTestFolder, './app-config.json')

  const sourcePath = path.join(appConfigTestFolder, './test-source')
  const destPath = path.join(appConfigTestFolder, './test-destination')

  fse.mkdirpSync(sourcePath)
  fse.mkdirpSync(destPath)

  fse.writeJSONSync(
    appConfigPath,
    {
      source: [
        sourcePath
      ],
      destination: destPath,
      validExifTags: [
        'ImageWidth'
      ],
      watch: false
    })
}
