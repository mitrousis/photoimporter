const { createLogger, format, transports } = require('winston')
const colors = require('colors/safe')

// This is a singleton class for logging
class Logger {
  constructor () {
    this.winstonLogger = createLogger({
      transports: [
        new transports.Console({
          format: this._getWinstonFormat(true)
        })
      ]
    })

    // Default
    this.level = 'verbose'

    // Override from env, if availale
    if (process && process.env.LOG_LEVEL) {
      this.level = process.env.LOG_LEVEL
    }
  }

  setLoggingFile (filename) {
    this.winstonLogger.add(
      new transports.File({
        filename,
        format: this._getWinstonFormat(false)
      })
    )
  }

  flushLogs () {
    return new Promise((resolve, reject) => {
      this.winstonLogger.on('finish', (info) => {
        resolve()
      })

      this.winstonLogger.end()
    })
  }

  set level (level) {
    const validLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']

    if (validLevels.indexOf(level) === -1) {
      level = 'info'
    }

    this.winstonLogger.level = level
  }

  get level () {
    return this.winstonLogger.level
  }

  /**
   * Avoid sending color data to file logs
   * @param {boolean} useColor
   */
  _getWinstonFormat (useColor = true) {
    const combineOptions = []

    if (useColor) combineOptions.push(format.colorize())

    combineOptions.push(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZZ' })
    )

    combineOptions.push(
      format.printf(info => {
        let timestamp = info.timestamp
        let section = ''
        let errorDetails = ''

        if (useColor) {
          timestamp = colors.dim.yellow(timestamp)
        }

        if (info.section && useColor) {
          section = colors.blue(`[${info.section}] `)
        } else {
          section = `[${info.section}] `
        }

        if (info.errorDetails && useColor) {
          errorDetails = `\n ${colors.dim.red('[Error details]')}\n   ${colors.gray(info.errorDetails)}`
        } else if (info.errorDetails) {
          errorDetails = `\n [Error details]\n   ${info.errorDetails}`
        }

        return `${timestamp} ${section}${info.level}: ${info.message}${errorDetails}`
      })
    )

    return format.combine(...combineOptions)
  }

  /**
   * Logging wrapper. Levels from winston:
   * error: 0
   * warn: 1
   * info: 2
   * verbose: 3
   * debug: 4
   * silly: 5
   * @param {string} message
   * @param {string} level - see levels
   * @param {string} section - used to categorize the log, e.g., a ClassName
   */
  log (message, level = 'info', section = null, errorDetails = null) {
    this.winstonLogger.log(level, message, { section, errorDetails })
  }

  // Shortcut methods
  /**
   * @param {string} message
   * @param {string} section
   * @param {error} errorObject
   * @returns {error} new error with messaging that can be passes along
   */
  error (message, section = '(no section)', error = null) {
    const originatingErrorMessage = (error) ? error.message : null
    const errorStack = (error && error.stack) ? error.stack : ''

    this.log(message, 'error', section, errorStack)

    // Create a more detailed error message for responding back to user
    const detailedError = new Error()
    detailedError.message = `${section}: ${message}.`
    detailedError.stack = errorStack

    if (originatingErrorMessage) detailedError.message += ` Originating error: ${originatingErrorMessage}`

    return detailedError
  }

  warn (message, section) {
    this.log(message, 'warn', section)
  }

  info (message, section) {
    this.log(message, 'info', section)
  }

  verbose (message, section) {
    this.log(message, 'verbose', section)
  }

  debug (message, section) {
    this.log(message, 'debug', section)
  }
}

module.exports = new Logger()
