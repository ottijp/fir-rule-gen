var cli = require('cli')
var csv = require('csv')

cli.withStdin(function(data) {
  csv.parse(data, function(err, data) {
    if (err) {
      console.log(err)
      return
    }
    csv.transform(data, function(data) {
      console.log(data)
    })
  })
})

//function showUsage() {
//  console.log('CSV file not specified')
//}
