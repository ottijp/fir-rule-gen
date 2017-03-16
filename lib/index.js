'use strict'

var cli = require('cli')
var csv = require('csv')
var _ = require('underscore')
var fs = require('fs')

var MAX_LEVEL = 32

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
  var parents = []

  _.forEach(data, function(rec) {
    // depth level of this element
    var level = Array.apply(null, {length: MAX_LEVEL})
      .map(Function.call, Number)
      .filter(function(lv) {
        var colName = 'LV' + (lv + 1)
        return rec[colName] != undefined && rec[colName] != ''
      })
      .filter(function(elem, idx) {
        return idx === 0
      })[0]
    if (level === undefined) {
      console.error('no elements found in any level')
      process.exit(-1)
    }

    var elem = rec['LV' + (level + 1)]

    // add this object to JSON tree
    var obj = {}
    if (level === 0) {
      ruleJson[elem] = obj
    }
    else {
      parents[level - 1][elem] = obj
    }
    parents[level] = obj

    // add type condition
    var typeCondition = ''
    if (rec.TYPE !== '') {
      switch (rec.TYPE) {
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
          console.error('invalid type "' + rec.TYPE + ': ' + elem)
          break;
      }
    }
    var userCondition = rec.CONDITION
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
    if  (rec.INDEX) {
      if (rec.INDEX !== 'x') {
          console.error('INDEX column must be "x": ' + elem)
      }
      else if (level === 0) {
          console.error('INDEX element must not be at the top level: ' + elem)
      }
      else {
        if (!parents[level - 1]['.index']) {
          parents[level - 1]['.index'] = []
        }
        parents[level - 1]['.index'].push(elem)
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
