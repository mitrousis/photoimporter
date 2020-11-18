// Super quick extraction of exif data to json files for testing

const { exiftool } = require('exiftool-vendored')

const filePath = process.argv[2]

exiftool
  .read(filePath)
  .then((tags) => {
    console.log(JSON.stringify(tags, null, 2))
  })
  .finally(() => {
    return exiftool.end()
  })
