'use strict';

var makeMongoDBDate = function (euroDate) {
  var tmp = euroDate.split('.');
  return tmp[2] +'-'+ tmp[1] +'-'+ tmp[0] +'T00:00:00Z'
}

describe('Services', function() {

  beforeEach(module('bebber'));

  describe('Docs', function () {

    var scope,
      $httpBackend,
      testDocName = 'testDoc',
      doc = {
        name: testDocName,
        infos: {
          dateofreceipt: makeMongoDBDate('01.01.2000'),
          dateofscan: makeMongoDBDate('01.01.2000'),
        }
      };

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend
        .when('POST', '/Search')
        .respond([doc]);
      $httpBackend
        .when('PATCH', '/Doc')
        .respond({Status: 'success'});
      scope = $injector.get('$rootScope').$new(); 
      scope.docs = $injector.get('Docs');
    }));

    it('check the existence of Docs factory', inject(function(Docs) {
      expect(Docs).toBeDefined();
    }));

    it('should implement a changeDateOfReceipt function', 
      inject(function(Docs) {
        expect(Docs.changeDateOfReceipt).toBeDefined();
    }));

    it('should set date of receipt to 06.04.1987', function (done) {
      var expectDoc,
        expectDate = makeMongoDBDate('06.04.1987');

      $httpBackend.expectPOST('/Search');
      scope.docs.find(JSON.stringify({name: testDocName}))
        .then(function (data) {
          scope.docs.saveDocs(data);
        });
      $httpBackend.flush();

      $httpBackend.expectPATCH('/Doc');
      scope.docs.changeDateOfReceipt(testDocName, expectDate)
        .catch(function(response) {
          expect(response).toEqual({Status: 'success'});
        })
      $httpBackend.flush();

      expectDoc = scope.docs.readDoc(testDocName);
      expect(expectDoc.infos.dateofreceipt).toBe(expectDate);
      done();
    });

  });
});
