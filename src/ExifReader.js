const exiftool = require('exiftool-vendored').exiftool
const Logger = require('./Logger')

class EXIFReader {
  // constructor () {

  // }

  async getDateFolder (filePath) {
    const tags = await exiftool.read(filePath)

    if (tags.Error === 'Unknown file type') {
      throw Logger.error(`Invalid EXIF: ${filePath}`, 'EXIFReader')
    }

    await exiftool.end()

    return this._getFolderFromDate(
      this._getDateFromTags(tags)
    )
  }

  /**
   *
   * @param {*} exifTags
   * @returns {String} folder formatted as date
   */
  _getFolderFromDate (exifTags) {
    const date = this._getDateFromTags(exifTags)
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
    } else if (exifTags.FileModifyDate !== undefined) {
      dateNode = exifTags.FileModifyDate
    }

    return new Date(dateNode.year, dateNode.month - 1, dateNode.day, dateNode.hour, dateNode.minute, dateNode.second)
  }
}

module.exports = EXIFReader
