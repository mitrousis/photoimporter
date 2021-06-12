const drivelist = require('drivelist')
const Watcher = require('./Watcher')
const Logger = require('./Logger')
const { execSync } = require('child_process')
const os = require('os')
const path = require('path')
const PlaySound = require('play-sound')()

/**
 * Watches for specified removable disks, then adds their
 * mountpoint to watcher to be watched for changes
 */
class SDWatcher extends Watcher {
  /**
   * @param {Boolean} playSoundOnUnmount defaults to false
   */
  constructor (playSoundOnUnmount = false) {
    super()

    this._validDriveLabels = []
    this._sdCardPollingInterval = 4000
    this._sdCardPollingTimeoutRef = null
    this._mountedRemovableDrives = []
    this._playSoundOnUnmount = playSoundOnUnmount
  }

  /**
   *
   * @param {Array<String>} validDriveLabels array of valid drive labels that will trigger a copy
   */
  watch (validDriveLabels) {
    this._validDriveLabels = validDriveLabels
    this._nextDrivePoll()
  }

  stop () {
    clearTimeout(this._sdCardPollingTimeoutRef)
    return super.stop()
  }

  async filesProcessingComplete () {
    return await this._unmountDrives()
  }

  async _nextDrivePoll () {
    const currDriveList = await drivelist.list()
    this._mountedRemovableDrives = this._filterRemovableDrives(currDriveList)

    this._mountedRemovableDrives.map((drive) => {
      super.watch(drive.path)
    })

    // Start polling over again
    this._sdCardPollingTimeoutRef = setTimeout(() => {
      this._nextDrivePoll()
    }, this._sdCardPollingInterval)
  }

  /**
   * Returns the SD card mount points, if available
   * @param {array} driveList
   */
  _filterRemovableDrives (driveList) {
    const removableDrives = []

    for (const drive of driveList) {
      // Looking at drive labels for removable drives
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

          removableDrives.push(props)
        }
      }
    }

    return removableDrives
  }

  // Unmounts all the drives though in practice there's probably only one attached at any given time
  async _unmountDrives () {
    let didUnmount = false

    if (os.platform() !== 'darwin') {
      Logger.warn('Automatic unmounting of removable drives is only supported on Mac', 'SDWatcher')
    } else {
      this._mountedRemovableDrives.forEach((drive) => {
        // Mac only
        try {
          execSync(`hdiutil detach "${drive.path}"`)
          Logger.info(`Unmounted ${drive.path}`, 'SDWatcher')
          didUnmount = true
        } catch (e) {
          Logger.error(`Could not unmount ${drive.path}`, 'SDWatcher', e)
        }
      })

      // Clear out any mounts. Note this does not stop watching them for future changes
      this._mountedRemovableDrives = []
    }

    // Play a audible, yet pleasant sound so you know the card is ready to be physically removed
    return new Promise((resolve) => {
      if (this._playSoundOnUnmount && didUnmount) {
        PlaySound.play(path.join(__dirname, './notification_decorative-01.wav'), function (err) { // eslint-disable-line handle-callback-err
          if (err) console.log(err)
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

module.exports = SDWatcher
