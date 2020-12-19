// const { spawn } = require('child_process')

// const ls = spawn('ls', ['-lh', '/usr'])

// var ps = require('ps-node')

// // A simple pid lookup
// ps.lookup({
//   command: 'node',
//   arguments: '--debug'
// }, function (err, resultList) {
//   if (err) {
//     throw new Error(err)
//     }

//   resultList.forEach(function (process) {
//     if (process) {
//       console.log('PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments)
//         }
//   })
// })

const fse = require('fs-extra')

var daemon = require('daemonize2').setup({
  main: 'Daemon.js',
  name: 'PhotoImport',
  pidfile: './PhotoImport.pid',
  argv: ['child'],
  cwd: __dirname,
  silent: true
})

daemon
  .on('starting', function () {
    console.log('Starting daemon...')
  })
  .on('started', function (pid) {
    console.log('Daemon started. PID: ' + pid)
  })
  .on('stopping', function () {
    console.log('Stopping daemon...')
  })
  .on('stopped', function (pid) {
    console.log('Daemon stopped.')
  })
  .on('running', function (pid) {
    console.log('Daemon already running. PID: ' + pid)
  })
  .on('notrunning', function () {
    console.log('Daemon is not running')
  })
  .on('error', function (err) {
    console.log('Daemon failed to start:  ' + err.message)
  })

switch (process.argv[2]) {
  case 'start':
    // Not running
    if (daemon.status() !== 0) {
      console.log('Already running')
    } else {
      daemon.start()
    }

    break

  case 'stop':
    daemon.stop()
    break

  case 'child':
    fse.appendFileSync('output.txt', process.argv + '\r')

    setInterval(() => {
      fse.appendFileSync('output.txt', 'hello\r')
    }, 2000)
    break

  default:
    console.log('Usage: [start|stop]')
}
