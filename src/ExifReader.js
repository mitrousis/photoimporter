const exiftool = require('exiftool-vendored').exiftool
const Logger = require('./Logger')

class EXIFReader {
  constructor () {
    this._exifEndTimeout = -1

    this._invalidMIMETypes = ['text/plain']
  }

  async getDateFolder (filePath) {
    clearTimeout(this._exifEndTimeout)

    // Set timeout to end() exif tool if
    // no other calls are being made
    this._exifEndTimeout = setTimeout(() => {
      exiftool.end()
    }, 1000)

    const tags = await exiftool.read(filePath)

    if (tags.errors.length > 0) {
      throw Logger.error(`EXIF read error(s) [${tags.errors.join(', ')}]: ${filePath}`, 'EXIFReader')
    }

    if (this._invalidMIMETypes.indexOf(tags.MIMEType) !== -1) {
      throw Logger.error(`Invalid MIME Type [${tags.MIMEType}]: ${filePath}`, 'EXIFReader')
    }

    return this._getFolderFromDate(
      this._getDateFromTags(tags)
    )
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
