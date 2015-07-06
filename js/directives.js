'use strict'

var appDirectives = angular.module('appDirectives', []);

appDirectives.directive('shortcuts', function ($window, Globals) {
  console.log('shortcuts!!');

  return {
    link: function (scope, element, attr) {
      console.log('shortcuts on!');
      console.log(scope.doc);

      var docName = scope.doc.name;
      var docs = scope.docs;
      var g = scope.globals;

      angular.element($window).on('keydown', function (e) {
        switch (e.which) {
          case 37:
            console.log('prev');
            docs.prevDoc();
            break;
          case 39:
            console.log('next');
            docs.nextDoc();
            break;
          case 65:
            console.log('Buchhaltung');
            docs.appendLabels(docName, ['Buchhaltung'])
              .catch(function (response) {
                g.globalErrMsg(response.Msg);
              });
            break;
          case 66:
            console.log('Inbox-Bruno');
            docs.appendLabels(docName, ['Inbox-Bruno'])
              .catch(function (response) {
                g.globalErrMsg(response.Msg);
              });
            break;
          case 77:
            console.log('Inbox-Martin');
            docs.appendLabels(docName, ['Inbox-Martin'])
              .catch(function (response) {
                g.globalErrMsg(response.Msg);
              });
            break;
          default:
            console.log(e.which);
        }
      })

      angular.element($window).on('$destroy', function () {
        angular.element($window).off('keydown');
      });
    },
  }

});
