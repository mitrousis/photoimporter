const assert    = require('assert')

const photoimport = require('../photoimport')

let PhotoImport = new photoimport()

let testAssetFolder = __dirname + '/photos'
//let testData        = require('./testData.js')

describe('PhotoImport', function() {
  describe('#getFileList()', function() {
    it('should return an array of fully qualified file paths', function(done) {
      
      PhotoImport.getFileList(testAssetFolder)
      .then((list) => {
        assert.deepEqual(
          list,
          [ `${testAssetFolder}/.DS_Store`,
            `${testAssetFolder}/DSC02487.JPG`,
            `${testAssetFolder}/IMG_0468-old.jpg`,
            `${testAssetFolder}/IMG_5298.JPG`,
            `${testAssetFolder}/MAH02552.MP4`,
            `${testAssetFolder}/MVI_1112-old.avi`
          ]
        )
        done()
      })
    }) 

    it('should throw an ENOENT Error for a bad path', function(done){
      PhotoImport.getFileList('/junk/folder')
      .catch((err) => {
        assert.equal(err.code, 'ENOENT')
        done()
      })
    })
  })

  describe('#readExif()', function() {
    it('should return valid EXIF for files with EXIF', function(done) {
      PhotoImport.readExif(`${testAssetFolder}/DSC02487.JPG`)
      .then((tags) => {
        assert.equal(tags.Error, undefined)
        done()
      })
    })

    it('should return null for files with no EXIF', function(done) {
      PhotoImport.readExif(`${testAssetFolder}/.DS_Store`)
      .then((tags) => {
        assert.equal(tags, null)
        done()
      })
    })
  })

  describe('#getFolderDate()', function(){
    it('should return yyyy-mm format when CreateDate node is present', function(){
      return PhotoImport.readExif(`${testAssetFolder}/DSC02487.JPG`)
      .then(function(tags) {
        assert.equal(PhotoImport.getFolderDate(tags), '2017-01')
      })
    })

    it('should return yyyy-mm format when DateTimeOriginal node is present', function(){
      return PhotoImport.readExif(`${testAssetFolder}/MVI_1112-old.avi`)
      .then(function(tags) {
        assert.equal(PhotoImport.getFolderDate(tags), '2005-05')
      })
    })

  })

})