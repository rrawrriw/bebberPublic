'use strict'

var appServices = angular.module('appServices', ['ngResource']);

appServices.factory('User', ['$resource',
  function($resource){
    return $resource('/User/:name', {name:'@name'});
  }
]);

appServices.factory('Globals', ['$location','$rootScope', '$timeout',
  function($location, $rootScope, $timeout) {

    $rootScope.globalErrMsg = {
      show: false,
      msg: "",
    }

    return {
      goToDoc: function (docName) {
        $location.url('/searchResult/'+ docName);
      },

      goToLogin: function () {
        $location.url('/login');
      },

      makeMongoDBDate: function (euroDate) {
        var tmp = euroDate.split('.');
        return tmp[2] +'-'+ tmp[1] +'-'+ tmp[0] +'T00:00:00Z'
      },

      makeEuroDateFormat: function (timeObj) {
        if (timeObj !== undefined) {
          var tmp = timeObj.split("T");
          var date = tmp[0].split("-");
          return date[2] +'.'+ date[1] +'.'+ date[0]
        } else {
          return '';
        }
      },

      globalErrMsg: function (msg) {
        $rootScope.globalErrMsg.show = true;
        $rootScope.globalErrMsg.msg = msg;

        $timeout(function () {
          $rootScope.globalErrMsg.show = false;
        }, 10000);
      },


    }
  }
]);

