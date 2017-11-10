const Promise   = require('bluebird')

let a = [1,2,3]

function go(){
  return Promise.each(a, (b) => {
    return new Promise((res, rej) => {
      setTimeout(() => {
        console.log(b)
        res(b)
      }, 200)
    })
  })
  .then(()=> {
    console.log('all done')
  })
}

go()
.then(() => {
  console.log("@")
})
.then(() => {
  console.log("@2")
})