'use strict'

var app = angular.module('bebber', [
  'ngRoute',
  'appCtrl',
  'pdf',
]);


app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/docs', {
        templateUrl: '/public/angular-tpls/singleView.html',
        controller: 'singleViewCtrl'
      }).when('/login', {
        templateUrl: '/public/angular-tpls/login.html',
        controller: 'loginCtrl'
      }).otherwise('/login');
  }
]);
