'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  var $compile,
    $rootScope,
    $scope;

  beforeEach(module('bebber'));

  beforeEach(inject(function ($injector) {
    $compile = $injector.get('$compile');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
  }));

  describe('dateProxy', function () {

    it('should be show date 07.07.2015', function () {
      $scope.dateModel = '2015-07-07T18:09:13+02:00';
      var elem = $compile('<input ng-model="dateModel" date-proxy>')($scope);
      $rootScope.$digest();
      expect(elem.val()).toEqual('07.07.2015');
    });

    it('should be save date 2015-07-07T00:00:00Z', function () {
      $scope.dateModel = '2015-07-06T00:00:00+02:00';
      var elem = $compile('<input name="date" ng-model="dateModel" date-proxy>')($scope);
      $rootScope.$digest();
      elem.val('07.07.2015').triggerHandler('input');
      expect($scope.dateModel).toEqual('2015-07-07T00:00:00Z');
    });

  });

});
