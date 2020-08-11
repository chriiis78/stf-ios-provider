var syrup = require('stf-syrup')
var path = require('path')
var fs = require('fs')
var Mocha = require("mocha")
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../../device/support/router'))
  .dependency(require('../../device/support/push'))
  .dependency(require('./service'))
  .define(function(options, router, push, service) {
    var log = logger.createLogger('device:plugins:test')

    router.on(wire.TestLaunchMessage, function(channel, message) {
      log.info('Test Launch iOS')
      var reply = wireutil.reply(options.serial)

      var mocha = new Mocha({
        reporter: "mochawesome"
      });
      filename = path.join(__dirname, "test-ios-safari.js")
      testfilename = path.join(__dirname, "../../../../testExemple.js")
      dstfilename = path.join(__dirname, "../../../../testExemple-test.js")
      
      testString = {}
      readFile(testfilename, 'utf8')
      .then(data => testString = data)
      .then(() => readFile(filename, 'utf8'))
      .then(data => {
        data = data.replace(/\/\/USERTESTS/g, testString)
        data = data.replace(/UDID/g, options.serial)
        data = data.replace(/DEVICENAME/g, options.deviceName)
        data = data.replace(/WDAPORT/g, options.wdaPort)
        return data
      })
      .then(data => writeFile(dstfilename, data, 'utf8'))
      .then(() => {
        delete require.cache[dstfilename]
        mocha.addFile(
          dstfilename
        );
        // Run the tests.
        mocha.run(function(failures) {log.info('Mocha test done')})
          // .on('test', function(test) {
          //     console.log('Test started: '+test.title);
          // })
          // .on('test end', function(test) {
          //     console.log('Test done: '+test.title);
          // })
          // .on('pass', function(test) {
          //     console.log('Test passed');
          //     console.log(test);
          // })
          // .on('fail', function(test, err) {
          //     console.log('Test fail');
          //     console.log(test);
          //     console.log(err);
          // })
          // .on('end', function() {
          //     console.log('All done');
          // });
      })
      .catch(err => console.log(err))
    });
  });
