const SDWatcher = require('../src/SDWatcher')
const driveListNoSD = require('./_fixtures/drivelist-no-sd.json')
const driveListWithSD = require('./_fixtures/drivelist-with-sd.json')

describe('SDWatcher', () => {
  test('#_getMountedSDCards() should not find SD drives', () => {
    const sdWatcher = new SDWatcher()

    expect(sdWatcher._getMountedSDCards(driveListNoSD)).toBeInstanceOf(Array)
    expect(sdWatcher._getMountedSDCards(driveListNoSD).length).toEqual(0)
  })

  test('#_getMountedSDCards() should find SD drives', () => {
    const sdWatcher = new SDWatcher()

    expect(sdWatcher._getMountedSDCards(driveListWithSD)).toEqual(
      expect.arrayContaining([
        {
          device: '/dev/disk2',
          path: '/Volumes/NO NAME',
          name: 'NO NAME'
        }
      ])
    )
  })

  describe('#_compareDrivesStatus()', () => {
    let sdWatcher, expectedDrive1, expectedDrive2

    beforeAll(() => {
      sdWatcher = new SDWatcher()
      expectedDrive1 = {
        device: '/dev/disk2',
        path: '/Volumes/NEW DRIVE',
        name: 'NEW DRIVE'
      }

      expectedDrive2 = {
        device: '/dev/disk3',
        path: '/Volumes/NEW DRIVE 2',
        name: 'NEW DRIVE 2'
      }
    })

    test.only('should return one unique new drive', () => {
      const currDrivesStatus = []
      const newDrivesStatus = [expectedDrive1]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toEqual(
        expect.arrayContaining([expectedDrive1])
      )
    })

    test.only('should return no unique drives when there is an existing drive', () => {
      const currDrivesStatus = [expectedDrive1]
      const newDrivesStatus = [expectedDrive1]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toHaveLength(0)
    })

    test.only('should return no unique drives when one is removed', () => {
      const currDrivesStatus = [expectedDrive1]
      const newDrivesStatus = []

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toHaveLength(0)
    })

    test.only('should return two unique drives', () => {
      const currDrivesStatus = []
      const newDrivesStatus = [expectedDrive1, expectedDrive2]

      expect(sdWatcher._compareDrivesStatus(currDrivesStatus, newDrivesStatus)).toEqual(
        expect.arrayContaining([expectedDrive1, expectedDrive2])
      )
    })
  })
})
