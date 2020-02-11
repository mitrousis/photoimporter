const drivelist = require('drivelist')
const Watcher = require('./Watcher')

class SDWatcher extends Watcher {
  constructor () {
    super()

    this._sdCardPollingInterval = 4000
    this._sdCardPollingTimeoutRef = null
    this._detectedDrives = []
  }

  pollForSDCard () {
    this._sdCardPollingTimeoutRef = setTimeout(() => {

    })
  }

  _compareDrivesStatus (currDrivesStatus, newDrivesStatus) {
    const foundNewDrives = newDrivesStatus.filter((newDrive) => {
      // Checks if this drive path is already in list
      const found = currDrivesStatus.findIndex((currDrive) => {
        return currDrive.path === newDrive.path
      })

      return found
    })

    return foundNewDrives
  }

  /**
   * Returns the SD card mount points, if available
   * @param {array} driveList
   */
  _getMountedSDCards (driveList) {
    const mountedSDCards = []

    for (const drive of driveList) {
      // Only checking for isCard - would need to adjust
      // this logic if other drive types are to be included
      if (drive.isCard) {
        const props = {
          device: drive.device,
          // Assume 1 mountpoint
          path: drive.mountpoints[0].path,
          name: drive.mountpoints[0].label
        }

        mountedSDCards.push(props)
      }
    }

    return mountedSDCards
  }
}

module.exports = SDWatcher
// drivelist.list()
//   .then((drives) => {
//     console.log(JSON.stringify(drives, null, 1))
//     // drives.forEach((drive) => {
//     //   console.log(JSON.stringify(drive.mountpoints, null, 1))
//     // })
//   })
