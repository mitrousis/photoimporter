#! /usr/bin/env node

// Import photos via image capture
// Read each photo, exif data if avail
// Otherwise use creation date.

// process.argv
const fs        = require('fs')
const path      = require('path')
const util      = require('util')
const exifTool  = require('exiftool-vendored').exiftool
const async     = require('async')
const config    = require('konfig')()

//import { exiftool } from "exiftool-vendored";


//let sourceFolder     = __dirname + '/testphotos/';
//let duplicatesFolder = sourceFolder + 'duplicates/';

// Create dupes folder if needed
/*if(!fs.existsSync(duplicatesFolder)){
    console.log("Making duplicates folder.");
    fs.mkdirSync(duplicatesFolder);
}*/

class PhotoImport {

  processFolder(path) {
    fs.readdir(path, (err, files) => {
    
      async.eachSeries(files, (file, callback) => {
        let fullPath = path + file

        // Parsing every file, even if non-image or folder
        // and letting exif determine if we should reject
        this.readExif(fullPath, callback)

      }, (err) => {
        if(err) {
          console.error(err)
        }

        // Need to explicitly close Exif tool or hangs
        exifTool.end()
        console.log('Done.')
      })
    })
  }

  getFileList(sourcePath, callback) {
    let fullPaths = []
    fs.readdir(sourcePath, (err, files) => {

      for(let f of files){
        fullPaths.push(path.join(sourcePath, f))
      }
      
      callback(err, fullPaths)
    })
  }


  readExif(filePath, callback) {
    exifTool
    .read(filePath)
    .then((tags) => {
        if(tags.Error !== 'Unknown file type'){
          console.log(tags.SourceFile)
        }
        callback()
    })
    .catch(err => {
      //console.log('Exif error', err)
      callback()
    })
  }
  
}


module.exports = PhotoImport



/*let pi = new PhotoImport()

pi.getFileList(__dirname + '/test/photos', (err, list) => {
  console.log(list)
})*/



/*for(var i=0; i<fileList.length; i++){
    var fileName = fileList[i];
    var fullPath = sourceFolder + fileList[i];

    // Not dir and not .file
    if(!fs.lstatSync(fullPath).isDirectory()){

        if(fileName.charAt(0) != "."){

            var year, month;

            exifTool
            .read(fullPath)
            .then((tags) => {
                console.log(tags)
            })
            .catch(err => console.error(err))*/
  

            //try {


                /*new ExifImage({ image : fullPath }, function (error, exifData) {
                    if (error) {
                        var modifiedTime = fs.lstatSync(fullPath);
                        
                        console.log(new Date(modifiedTime.birthtime).getTime());
                        

                    } else {

                        console.log(exifData);*/

                       /*var dateTime = exifData.exif.DateTimeOriginal.split(":");
                       year     = dateTime[0];
                       month    = dateTime[1];*/
                    //}
                //});

            // Not an image, probably a video
            // Use the file date to determine folder
            /*} catch (error) {
                
            }*/
    //    }
  //  }
//}
