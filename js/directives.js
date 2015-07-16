'use strict'

var appDirectives = angular.module('appDirectives', []);

appDirectives.directive('shortcuts', ['$window', 'Globals', 'Docs', 
  function ($window, Globals, Docs) {

    var removeNewLabel = function (docName, docs, gloabls) {
      docs.removeLabel(docName, 'Neu')
        .catch(function (response) {
          globals.globalErrMsg(response.Msg);
        });
    }

    return {
      link: function (scope, element, attr) {

        scope.docs = Docs;
        scope.globals = Globals;

        var docName = scope.doc.name;
        var docs = scope.docs;
        var g = scope.globals;

        angular.element($window).on('keyup', function (e) {
          
          var activeElement = angular.element('input:focus');
          if (activeElement.length > 0) return;
          activeElement = angular.element('textarea:focus');
          if (activeElement.length > 0) return;

          switch (e.which) {
            case 37:
              docName = docs.prevDoc().name;
              g.goToDoc(docName);
              scope.$apply();
              break;
            case 39:
              docName = docs.nextDoc().name;
              g.goToDoc(docName);
              scope.$apply();
              break;
            case 65:
              docs.appendLabels(docName, ['Inbox-Buchhaltung'])
                .catch(function (response) {
                  g.globalErrMsg(response.Msg);
                });
              removeNewLabel(docName, docs, g);
              break;
            case 66:
              docs.appendLabels(docName, ['Inbox-Bruno'])
                .catch(function (response) {
                  g.globalErrMsg(response.Msg);
                });
              removeNewLabel(docName, docs, g);
              break;
            case 77:
              docs.appendLabels(docName, ['Inbox-Martin'])
                .catch(function (response) {
                  g.globalErrMsg(response.Msg);
                });
              removeNewLabel(docName, docs, g);
              break;
            case 82:
              docs.removeLabel(docName, 'Neu')
                .catch(function (response) {
                  g.globalErrMsg(response.Msg);
                });
              break;
            default:
              break;
          }
        })

        scope.$on('$destroy', function () {
          angular.element($window).remove();
          angular.element($window).off('keyup');
        });
      },
    }

  }
]);
