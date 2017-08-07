const PhotoImport = require('./photoimport')

let pi = new PhotoImport()

pi.readExif(__dirname + '/test/photos/' + 'IMG_5298.JPG', (err, tags) => {
  console.log(tags)
  pi.closeExif()
})


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