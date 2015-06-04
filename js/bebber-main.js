'use strict'

var bebberApp = angular.module("bebber", [
  "ngRoute",
  "bebberCtrl"
]);


bebberApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/dir/:name', {
        templateUrl: '/public/angular-tpls/dir.html',
        controller: 'dirCtrl'
      }).when('/login', {
        templateUrl: '/public/angular-tpls/login.html',
        controller: 'loginCtrl'
      }).otherwise('/login');
  }]);

/*
bebberApp.config(['$httpProvider', 
    function($httpProvider) {
      $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

    }
]);
*/
