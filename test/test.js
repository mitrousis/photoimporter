const assert    = require('assert')

const photoimport = require('../photoimport')

let PhotoImport = new photoimport()

let testAssetFolder = __dirname + '/photos'


describe('PhotoImport', function() {
  describe('#getFileList()', function() {
    it('should return an array of fully qualified file paths', function(done) {
      
      PhotoImport.getFileList(testAssetFolder, function(err, list) {
        assert.deepEqual(
          list,
          [ `${testAssetFolder}/.DS_Store`,
            `${testAssetFolder}/DSC02487.JPG`,
            `${testAssetFolder}/IMG_5298.JPG`,
            `${testAssetFolder}/MAH02552.MP4` 
          ]
        )
        done()
      })
    }) 
  })

  describe('#readExif()', function() {
    it('should return null for unsupported file types', function(done) {
      
      PhotoImport.readExif(`${testAssetFolder}/.DS_Store`, function(err, tags) {
        assert.equal(tags, null)
        done()
      })
    }) 
  })

  /*describe('#readExif()', function() {
    it('should return null for unsupported file types', function(done) {
      
      PhotoImport.readExif(`${testAssetFolder}/.DS_Store`, function(err, tags) {
        assert.equal(tags, null)
        done()
      })
    }) 
  })*/
})