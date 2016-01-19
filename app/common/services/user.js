'use strict';

angular.module('common.services.users', []).factory('User', [
  '$resource', function($resource) {
    return $resource('/User/:name', {
      name: '@name'
    });
  }
]);

