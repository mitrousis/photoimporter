const chokidar = require('chokidar')

const pattern = ''//* */*.{jpg,JPG,png,PNG,mp4,MP4,jpeg,JPEG,avi,AVI,raw,RAW}'
const volume = '/Volumes/NO NAME/'

console.log(volume + pattern)
const watcher = chokidar.watch(volume + pattern, {
  // ignored: /.*\.(?!(png|jpg|jpeg|mp4|avi|mov|raw|tif|tiff))/i,
  persistent: true
})

const files = []

// Add event listeners.
watcher
  .on('add', path => {
    console.log(path)
    // files.push(path)
  })
  .on('ready', () => {
    // console.log(files)
    console.log('> ready')
  })
  .on('unlinkDir', path => console.log(`File ${path} has been removed`))
  .on('addDir', path => console.log(`Directory ${path} has been added`))