appServices.factory('Docs', ['$http', '$q',
  function ($http, $q) {
    return {

      _currDocs: {},
      _sortedDocNames: [],
      _index: 0,

      find: function (searchStrJSON) {
        var that = this;
        var deferred = $q.defer();

        $http.post('/SearchDocs', searchStrJSON)
          .success(function (response) {
            if (response.Status === 'success') {
              deferred.resolve(response);
            } else {
              deferred.reject(response);
            }
          })
          .error(function (response) {
            deferred.reject(response);
          });

        return deferred.promise;
      },

      saveDocs: function (docs) {
        var that = this;
        this._currDocs = {};
        angular.forEach(docs, function (v, k) {
          that._currDocs[v.Name] = v;
        });
        this.sortByDateOfScan();
      },

      readCurrDocs: function () {
        var that = this;
        var currDocs = [];
        angular.forEach(this._sortedDocNames, function (v, k) {
          currDocs.push(that._currDocs[v.name]);
        });
        return currDocs;
      },

      sortByDateOfScan: function () {
        var that = this;

        this._sortedDocNames = [];

        angular.forEach(this._currDocs, function (v, k) {
          that._sortedDocNames.push({name: v.Name, dateOfScan: v.Infos.DateOfScan})
        });

        this._sortedDocNames.sort(function (a, b) {
          if (a.dateOfScan < b.dateOfScan) {
            return a;
          } else if (a.dateOfScan > b.dateOfScan) {
            return b;
          } else {
            return a
          }
        });

      },

      appendLabels: function (name, labels) {
        var jsonReq = {Name: name, Labels: labels}
        var that = this;
        var deferred = $q.defer();

        $http.patch('/DocLabels', JSON.stringify(jsonReq))
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              angular.forEach(labels, function (value, key) {
                that._currDocs[name].Labels.push(value);
              });
              deferred.resolve(response)
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });

        return deferred.promise;
      },

      _removeLabelFromCurrDocs: function (name, label) {
        var that = this;
        angular.forEach(that._currDocs[name].Labels, function (v, k) {
          if (label === v) {
            that._currDocs[name].Labels.splice(k, 1);
          }
        });
      },

      removeLabel: function (name, label) {
        var that = this;
        var url = '/DocLabels/'+ name +'/'+ label;
        var deferred = $q.defer();

        $http.delete(url)
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              that._removeLabelFromCurrDocs(name, label);
              deferred.resolve(response)
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });
        
        return deferred.promise;
      },

      contains: function (list, obj) {
        var contain = false;
        angular.forEach(list, function (v, k) {
          if (v === obj) {
            contain = true;
            return
          }
        })

        return contain;
      },

      appendDocNumbers: function (name, numbers) {
        var jsonReq = {Name: name, DocNumbers: numbers}
        var that = this;
        var deferred = $q.defer();

        var currDocNumbers = this._currDocs[name].AccountData.DocNumbers;
        angular.forEach(numbers, function (v, k) {
          if (that.contains(currDocNumbers, v)) {
            numbers.splice(k, 1);
          }
        });

        $http.patch('/DocNumbers', JSON.stringify(jsonReq))
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              angular.forEach(numbers, function (value, key) {
                that._currDocs[name].AccountData.DocNumbers.push(value);
              });
              deferred.resolve(response)
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });

        return deferred.promise;
      },

      _removeDocNumberFromCurrDocs: function (name, number) {
        var that = this;
        var currDocNumbers = this._currDocs[name].AccountData.DocNumbers;
        angular.forEach(currDocNumbers, function (v, k) {
          if (number === v) {
            currDocNumbers.splice(k, 1);
          }
        });
      },

      removeDocNumber: function (name, number) {
        var that = this;
        var url = '/DocNumbers/'+ name +'/'+ number;
        var deferred = $q.defer();

        $http.delete(url)
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              that._removeDocNumberFromCurrDocs(name, number);
              deferred.resolve(response)
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });

        return deferred.promise;

      },

      saveNote: function (name, note) {
        var that = this;
        var request = {'Name': name, 'Note': note}
        var deferred = $q.defer();

        $http.patch('/Doc', JSON.stringify(request))
          .success(function (response) {
            if (response.Status === 'fail') {
              deferred.reject(response)
            } else if (response.Status === 'success') {
              that._currDocs[name].Note = note;
              deferred.resolve(note, response)
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });

        return deferred.promise;

      },

      _changeDocNameFromCurrDocs: function (name, newName) {
        this._currDocs[newName] = this._currDocs[name];
        delete this._currDocs[name];

      },

      changeDocName: function (name, newName) {
        var that = this;
        var deferred = $q.defer();
        var url = '/DocRename';
        var request = {Name: name, NewName: newName};

        $http.patch(url, JSON.stringify(request))
          .success(function (response) {
            if (response.Status === 'success') {
              that._changeDocNameFromCurrDocs(name, newName);
              deferred.resolve(response);
            } else if (response.Status === 'fail') {
              deferred.reject(response);
            }
          })
          .error(function (response) {
            deferred.reject(response);
          });

        return deferred.promise;

      },

      _changeDateOfReceiptFromCurrDocs: function (name, newDate) {
        this._currDocs[name].Infos.DateOfReceipt = newDate;
      },

      changeDateOfReceipt: function (name, newDate) {
        var that = this;
        var deferred = $q.defer();
        var url = '/Doc';
        var request = {
          Name: name,
          Infos: {
            DateOfReceipt: newDate,
          },
        };

        $http.patch(url, JSON.stringify(request))
          .success(function (response) {
            if (response.Status === 'success') {
              that._changeDateOfReceiptFromCurrDocs(name, newDate);
              deferred.resolve(response);
            } else if (response.Status === 'fail') {
              deferred.reject(response);
            }
          })
          .error(function (response) {
            deferred.reject(response);
          });

        return deferred.promise;
      },

      saveAccData: function (name, accData) {
        var that = this;
        var request = {
          Name: name,
          AccountData: {
            AccNumber: accData.accNumber,
            DocPeriod: {
              from: accData.docPeriod.from,
              to: accData.docPeriod.to,
            }
          }
        };
        var url = '/Doc';
        var deferred = $q.defer();

        $http.patch(url, JSON.stringify(request))
          .success(function (response) {
            if (response.Status === 'success') {
              that._currDocs[name].AccountData.Accnumber = accData.accNumber;
              that._currDocs[name].AccountData.DocPeriod.From = accData.docPeriod.from;
              that._currDocs[name].AccountData.DocPeriod.To = accData.docPeriod.to;
              deferred.resolve(response);
            } else if (response.Status === 'fail') {
              deferred.reject(response);
            }
          })
          .error(function (response) {
            deferred.reject(response)
          });

        return deferred.promise;
      },

      readDoc: function (name) {
        return this._currDocs[name];
      },

      readDocByIndex: function (index) {
        var doc = this._sortedDocNames[index];
        return this.readDoc(doc.name);
      },

      firstDoc: function () {
        this._index = 0;
        return this.readDocByIndex(this._index);
      },

      nextDoc: function () {
        if ((this._index + 1) < this._sortedDocNames.length) {
          this._index += 1;
        } else if ((this._index + 1) >= this._sortedDocNames.length) {
          this._index = 0;
        }
        return this.readDocByIndex(this._index);
      },

      prevDoc: function () {
        if (this._index === 0) {
          this._index = this._sortedDocNames.length-1;
        } else { 
          this._index -= 1;
        }
        return this.readDocByIndex(this._index);
      },


    }
  }
]);

