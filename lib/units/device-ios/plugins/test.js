var syrup = require('stf-syrup')
var path = require('path')
var fs = require('fs')
var Mocha = require("mocha")
const { promisify } = require('util')
const archiver = require('archiver');

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
const { zip } = require('lodash')

module.exports = syrup.serial()
  .dependency(require('../../device/support/router'))
  .dependency(require('../../device/support/push'))
  .dependency(require('../../device/support/storage'))
  .define(function(options, router, push, storage) {
    var log = logger.createLogger('device:plugins:test')

    router.on(wire.TestLaunchMessage, function(channel, message) {
      scriptText = message.script

      log.info('Test Launch iOS')
      var reply = wireutil.reply(options.serial)

      var mocha = new Mocha({
        reporter: "mochawesome"
      });
      filename = path.join(__dirname, "test-ios-safari.js")
      testfilename = path.join(__dirname, "../../../../testExemple.js")
      dstfilename = path.join(__dirname, "../../../../testExemple-test.js")
      
      // testString = {}
      // readFile(testfilename, 'utf8')
      // .then(data => testString = data)
      // .then(() => 
      readFile(filename, 'utf8')
      .then(data => {
        data = data.replace(/\/\/USERTESTS/g, scriptText)
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
        return new Promise(resolve => mocha.run(resolve))
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
      .then((result) => {
        log.info('Mocha test done', result)
        var filename = options.serial + ".zip";

        const archive = archiver('zip', { zlib: { level: 9 }});
        const stream = fs.createWriteStream("" + filename);

        return new Promise((resolve, reject) => {
          archive
            .directory("mochawesome-report/", false)
            .on('error', err => reject(err))
            .pipe(stream)
          ;

          stream.on('close', () => resolve(filename));
          archive.finalize();
        });
      })
      .then(filename => {
        var s = fs.createReadStream( "" + filename )
        return storage.store('blob', s, {
          filename: filename,
          contentType: 'application/zip',
          //knownLength: jpegImageData.length
        })
      })
      .then(result => {
        push.send([
          channel
        , reply.okay('success', result)
        ])
      })
      .catch(err => {
        log.error("Mocha launch test failed", err)
        push.send([
          channel
        , reply.fail(err.message)
        ])
      })
    });
  });
