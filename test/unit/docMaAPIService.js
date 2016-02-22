'use strict';

describe('docMaAPI service', function() {
  beforeEach(module('docMa'));

  describe('v1', function() {
    var $scope;
    var $httpBackend;
    var client;

    beforeEach(inject(function($injector) {
      $scope = $injector.get('$rootScope').$new();
      $httpBackend = $injector.get('$httpBackend');
      client = $injector.get('docMaAPI');
    }));

    it('should implement urlPrefix', function() {
      expect(client.urlPrefix).toEqual('/v1');
    });

    it('should read all docs', function(done) {
      var data = {
        id: 1,
        name: 'doc1.pdf',
        barcode: 'A1',
        dateOfScan: new Date(),
        dateOfReceipt: new Date(),
        note: 'node 1',
      };

      $httpBackend
        .expectGET('/v1/docs/')
        .respond(200, [data]);

      var docs = client.docs.readAllDocs();
      docs.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        expect(docs[0].id).toEqual(1);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should update doc', function(done) {
      var data = {
        id: 1,
        name: 'doc1.pdf',
        barcode: 'A1',
        dateOfScan: new Date(),
        dateOfReceipt: new Date(),
        note: 'node 1',
      };

      $httpBackend
        .expectPUT('/v1/docs/1')
        .respond(200, data);

      var doc = client.docs.updateDoc(1, data);
      doc.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        expect(doc.id).toEqual(1);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should rename doc', function(done) {
      $httpBackend
        .expectPATCH('/v1/docs/1/name')
        .respond(200);

      var doc = client.docs.renameDoc(1, "test");
      doc.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should delete doc', function(done) {
      $httpBackend
        .expectDELETE('/v1/docs/1')
        .respond(200, undefined);

      client.docs.deleteDoc(1).then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should create doc number', function(done) {
      var data = {
        id: 1,
        number: 'DN1',
      };
      $httpBackend
        .expectPOST('/v1/docs/doc_numbers/')
        .respond(201, data);

      var docNumber = client.docs.createDocNumber(1, data);
      docNumber.$promise.then(function(resp) {
        expect(resp.status).toBe(201);
        expect(docNumber.id).toEqual(data.id);
        expect(docNumber.number).toEqual(data.number);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should read all doc numbers', function(done) {
      var data = {
        id: 1,
        number: 'DN1',
      };
      $httpBackend
        .expectGET('/v1/docs/1/doc_numbers/')
        .respond(200, [data]);

      var docNumbers = client.docs.readAllDocNumbers(1);
      docNumbers.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        expect(docNumbers[0].id).toEqual(data.id);
        expect(docNumbers[0].number).toEqual(data.number);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should delete doc number', function(done) {
      $httpBackend
        .expectDELETE('/v1/docs/1/doc_numbers/1')
        .respond(200, {});

      var promise = client.docs.deleteDocNumber(1, 1);
      promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should read account data', function(done) {
      var data = {
        account_number: 123,
        period_from: new Date(),
        period_to: new Date(),
      };
      $httpBackend
        .expectGET('/v1/docs/1/account_data/')
        .respond(200, data);

      var accountData = client.docs.readAccountData(1);
      accountData.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should update account data', function(done) {
      $httpBackend
        .expectPUT('/v1/docs/1/account_data/')
        .respond(200, undefined);

      var accountData = client.docs.updateAccountData(1, 1, {});
      accountData.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should find all labels of a doc', function(done) {
      var data = {
        id: 1,
        name: 'doc1.pdf',
        barcode: 'A1',
        dateOfScan: new Date(),
        dateOfReceipt: new Date(),
        note: 'node 1',
      };
      $httpBackend
        .expectGET('/v1/docs/1/labels')
        .respond(200, [data]);

      var docs = client.docs.readAllLabels(1);
      docs.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        expect(docs[0].id).toEqual(1);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();

    });

    it('should find all docs by label', function(done) {
      var data = {
        id: 1,
        name: 'doc1.pdf',
        barcode: 'A1',
        dateOfScan: new Date(),
        dateOfReceipt: new Date(),
        note: 'node 1',
      };

      $httpBackend
        .expectGET('/v1/labels/1/docs')
        .respond(200, [data]);

      var docs = client.docs.findDocsByLabel(1);
      docs.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        expect(docs[0].id).toEqual(1);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should search docs', function(done) {
      $httpBackend
        .expectPOST('/v1/search/docs')
        .respond(200, []);

      var docs = client.search.docs({});
      docs.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should join label with doc', function(done) {
      var data = {
        label_id: 1,
        doc_id: 2,
      };
      $httpBackend
        .expectPOST('/v1/docs/labels')
        .respond(202, data);

      var ref = client.docs.joinLabel(2, 1);
      ref.$promise.then(function(resp) {
        expect(resp.status).toBe(202);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should detach label from doc', function(done) {
      $httpBackend
        .expectDELETE('/v1/docs/1/labels/2')
        .respond(202, {});

      var promise = client.docs.detachLabel(1, 2);
      promise.then(function(resp) {
        expect(resp.status).toBe(202);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });


    it('should read doc number proposal', function(done) {
      var data = {
        doc_number_proposal: 1,
      };
      $httpBackend
        .expectGET('/v1/doc_number_proposals/')
        .respond(200, data);

      var numberProposal = client.docNumberProposals.read();
      numberProposal.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should update a doc number proposal', function(done) {
      $httpBackend
        .expectPUT('/v1/doc_number_proposals/')
        .respond(200, {});

      var proposal = client.docNumberProposals.update();
      proposal.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should read next doc number proposal', function(done) {
      var data = {
        doc_number_proposal: 1,
      };
      $httpBackend
        .expectGET('/v1/doc_number_proposals/next/')
        .respond(200, data);

      var proposal = client.docNumberProposals.next();
      proposal.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should read all accounting data of doc', function(done) {
      $httpBackend
        .expectGET('/v1/docs/1/accounting_data/')
        .respond(200, []);

      var docNumbers = client.docs.readAccountingData(1);
      docNumbers.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should read all labels', function(done) {
      var data = [
        {
          id: 1,
          name: 'l1'
        },
        {
          id: 2,
          name: 'l2'
        },
      ];
      $httpBackend
        .expectGET('/v1/labels/')
        .respond(200, data);

      var labels = client.labels.readAllLabels();
      labels.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should find labels by name', function(done) {
      var data = [
        {
          id: 1,
          name: 'l1'
        }
      ];
      $httpBackend
        .expectGET('/v1/labels?name=l1')
        .respond(200, data);

      var labels = client.labels.findLabelsByName("l1");
      labels.$promise.then(function(resp) {
        expect(resp.status).toBe(200);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });

    it('should create new label', function(done) {
      var data = {
        id: 1,
        name: 'l1',
      };
      $httpBackend
        .expectPOST('/v1/labels/')
        .respond(202, data);

      var label = client.labels.createLabel(data);
      label.$promise.then(function(resp) {
        expect(resp.status).toBe(202);
        done();
      });

      $httpBackend.flush();
      $scope.$apply();
    });



  });

});
