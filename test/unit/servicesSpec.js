'use strict';

var makeMongoDBDate = function (euroDate) {
  var tmp = euroDate.split('.');
  return tmp[2] +'-'+ tmp[1] +'-'+ tmp[0] +'T00:00:00Z'
}

describe('Services', function() {

  beforeEach(module('bebber'));

  describe('Docs', function () {

    var $scope,
      $rootScope,
      $httpBackend,
      testDocName = 'testDoc',
      doc = {
        Name: testDocName,
        Labels: ['l1', 'l2'],
        AccountData: {
          DocNumbers: ['13', '14'],
        },
        Infos: {
          DateOfReceipt: makeMongoDBDate('01.01.2000'),
          DateOfScan: makeMongoDBDate('01.01.2000'),
        }
      };

    beforeEach(inject(function ($injector) {
      $rootScope = $injector.get('$rootScope')
      $scope = $rootScope.$new(); 
      $scope.docs = $injector.get('Docs');

      $httpBackend = $injector.get('$httpBackend');
      $httpBackend
        .when('POST', '/SearchDocs')
        .respond({"Status": "success", "Result": [doc]});
      $httpBackend
        .when('PATCH', '/Doc')
        .respond({Status: 'success'});

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

    describe('Modifiy labels', function () {
      it('should implement a appendLabels function', function () {
        expect($scope.docs.appendLabels).toBeDefined();
      });

      it('should add labels to a doc', function (done) {
        $httpBackend
          .when('PATCH', '/DocLabels')
          .respond({Status: 'success'});
        $httpBackend.expectPATCH('/DocLabels');
        $scope.docs.appendLabels(doc.Name, ['l3'])
          .catch(function (response) {
            expect(response).toEqual({Status: 'success'});
          });
        $httpBackend.flush();

        var expectLabels = ['l1', 'l2', 'l3'];
        var resultDoc = $scope.docs.readDoc(doc.Name);
        expect(resultDoc.Labels).toEqual(expectLabels);

        done();
      });

      it('should implement a removeLabel function', function () {
        expect($scope.docs.removeLabel).toBeDefined();
      });

      it('should remove a label from a doc', function (done) {
        $httpBackend
          .when('DELETE', '/DocLabels/'+ doc.Name +'/l2')
          .respond({Status: 'success'});

        $httpBackend.expectDELETE('/DocLabels/'+ doc.Name +'/l2');
        $scope.docs.removeLabel(doc.Name, 'l2')
          .catch(function (response) {
            expect(response).toEqual({Status: 'success'});
          });
        $httpBackend.flush();

        var expectLabels = ['l1'];
        var resultDoc = $scope.docs.readDoc(doc.Name);
        expect(resultDoc.Labels).toEqual(expectLabels);

        done();
      });

    });

    describe('Modifiy doc numbers', function () {

      it('should implement a appendDocNumbers function', function () {
        expect($scope.docs.appendDocNumbers).toBeDefined();
      });

      it('should add doc numbers to a doc', function (done) {
        $httpBackend
          .when('PATCH', '/DocNumbers')
          .respond({Status: 'success'});
        $httpBackend.expectPATCH('/DocNumbers');
        $scope.docs.appendDocNumbers(doc.Name, ['DE14'])
          .catch(function (response) {
            expect(response).toEqual({Status: 'success'});
          });
        $httpBackend.flush();

        var expectDocNumbers = ['13', '14', 'DE14'];
        var resultDoc = $scope.docs.readDoc(doc.Name);
        expect(resultDoc.AccountData.DocNumbers).toEqual(expectDocNumbers);

        done();
      });

      it('should implement a removeDocNumber function', function () {
        expect($scope.docs.removeDocNumber).toBeDefined();
      });

      it('should remove a doc number from a doc', function (done) {
        $httpBackend
          .when('DELETE', '/DocNumbers/'+ doc.Name +'/13')
          .respond({Status: 'success'});

        $httpBackend.expectDELETE('/DocNumbers/'+ doc.Name +'/13');
        $scope.docs.removeDocNumber(doc.Name, '13')
          .catch(function (response) {
            expect(response).toEqual({Status: 'success'});
          });
        $httpBackend.flush();

        var expectDocNumbers = ['14'];
        var resultDoc = $scope.docs.readDoc(doc.Name);
        expect(resultDoc.AccountData.DocNumbers).toEqual(expectDocNumbers);

        done();
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
      $httpBackend.expectGET('/DocNumberProposal');
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
