const fse = require('fs-extra')

const jestTestVariables = JSON.parse(process.env.jestTestVariables)

// Some global setup before any tests
module.exports = async () => {
  // fse.removeSync(jestTestVariables.appConfigTestFolder)
}
