const drivelist = require('drivelist')
const Watcher = require('./Watcher')
const logger = require('./Logger')

class SDWatcher extends Watcher {
  constructor () {
    super()

    this._sdCardPollingInterval = 2000
    this._sdCardPollingTimeoutRef = null
    this._knownSDCards = []
  }

  watch () {
    this._nextDrivePoll()
  }

  async _nextDrivePoll () {
    const newSDCards = await this._getNewSDCards()

    if (newSDCards.length > 0) {
      // Start watching
      newSDCards.forEach((newCard) => {
        logger.info('Found new SD card:', newCard)
        const watchPath = newCard.path
        super.watch(watchPath)
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
