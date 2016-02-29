'use strict';

var m = angular.module('common.services.session', []);

m.factory('session', [function() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return {
    token: '',
    userID: '',
    expires: d,

    new: function(token, userID, expires) {
      this.token = token;
      this.userID = userID;
      this.expires = expires;
    },

    isExpired: function() {
      var now = new Date();
      return (this.expires.getTime() < now.getTime());
    },
  };
}
])
