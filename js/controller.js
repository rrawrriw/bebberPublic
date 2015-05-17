'use strict'

var bebberCtrl = angular.module('bebberCtrl', []);

var buildJsonTagsStr = function (tags) {
  return "" 
}

bebberCtrl.controller('LoginCtrl', ['$scope', '$http',
    function($scope, $http) {
      
    }]);

bebberCtrl.controller('mainCtrl', ['$scope', '$http',
    function($scope, $http) {

      $scope.dirInput = '/home/t/Downloads';

      $scope.loadDirectory = function (dir) {
        $scope.errorMsg = false;
        $scope.successMsg = false;
        $http.post('/LoadDir/', '{"Dir": "'+ dir +'"}')
          .success(function (data) {
            console.log(data);
            if (data.Status === 'fail') {
              $scope.errorMsg = true;
              $scope.err = data.Msg;
            } else {
              for (var x=0;x < data.Dir.length;x++) {
                data.Dir[x].CurrTags = [];
                angular.forEach(data.Dir[x].SimpleTags, function (value, key) {
                  data.Dir[x].CurrTags.push(value.Tag);
                });
                angular.forEach(data.Dir[x].ValueTags, function (value, key) {
                  data.Dir[x].CurrTags.push(value.Tag +":"+ value.Value);
                });
                angular.forEach(data.Dir[x].RangeTags, function (value, key) {
                  var sd = value.Start.split("T")[0].split("-");
                  var ed = value.End.split("T")[0].split("-");
                  var sDate = sd[2] + sd[1] + sd[0];
                  var eDate = ed[2] + ed[1] + ed[0];
                  data.Dir[x].CurrTags.push(value.Tag +":"+ sDate +".."+ eDate);
                });
                data.Dir[x].CurrTags.sort()
              }
              $scope.dir = data.Dir;
            }
          })
          .error(function (data, status) {
            $scope.errorMsg = true;
            $scope.err = data;
          });
      }

      $scope.sendTags = function (keyEvent, filename, newTags) {
          if (keyEvent.which === 13) {
            var that = this;
            that.tagErrorMsg = false;

            console.log(filename)
            console.log(newTags)
            console.log(that.file.SimpleTags)

            var jsonReq = {Filename: filename, Tags: newTags}
            $http.post('/AddTags/', JSON.stringify(jsonReq))
              .success(function (data) {
                console.log(data);
                if (data.Status == 'fail') {
                  that.tagErrorMsg = data.Msg;
                } else {
                  that.newTags = "";
                  angular.forEach(newTags, function (value, key) {
                    that.file.CurrTags.push(value);
                  });
                }
              })
              .error(function (data, status) {
                that.tagErrorMsg = data;
              });
             
          }
      }


    }]);
