const SDWatcher = require('../src/SDWatcher')
const { execSync } = require('child_process')
const path = require('path')
const driveListNoSD = require('./_fixtures/drivelist-no-sd.json')
const driveListWithSD = require('./_fixtures/drivelist-with-sd.json')
const Watcher = require('../src/Watcher')

describe('SDWatcher unit tests', () => {
  const validDriveLabels = ['NO NAME']

  test('#_filterRemovableDrives() should not find drives is nothing is mounted', () => {
    const sdWatcher = new SDWatcher()
    sdWatcher._validDriveLabels = validDriveLabels

    expect(sdWatcher._filterRemovableDrives(driveListNoSD)).toBeInstanceOf(Array)
    expect(sdWatcher._filterRemovableDrives(driveListNoSD).length).toEqual(0)
  })

  test('#_filterRemovableDrives() should find removable drives', () => {
    const sdWatcher = new SDWatcher()
    sdWatcher._validDriveLabels = validDriveLabels

    expect(sdWatcher._filterRemovableDrives(driveListWithSD)).toEqual(
      expect.arrayContaining([
        {
          device: '/dev/disk2',
          path: '/Volumes/NO NAME',
          label: 'NO NAME'
        }
      ])
    )
  })
})

describe('SDWatcher integration tests', () => {
  let sdWatcher

  afterEach(() => {
    sdWatcher.stop()
    sdWatcher.removeAllListeners(Watcher.EVENT_FILE_LIST_UPDATED)
    _detachTestImage()
  })

  test('Adding same drive to watcher should not change watched paths', (done) => {
    sdWatcher = new SDWatcher()
    sdWatcher._sdCardPollingInterval = 2000

    sdWatcher.watch('TEST_IMAGE')

    _attachTestImage()

    setTimeout(() => {
      expect(sdWatcher._chokidarWatcher.getWatched()).toHaveProperty('/Volumes/TEST_IMAGE')
      done()
    }, 6000)
  }, 20000)

  test('Volume should be able to mount and unmount more than once', (done) => {
    sdWatcher = new SDWatcher()

    let mountCount = 0

    const waitAndMount = () => {
      setTimeout(() => {
        mountCount++
        _attachTestImage()
      }, 500)
    }

    sdWatcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (fileList) => {
      sdWatcher.filesProcessingComplete()
        .then(() => {
          if (mountCount === 2) {
            expect(true).toBeTruthy()
            done()
          } else {
            waitAndMount()
          }
        })
    })

    sdWatcher.watch('TEST_IMAGE')
    waitAndMount()
  }, 100000)

  test('Calling filesProcessingComplete() before and after a drive is mounted should not error', (done) => {
    sdWatcher = new SDWatcher()

    const waitAndMount = () => {
      setTimeout(() => {
        _attachTestImage()
      }, 500)
    }

    // Start watching
    sdWatcher.watch('TEST_IMAGE')

    // Called before mount
    sdWatcher.filesProcessingComplete()
      .then(() => {
        waitAndMount()
      })

    // Wait for files to be found
    sdWatcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (fileList) => {
      // Trigger complete
      sdWatcher.filesProcessingComplete()
        .then(() => {
          // Then trigger complete again, explicitly calling done
          expect(sdWatcher.filesProcessingComplete()).resolves.toBeUndefined()
            .then(() => done())
        })
    })
  }, 100000)
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
