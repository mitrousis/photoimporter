const ExifReader = require('../src/ExifReader')
const path = require('path')
const fse = require('fs-extra')

describe('ExifReader', () => {
  const testFolder = path.join(__dirname, './_fixtures/exif/')
  const exifReader = new ExifReader()

  test.each([
    ['exif_test_iphone_1.json', new Date(2017, 10, 9, 16, 27, 22, 0)],
    ['exif_test_iphone_video.json', new Date(2017, 10, 9, 16, 29, 26, 0)],
    ['exif_test_old_video.json', new Date(2005, 4, 14, 23, 42, 21, 0)]
  ])(
    'Test Exif: %s, expected date: %s',
    (fileName, expectedDate) => {
      const tags = fse.readJsonSync(path.join(testFolder, fileName))

      expect(exifReader._getDateFromTags(tags)).toEqual(expectedDate)
    }
  )
})
