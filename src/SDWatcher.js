const drivelist = require('drivelist')
const Watcher = require('./Watcher')
const Logger = require('./Logger')
/**
 * Watches for specified removable disks, then adds their
 * mountpoint to watcher to be watched for changes
 */
class SDWatcher extends Watcher {
  constructor () {
    super()

    this._validDriveLabels = []
    this._sdCardPollingInterval = 2000
    this._sdCardPollingTimeoutRef = null
    this._knownSDCards = []
  }

  /**
   *
   * @param {Array<String>} driveLabels array of valid drive labels that will trigger a copy
   */
  watch (driveLabels) {
    this._validDriveLabels = driveLabels
    this._nextDrivePoll()
  }

  stop () {
    clearTimeout(this._sdCardPollingTimeoutRef)
    return super.stop()
  }

  async _nextDrivePoll () {
    const newSDCards = await this._getNewSDCards()

    if (newSDCards.length > 0) {
      // Start watching
      newSDCards.forEach((newCard) => {
        Logger.info(`New removable drive found: "${newCard.label}"`, 'SDWatcher')
        // Path will be watched by chokidir
        super.watch(newCard.path)
      })
    }

    this._knownSDCards = this._knownSDCards.concat(newSDCards)

    // Start polling over again
    this._sdCardPollingTimeoutRef = setTimeout(() => {
      this._nextDrivePoll()
    }, this._sdCardPollingInterval)
  }

  async _getNewSDCards () {
    const currDriveList = await drivelist.list()
    const mountedDrivesStatus = this._getMountedSDCards(currDriveList)
    return this._compareDrivesStatus(this._knownSDCards, mountedDrivesStatus)
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
      // Looking at drive labels for removable drives
      // instead of targeting SD cards specifically
      if (drive.isRemovable) {
        const label = drive.mountpoints[0].label

        // Only include valid drive labels
        if (this._validDriveLabels.indexOf(label) > -1) {
          const props = {
            device: drive.device,
            // Assume 1 mountpoint
            path: drive.mountpoints[0].path,
            label
          }

          mountedSDCards.push(props)
        }
      }
    }

    return mountedSDCards
  }
}

module.exports = SDWatcher
