'use strict'

var m = angular.module('common.controllers', []);

m.controller('SignInCtrl', [
  '$scope',
  '$rootScope',
  '$http',
  '$location',
  '$log',
  'session',
  'utils', function(
    $scope,
    $rootScope,
    $http,
    $location,
    $log,
    session,
    utils) {

    angular.element("#username").focus();

    $scope.signIn = function() {
      var user = btoa($scope.username);
      var pass = btoa($scope.password);
      var url = '/v1/sign_in/' + user + '/' + pass;
      $http.get(url)
        .then(function(resp) {
          session.new(
            resp.data.token,
            resp.data.user_id,
            new Date(resp.data.expires)
          );

          $rootScope.loggedInAs = user.Username;
          $rootScope.user = user
          return utils.go2('/new_docs');
        })
        .catch(function(resp) {
          $log.error(resp.data.message);
          utils.globalErrMsg('Cannot login wrong password or username');
        })
    }

  }
]);
