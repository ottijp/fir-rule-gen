'use strict'

var cli = require('cli')
var csv = require('csv')
var fs = require('fs')
var local = {}

var MAX_LEVEL = 32

function main(callback) {
  // parse command arguments
  cli.parse({})

  if (cli.args.length === 2) {
    // load csv from file
    var srcFile = cli.args[0]
    var dstFile = cli.args[1]

    var data = fs.readFileSync(srcFile, {encoding: 'utf-8'})
    local.makeRuleJson(data, function(err, json) {
      if (err) {
        local.errorExit(1, 'convert error:' + err)
      }
      else {
        // write converted file to dstFile
        fs.writeFileSync(dstFile, JSON.stringify(json), 0, 'utf-8')
        callback()
      }
    })
  }
  else {
    // load csv file from stdin
    cli.withStdin(function(data) {
      local.makeRuleJson(data, function(err, json) {
        if (err) {
          local.errorExit(1, 'convert error: ' + err)
        }
        else {
          // write converted file to stdout
          local.writeToConsole(JSON.stringify(json))
          callback()
        }
      })
    })
  }
}

local.makeRuleJson = function(csvString, callback) {
  csv.parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    skip_lines_with_empty_values: true
  },
    function(err, csv, obj) {
      if (err) {
        callback(err)
      }
      var ruleJson = {}
      var parents = []

      csv.forEach(function(rec) {
        // depth level of this element
        var level = Array.apply(null, {length: MAX_LEVEL})
          .map(Function.call, Number)
          .filter(function(lv) {
            var colName = 'LV' + (lv + 1)
            return rec[colName] !== undefined && rec[colName] !== ''
          })
          .filter(function(elem, idx) {
            return idx === 0
          })[0]
        if (level === undefined) {
          callback(new Error('no elements found in any level'))
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

        // add read/write
        if (rec.READ !== '') {
          obj['.read'] = rec.READ
        }
        if (rec.WRITE !== '') {
          obj['.write'] = rec.WRITE
        }

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
              callback(new Error('invalid type "' + rec.TYPE + ': ' + elem))
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
          if (level === 0) {
            callback(new Error('INDEX element must not be at the top level: ' + elem))
          }
          else {
            if (!parents[level - 1]['.indexOn']) {
              parents[level - 1]['.indexOn'] = []
            }
            parents[level - 1]['.indexOn'].push(elem)
          }
        }
      })
      callback(null, { rules: ruleJson })
    })
}

// exit with exit code and error message
local.errorExit = function(exitCode, message) {
  if (message) console.error(message)
  process.exit(exitCode)
}

// write message to console
local.writeToConsole = function(message) {
  console.log(message)
}

module.exports = {
  main: main,
  _test: local
}
