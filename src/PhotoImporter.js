const cliArguments = require('./Cli')
const FilesProcessor = require('./FilesProcessor')

console.log(cliArguments)

const fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, duplicatesDir, null, false)
