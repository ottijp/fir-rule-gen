'use strict'

var cli = require('cli')
var csv = require('csv')
var _ = require('underscore')
var fs = require('fs')

// load csv file from stdin
cli.withStdin(function(data) {
  csv.parse(data, {
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
    var typeCondition = ''
    if (elem.TYPE !== '') {
      switch (elem.TYPE) {
        case 'string':
          typeCondition = 'newData.isString()'
          break;
        case 'number':
          typeCondition = 'newData.isNumber()'
          break;
        case 'boolean':
          typeCondition = 'newData.isBoolean()'
          break;
        default:
          console.error('invalid type "' + elem.TYPE + ': ' + elem.ELEMENT)
          break;
      }
    }
    var userCondition = elem.CONDITION
    var condition = ''
    if (typeCondition !== '' && userCondition !== '') {
      condition = '(' + typeCondition + ') && (' + userCondition + ')'
    }
    else if (typeCondition !== '' && userCondition === '') {
      condition = typeCondition
    }
    else if (userCondition !== '') {
      condition = userCondition
    }
    if (condition !== '') {
        obj['.validate'] = condition
    }

    // add index
    if  (elem.INDEX) {
      if (elem.INDEX !== 'x') {
          console.error('INDEX column must be "x": ' + elem.ELEMENT)
      }
      else if (level === 0) {
          console.error('INDEX element must not be at the top level: ' + elem.ELEMENT)
      }
      else {
        if (!parents[level - 1]['.index']) {
          parents[level - 1]['.index'] = []
        }
        parents[level - 1]['.index'].push(elem.ELEMENT)
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
