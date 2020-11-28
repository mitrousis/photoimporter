const drivelist = require('drivelist')

drivelist.list()
  .then((driveList) => {
    console.log(JSON.stringify(driveList, null, 1))
  })
