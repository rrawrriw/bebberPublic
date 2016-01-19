'use strict'

var m = angular.module('virtualDir.services.docs', ['ngResource']);

m.factory('docTools', ['$http', function($http) {
  return {
    findDocsByLabel: function(label) {
      var url = '/v2/docs/labels?label__name=' + label;
      return $http.get(url);
    },
  };
}
]);

m.factory('Doc', [
  '$resource', function($resource) {
    var methods = {
      'update': {
        methode: 'PUT'
      },
    };

    var url_prefix = '/v2/docs/';
    var res = $resource(url_prefix + ':id', null, methods);

    res.readLabels = function() {
      var url = url_prefix + this.id + '/labels';
      return $http.get(url);
    };

    res.joinLabel = function(label) {
      var url = url_prefix + this.id + '/labels/';
      return $http.post(url);
    };

    res.detachLabel = function(labelID) {
      var url = url_prefix + this.id + '/labels/' + labelID;
      return $http.delete(url);
    };

    res.readDocNumbers = function() {
      var url = url_prefix + this.id + '/doc_numbers/';
      return $http.get(url);
    };

    // Create a new doc number table entry
    res.appendDocNumber = function(docNumber) {
      var url = url_prefix + this.id + '/doc_numbers/';
      var data = {
        doc_number: docNumber,
      };
      return $http.post(url, data);
    };

    res.removeDocNumber = function(docNumberID) {
      var url = url_prefix + this.id + '/doc_numbers/' + docNumberID;
      return $http.delete(url);
    };

    res.readAccountData = function() {
      var url = url_prefix + this.id + '/account_data/';
      return $http.get(url);
    }

    res.readAccountingData = function() {
      var url = url_prefix + this.id + '/accounting_data/';
      return $http.get(url);
    }
  }
]);

m.factory('AccProcess', ['$http', '$q', function($http, $q) {
  return {
    searchResult: [],
    findByDocNumber: function(docNumber) {
      var deferred = $q.defer();
      var url = '/AccProcess/FindByDocNumber/' + docNumber
      $http.get(url)
        .success(function(response) {
          if (response.Status === 'success') {
            deferred.resolve(response);
          } else if (response.Status === 'fail') {
            deferredk.reject(response);
          }
        })
        .error(function(response) {
          deferredk.reject(response);
        });

      return deferred.promise;
    },

    findByAccNumber: function(accNumber, from, to) {
      var deferred = $q.defer();
      var url = '/AccProcess/FindByAccNumber/'
        + from + '/' + to + '/' + accNumber;
      $http.get(url)
        .success(function(response) {
          if (response.Status === 'success') {
            deferred.resolve(response);
          } else if (response.Status === 'fail') {
            deferred.reject(response);
          }
        })
        .catch(function(response) {
          deferred.reject(response);
        });

      return deferred.promise;
    },

    findAll: function(docNumbers, accNumber, from, to) {
      var that = this;
      var deferred = $q.defer();
      var promises = [];
      from = this.makeURLDate(from);
      to = this.makeURLDate(to);

      angular.forEach(docNumbers, function(v, k) {
        promises.push(that.findByDocNumber(v));
      });

      promises.push(that.findByAccNumber(accNumber, from, to));

      $q.all(promises)
        .then(function(responseArray) {
          var searchResult = [];
          angular.forEach(responseArray, function(response, k) {
            angular.forEach(response.AccProcessList, function(accProcess, k) {
              searchResult.push(accProcess);
            });
          });
          that.searchResult = searchResult;
          deferred.resolve(searchResult);
        })
        .catch(function(responseArray) {
          deferred.reject(responseArray);
        });

      return deferred.promise;

    },

    makeURLDate: function(dateObj) {
      var tmp = dateObj.split('T');
      var dmy = tmp[0].split('-');
      return dmy[2] + dmy[1] + dmy[0];
    }


  }
}
]);

m.factory('docNumberProposal', [
  '$http', function($http) {
    return {
      url_prefix: '/v2/doc_numbers/proposal',
      save: function(newProposal) {
        var data = {
          proposal: newProposal,
        }
        return $http.put(url_prefix + '/', data);
      },

      curr: function() {
        return $http.get(url_prefix + '/');
      },

      next: function() {
        return $http.get(url_prefix + 'next');
      },
    }
  }
]);
