const FilesProcessor = require('../src/FilesProcessor')
const fse = require('fs-extra')
const path = require('path')

const jestTestVariables = JSON.parse(process.env.jestTestVariables)

describe('FilesProcessor', () => {
  const mediaFixtures = path.join(__dirname, './_fixtures/media')

  test('Should move images into their expected destination folder when run once', (done) => {
    const duplicatesDir = path.join(jestTestVariables.sourcePath, './duplicates-test')

    // Setup some test files
    for (var i = 0; i < 10; i++) {
      fse.copyFileSync(
        path.join(mediaFixtures, 'iphone_photo.jpg'),
        path.join(jestTestVariables.sourcePath, `test_image_${i}.jpg`)
      )
    }

    const expectedValidPath = path.join(jestTestVariables.destPath, './2017-11/test_image_9.jpg')

    const fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, duplicatesDir, false, false)

    fp.on(FilesProcessor.EVENT_COMPLETE, () => {
      // Quick check that the last file was copied
      expect(fse.pathExistsSync(expectedValidPath)).toEqual(true)
      done()
    })
  }, 8000)

  // beforeAll(() => {
  //   fse.mkdirpSync(testFolder)
  //   fse.mkdirpSync(testFolderDest)
  // })

  // afterAll(() => {
  //   fse.removeSync(testFolder)
  // })
})
