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


  /*describe('#getFileList()', function() {
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

  describe('#moveFile()', function(){
    
    it('should create a proper yyyy-mm folder and move the file', function(done){
      // Hard coding date for testing
      let dateFolder = '2017-04'

      PhotoImport.moveFile(`${sourceFileFolder}/move_me.jpg`, `${targetFileFolder}/${dateFolder}/move_me.jpg`)
        .then(function(){
          assert.ok(fs.existsSync(`${targetFileFolder}/${dateFolder}/move_me.jpg`))
        })
        .then(done, done)
    })

    it('should error with a dupe file', function(done){
      // Hard coding date for testing
      let dateFolder = '2017-04'

      PhotoImport.moveFile(`${sourceFileFolder}/move_me_dupe.jpg`, `${targetFileFolder}/${dateFolder}/move_me.jpg`)
        .then(function(){
          assert.ok(true)//fs.existsSync(`${targetFileFolder}/2017-04/move_me.jpg`))
        })
        .then(done, done)

    })


  })*/

  describe('#processFolder()', function() {
    it('should process the full folder without error', function() {

      assert.doesNotThrow(
        () => {
          PhotoImport.processFolder(sourceFileFolder, targetFileFolder)
        }
        
      )

    }) 
  })
})