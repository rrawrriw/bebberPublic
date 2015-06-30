'use strict'

var appServices = angular.module('appServices', ['ngResource']);

appServices.factory('User', ['$resource',
  function($resource){
    return $resource('/User/:name', {name:'@name'});
  }
]);

appServices.factory('Globals', ['$location',
  function($location) {
    return {
      goToDoc: function (docName) {
        $location.url('/docs/'+ docName);
      },

      makeMongoDBDate: function (day, month, year) {
        return year +'-'+ month +'-'+ day +'T00:00:00Z'
      },

      makeEuroDate: function (timeObj) {
        if (timeObj !== undefined) {
          var tmp = timeObj.split("T");
          var date = tmp[0].split("-");
          return date[2] +'.'+ date[1] +'.'+ date[0]
        } else {
          return '';
        }
      },
    }
  }
]);

appServices.factory('SearchStr', function() {
  return {
    _draft: {}, // Tag objects
    make: function () {
      var tagNames = [];
      angular.forEach(this._draft, function (v,k) {
        var obj = {}
        tagNames.push(k);
        angular.forEach(v, function (v,k) {
            obj[k] = v;
        });
        //searchStr.push(obj);
      });

      searchStr = {
            '$in': {'tags': tagNames},
      }

      return JSON.stringify(searchStr);

    },
    append: function (tagName, obj) {
      return this._draft[tagName] = obj;
    },
    readDraft: function () {
      return this._draft;
    },
    removeDraft: function (tagName) {
      delete this._draft[tagName]
    },
    amountDraft: function () {
      var amount = 0;
      angular.forEach(this._draft, function (v,k) {
        amount += 1;
      });
      return amount;
    },
    clearDraft: function () {
      var that = this;
      angular.forEach(this._draft, function (v,k) {
        that.removeDraft(k);
      });
    }
  }
});

appServices.factory('Docs', ['$log', '$http', '$q',
  function ($log, $http, $q) {
    return {

      _currDocs: {},
      _sortedDocNames: [],
      _index: 0,
      searchResult: [],

      find: function (searchStrJSON) {
        var that = this;
        var deferred = $q.defer();

        $http.post('/Search', searchStrJSON)
          .success(function (result) {
            console.log("success func");
            that.searchResult = result;
            deferred.resolve(that);
          })
          .error(function (data) {
            deferred.reject(data);
          });

        return deferred.promise;
      },

      saveDocs: function (docs) {
        console.log(docs);
        var that = this;
        angular.forEach(docs, function (v, k) {
          that._currDocs[v.name] = v;
        });
        this.sortByDateOfScan();
      },

      readCurrDocs: function () {
        var currDocs = [];
        angular.forEach(this._currDocs, function (v, k) {
          currDocs.push(v);
        });
        return currDocs;
      },

      sortByDateOfScan: function () {
        var that = this;
        angular.forEach(this._currDocs, function (v, k) {
          that._sortedDocNames.push({name: v.name, dateOfScan: v.infos.dateofscan})
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
                that._currDocs[name].labels.push(value);
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
        angular.forEach(that._currDocs[name].labels, function (v, k) {
          if (label === v) {
            that._currDocs[name].labels.splice(k, 1);
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

      appendDocNumbers: function (name, numbers) {
        var jsonReq = {Name: name, DocNumbers: numbers}
        var that = this;
        var deferred = $q.defer();

        $http.patch('/DocNumbers', JSON.stringify(jsonReq))
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              angular.forEach(numbers, function (value, key) {
                that._currDocs[name].accountdata.docnumbers.push(value);
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
        var currDocNumbers = this._currDocs[name].accountdata.docnumbers;
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
        var request = {"Name": name, "Note": note}
        console.log(note);
        return new Promise(function (resolve, reject) {
          $http.patch('/Doc', JSON.stringify(request))
            .success(function (response) {
              if (response.Status == 'fail') {
                reject(response)
              } else {
                that._currDocs[name].note = note;
                resolve(note, response)
              }
            })
            .error(function (response) {
              reject(response)
            });
        });

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
        console.log(request);
        var url = '/Doc';
        var deferred = $q.defer();

        $http.patch(url, JSON.stringify(request))
          .success(function (response) {
            console.log(response);
            if (response.Status === 'success') {
              that._currDocs[name].accountdata.accnumber = accData.accNumber;
              that._currDocs[name].accountdata.docperiod.from = accData.docPeriod.from;
              that._currDocs[name].accountdata.docperiod.to = accData.docPeriod.to;
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
        } else if ((this._index + 1) > this._sortedDocNames.length) {
          this._index = 0;
        }
        return this.readDocByIndex(this._index);
      },

      prevDoc: function () {
        if ((this._index - 1) < 0) {
          this._index = 0;
        } else if ((this._index - 1) >= 0){
          this._index -= 1;
        }
        return this.readDocByIndex(this._index);
      },


    }
  }
]);
