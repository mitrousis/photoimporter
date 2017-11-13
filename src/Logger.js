const winston          = require('winston')

let _logger = null

function getInstance (){
  if(_logger == null){
    _logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    })

    _logger.cli()
  }

  return _logger
}

module.exports = getInstance()