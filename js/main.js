'use strict'

var bebberApp = angular.module('bebber', [
  'ngRoute',
  'bebberCtrl',
  'pdf',
]);


bebberApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/box/:name', {
        templateUrl: '/public/angular-tpls/box.html',
        controller: 'boxCtrl'
      }).when('/box/:name/singleview', {
        templateUrl: '/public/angular-tpls/boxSingleView.html',
        controller: 'boxSingleViewCtrl'
      }).when('/login', {
        templateUrl: '/public/angular-tpls/login.html',
        controller: 'loginCtrl'
      }).otherwise('/login');
  }
]);

bebberApp.factory('User', ['$resource',
  function($resource){
    return $resource('/User/:name', {name:'@name'});
  }
]);

bebberApp.factory('Boxes', ['$http',
  function ($http) {
    return {
      boxData: {},
      boxes: {},
      loaded: {},
      addBox: function (name, relPath) {
        if (this.existsBox(name) === false) {
          this.boxData[name] = relPath;
          this.boxes[name] = [];
          this.loaded[name] = false;
        }
      },
      getBoxPath: function (name) {
        if (this.existsBox(name)) {
          return this.boxData[name];
        } else {
          return "";
        }

      },
      getBoxNames: function () {
        var names = [];
        angular.forEach(this.boxData, function(v,k) {
          names.push(k);
        });
        return names;
      },
      existsBox: function (name) {
        if (this.getBoxNames().indexOf(name) >= 0) {
          return true;
        } else {
          return false;
        }
      },
      moveFile: function (fromBox, toBox, filename) {
        if (this.existsBox(fromBox) && this.existsBox(toBox)) {
          var found = false;
          var fileDoc = {};
          var index = -1;
          angular.forEach(this.boxes[fromBox], function (v,k) {
            if (v.Filename === filename) {
              found = true; 
              fileDoc = v;
              index = k;
              return
            }
          });

          if (found) {
            this.boxes[toBox].push(fileDoc);
            this.boxes[fromBox].splice(index, 1);
          } else {
            return filename +' is not in box '+ fromBox
          }

        } else {
          return 'cannot find box '+ fromBox +' or '+ toBox
        }
      },
      isCashed: function (name) {
        if (this.existsBox(name)) {
          return this.loaded[name];
        } else {
          return false;
        }
      },
      getCashedBox: function (name) {
        if (this.existsBox(name)) {
          return this.boxes[name];
        } else {
          return {};
        }
      },
      loadBox: function (box, afterFunc) {
        var that = this;
        if (this.existsBox(box) === false) {
          return box + ' doesn\'t exists';
        }

        $http.get('/LoadBox/' + box)
          .success(function (data) {
            if (data.Status === 'fail') {
              afterFunc([], data.Msg);
            } else if (data.Status === 'success') {
              if (data.Dir == null) {
                that.boxes[box] = [];
                that.loaded[box] = true;
                afterFunc([], undefined);
                return
              }
              for (var x=0;x < data.Dir.length;x++) {
                data.Dir[x].CurrTags = [];
                angular.forEach(data.Dir[x].SimpleTags, function (value, key) {
                  data.Dir[x].CurrTags.push(value.Tag);
                });
                angular.forEach(data.Dir[x].ValueTags, function (value, key) {
                  data.Dir[x].CurrTags.push(value.Tag +':'+ value.Value);
                });
                angular.forEach(data.Dir[x].RangeTags, function (value, key) {
                  var sd = value.Start.split('T')[0].split('-');
                  var ed = value.End.split('T')[0].split('-');
                  var sDate = sd[2] + sd[1] + sd[0];
                  var eDate = ed[2] + ed[1] + ed[0];
                  data.Dir[x].CurrTags.push(value.Tag +':'+ sDate +'..'+ eDate);
                });
                data.Dir[x].CurrTags.sort()
              }
              that.boxes[box] = data.Dir;
              that.loaded[box] = true;
              afterFunc(data.Dir, undefined);
            }
          })
          .error(function (data, status) {
            afterFunc([], data);
          });
      },

    };
  }
]);
