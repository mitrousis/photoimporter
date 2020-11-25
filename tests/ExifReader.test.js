const ExifReader = require('../src/ExifReader')
const path = require('path')
const fse = require('fs-extra')

describe('ExifReader', () => {
  const fixtures = path.join(__dirname, './_fixtures/')
  const exifReader = new ExifReader()

  test('#_confirmValidTags() expect valid ImageWidth tag in image file', () => {
    const tags = fse.readJsonSync(path.join(fixtures, '/exif/exif_test_iphone_1.json'))
    expect(exifReader._confirmValidTags(tags, ['ImageWidth'])).toEqual(true)
  })

  test('#_confirmValidTags() expect missing ImageWidth tag in non-image file', () => {
    const tags = fse.readJsonSync(path.join(fixtures, '/exif/exif_test_zip.json'))
    expect(exifReader._confirmValidTags(tags, ['ImageWidth'])).toEqual(false)
  })

  test.each([
    ['exif_test_iphone_1.json', new Date(2017, 10, 9, 16, 27, 22, 0)],
    ['exif_test_iphone_video.json', new Date(2017, 10, 9, 16, 29, 26, 0)],
    ['exif_test_old_video.json', new Date(2005, 4, 14, 23, 42, 21, 0)]
  ])(
    '#_getDateFromTags() %s, expected date: %s',
    (fileName, expectedDate) => {
      const tags = fse.readJsonSync(path.join(fixtures, '/exif/', fileName))

      expect(exifReader._getDateFromTags(tags)).toEqual(expectedDate)
    }
  )

  test.each([
    [new Date(2017, 10, 9, 16, 29, 26, 0), '2017-11'],
    [new Date(2005, 4, 14, 23, 42, 21, 0), '2005-05']
  ])(
    '#_getFolderFromDate() %s, expected folder name: %s',
    (date, expectedFolder) => {
      expect(exifReader._getFolderFromDate(date)).toEqual(expectedFolder)
    }
  )

  test.each([
    ['iphone_photo_2.jpg', '2017-11'],
    ['iphone_photo.jpg', '2017-11'],
    ['iphone_video.mov', '2017-11'],
    ['old_video.avi', '2005-05']
  ])(
    '#getDateFolder() from %s, expected folder name: %s',
    (fileName, expectedFolder) => {
      return expect(exifReader.getDateFolder(path.join(fixtures, '/media/', fileName))).resolves.toEqual(expectedFolder)
    }
  )
})
