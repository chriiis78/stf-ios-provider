var { writeFile, mkdirSync } = require('fs')
var path = require('path')
const { promisify } = require('util')
const addContext = require('mochawesome/addContext')
var execSync = require('child_process').execSync

const myWriteFile = promisify(writeFile)

var wd = require("wd");
      
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;
var screenshotCount = 0

testOutput = ""

describe("ios safari", function () {
    this.timeout(300000);
    var driver;
    var allPassed = true;

    before(function () {
        var serverConfig = {
            host: 'localhost',
            port: 4723
        };
        driver = wd.promiseChainRemote(serverConfig);

        driver.on('status', function (info) {
            testOutput += info + '\n';
        });
        driver.on('command', function (meth, path, data) {
            testOutput += ' > ' + meth + ' ' + path + ' ' + (data || '') + '\n';
        });
        driver.on('http', function (meth, path, data) {
            testOutput += ' > ' + meth + ' ' + path + ' ' + (data || '') + '\n';
        });

        var desired = {
            browserName: '',
            platformName: 'iOS',
            udid: 'UDID',
            automationName: 'XCUITest',
            autoWebview: true,
            deviceName: 'DEVICENAME',
            useNewWDA: false,
            webDriverAgentUrl: "http://localhost:WDAPORT",
            app: undefined // will be set later
        };
        desired.browserName = 'safari';
        return driver.init(desired);
    });

    after(function () {
        dstfilename = path.join(__dirname, "testExemple-test-output.txt")
        console.log("dstfilename " + dstfilename)
        myWriteFile(dstfilename, testOutput, 'utf8')
        .catch(err => console.log(err))
    })

    afterEach(function () {
        mkdirSync("mochawesome-report/assets/", { recursive: true })
        filename = screenshotCount + ".png"
        cmd = "idevicescreenshot -u UDID mochawesome-report/assets/" + filename;
        execSync(cmd,{});
        addContext(this, "assets/" + filename)
        screenshotCount++
    })

//USERTESTS
})