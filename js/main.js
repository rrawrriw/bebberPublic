'use strict'

var app = angular.module('bebber', [
  'ngRoute',
  'appCtrl',
  'pdf',
]);


app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/docs/:docName', {
        templateUrl: '/public/angular-tpls/singleView.html',
        controller: 'singleViewCtrl'
      }).when('/newDocs', {
        templateUrl: '/public/angular-tpls/singleView.html',
        controller: 'newDocsCtrl'
      }).when('/login', {
        templateUrl: '/public/angular-tpls/login.html',
        controller: 'loginCtrl'
      }).otherwise('/login');
  }
]);
