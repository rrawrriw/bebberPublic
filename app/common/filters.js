'use strict'

var m = angular.module('common.filters', []);

m.filter('euroDate', function() {
  return function(timeObj) {
    if (timeObj !== undefined) {
      var tmp = timeObj.split("T");
      var date = tmp[0].split("-");
      return date[2] + '.' + date[1] + '.' + date[0]
      } else {
        return '';
      }
    }
  })
