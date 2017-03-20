var assert = require('power-assert')
var target = require('../lib/index.js')
var fs = require('fs')

describe('makeRuleJson', function() {
  it('regular pattern', function(done) {
    var data = fs.readFileSync(__dirname + '/testdata_regular_input.csv')
    target.makeRuleJson(data, function(err, data) {
      assert(err === null)
      var expected = require(__dirname + '/testdata_regular_result.json')
      assert(JSON.stringify(data) === JSON.stringify(expected))
      done()
    })
  })
})
