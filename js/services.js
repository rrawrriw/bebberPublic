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
      }
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
        var deferrd = $q.defer();

        $http.patch('/DocLabels', JSON.stringify(jsonReq))
          .success(function (response) {
            if (response.Status == 'fail') {
              deferred.reject(response)
            } else {
              angular.forEach(labels, function (value, key) {
                that._currDocs[name].labels.push(value);
              });
              deferred.resolve(labels, response)
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

        return new Promise(function (resolve, reject) {
          $http.delete(url)
            .success(function (response) {
              if (response.Status == 'fail') {
                reject(response)
              } else {
                that._removeLabelFromCurrDocs(name, label);
                resolve(response)
              }
            })
            .error(function (response) {
              reject(response)
            });
        });

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
