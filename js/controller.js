'use strict'

var bebberCtrl = angular.module('bebberCtrl', []);

bebberCtrl.controller('LoginCtrl', ['$scope', '$http',
    function($scope, $http) {
      
    }]);

bebberCtrl.controller('mainCtrl', ['$scope', '$http',
    function($scope, $http) {

      $scope.loadDirectory = function (dir) {
        console.log('dir '+ dir);
        $http.post('/LoadDir/', '{"Dir": "'+ dir +'"}')
          .success(function (data) {
            console.log(data);
            if (data.Status === 'fail') {
              $scope.err = data.msg;
            } else {
              $scope.Dir = data.Dir;
            }
          })
          .error(function (data, status) {
            $scope.err = data;
          });
      }


    }]);
