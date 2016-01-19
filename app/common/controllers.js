'use strict'

var m = angular.module('common.controllers', [
  'ui.bootstrap',
  'common.services.utils',
  'common.services.users',
  'virtualDir.services.docs',
]);

m.controller('InitCtrl', [
  '$scope',
  '$rootScope',
  '$http',
  '$uibModal',
  'Docs',
  'utils', function(
    $scope,
    $rootScope,
    $http,
    $modal,
    Docs,
    utils) {

    $rootScope.searchResultLength = 0;

    $scope.docs = Docs;

    $scope.searchForm = {
      labels: [],
      docNumbers: [],
      fromDateOfScan: null,
      toDateOfScan: null,
      opened: true,

      findDocs: function() {
        var that = this;
        var request = this.makeSearchJSON();

        if (!angular.isDefined(request)) {
          return
        }

        $scope.docs.find(request)
          .then(function(response) {
            console.log("success find");
            var result = response.Result;
            var modal = that.openSearchResult(result);
            modal.result.then(function() {
              $rootScope.searchResultLength = $scope.docs.readCurrDocs().length;
              that.toggle();
            });
          })
          .catch(function(response) {
            utils.globalErrMsg(response.Msg);
          });

      },

      openSearchResult: function(result) {
        if (!angular.isDefined(result)) {
          result = $scope.docs.readCurrDocs();
        }
        console.log('openSearchResult');
        var modal = $modal.open({
          animation: true,
          templateUrl: '/public/angular-tpls/searchResultModal.html',
          controller: 'searchResultModalCtrl',
          size: 'lg',
          resolve: {
            'result': function() {
              return result
            },
          },
        });
        return modal;
      },


      toggle: function() {
        this.opened = !this.opened;
      },

      clear: function() {
        this.labels = [];
        this.docNumbers = [];
        this.fromDateOfScan = null;
        this.toDateOfScan = null;
      },

      keyEvents: function(keyEvent) {
        if (keyEvent.which === 13) {
          this.findDocs();
        }
      },

      makeSearchJSON: function() {
        var searchObj = {};
        var valid = 0;

        if (this.labels.length > 0) {
          searchObj['Labels'] = this.labels.join(',');
          valid += 1;
        }
        if (this.docNumbers.length > 0) {
          searchObj['DocNumbers'] = this.docNumbers.join(',');
          valid += 1;
        }
        if (this.fromDateOfScan !== null ||
          this.toDateOfScan !== null) {
          var tmp = searchObj['DateOfScan'] = {};
          if (this.formDateOfScan !== null) {
            var d = new Date(this.fromDateOfScan);
            tmp['From'] = d.toISOString();
          }
          if (this.toDateOfScan !== null) {
            var d = new Date(this.toDateOfScan);
            tmp['To'] = d.toISOString();
          }

          valid += 1;
        }

        if (valid === 0) {
          return undefined;
        } else {
          var searchStr = JSON.stringify(searchObj);
          console.log(searchStr);
          return searchStr;
        }
      },

      openDatepickerFrom: function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedFrom = true;
      },

      openDatepickerTo: function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedTo = true;
      },

    };

  }
]);

m.controller('SignInCtrl', [
  '$scope',
  '$rootScope',
  '$http',
  '$location',
  '$log',
  'User',
  'utils', function(
    $scope,
    $rootScope,
    $http,
    $location,
    $log,
    User,
    utils) {

    angular.element("#username").focus();
    utils = utils
    $scope.login = function() {
      var user = {
        Username: $scope.username,
        Password: $scope.password
      }
      $http.post('/Login', user)
        .success(function(response) {
          if (response.Status === 'fail') {
          } else if (response.Status === 'success') {
            $rootScope.loggedInAs = user.Username;
            $rootScope.user = user
            $location.url('/newDocs');
          }
        })
        .error(function(response) {
          utils.globalErrMsg(response.Msg);
        })
    }

  }
]);

m.controller('searchResultModalCtrl', [
  '$scope',
  '$uibModalInstance',
  'result',
  'Docs',
  'utils', function($scope,
    $modalInstance,
    result,
    Docs,
    utils) {

    $scope.docs = Docs;

    $scope.result = result;

    console.log('searchResultModal');

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    $scope.use = function() {
      $scope.docs.saveDocs($scope.result);
      var doc = $scope.docs.firstDoc();
      $modalInstance.close();
      utils.goToDoc(doc.Name)
    };

    $scope.keyEvents = function(keyEvent) {
      if (keyEvent.which === 13) {
        $scope.use();
      }
    };

  }
]);

