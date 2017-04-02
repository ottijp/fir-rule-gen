"use strict"

var assert = require('power-assert')
var fs = require('fs')
var proxyquire = require('proxyquire')
var sinon = require('sinon')
var target

beforeEach(function() {
  target = require('../lib/index.js')
})

describe('CLI', function() {
  beforeEach(function() {
    this.originalArgv = process.argv
    target = proxyquire('../lib/index', {
      'fs': sinon.spy()
    })
  })

  afterEach(function() {
    process.argv = this.originalArgv
  })

  it('file to file', function(done) {
    process.argv = ['node', 'fir-rule-gen', 'srcfile', 'dstfile']
    var fsMock = {
      'readFileSync': sinon.stub().returns(''),
      'writeFileSync': sinon.stub()
    }
    var target = proxyquire('../lib/index', {
      'fs': fsMock,
      'cli': proxyquire('../node_modules/cli/cli', {}) // to load process.argv again
    })
    sinon.stub(target._test, 'makeRuleJson').callsArgWithAsync(1, null, {})

    target.main(function() {
      assert(fsMock.readFileSync.called === true)
      assert(fsMock.writeFileSync.called === true)
      assert(target._test.makeRuleJson.called === true)
      done()
    })
  })

  it('pipe', function(done) {
    process.argv = ['node', 'fir-rule-gen']
    var cliMock = proxyquire('../node_modules/cli/cli', {}) // to load process.argv again
    cliMock.withStdin = sinon.stub().callsArgWithAsync(0, '')
    var target = proxyquire('../lib/index', {
      'cli':  cliMock
    })
    sinon.stub(target._test, 'makeRuleJson').callsArgWithAsync(1, null, {})

    sinon.stub(console, 'log')
    target.main(function() {
      assert(cliMock.withStdin.called === true)
      assert(target._test.makeRuleJson.called === true)
      //assert(consoleMock.log.called === true)
      assert(console.log.called === true)
      console.log.restore()
      done()
    })
  })
})

describe('makeRuleJson', function() {
  it('regular pattern', function(done) {
    var target = require('../lib/index.js')
    var data = fs.readFileSync(__dirname + '/testdata_regular_input.csv')
    target._test.makeRuleJson(data, function(err, data) {
      assert(err === null)
      var expected = require(__dirname + '/testdata_regular_result.json')
      assert(JSON.stringify(data) === JSON.stringify(expected))
      done()
    })
  })
})
