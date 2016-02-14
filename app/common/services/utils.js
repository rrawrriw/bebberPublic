'use strict';

angular.module('common.services.utils', []).factory('utils', [
  '$location',
  '$rootScope',
  '$timeout', function(
    $location,
    $rootScope,
    $timeout) {

    $rootScope.globalErrMsg = {
      show: false,
      msg: "",
    }

    return {
      goToDoc: function(docName) {
        $location.url('/searchResult/' + docName);
      },

      goToLogin: function() {
        $location.url('/login');
      },

      go2: function(url) {
        $location.url(url);
      },

      makeMongoDBDate: function(euroDate) {
        var tmp = euroDate.split('.');
        return tmp[2] + '-' + tmp[1] + '-' + tmp[0] + 'T00:00:00Z'
      },

      makeEuroDateFormat: function(timeObj) {
        if (timeObj !== undefined) {
          var tmp = timeObj.split("T");
          var date = tmp[0].split("-");
          return date[2] + '.' + date[1] + '.' + date[0]
          } else {
            return '';
          }
        },

        globalErrMsg: function(msg) {
          $rootScope.globalErrMsg.show = true;
          $rootScope.globalErrMsg.msg = msg;

          $timeout(function() {
            $rootScope.globalErrMsg.show = false;
          }, 10000);
        },


      }
    }
  ]);
