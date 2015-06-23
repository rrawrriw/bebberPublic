'use strict'

var appServices = angular.module('appServices', ['ngResource']);

appServices.factory('User', ['$resource',
  function($resource){
    return $resource('/User/:name', {name:'@name'});
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

appServices.factory('Docs', ['$log', '$http',
  function ($log, $http) {
    return {

      _currDocs: {},

      find: function (searchStrJSON) {
        var that = this;

        return new Promise(function (resolve, reject) {

          $http.post('/Search', searchStrJSON)
            .success(function (result) {
              // select docs from draft
              var selectedDocs = resolve(result);

              if (selectedDocs === undefined) {
                console.log("no draft retunred");
                that.saveDocs(result);
              } else {
                console.log("changed draft");
                that.saveDocs(selectedDocs);
              }
              // call after save draft
              resolve(that._currDocs);
            })
            .error(function (data) {
              reject(data);
            });

        });
      },

      saveDocs: function (docs) {
        var that = this;
        console.log("save docs");
        angular.forEach(docs, function (v, k) {
          that._currDocs[v.name] = v;
        });
      },

      readCurrDocs: function () {
        var currDocs = [];
        angular.forEach(this._currDocs, function (v, k) {
          currDocs.push(v);
        });
        return currDocs;
      },

      sortByDateOfScan: function () {

      },

      appendLabels: function (name, labels) {
        var jsonReq = {Name: name, Labels: labels}
        var that = this;

        return new Promise(function (resolve, reject) {
          $http.patch('/DocLabels', JSON.stringify(jsonReq))
            .success(function (response) {
              if (response.Status == 'fail') {
                reject(response)
              } else {
                angular.forEach(labels, function (value, key) {
                  that._currDocs[name].labels.push(value);
                });
                resolve(labels, response)
              }
            })
            .error(function (response) {
              reject(response)
            });
        });
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
                resolve(label, response)
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


    }
  }
]);
