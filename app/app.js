'use strict';

var app = angular.module('docMa', [
  'ngRoute',

  'ui.bootstrap',

  'common.services.utils',
  'common.services.users',
  'common.services.session',
  'common.filters',
  'common.controllers',

  'virtualDir.services.virtualDir',
  'virtualDir.services.docMaAPI',
  'virtualDir.services.filterHistory',
  'virtualDir.directives',
  'virtualDir.controllers',
]);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/virtual_dir/:dirName/:dirPosition', {
    templateUrl: '/public/angular-tpls/virtualDir/detailView.html',
    controller: 'VirtualDirDetailViewCtrl'
  }).when('/new_docs', {
    templateUrl: '/public/angular-tpls/virtualDir/searchView.html',
    controller: 'VirtualDirFindNewDocsCtrl',
  }).when('/sign_in', {
    templateUrl: '/public/angular-tpls/common/sign_in.html',
    controller: 'SignInCtrl'
  }).otherwise('/sign_in');
}
]);
