'use strict';

m = angular.module('virtualDir.services.labels', ['ngResource']);

m.factory('Label', ['$resource', function($resource) {
  return $resource('/v2/labels/:id');
}
]);
