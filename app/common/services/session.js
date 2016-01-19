'use strict';

var m = angular.module('common.services.session', []);

m.factory('session', [function() {
  return {
    token: '',
    userID: '',
    expires: undefined,

    new: function(token, userID, expires) {
      this.token = token;
      this.userID = userID;
      this.expires = expires;
    },

    isExpired: function() {
      var now = new Date();
      return (this.expires.getDate() < now.getDate());
    },
  };
}
])
