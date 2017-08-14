const PhotoImport = require('./src/PhotoImport')

let pi = new PhotoImport()

//pi.processFolder(__dirname + '/test/photos/')

pi.moveFile("/Users/nicholas/_Projects/photo-import/test/photos/DSC02487.JPG",
"/Users/nicholas/_Projects/photo-import/test/target/1234/DSC02487.JPG" )

/*
IMG_5298.JPG

*/
/* MAH

CreateDate: 
   ExifDateTime {
     year: 2017,
     month: 4,
     day: 16,
     hour: 7,
     minute: 15,
     second: 5,
     tzoffsetMinutes: undefined,
     millis: 0 },

*/