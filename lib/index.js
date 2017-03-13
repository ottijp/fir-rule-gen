var cli = require('cli')
var csv = require('csv')
var _ = require('underscore')
var fs = require('fs')

// load csv file from stdin
cli.withStdin(function(data) {
  parsedData = csv.parse(data, {
    columns: true,
    skip_empty_lines: true,
    skip_lines_with_empty_values: true
  },
    function(err, data, obj) {
      if (err) {
        console.error(err)
        return
      }

      // write converted file
      fs.writeFile('database.rules.json', JSON.stringify(makeRuleJson(data)))
    })
})

function makeRuleJson(data) {
  var ruleJson = {}
  var currentLevel = 0
  var parents = []
  _.forEach(data, function(elem) {
    // depth level of this object
    var level = Math.floor(elem.ELEMENT.match(/^\s*/)[0].length/2)

    elem.ELEMENT = elem.ELEMENT.trim()

    // add this object to JSON tree
    var obj = {}
    if (level === 0) {
      ruleJson[elem.ELEMENT] = obj
    }
    else {
      parents[level - 1][elem.ELEMENT] = obj
    }
    parents[level] = obj

    // add type condition
    if (elem.TYPE !== '') {
      switch (elem.TYPE) {
        case 'string':
          obj['.validate'] = 'newData.isString()'
          break;
        case 'number':
          obj['.validate'] = 'newData.isNumber()'
          break;
        case 'boolean':
          obj['.validate'] = 'newData.isBoolean()'
          break;
        default:
          console.error('invalid type "' + elem.TYPE + '" of ' + elem.ELEMENT)
          break;
      }
    }
  })
  return {
    rules: ruleJson
  }
}

//function showUsage() {
//  console.log('CSV file not specified')
//}
