const fse = require('fs-extra')
const path = require('path')

// Some global setup before any tests
module.exports = async () => {
  const appConfigTestFolder = path.join(__dirname, './_fixtures/appConfigTest/')

  fse.removeSync(appConfigTestFolder)
}
