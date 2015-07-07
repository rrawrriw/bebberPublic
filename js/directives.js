'use strict'

var appDirectives = angular.module('appDirectives', []);

appDirectives.directive('shortcuts', ['$window', 'Globals', 'Docs', 
  function ($window, Globals, Docs) {
    console.log('shortcuts!!');

    return {
      link: function (scope, element, attr) {
        console.log('shortcuts on!');
        console.log(scope.doc);

        scope.docs = Docs;
        scope.globals = Globals;

        var docName = scope.doc.name;
        var docs = scope.docs;
        var g = scope.globals;

        angular.element($window).on('keyup', function (e) {
          
          //var a = angular.element(':focus');
          //console.log(a);
          var activeElement = angular.element('input:focus');
          if (activeElement.length > 0) return;
          activeElement = angular.element('textarea:focus');
          if (activeElement.length > 0) return;

          switch (e.which) {
            case 37:
              console.log('prev');
              docName = docs.prevDoc().name;
              console.log(docName);
              g.goToDoc(docName);
              scope.$apply();
              break;
            case 39:
              console.log('next');
              docName = docs.nextDoc().name;
              console.log(docName);
              g.goToDoc(docName);
              scope.$apply();
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
            case 82:
              console.log('Remove Neu label');
              docs.removeLabel(docName, 'Neu')
                .catch(function (response) {
                  g.globalErrMsg(response.Msg);
                });
              break;
            default:
              //console.log(e);
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
