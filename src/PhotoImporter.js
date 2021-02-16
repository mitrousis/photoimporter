const AppConfig = require('./AppConfig')
const FilesProcessor = require('./FilesProcessor')

AppConfig.parseCli()
const fp = new FilesProcessor(AppConfig.directories, AppConfig.destination, AppConfig.drives, AppConfig.shouldWatch)
