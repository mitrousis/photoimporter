const fse = require('fs-extra')
const path = require('path')
const { spawn, execSync } = require('child_process')
const os = require('os')

const jestTestVariables = JSON.parse(process.env.jestTestVariables)
const mediaFixtures = path.join(__dirname, './_fixtures/media')

/**
 * These end to end tests are currently only supported on OSX
 * These run the command line PhotoImporter script with arguments
 * All files in the /media fixtures are processed
 */
if (os.platform() === 'darwin') {
  describe('PhotoImporter end-to-end tests', () => {
    const sourceDir = path.join(jestTestVariables.sourcePath, './e2e')
    const targetDir = path.join(jestTestVariables.destPath, './e2e')

    beforeAll(() => {
      fse.mkdirpSync(sourceDir)
      fse.mkdirpSync(targetDir)
    })

    afterAll(() => {
      _detachTestImage()
    })

    test('Should copy media folder and have expected dates', (done) => {
      const proc = spawn('node', ['index.js', `--directories=${sourceDir}`, '--drives=TEST_IMAGE', `--destination=${targetDir}`, '--watch=true'])

      let stoutTimeout

      proc.stdout.on('data', (data) => {
        console.log(data.toString())
        if (stoutTimeout) clearTimeout(stoutTimeout)
        // Wait 8 seconds after the last stout event to kill since there is no "complete" message fired
        stoutTimeout = setTimeout(() => {
          proc.kill()
        }, 8000)
      })

      proc.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`)
      })

      proc.on('close', (code) => {
        // These are all the paths that are expected after completion
        const paths = [
          path.join(targetDir, '2005-05/old_video.avi'),
          path.join(targetDir, '2017-11/iphone_photo_2.jpg'),
          path.join(targetDir, '2017-11/iphone_photo.jpg'),
          path.join(targetDir, '2017-11/iphone_video.mov'),
          path.join(targetDir, '2017-11/sd-image.jpg'),
          path.join(targetDir, '2021-06/iphone_photo_app_saved.jpg'),
          // Files that should not have been copied
          path.join(sourceDir, 'not_a_photo.txt'),
          path.join(sourceDir, 'not_a_photo.txt.zip')
        ]

        paths.map((path) => {
          expect(fse.pathExistsSync(path)).toBeTruthy()
        })
        done()
      })

      // Copy all the files in the media folder, should start
      fse.copySync(mediaFixtures, sourceDir)
      // Wait, then mount the SD
      setTimeout(() => {
        _attachTestImage()
      }, 1000)
    }, 100000)
  })
} else {
  console.log('End-to-end tests are only supported on Darwin')
}

function _attachTestImage () {
  const imagePath = path.join(__dirname, './_fixtures/TEST_IMAGE.dmg')
  execSync(`hdiutil attach ${imagePath}`)
}

function _detachTestImage () {
  execSync('hdiutil detach /Volumes/TEST_IMAGE')
}
