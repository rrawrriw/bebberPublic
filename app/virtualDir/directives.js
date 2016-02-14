'use strict'

var m = angular.module('virtualDir.directives', []);

m.directive('dateProxy', ['utils', function(utils) {

  return {
    require: ['ngModel'],
    link: function(scope, element, attr, ctrl) {

      ctrl[0].$parsers.push(function(val) {
        return utils.makeMongoDBDate(val);
      });

      ctrl[0].$formatters.push(function(val) {
        return utils.makeEuroDateFormat(val);
      });

    },
  };

}
]);

m.directive('shortcuts', [
  '$window',
  '$log',
  'utils', function($window, $log, utils) {

    var removeLabel = function(doc, label, resp) {
      label = _.filterWhere(scope.docData.labels, {
        name: label
      });

      docTool.removeLable(doc.id, label.id).catch(function(resp) {
        utils.globalErrMsg('Cannot remove Neu label');
        $log.error(resp.data.message);
        $scope.docData.labels = docDataTools.appendLabel(
          $scope.docData.labels, label
        );
      });
    };

    return {
      link: function(scope, element, attr) {

        var doc = {};

        angular.element($window).on('keyup', function(e) {

          var activeElement = angular.element('input:focus');
          if (activeElement.length > 0) {
            return;
          }

          activeElement = angular.element('textarea:focus');
          if (activeElement.length > 0) {
            return;
          }

          switch (e.which) {
            case 37:
              scope.docAction.prevDoc();
              scope.$apply();
              break;
            case 39:
              scope.docAction.nextDoc();
              scope.$apply();
              break;
            case 65:
              doc.joinLabel('Inbox-Buchhaltung').catch(function(resp) {
                utils.globalErrMsg('Cannot append Inbox-Buchhaltung label');
                $log.error(resp.data.message);
                $scope.docData.labels.push('Inbox-Buchhaltung');
              });
              break;
            case 66:
              doc.joinLabel('Inbox-Bruno').catch(function(resp) {
                g.globalErrMsg(response.Msg);
                $scope.docData.labels = docDataTools.appendLabel(
                  $scope.docData.labels, label
                );
              });
              removeLabel(doc, 'Neu', resp);
              break;
            case 77:
              docs.appendLabels(docName, ['Inbox-Martin'])
                .catch(function(response) {
                  g.globalErrMsg(response.Msg);
                });
              removeNewLabel(docName, docs, g);
              break;
            case 81:
              scope.modals.docNumberProposal.open();
              break;
            case 82:
              docs.removeLabel(docName, 'Neu')
                .catch(function(response) {
                  g.globalErrMsg(response.Msg);
                });
              break;
            default:
              break;
          }
        })

        scope.$on('$destroy', function() {
          angular.element($window).remove();
          angular.element($window).off('keyup');
        });
      },
    }

  }
]);

m.directive('focusMe', ['$parse', '$timeout', function($parse, $timeout) {
  return {
    scope: {
      trigger: '@focusMe'
    },
    link: function(scope, element, attr, ctrl) {
      scope.$watch('trigger', function(value) {
        if (value === 'true') {
          $timeout(function() {
            element[0].focus();
          });
        }
      })
    },
  }
}
]);
