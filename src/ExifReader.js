const ExifTool = require('exiftool-vendored').ExifTool
const Logger = require('./Logger')
const AppConfig = require('./AppConfig')

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
    if (date === null) {
      return 'Unknown'
    }

    const yr = date.getFullYear()
    const mo = date.getMonth() + 1
    const moPad = ('00' + mo.toString()).substring(mo.toString().length)

    return `${yr}-${moPad}`
  }

  /**
   * All the logic for getting the right date from the tags
   * @param {Object} exifTags
   * @returns {Date|null} null if no date is found
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
    // CreateDate found on a Sony camera video
    } else if (exifTags.CreateDate !== undefined) {
      dateNode = exifTags.CreateDate
    // Fall back to FileModifyDate, which could be changed, but hopefully is valid when
    // first found on an SD or import
    } else if (exifTags.FileModifyDate !== undefined) {
      dateNode = exifTags.FileModifyDate
    }

    // Validate the node was correctly parsed by exiftool
    if (dateNode.year) {
      return new Date(
        dateNode.year,
        dateNode.month - 1,
        dateNode.day,
        dateNode.hour,
        dateNode.minute,
        dateNode.second
      )
    } else {
      return null
    }
  }
}

module.exports = EXIFReader
