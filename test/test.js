const assert      = require('assert')
const photoimport = require('../src/PhotoImport')
const fs          = require('fs')
const proc        = require('child_process')

let PhotoImport = new photoimport()
let testAssetFolder  = __dirname + '/assets'

let sourceFileFolder = __dirname + '/source'
let targetFileFolder = __dirname + '/target'

  
describe('PhotoImport', function() {

  // Create a source folder wtih assets
  before(function() {    
    proc.execSync(`cp -r ${testAssetFolder}/ ${sourceFileFolder}`)
    proc.execSync(`mkdir ${targetFileFolder}`)
  })

  after(function() {
    proc.execSync(`rm -rf ${sourceFileFolder}`)
    proc.execSync(`rm -rf ${targetFileFolder}`)
  })

 /*
  describe('#getFileList()', function() {
    it('should return an array of fully qualified file paths', function() {
      
      return PhotoImport.getFileList(sourceFileFolder)
      .then((list) => {
        assert.deepEqual(
          list,
          [ `${sourceFileFolder}/.DS_Store`,
            `${sourceFileFolder}/DSC02487.JPG`,
            `${sourceFileFolder}/MAH02552.MP4`,
            `${sourceFileFolder}/MVI_1112-old.avi`,
            `${sourceFileFolder}/move_me.jpg`,
            `${sourceFileFolder}/move_me_2.jpg`,
            `${sourceFileFolder}/move_me_dupe.jpg`
          ]
        )
      })
    }) 

    it('should throw an ENOENT Error for a bad path', function(){
      return PhotoImport.getFileList('/junk/folder')
      .catch((err) => {
        assert.equal(err.code, 'ENOENT')
      })
    })
  })

  describe('#readExif()', function() {
    it('should return valid EXIF for files with EXIF', function() {
      return PhotoImport.readExif(`${sourceFileFolder}/DSC02487.JPG`)
      .then((tags) => {
        assert.equal(tags.Error, undefined)
      })
    })

    it('should return null for files with no EXIF', function() {
      return PhotoImport.readExif(`${sourceFileFolder}/.DS_Store`)
      .then((tags) => {
        assert.equal(tags, null)
      })
    })

    it('should return error for no matching file', function() {
      return PhotoImport.readExif(`${sourceFileFolder}/badfile.jpg`)
      .catch(() => {
        assert.ok(true)
      })
    })  

  })

  describe('#getFolderDate()', function(){
    it('should return yyyy-mm format when CreateDate node is present', function(){
      return PhotoImport.readExif(`${sourceFileFolder}/DSC02487.JPG`)
      .then(function(tags) {
        assert.equal(PhotoImport.getFolderDate(tags), '2017-01')
      })
    })

    it('should return yyyy-mm format when DateTimeOriginal node is present', function(){
      return PhotoImport.readExif(`${sourceFileFolder}/MVI_1112-old.avi`)
      .then(function(tags) {
        assert.equal(PhotoImport.getFolderDate(tags), '2005-05')
      })
    })

  })

  */
  describe('#moveFile()', function(){
    
    // Copy dupe test target files
    before(function() {    
      proc.execSync(`mv ${sourceFileFolder}/dupe_test_diff_exif.jpg ${targetFileFolder}/dupe_test_diff_exif.jpg`)
      proc.execSync(`mv ${sourceFileFolder}/dupe_test_same_exif.jpg ${targetFileFolder}/dupe_test_same_exif.jpg`)
    })

    /*it('should create a proper yyyy-mm folder and move the file', function(){
      // Hard coding date for testing
      let dateFolder = '2017-04'

      return PhotoImport.moveFile(`${sourceFileFolder}/move_me.jpg`, `${targetFileFolder}/${dateFolder}/move_me.jpg`)
      .then(function(){
        assert.ok(fs.existsSync(`${targetFileFolder}/${dateFolder}/move_me.jpg`))
      })
    })

    it('should error with a dupe file', function(){
      // Hard coding date for testing
      let dateFolder = '2017-04'

      return PhotoImport.moveFile(`${sourceFileFolder}/move_me_dupe.jpg`, `${targetFileFolder}/${dateFolder}/move_me.jpg`)
      .then(function(){
        assert.ok(fs.existsSync(`${targetFileFolder}/2017-04/move_me.jpg`))
      })

    })*/

    it('duplicate filename, different exif, should increment filename', function(){
      
      return PhotoImport.moveFile(`${sourceFileFolder}/dupe_test_source.jpg`, `${targetFileFolder}/dupe_test_diff_exif.jpg`)
      .then(function(){
        assert.ok(fs.existsSync(`${targetFileFolder}/dupe_test_diff_exif_1.jpg`))
      })

    })


  })

  describe('#incrementFilename()', function(){
    
    it('should add _1 to non-versioned file', function(){
      assert.equal(PhotoImport.incrementFilename('/some/path/to/filename.jpg'), '/some/path/to/filename_1.jpg');
    })

    it('should increment _1 to _2', function(){
      assert.equal(PhotoImport.incrementFilename('/some/path/to/filename_1.jpg'), '/some/path/to/filename_2.jpg');
    })

    it('should increment from 1 to 2 digits', function(){
      assert.equal(PhotoImport.incrementFilename('/some/path/to/filename_9.jpg'), '/some/path/to/filename_10.jpg');
    })

    it('should increment 2 digit number', function(){
      assert.equal(PhotoImport.incrementFilename('/some/path/to/filename_20.jpg'), '/some/path/to/filename_21.jpg');
    })


  })


  /*describe('#processFolder()', function() {
    it('should process the full folder without error', function() {

      assert.doesNotThrow(
        () => {
          PhotoImport.processFolder(sourceFileFolder, targetFileFolder)
        }
        
      )

    }) 
  })*/
})