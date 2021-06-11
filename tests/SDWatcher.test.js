const SDWatcher = require('../src/SDWatcher')
const { execSync } = require('child_process')
const path = require('path')
const driveListNoSD = require('./_fixtures/drivelist-no-sd.json')
const driveListWithSD = require('./_fixtures/drivelist-with-sd.json')
const Watcher = require('../src/Watcher')
const { removeAllListeners } = require('process')

describe('SDWatcher unit tests', () => {
  const validDriveLabels = ['NO NAME']

  test('#_getMountedSDCards() should not find drives is nothing is mounted', () => {
    const sdWatcher = new SDWatcher()
    sdWatcher._validDriveLabels = validDriveLabels

    expect(sdWatcher._getMountedSDCards(driveListNoSD)).toBeInstanceOf(Array)
    expect(sdWatcher._getMountedSDCards(driveListNoSD).length).toEqual(0)
  })

  test('#_getMountedSDCards() should find drives', () => {
    const sdWatcher = new SDWatcher()
    sdWatcher._validDriveLabels = validDriveLabels

    expect(sdWatcher._getMountedSDCards(driveListWithSD)).toEqual(
      expect.arrayContaining([
        {
          device: '/dev/disk2',
          path: '/Volumes/NO NAME',
          label: 'NO NAME'
        }
      ])
    )
  })

  test('#_nextDrivePoll() should update known drive list when drive is found', (done) => {
    const sdWatcher = new SDWatcher()

    const expectedDrive1 = {
      device: '/dev/disk2',
      path: '/Volumes/NEW DRIVE',
      label: 'NEW DRIVE'
    }

    // Mock function
    sdWatcher._getMountedSDCards = function () {
      return [
        expectedDrive1
      ]
    }

    expect(sdWatcher._nextDrivePoll())
      .resolves.toEqual(undefined)
      .then(() => {
        expect(sdWatcher._knownSDCards).toEqual(
          expect.arrayContaining([
            expectedDrive1
          ])
        )
        sdWatcher.stop()
          .then(() => {
            done()
          })
      })
  })

  describe('#_compareDrivesStatus()', () => {
    let sdWatcher, expectedDrive1, expectedDrive2

    beforeAll(() => {
      sdWatcher = new SDWatcher()
      expectedDrive1 = {
        device: '/dev/disk2',
        path: '/Volumes/NEW DRIVE',
        label: 'NEW DRIVE'
      }

      expectedDrive2 = {
        device: '/dev/disk3',
        path: '/Volumes/NEW DRIVE 2',
        label: 'NEW DRIVE 2'
      }
    })

    test('should return one unique new drive', () => {
      const currDrivesStatus = []
      const newDrivesStatus = [expectedDrive1]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toEqual(
        expect.arrayContaining([expectedDrive1])
      )
    })

    test('should return no unique drives when there is an existing drive', () => {
      const currDrivesStatus = [expectedDrive1]
      const newDrivesStatus = [expectedDrive1]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toHaveLength(0)
    })

    test('should return no unique drives when one is removed', () => {
      const currDrivesStatus = [expectedDrive1]
      const newDrivesStatus = []

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toHaveLength(0)
    })

    test('should return two unique drives', () => {
      const currDrivesStatus = []
      const newDrivesStatus = [expectedDrive1, expectedDrive2]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toEqual(
        expect.arrayContaining([expectedDrive1, expectedDrive2])
      )
    })
  })
})

describe('SDWatcher integration tests', () => {
  let sdWatcher

  afterEach(() => {
    sdWatcher.stop()
    sdWatcher.removeAllListeners(Watcher.EVENT_FILE_LIST_UPDATED)
    _detachTestImage()
  })

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
