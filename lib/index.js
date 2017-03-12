var cli = require('cli')
var csv = require('csv')
var _ = require('underscore')

cli.withStdin(function(data) {
  parsedData = csv.parse(data, {
    columns: true,
    skip_empty_lines: true,
    skip_lines_with_empty_values: true
  },
    function(err, data, obj) {
      if (err) {
        console.log(err)
        return
      }
      console.dir(JSON.stringify(makeRuleJson(data)))
    })
})

function makeRuleJson(data) {
  var ruleJson = {}
  var currentLevel = 0
  var parents = []
  _.forEach(data, function(elem) {
    var level = Math.floor(elem.ELEMENT.match(/^\s*/)[0].length/2)
    elem.ELEMENT = elem.ELEMENT.trim()
    var obj = {}
    if (level === 0) {
      ruleJson[elem.ELEMENT] = obj
    }
    else {
      parents[level - 1][elem.ELEMENT] = obj
    }
    parents[level] = obj
  })
  return {
    rules: ruleJson
  }
}

//function showUsage() {
//  console.log('CSV file not specified')
//}
