'use strict'

var appDirectives = angular.module('appDirectives', []);

appDirectives.directive('dateProxy', ['Globals',
  function (Globals) {

    return {
      require: ['ngModel'],
      link: function (scope, element, attr, ctrl) {
        scope.globals = Globals;

        ctrl[0].$parsers.push(function (val) {
          return scope.globals.makeMongoDBDate(val);
        });

        ctrl[0].$formatters.push(function (val) {
          return scope.globals.makeEuroDateFormat(val);
        });

      },
    };

  }
]);

appDirectives.directive('shortcuts', ['$window',
  function ($window) {

    var removeNewLabel = function (docName, docs, globals) {
      docs.removeLabel(docName, 'Neu')
        .catch(function (response) {
          globals.globalErrMsg(response.Msg);
        });
    }

    return {
      link: function (scope, element, attr) {

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
            case 81:
              scope.modals.docNumberProposal.open();
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

appDirectives.directive('focusMe', ['$parse', '$timeout',
  function ($parse, $timeout) {
    return {
      scope: {trigger: '@focusMe'},
      link: function (scope, element, attr, ctrl) {
        scope.$watch('trigger', function(value) {
          if(value === 'true') { 
            $timeout(function() {
              element[0].focus(); 
            });
          }
        })
      },
    }
  }
]);
