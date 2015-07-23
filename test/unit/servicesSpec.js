'use strict';

var makeMongoDBDate = function (euroDate) {
  var tmp = euroDate.split('.');
  return tmp[2] +'-'+ tmp[1] +'-'+ tmp[0] +'T00:00:00Z'
}

describe('Services', function() {

  beforeEach(module('bebber'));

  describe('Docs', function () {

    var $scope,
      $httpBackend,
      testDocName = 'testDoc',
      doc = {
        Name: testDocName,
        Labels: ["l1", "l2"],
        Infos: {
          DateOfReceipt: makeMongoDBDate('01.01.2000'),
          DateOfScan: makeMongoDBDate('01.01.2000'),
        }
      };

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend
        .when('POST', '/SearchDocs')
        .respond({"Status": "success", "Result": [doc]});
      $httpBackend
        .when('PATCH', '/Doc')
        .respond({Status: 'success'});
      $scope = $injector.get('$rootScope').$new(); 
      $scope.docs = $injector.get('Docs');

      $httpBackend.expectPOST('/SearchDocs');
      $scope.docs.find()
        .then(function (response) {
          $scope.docs.saveDocs(response.Result);
        });
      $httpBackend.flush();

    }));

    describe('changeDateOfReceipt', function () {

      it('should implement a changeDateOfReceipt function', 
        inject(function(Docs) {
          expect(Docs.changeDateOfReceipt).toBeDefined();
      }));

      it('should set date of receipt to 06.04.1987', function (done) {
        var expectDoc,
          expectDate = makeMongoDBDate('06.04.1987');

        $httpBackend.expectPATCH('/Doc');
        $scope.docs.changeDateOfReceipt(testDocName, expectDate)
          .catch(function(response) {
            expect(response).toEqual({Status: 'success'});
          })
        $httpBackend.flush();

        expectDoc = $scope.docs.readDoc(testDocName);
        expect(expectDoc.Infos.DateOfReceipt).toBe(expectDate);
        done();
      });

    });

    describe('readCurrDocs', function () {
      it('should implement a readCurrDocs function', function () {
        expect($scope.docs.readCurrDocs).toBeDefined();
      });

      it('should possible to get the current docs', function () {
        var expectResult = [doc];
        var result = $scope.docs.readCurrDocs()
        expect(result).toEqual(expectResult);
      });

    });


  });

  describe('DocNumberProposal', function () {
    var $rootScope,
      $scope,
      $httpBackend,
      DocNumberProposal;

    beforeEach(inject(function ($injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
      DocNumberProposal = $injector.get('DocNumberProposal');
      $scope.docNumberProposal = DocNumberProposal;

      $httpBackend
        .when('GET', '/DocNumberProposal/Next')
        .respond({Status: 'success', Proposal: 1234});
      $httpBackend
        .when('GET', '/DocNumberProposal')
        .respond({Status: 'success', Proposal: 1235});
      $httpBackend
        .when('PUT', '/DocNumberProposal')
        .respond({Status: 'success'});

    }));

    it('should possible to save doc number proposal', function (done) {
      $httpBackend.expect('PUT', '/DocNumberProposal');
      $scope.docNumberProposal.save('1235')
        .catch(function (response) {
          expect(response).toEqual({Status: 'success'});
        });
      $httpBackend.flush();
      done();
    });

    it('should possible to get the next doc number proposal', function (done) {
      $httpBackend.expect('GET', '/DocNumberProposal/Next');
      $scope.docNumberProposal.next()
        .then(function (response) {
          expect(response.Proposal).toEqual(1234);
        })
        .catch(function (response) {
          expect(respone).toEqual({Status: 'success'});
        });
      $httpBackend.flush();
      done();
    });

    it('should possible to get the current doc number proposal', function (done) {
      $httpBackend.expect('GET', '/DocNumberProposal');
      $scope.docNumberProposal.curr()
        .then(function (response) {
          expect(response.Proposal).toEqual(1235);
        })
        .catch(function (response) {
          expect(respone).toEqual({Status: 'success'});
        });
      $httpBackend.flush();
      done();
    });

  });
});
