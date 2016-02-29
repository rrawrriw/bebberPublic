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
  'docMaAPI',
  'utils', function($window, $log, docMaAPI, utils) {

    var labels = docMaAPI.labels.readAllLabels()
    labels.$promise.catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot load labels');
    });

    var detachLabel = function(docData, name) {
      var label = _.findWhere(labels, {
        name: name,
      });

      docMaAPI.docs.detachLabel(docData.id, label.id).then(function() {
        docData.labels = _.filter(docData.labels, function(v) {
          return (v.name !== label.name)
        });
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot remove ' + name + ' label');
        $log.error(resp.data.message);
      });
    };

    var joinLabel = function(docData, name) {
      var label = _.findWhere(labels, {
        name: name,
      });

      docMaAPI.docs.joinLabel(docData.id, label.id).$promise.then(function() {
        docData.labels.push(label);
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot join ' + name + ' label');
        $log.error(resp.data.message);
      });
    }

    return {
      link: function(scope, element, attr) {

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
            // key <-
            case 37:
              scope.docsCtrl.prevDoc();
              scope.$apply();
              break;
            // key ->
            case 39:
              scope.docsCtrl.nextDoc();
              scope.$apply();
              break;
            // key a
            case 65:
              joinLabel(scope.docData, 'Inbox-Buchhaltung');
              detachLabel(scope.docData, 'Buchungsbeleg');
              break;
            // key b
            case 66:
              joinLabel(scope.docData, 'Inbox-Bruno');
              detachLabel(scope.docData, 'Neu');
              break;
            // key m
            case 77:
              joinLabel(scope.docData, 'Inbox-Martin');
              detachLabel(scope.docData, 'Neu');
              break;
            // key q
            case 81:
              scope.modals.docNumberProposal.open();
              break;
            // key r
            case 82:
              detachLabel(scope.docData, 'Neu');
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
