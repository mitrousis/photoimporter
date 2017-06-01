#! /usr/bin/env node

// Import photos via image capture
// Read each photo, exif data if avail
// Otherwise use creation date.

// process.argv
const fs        = require('fs')
//var ExifImage   = require("exif").ExifImage;
const util      = require('util')
const exifTool  = require('exiftool-vendored').exiftool
const async     = require('async')

//import { exiftool } from "exiftool-vendored";


let sourceFolder     = __dirname + '/testphotos/';
let duplicatesFolder = sourceFolder + 'duplicates/';

// Create dupes folder if needed
/*if(!fs.existsSync(duplicatesFolder)){
    console.log("Making duplicates folder.");
    fs.mkdirSync(duplicatesFolder);
}*/


fs.readdir(sourceFolder, (err, files) => {
    
  async.eachSeries(files, (file, callback) => {
    let fullPath = sourceFolder + file

    // Parsing every file, even if non-image or folder
    // and letting exif determine if we should reject
    exifTool
      .read(fullPath)
      .then((tags) => {
          //console.log(tags)
          if(tags.Error !== 'Unknown file type'){
            console.log(tags.SourceFile)
          }
          callback()
      })
      .catch(err => {
        //console.log('Exif error', err)
        callback()
      })


  }, (err) => {
    if(err) console.error(err)

    exifTool.end()
    console.log('Done.')
  })

    
});


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
