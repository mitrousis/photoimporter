const fse = require('fs-extra')

// async function doit () {
//   try {
//     await fse.move('./fileA.txt', './fileC.txt', {
//       overwrite: false
//     })
//   } catch (error) {
//     console.log(error.code)
//   }
// }

async function doit () {
  try {
    await fse.copy('./fileB.txt', './fileC.txt', {
      overwrite: false,
      errorOnExist: true,
      preserveTimestamps: true
    })
  } catch (error) {
    console.log(error.message)
  }
}

doit()

// const SDWatcher = require('./src/SDWatcher')

// const watch = new SDWatcher()

// watch.watch()
// async function f () {
//   const driveStat = await watch._checkForNewDrives()

//   console.log(driveStat)
// }

// f()
// const chokidar = require('chokidar')

// // const pattern = '*/*.{jpg,JPG,png,PNG,mp4,MP4,jpeg,JPEG,avi,AVI,raw,RAW}'
// const volume = '/Volumes/NO NAME/'

// // console.log(volume + pattern)
// const watcher = chokidar.watch(volume, {
//   // ignored: /.*\.(?!(png|jpg|jpeg|mp4|avi|mov|raw|tif|tiff))/i,
//   persistent: true
// })

// const files = []

// // Add event listeners.
// watcher
//   .on('add', path => {
//     console.log('add', path)
//     // files.push(path)
//   })
//   // .on('change', path => {
//   //   console.log('change', path)
//   //   // files.push(path)
//   // })
//   .on('ready', () => {
//     // console.log(files)
//     console.log('> ready')
//   })
//   // .on('unlinkDir', path => console.log(`File ${path} has been removed`))
//   // .on('addDir', path => console.log(`Directory ${path} has been added`))
