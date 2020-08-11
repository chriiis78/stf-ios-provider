it("should get the url", function () {
    return driver
    .get('https://www.google.com')
    .sleep(2000)
    .waitForElementByName('q', 5000).sendKeys('Capgemini')
    .sleep(2000)
    .get('https://www.capgemini.com')
})