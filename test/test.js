const assert      = require('assert')
const photoimport = require('../src/PhotoImport')
const fs          = require('fs')
const proc        = require('child_process')

let PhotoImport = new photoimport()
let testAssetFolder  = __dirname + '/assets'

let sourceFileFolder = __dirname + '/source'
let targetFileFolder = __dirname + '/target'
let duplicatesFolder = sourceFileFolder + '/duplicates'

  
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
            `${sourceFileFolder}/dupe_test_diff_exif.jpg`,
            `${sourceFileFolder}/dupe_test_same_exif.jpg`,
            `${sourceFileFolder}/dupe_test_source.jpg`,
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

  describe('File moving and de-duping functions', function(){
    
    // Copy dupe test target files
    before(function() {
      proc.execSync(`mv ${sourceFileFolder}/dupe_test_diff_exif.jpg ${targetFileFolder}/dupe_test_diff_exif.jpg`)
      proc.execSync(`mv ${sourceFileFolder}/dupe_test_same_exif.jpg ${targetFileFolder}/dupe_test_same_exif.jpg`)
    })

    it('#isSameFile() : should be the same file hash', function(){
      return PhotoImport.isSameFile(`${sourceFileFolder}/dupe_test_source.jpg`, `${targetFileFolder}/dupe_test_same_exif.jpg`)
      .then(function(isSameFile){
        assert.equal(isSameFile, true)
      })
    })

    it('#isSameFile() : should _not_ be the same file hash', function(){
      return PhotoImport.isSameFile(`${sourceFileFolder}/dupe_test_source.jpg`, `${targetFileFolder}/dupe_test_diff_exif.jpg`)
      .then(function(isSameFile){
        assert.equal(isSameFile, false)
      })
    })

    it('#moveFile() : should create a proper yyyy-mm folder and move the file', function(){
      // Hard coding date for testing
      let dateFolder = '2017-04'

      return PhotoImport.moveFile(`${sourceFileFolder}/move_me.jpg`, `${targetFileFolder}/${dateFolder}/move_me.jpg`)
      .then(function(){
        assert.ok(fs.existsSync(`${targetFileFolder}/${dateFolder}/move_me.jpg`))
      })
    })

    // Create additional source files, since we'll be moving them
    before(function() {
      proc.execSync(`cp ${sourceFileFolder}/dupe_test_source.jpg ${sourceFileFolder}/dupe_test_source_2.jpg`)
      proc.execSync(`cp ${sourceFileFolder}/dupe_test_source.jpg ${sourceFileFolder}/dupe_test_source_3.jpg`)
    })

    it('#moveFile() : should increment filename on duplicate file with different exif', function(){
      return PhotoImport.moveFile(`${sourceFileFolder}/dupe_test_source_2.jpg`, `${targetFileFolder}/dupe_test_diff_exif.jpg`)
      .then(function(){
        assert.ok(fs.existsSync(`${targetFileFolder}/dupe_test_diff_exif_1.jpg`))
      })
    })

    it('#moveFile() : should move to duplicates folder on exact duplicate file hash, ', function(){
      return PhotoImport.moveFile(
        `${sourceFileFolder}/dupe_test_source_3.jpg`, 
        `${targetFileFolder}/dupe_test_same_exif.jpg`,
        duplicatesFolder
      )
      .then(function(){
        assert.ok(fs.existsSync(`${duplicatesFolder}/dupe_test_source_3.jpg`))
      })
    })
  })

  describe('#getCreationDate()', function(){
    let exampleExif = {"SourceFile":"/test.jpg","errors":[],"ExifToolVersion":"10.51","FileName":"dupe_test_diff_exif.jpg","Directory":"/","FileSize":"1460 kB","FileModifyDate":{"year":2017,"month":11,"day":8,"hour":21,"minute":46,"second":48,"tzoffsetMinutes":-480,"millis":0},"FileAccessDate":{"year":2017,"month":11,"day":8,"hour":21,"minute":46,"second":48,"tzoffsetMinutes":-480,"millis":0},"FileInodeChangeDate":{"year":2017,"month":11,"day":8,"hour":21,"minute":46,"second":48,"tzoffsetMinutes":-480,"millis":0},"FilePermissions":"rw-r--r--","FileType":"JPEG","FileTypeExtension":"jpg","MIMEType":"image/jpeg","ExifByteOrder":"Big-endian (Motorola, MM)","PhotometricInterpretation":"RGB","Make":"Apple","Model":"iPhone 6s","Orientation":"Horizontal (normal)","SamplesPerPixel":3,"XResolution":72,"YResolution":72,"ResolutionUnit":"inches","Software":"Adobe Photoshop CC (Macintosh)","ModifyDate":{"year":2017,"month":11,"day":8,"hour":17,"minute":5,"second":20,"tzoffsetMinutes":-480,"millis":0},"YCbCrPositioning":"Centered","ExposureTime":"1/120","FNumber":2.2,"ExposureProgram":"Program AE","ISO":32,"ExifVersion":"0221","DateTimeOriginal":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":-480,"millis":0},"CreateDate":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":-480,"millis":0},"ComponentsConfiguration":"Y, Cb, Cr, -","ShutterSpeedValue":"1/120","ApertureValue":2.2,"BrightnessValue":5.800059952,"ExposureCompensation":0,"MeteringMode":"Multi-segment","Flash":"Auto, Did not fire","FocalLength":"4.2 mm","SubjectArea":"2015 1511 2217 1330","SubSecTimeOriginal":285,"SubSecTimeDigitized":285,"FlashpixVersion":"0100","ColorSpace":"sRGB","ExifImageWidth":3024,"ExifImageHeight":4032,"SensingMethod":"One-chip color area","SceneType":"Directly photographed","ExposureMode":"Auto","WhiteBalance":"Auto","FocalLengthIn35mmFormat":"29 mm","SceneCaptureType":"Standard","LensInfo":"4.15mm f/2.2","LensMake":"Apple","LensModel":"iPhone 6s backcamera 4.15mm f/2.2","GPSLatitudeRef":"North","GPSLongitudeRef":"West","GPSAltitudeRef":"Above Sea Level","GPSTimeStamp":{"hour":16,"minute":37,"second":2,"tzoffsetMinutes":0,"millis":70},"GPSSpeedRef":"km/h","GPSSpeed":0,"GPSImgDirectionRef":"True North","GPSImgDirection":158.588,"GPSDestBearingRef":"True North","GPSDestBearing":158.588,"GPSDateStamp":{"year":2017,"month":11,"day":8},"GPSHPositioningError":"65 m","Compression":"JPEG (old-style)","ThumbnailOffset":1270,"ThumbnailLength":6502,"CurrentIPTCDigest":"7cded263283055c8e52a7d92483b3ae1","ApplicationRecordVersion":0,"TimeCreated":{"hour":8,"minute":37,"second":3,"tzoffsetMinutes":0,"millis":0},"IPTCDigest":"7cded263283055c8e52a7d92483b3ae1","DisplayedUnitsX":"inches","DisplayedUnitsY":"inches","PrintStyle":"Centered","PrintPosition":"0 0","PrintScale":1,"GlobalAngle":4294967236,"GlobalAltitude":30,"URL_List":[],"SlicesGroupName":"dupe_test_diff_exif","NumSlices":1,"PixelAspectRatio":1,"PhotoshopThumbnail":"(Binary data 6502 bytes, use -b option to extract)","HasRealMergedData":"Yes","WriterName":"Adobe Photoshop","ReaderName":"Adobe Photoshop CC","PhotoshopQuality":8,"PhotoshopFormat":"Standard","ProgressiveScans":"3 Scans","XMPToolkit":"Adobe XMP Core 5.6-c140 79.160451, 2017/05/06-01:08:21        ","CreatorTool":"10.3.3","MetadataDate":{"year":2017,"month":11,"day":8,"hour":17,"minute":5,"second":20,"tzoffsetMinutes":-480,"millis":0},"Lens":"iPhone 6s back camera 4.15mm f/2.2","DateCreated":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":-480,"millis":285},"ColorMode":"RGB","ICCProfileName":"sRGB IEC61966-2.1","DocumentID":"6536811ADF446D549C51EB23FB0FF7B8","InstanceID":"xmp.iid:258ecfe0-4fa3-4bff-8bc4-127e027eea64","OriginalDocumentID":"6536811ADF446D549C51EB23FB0FF7B8","Format":"image/jpeg","HistoryAction":"saved","HistoryInstanceID":"xmp.iid:258ecfe0-4fa3-4bff-8bc4-127e027eea64","HistoryWhen":"2017:11:08 17:05:20-08:00","HistorySoftwareAgent":"Adobe Photoshop CC (Macintosh)","HistoryChanged":"/","ProfileCMMType":"Lino","ProfileVersion":"2.1.0","ProfileClass":"Display Device Profile","ColorSpaceData":"RGB ","ProfileConnectionSpace":"XYZ ","ProfileDateTime":{"year":1998,"month":2,"day":9,"hour":6,"minute":49,"second":0,"tzoffsetMinutes":-480,"millis":0},"ProfileFileSignature":"acsp","PrimaryPlatform":"Microsoft Corporation","CMMFlags":"Not Embedded, Independent","DeviceManufacturer":"IEC ","DeviceModel":"sRGB","DeviceAttributes":"Reflective, Glossy, Positive, Color","RenderingIntent":"Perceptual","ConnectionSpaceIlluminant":"0.9642 1 0.82491","ProfileCreator":"HP  ","ProfileID":0,"ProfileCopyright":"Copyright (c) 1998 Hewlett-Packard Company","ProfileDescription":"sRGB IEC61966-2.1","MediaWhitePoint":"0.95045 1 1.08905","MediaBlackPoint":"0 0 0","RedMatrixColumn":"0.43607 0.22249 0.01392","GreenMatrixColumn":"0.38515 0.71687 0.09708","BlueMatrixColumn":"0.14307 0.06061 0.7141","DeviceMfgDesc":"IEC http://www.iec.ch","DeviceModelDesc":"IEC 61966-2.1 Default RGB colour space - sRGB","ViewingCondDesc":"Reference Viewing Condition in IEC61966-2.1","ViewingCondIlluminant":"19.6445 20.3718 16.8089","ViewingCondSurround":"3.92889 4.07439 3.36179","ViewingCondIlluminantType":"D50","Luminance":"76.03647 80 87.12462","MeasurementObserver":"CIE 1931","MeasurementBacking":"0 0 0","MeasurementGeometry":"Unknown","MeasurementFlare":"0.999%","MeasurementIlluminant":"D65","Technology":"Cathode Ray Tube Display","RedTRC":"(Binary data 2060 bytes, use -b option to extract)","GreenTRC":"(Binary data 2060 bytes, use -b option to extract)","BlueTRC":"(Binary data 2060 bytes, use -b option to extract)","DCTEncodeVersion":100,"APP14Flags0":"(none)","APP14Flags1":"(none)","ColorTransform":"YCbCr","ImageWidth":3024,"ImageHeight":4032,"EncodingProcess":"Baseline DCT, Huffman coding","BitsPerSample":[8],"ColorComponents":3,"YCbCrSubSampling":"YCbCr4:4:4 (1 1)","Aperture":2.2,"DateTimeCreated":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":0,"millis":0},"GPSAltitude":"62 m Above Sea Level","GPSDateTime":{"year":2017,"month":11,"day":8,"hour":16,"minute":37,"second":2,"tzoffsetMinutes":0,"millis":70},"GPSLatitude":37.77930833,"GPSLongitude":-122.45856389,"GPSPosition":"37.77930833 N, 122.45856389 W","ImageSize":"3024x4032","Megapixels":12.2,"ScaleFactor35efl":7,"ShutterSpeed":"1/120","SubSecCreateDate":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":-480,"millis":285},"SubSecDateTimeOriginal":{"year":2017,"month":11,"day":8,"hour":8,"minute":37,"second":3,"tzoffsetMinutes":-480,"millis":285},"ThumbnailImage":"(Binary data 6502 bytes, use -b option to extract)","CircleOfConfusion":"0.004 mm","FOV":"63.7 deg","FocalLength35efl":"4.2 mm (35 mm equivalent: 29.0 mm)","HyperfocalDistance":"1.82 m","LightValue":10.8}
    let targetDate  = new Date(2017, 10, 8, 8, 37, 3);

    it('exif data should parse correctly into date object', function(){
      assert.equal(PhotoImport.getCreationDate(exampleExif).getTime(), targetDate.getTime());
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