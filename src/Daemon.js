const Daemonize2 = require('daemonize2')
const Logger = require('./Logger')

class Daemon {
  constructor () {
    this._daemon = Daemonize2.setup({
      main: 'Daemon.js',
      name: 'PhotoImport',
      pidfile: './PhotoImportDaemon.pid',
      argv: ['child'],
      cwd: __dirname,
      silent: true
    })

    this._daemon
      .on('starting', function () {
        Logger.log('Starting daemon...')
      })
      .on('started', function (pid) {
        Logger.log('Daemon started. PID: ' + pid)
      })
      .on('stopping', function () {
        Logger.log('Stopping daemon...')
      })
      .on('stopped', function (pid) {
        Logger.log('Daemon stopped.')
      })
      .on('running', function (pid) {
        Logger.log('Daemon already running. PID: ' + pid)
      })
      .on('notrunning', function () {
        Logger.log('Daemon is not running')
      })
      .on('error', function (err) {
        Logger.log('Daemon failed to start:  ' + err.message)
      })

    switch (process.argv[2]) {
      case 'start':
        // Not running
        if (this._daemon.status() !== 0) {
          Logger.log('Already running')
        } else {
          this._daemon.start()
        }

        break

      case 'stop':
        this._daemon.stop()
        break

      case 'child':
        fse.appendFileSync('output.txt', process.argv + '\r')

        setInterval(() => {
          fse.appendFileSync('output.txt', 'hello\r')
        }, 2000)
        break

      default:
        Logger.log('Usage: [start|stop]')
    }
  }
}

module.exports = Daemon