appServices.factory('AccProcess', ['$http', '$q',
  function ($http, $q) {
    return {
      searchResult: [],
      findByDocNumber: function (docNumber) {
        var deferred = $q.defer();
        var url = '/AccProcess/FindByDocNumber/'+ docNumber 
        $http.get(url)
          .success(function (response) {
            if (response.Status === 'success') {
              deferred.resolve(response);
            } else if (response.Status === 'fail') {
              deferredk.reject(response);
            }
          })
          .error(function (response) {
            deferredk.reject(response);
          });

        return deferred.promise;
      },

      findByAccNumber: function (accNumber, from, to) {
        var deferred = $q.defer();
        var url = '/AccProcess/FindByAccNumber/'
          + from +'/'+ to +'/'+ accNumber;
        $http.get(url)
          .success(function (response) {
            if (response.Status === 'success') {
              deferred.resolve(response);
            } else if (response.Status === 'fail') {
              deferred.reject(response);
            }
          })
          .catch(function (response) {
            deferred.reject(response);
          });

        return deferred.promise;
      },

      findAll: function (docNumbers, accNumber, from, to) {
        var that = this;
        var deferred = $q.defer();
        var promises = [];
        from = this.makeURLDate(from);
        to = this.makeURLDate(to);

        angular.forEach(docNumbers, function (v, k) {
          promises.push(that.findByDocNumber(v));
        });

        promises.push(that.findByAccNumber(accNumber, from, to));

        $q.all(promises)
          .then(function (responseArray) {
            var searchResult = [];
            angular.forEach(responseArray, function (response, k) {
              angular.forEach(response.AccProcessList, function (accProcess, k) {
                searchResult.push(accProcess);
              });
            });
            that.searchResult = searchResult;
            deferred.resolve(searchResult);
          })
          .catch(function (responseArray) {
            deferred.reject(responseArray);
          });

        return deferred.promise;

      },

      makeURLDate: function (dateObj) {
        var tmp = dateObj.split('T');
        var dmy = tmp[0].split('-');
        return dmy[2]+dmy[1]+dmy[0];
      }


    }
  }
]);

appServices.factory('DocNumberProposal', ['$http', '$q',
  function ($http, $q) {
    return {
      sendRequest: function (method, url, data) {
        var deferred = $q.defer();
        var request = {
          method: method,
          url: url,
          data: data,
        };
        $http(request)
          .success(function (response) {
            if (response.Status === 'success') {
              deferred.resolve(response);
            } else {
              deferred.reject(response);
            }
          })
          .error(function () {
            deferred.reject(response);
          });

        return deferred.promise;
      },
      save: function (newProposal) {
        return this.sendRequest(
          'PUT',
          '/DocNumberProposal',
          {Proposal: newProposal}
        );
      },
      curr: function () {
        return this.sendRequest(
          'GET',
          '/DocNumberProposal',
          {}
        );
      },
      next: function () {
        return this.sendRequest(
          'GET',
          '/DocNumberProposal/Next',
          {}
        );
      },
    }
  }
]);
