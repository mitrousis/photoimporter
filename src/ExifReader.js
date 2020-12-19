const ExifTool = require('exiftool-vendored').ExifTool
const Logger = require('./Logger')
const AppConfig = require('./AppConfig')
const nodeCleanup = require('node-cleanup')

class EXIFReader {
  constructor () {
    this._validExifTags = AppConfig.validExifTags
    this._exifTool = null
  }

  /**
   *
   * @param {String} filePath
   * @returns {Promise<String>} Folder name formatted with date
   */
  async getDateFolder (filePath) {
    if (this._exifTool === null) {
      this._exifTool = new ExifTool()
    }

    let tags

    try {
      tags = await this._exifTool.read(filePath)
    } catch (e) {
      throw Logger.error(e, 'EXIFReader')
    }

    if (tags.errors.length > 0) {
      Logger.warn(`EXIF read error(s) [${tags.errors.join(', ')}]: ${filePath}`, 'EXIFReader')
      throw new Error()
    }

    if (!this._confirmValidTags(tags, AppConfig.validExifTags)) {
      Logger.warn(`File does not have valid media EXIF tags: ${filePath}`, 'EXIFReader')
      throw new Error()
    }

    return this._getFolderFromDate(
      this._getDateFromTags(tags)
    )
  }

  async close () {
    await this._exifTool.end()
    this._exifTool = null
  }

  /**
   * Determine if a tag object contains any valid tags
   * @param {*} tags
   * @param {*} validTags
   */
  _confirmValidTags (tags, validTags) {
    let valid = false

    Object.entries(tags).forEach(([key, value]) => {
      if (validTags.indexOf(key) > -1) {
        valid = true
      }
    })

    return valid
  }

  /**
   *
   * @param {Date} date
   * @returns {String} folder formatted as date
   */
  _getFolderFromDate (date) {
    const yr = date.getFullYear()
    const mo = date.getMonth() + 1
    const moPad = ('00' + mo.toString()).substring(mo.toString().length)

    return `${yr}-${moPad}`
  }

  /**
   * All the logic for getting the right date from the tags
   * @param {Object} exifTags
   * @returns {Date}
   */
  _getDateFromTags (exifTags) {
    let dateNode

    // Cascade through likely timestamps
    // Found in old AVI files
    if (exifTags.DateTimeOriginal !== undefined) {
      dateNode = exifTags.DateTimeOriginal
    // Found in iPhone video files
    } else if (exifTags.CreationDate !== undefined) {
      dateNode = exifTags.CreationDate
    // All other files without exif
    } else if (exifTags.FileModifyDate !== undefined) {
      dateNode = exifTags.FileModifyDate
    }

    return new Date(dateNode.year, dateNode.month - 1, dateNode.day, dateNode.hour, dateNode.minute, dateNode.second)
  }
}

module.exports = EXIFReader
