'use strict'

var bebberApp = angular.module("bebber", [
  "ngRoute",
  "bebberCtrl"
]);


bebberApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/public/angular-tpls/main.html',
        controller: 'mainCtrl'
      });
  }]);

/*
bebberApp.config(['$httpProvider', 
    function($httpProvider) {
      $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

    }
]);
*/
