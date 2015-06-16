'use strict'

var bebberApp = angular.module('bebber', [
  'ngRoute',
  'bebberCtrl',
  'pdf',
]);


bebberApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/files', {
        templateUrl: '/public/angular-tpls/singleView.html',
        controller: 'singleViewCtrl'
      }).when('/login', {
        templateUrl: '/public/angular-tpls/login.html',
        controller: 'loginCtrl'
      }).otherwise('/login');
  }
]);

bebberApp.factory('User', ['$resource',
  function($resource){
    return $resource('/User/:name', {name:'@name'});
  }
]);

bebberApp.factory('SearchStr', function() {
  return {
    _draft: [], // Tag objects
    make: function () {

    },
    append: function (tagobj) {
      draft.push(tagobj);
    },
    readDraft: function () {

    }
  }
});

var TagForm = function (tagForms) {
  return {
    _tagForms: tagForms,
    contains: function (tagname) {
      var found = false;
      angular.forEach(this._tagForms, function (v, k) {
        if (tagname === k) {
          found = true;
          return
        }
      });

      return found
    },
    getForm: function (tagname) {
      return this._tagForms[tagname];
    },
  }

}
