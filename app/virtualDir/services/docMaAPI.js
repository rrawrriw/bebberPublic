var m = angular.module('virtualDir.services.docMaAPI', []);

m.factory('docMaAPI', ['resti', function(resti) {
  var urlPrefix = '/v1';
  return {
    urlPrefix: urlPrefix,
    docs: new DocsAPI_v1(urlPrefix, resti),
    labels: new LabelsAPI_v1(urlPrefix, resti),
    docNumberProposals: new DocNumberProposalAPI_v1(urlPrefix, resti),
    search: new SearchAPI_v1(urlPrefix, resti),
  }
}
]);

m.factory('resti', ['$http', '$q', function($http, $q) {

  var create = function(result, url, data) {
    result.$promise = $http.post(url, data);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val, key) {
        result[key] = val;
      });
      return resp;
    }, function(resp) {
      return $q.reject(resp);
    });

    return result;
  };

  var readAll = function(result, url) {
    result.$promise = $http.get(url);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val) {
        result.push(val)
      });
      return resp;
    }, function(resp) {
      return $q.reject(resp);
    });

    return result;
  };

  var readOne = function(result, url) {
    result.$promise = $http.get(url);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val, key) {
        result[key] = val;
      });
      return resp;
    }, function(resp) {
      return $q.reject(resp);
    });

    return result;
  };

  var update = function(result, url, change) {
    result.$promise = $http.put(url, change);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val, key) {
        result[key] = val;
      });
      return resp;
    }, function(resp) {
      return $q.reject(resp);
    });

    return result;
  };

  var patch = function(result, url, change) {
    result.$promise = $http.patch(url, change);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val, key) {
        result[key] = val;
      });
      return resp;
    }, function(resp) {
      return $q.reject(resp);
    });

    return result;
  };

  var remove = function(url) {
    return $http.delete(url);
  };

  return {
    create: create,
    readAll: readAll,
    readOne: readOne,
    update: update,
    remove: remove,
    patch: patch,
    $http: $http,
    $q: $q,
  };
}
]);

var DocsAPI_v1 = function(urlPrefix, resti) {
  this.readAllDocs = function() {
    var result = []
    var url = urlPrefix + '/docs/';

    return resti.readAll(result, url);
  };

  this.updateDoc = function(id, change) {
    var result = {};
    var url = urlPrefix + '/docs/' + id;
    return resti.update(result, url, change);
  };

  this.renameDoc = function(id, name) {
    var result = {};
    var url = urlPrefix + '/docs/' + id + '/name';
    return resti.patch(result, url, {
      name: name
    });
  };

  this.deleteDoc = function(id) {
    var url = urlPrefix + '/docs/' + id;
    return resti.remove(url);
  };

  this.createDocNumber = function(docID, docNumber) {
    var result = {};
    var data = {
      doc_id: docID,
      number: docNumber,
    };
    var url = urlPrefix + '/docs/doc_numbers/';
    return resti.create(result, url, data);
  };

  this.readAllDocNumbers = function(docID) {
    var result = []
    var url = urlPrefix + '/docs/' + docID + '/doc_numbers/';

    return resti.readAll(result, url);
  };

  this.deleteDocNumber = function(docID, docNumberID) {
    var url = urlPrefix + '/docs/' + docID + '/doc_numbers/' + docNumberID
    return resti.remove(url);
  };

  this.readAccountData = function(docID) {
    var result = {};
    var url = urlPrefix + '/docs/' + docID + '/account_data/';
    return resti.readOne(result, url);
  };

  this.updateAccountData = function(docID, change) {
    var result = {}
    var url = urlPrefix + '/docs/' + docID + '/account_data/';
    return resti.update(result, url, change);
  };

  this.readAllLabels = function(docID) {
    var result = []
    var url = urlPrefix + '/docs/' + docID + '/labels';
    return resti.readAll(result, url);
  };

  this.findDocsByLabel = function(labelID) {
    var result = [];
    var url = urlPrefix + '/labels/' + labelID + '/docs';
    return resti.readAll(result, url);
  };

  this.joinLabel = function(docID, labelID) {
    var data = {
      doc_id: docID,
      label_id: labelID,
    };
    var result = {};
    var url = urlPrefix + '/docs/labels';
    return resti.create(result, url, data)
  };

  this.detachLabel = function(docID, labelID) {
    var url = urlPrefix + '/docs/' + docID + '/labels/' + labelID;
    return resti.remove(url)
  };

  this.readAccountingData = function(docID) {
    var result = [];
    var url = urlPrefix + '/docs/' + docID + '/accounting_data/';
    return resti.readAll(result, url)
  };
};

var DocNumberProposalAPI_v1 = function(urlPrefix, resti) {
  this.read = function() {
    var result = {};
    var url = urlPrefix + '/doc_number_proposals/';
    return resti.readOne(result, url)
  };

  this.update = function(change) {
    var result = {};
    var url = urlPrefix + '/doc_number_proposals/';
    return resti.update(result, url, change)
  };

  this.next = function() {
    var result = {};
    var url = urlPrefix + '/doc_number_proposals/next/';
    return resti.readOne(result, url)
  };
};

var LabelsAPI_v1 = function(urlPrefix, resti) {
  this.readAllLabels = function() {
    var result = [];
    var url = urlPrefix + '/labels/';
    return resti.readAll(result, url)
  };

  this.findLabelsByName = function(name) {
    var result = [];
    var url = urlPrefix + '/labels?name=' + name;
    return resti.readAll(result, url)
  };

  this.createLabel = function(label) {
    var data = {
      name: label
    };
    var result = [];
    var url = urlPrefix + '/labels/';
    return resti.create(result, url, data)
  };

};

var SearchAPI_v1 = function(urlPrefix, resti) {
  var readAll = function(result, url, data) {
    result.$promise = resti.$http.post(url, data);
    result.$promise.then(function(resp) {
      _.each(resp.data, function(val) {
        result.push(val)
      });
      return resp;
    }, function(resp) {
      return resti.$q.reject(resp);
    });

    return result;
  };

  this.docs = function(data) {
    var result = [];
    var url = urlPrefix + '/search/docs';
    return readAll(result, url, data)
  };
};

