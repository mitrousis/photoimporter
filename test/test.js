const assert    = require('assert')

const photoimport = require('../photoimport')

let PhotoImport = new photoimport()


describe('PhotoImport', function() {
  describe('#getFileList()', function() {
    it('should return an array of fully qualified file paths', function(done) {
      
      PhotoImport.getFileList(__dirname + '/photos', function(err, list) {
        assert.deepEqual(
          list,
          [ '/Users/nicholas/Pictures/photoimport_dev/test/photos/.DS_Store',
            '/Users/nicholas/Pictures/photoimport_dev/test/photos/DSC02487.JPG',
            '/Users/nicholas/Pictures/photoimport_dev/test/photos/IMG_5298.JPG',
            '/Users/nicholas/Pictures/photoimport_dev/test/photos/MAH02552.MP4' 
          ]
        )
        done()
      })
    }) 
  })
})