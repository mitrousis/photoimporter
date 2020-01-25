
// const path = require('path')
// const fse = require('fs-extra')

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
})
