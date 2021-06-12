const FilesProcessor = require('../src/FilesProcessor')
const fse = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const os = require('os')

const jestTestVariables = JSON.parse(process.env.jestTestVariables)
const mediaFixtures = path.join(__dirname, './_fixtures/media')

describe('FilesProcessor integration tests', () => {
  let fp

  afterEach((done) => {
    fp.removeAllListeners(FilesProcessor.EVENT_COMPLETE)
    fp.stop()
      .then(() => {
        done()
      })
  })

  test('Should move images into their expected destination folder when run once', (done) => {
    // Setup some test files
    for (var i = 0; i < 10; i++) {
      fse.copyFileSync(
        path.join(mediaFixtures, 'iphone_photo.jpg'),
        path.join(jestTestVariables.sourcePath, `test_image_${i}.jpg`)
      )
    }

    const expectedValidPath = path.join(jestTestVariables.destPath, './2017-11/test_image_9.jpg')

    fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, null, false)

    fp.on(FilesProcessor.EVENT_COMPLETE, () => {
      // Quick check that the last file was copied
      expect(fse.pathExistsSync(expectedValidPath)).toEqual(true)
      done()
    })
  }, 12000)

  // --- Only run these on OSX
  if (os.platform() === 'darwin') {
    describe('Removable disk tests', () => {
      afterAll(() => {
        _detachTestImage()
      })

      test('Should detect mounted removable drive, and copy the file inside', (done) => {
        const expectedValidPath = path.join(jestTestVariables.destPath, './2017-11/sd-image.jpg')
        const expectedSDPath = '/Volumes/TEST_IMAGE/DCIM/100TEST/sd-image.jpg'

        // Note that watch should be -true- in order to wait for the disk to mount
        fp = new FilesProcessor(jestTestVariables.sourcePath, jestTestVariables.destPath, ['TEST_IMAGE'], true)

        fp.on(FilesProcessor.EVENT_COMPLETE, () => {
        // Quick check that the last file was copied
          expect(fse.pathExistsSync(expectedValidPath)).toEqual(true)
          expect(fse.pathExistsSync(expectedSDPath)).toEqual(true)
          done()
        })

        setTimeout(() => {
          _attachTestImage()
        }, 500)
      }, 25000)
    })
  }
})

function _attachTestImage () {
  const imagePath = path.join(__dirname, './_fixtures/TEST_IMAGE.dmg')
  execSync(`hdiutil attach ${imagePath}`)
}

function _detachTestImage () {
  try {
    execSync('hdiutil detach /Volumes/TEST_IMAGE')
  } catch (e) {

  }
}
