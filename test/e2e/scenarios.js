'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('docMa App', function() {


  describe('singleview', function() {

    it('should be possible to change date of receipt', function() {
      browser.get('/');
      var username = element(by.model('username'));
      var password = element(by.model('password'));
      username.sendKeys('a');
      password.sendKeys('a');
      password.sendKeys(protractor.Key.ENTER);
      browser.get('/#/searchResult/20140415_0000182.pdf');
      browser.pause();
      //var dateInput = element.all(by.css('input#date-of-receipt-input'));
      //dateInput.value('16.04.1987');
      //dateInput.sendKeys(protractor.Key.ENTER);

    });

  });

});
