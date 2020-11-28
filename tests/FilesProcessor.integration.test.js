const FilesProcessor = require('../src/FilesProcessor')
const fse = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const os = require('os')

const jestTestVariables = JSON.parse(process.env.jestTestVariables)

describe('FilesProcessor', () => {
  const mediaFixtures = path.join(__dirname, './_fixtures/media')
  const duplicatesDir = path.join(jestTestVariables.sourcePath, './duplicates-test')

  test.skip('Should move images into their expected destination folder when run once', (done) => {
    // Setup some test files
    for (var i = 0; i < 10; i++) {
      fse.copyFileSync(
        path.join(mediaFixtures, 'iphone_photo.jpg'),
        path.join(jestTestVariables.sourcePath, `test_image_${i}.jpg`)
      )
    }

    const expectedValidPath = path.join(jestTestVariables.destPath, './2017-11/test_image_9.jpg')

    const fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, duplicatesDir, null, false)

    fp.on(FilesProcessor.EVENT_COMPLETE, () => {
      // Quick check that the last file was copied
      expect(fse.pathExistsSync(expectedValidPath)).toEqual(true)
      done()
    })
  }, 8000)

  // Only run these on OSX
  if (os.platform() === 'darwin') {
    describe('Removable disk tests', () => {
      beforeAll(() => {

      })

      afterAll(() => {
        _detachTestImage()
      })

      test('Should detect mounted removable drive, and -copy- the file inside', (done) => {
        const expectedValidPath = path.join(jestTestVariables.destPath, './2017-11/sd-image.jpg')
        const expectedSDPath = '/Volumes/TEST_IMAGE/DCIM/100TEST/sd-image.jpg'

        const fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, duplicatesDir, ['TEST_IMAGE'], false)

        fp.on(FilesProcessor.EVENT_COMPLETE, () => {
          // Quick check that the last file was copied
          expect(fse.pathExistsSync(expectedValidPath)).toEqual(true)
          expect(fse.pathExistsSync(expectedSDPath)).toEqual(true)
          done()
        })

        setTimeout(() => {
          _attachTestImage()
        }, 1000)
      }, 8000)
    })
  }
})

function _attachTestImage () {
  const imagePath = path.join(__dirname, './_fixtures/TEST_IMAGE.dmg')
  execSync(`hdiutil attach ${imagePath}`)
}

function _detachTestImage () {
  execSync('hdiutil detach /Volumes/TEST_IMAGE')
}
