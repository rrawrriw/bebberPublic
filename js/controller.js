'use strict'

var bebberCtrl = angular.module('bebberCtrl', ['ngRoute', 'ngResource']);

var buildJsonTagsStr = function (tags) {
  return "" 
}

bebberCtrl.controller('initCtrl', function($scope) {

});


bebberCtrl.controller('loginCtrl', ['$scope', '$rootScope', '$http', '$location', '$log', 'User', 'Boxes',
  function($scope, $rootScope, $http, $location, $log, User, Boxes) {
    angular.element("#username").focus();
    $scope.login = function () {
      var user = {Username: $scope.username,
                  Password: $scope.password}
      $http.post('/Login', user)
        .success(function (data) {
          if (data.Status === 'fail') {
            $log.error(data.Msg);
          } else if (data.Status === 'success') {
            $scope.boxes = Boxes;
            $scope.user = User;
            $scope.user.get({'name': user.Username}, function(user) {
              angular.forEach(user.Dirs, function(v, i) {
                $scope.boxes.addBox(i, v);
              });
              $rootScope.loggedInAs = user.Username;
            })
            $location.url('/box/inbox');
          }
        }).error(function (data) {
          $log.error(data);
        })
    }

  }
]);

bebberCtrl.controller('boxCtrl', ['$scope', '$http', '$log', 
                                  '$location', '$routeParams', 
                                  '$timeout', 'pdfDelegate', 
                                  'User', 'Boxes', 
  function($scope, $http, $log, $location, $routeParams, $timeout, pdfDelegate, User, Boxes) {
    $scope.params = $routeParams;
    $scope.boxes = Boxes;
    $scope.boxName = $scope.params.name;
    $scope.boxNames = [];
    $scope.selectedFiles = {};

    $scope.sendTags = function (keyEvent, filename, newTags) {
      if (keyEvent.which === 13) {
        var that = this;
        that.tagErrorMsg = false;

        var jsonReq = {Filename: filename, Tags: newTags}
        $http.post('/AddTags/', JSON.stringify(jsonReq))
          .success(function (data) {
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

    $scope.loadBox = function (boxName) {
      if ($scope.boxes.existsBox(boxName)) {
        $scope.boxName = boxName;
        if ($scope.boxes.isCashed(boxName)) {
          $scope.box = $scope.boxes.getCashedBox(boxName);
        } else {
          var err = $scope.boxes.loadBox(boxName, function (data, err) {
            if (err !== undefined) {
              $log.error("Error LoadBox: "+ err);
            } else {
              $scope.box = data; 
            }
          });
        }
      }
    }

    $scope.selectAllFiles = function () {
      angular.forEach($scope.selectedFiles, function(v,k) {
        $scope.selectedFiles[k] = true;
      });

    }

    $scope.unselectAllFiles = function () {
      angular.forEach($scope.selectedFiles, function(v,k) {
        $scope.selectedFiles[k] = false; 
      });

    }

    $scope.moveFiles = function (from, to) {
      angular.forEach($scope.selectedFiles, function(v,k) {
        if (v) {
          $scope.moveFile(from, to, k);
        }
      });
    }

    $scope.moveFile = function(from, to, file) {
      $http.post("/MoveFile", {FromBox: from, ToBox: to, File: file})
        .success(function (data) {
          if (data.Status === "success") {
            var err = $scope.boxes.moveFile(from, to, file);
            if (err !== undefined) {
              $log.error(err);
              return
            }
          } else {
            $log.error(data.Msg);
          }

        })
        .error(function (data, error) {
          $log.error(data);
        });
    }

    $scope.setupPdf = function () {
      $scope.file = $scope.box[$scope.index];
      $scope.pdfUrl = '/LoadFile/'+ $scope.boxName +'/'+ $scope.file.Filename;
      pdfDelegate.$getByHandle('pdfFile').load($scope.pdfUrl);
    }

    $timeout(function() { 
      $scope.totalPages = pdfDelegate.$getByHandle('pdfFile').getPageCount();
    }, 800);

    $scope.nextPage = function() {
      var pdfDoc = pdfDelegate.$getByHandle('pdfFile')
      pdfDoc.next();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.prevPage = function() {
      var pdfDoc = pdfDelegate.$getByHandle('pdfFile')
      pdfDoc.prev();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.zoomIn = function() {
      pdfDelegate.$getByHandle('pdfFile').zoomIn();
    }

    $scope.zoomOut = function() {
      pdfDelegate.$getByHandle('pdfFile').zoomOut();
    }

    $scope.showSingleView = function (boxName) {
      $location.url('/box/'+ boxName +'/singleview');
    }

    // Run on start
    if ($scope.boxes.isCashed($scope.boxName) === false) {
      var err = $scope.boxes.loadBox($scope.boxName, function (data, err) {
        if (err !== undefined) {
          $log.error("Error LoadBox: "+ err);
        } else {
          $scope.box = data;
          $scope.boxNames = $scope.boxes.getBoxNames();
        }
      });
    } else {
      $scope.box = $scope.boxes.getCashedBox($scope.boxName);
      $scope.boxNames = $scope.boxes.getBoxNames();
    }

    /*
    // dev
    $scope.user = User;
    $scope.user.get({'name':'a'}, function(user) {
      angular.forEach(user.Dirs, function(v, i) {
        $scope.boxes.addBox(i, v);
      });
      // Run LoadDirecotry
      var boxName = $scope.params.name
      if ($scope.boxes.existsBox(boxName)) {
        var err = $scope.boxes.loadBox(boxName, function (data, err) {
          if (err !== undefined) {
            console.log("Error LoadBox: "+ err);
          } else {
            $scope.box = $scope.boxes.getCashedBox(boxName); 
            $scope.boxNames = $scope.boxes.getBoxNames();
          }
        });
      }
    })
    // dev end
    */


  }
]);


bebberCtrl.controller('boxSingleViewCtrl', ['$scope', '$http', '$routeParams', '$log', 
                                            '$location', '$timeout', '$document', 
                                            'pdfDelegate', 'Boxes', 'User',
  function ($scope, $http, $routeParams, $log, $location, $timeout, $document, pdfDelegate, Boxes, User) {
    $scope.params = $routeParams;
    $scope.boxName = $scope.params.name;
    $scope.boxes = Boxes;
    $scope.boxNames = $scope.boxes.getBoxNames();
    $scope.index = 0;
    $scope.currentPage = 1;
    $scope.totalPages = '?';
    $scope.file = '';

    $document.keydown(function (keyEvent) {
      if (keyEvent.which === 37) {
        $scope.loadPrevFile();

      } else if (keyEvent.which === 39) {
        $scope.loadNextFile();

      } else if (keyEvent.which === 65) {
        $scope.moveFile($scope.boxName, 'archiv', $scope.file.Filename);
      } else {
        angular.element('#newtags').focus();
      }
    });

    $scope.actionKeys = function (keyEvent) {
    }

    $scope.showListView = function () {
      $location.url('/box/'+ $scope.boxName);
    }
    
    $scope.setupPdf = function () {
      $scope.file = $scope.box[$scope.index];
      $scope.pdfUrl = '/LoadFile/'+ $scope.boxName +'/'+ $scope.file.Filename;
      $timeout(function() {
        pdfDelegate.$getByHandle('pdfFile').load($scope.pdfUrl);
        $timeout(function() { 
          $scope.totalPages = pdfDelegate.$getByHandle('pdfFile').getPageCount();
        }, 800);
      }, 400);
      /*
      PDFJS.disableWorker = true;
      $http.get($scope.pdfUrl)
        .success(function (data) {
          for(var x=0;x<11;x++) {
            //console.log(data[x]);
          }
          var pdf = PDFJS.getDocument({data: data}).then(function (pdf) {;
            console.log(pdf);
            pdf.getPage(1).then(function(page) {
              var scale = 1;
              var viewport = page.getViewport(scale);

              var canvas = document.getElementById('pdf-files');
              var context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              var renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              page.render(renderContext);

            });
          });
        })
        .error(function (data) {

        });
        */
    }

    $scope.nextPage = function() {
      var pdfDoc = pdfDelegate.$getByHandle('pdfFile')
      pdfDoc.next();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.prevPage = function() {
      var pdfDoc = pdfDelegate.$getByHandle('pdfFile')
      pdfDoc.prev();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.zoomIn = function() {
      pdfDelegate.$getByHandle('pdfFile').zoomIn();
    }

    $scope.zoomOut = function() {
      pdfDelegate.$getByHandle('pdfFile').zoomOut();
    }

    $scope.loadNextFile = function () {
      if ($scope.box.length === $scope.index+1) {
        $scope.index = 0;
      } else {
        $scope.index += 1;
      }
      $scope.setupPdf();
      $scope.currentPage = 1;
      $scope.totalPages = '?';
    }

    $scope.loadPrevFile = function () {
      if ($scope.index-1 < 0) {
        $scope.index = $scope.box.length-1;
      } else {
        $scope.index -= 1;
      }
      $scope.setupPdf();
      $scope.currentPage = 1;
      $scope.totalPages = '?';
    }

    $scope.sendTags = function (keyEvent, filename, newTags) {
      if (keyEvent.which === 13) {
        var that = this;
        that.tagErrorMsg = false;

        var jsonReq = {Filename: filename, Tags: newTags}
        $http.post('/AddTags/', JSON.stringify(jsonReq))
          .success(function (data) {
            if (data.Status == 'fail') {
              that.tagErrorMsg = data.Msg;
              $log.error(data.Msg);
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

    $scope.moveFile = function(from, to, file) {
      $http.post("/MoveFile", {FromBox: from, ToBox: to, File: file})
        .success(function (data) {
          if (data.Status === "success") {
            var err = $scope.boxes.moveFile(from, to, file);
            if (err !== undefined) {
              $log.error(err);
              return
            }
            $scope.loadNextFile();
          } else {
            $log.error(data.Msg);
          }

        })
        .error(function (data, error) {
          $log.error(data);
        });
    }

    // Run on start
    if ($scope.boxes.isCashed($scope.boxName) === false) {
      var err = $scope.boxes.loadBox($scope.boxName, function (data, err) {
        if (err !== undefined) {
          $log.error("Error LoadBox: "+ err);
        } else {
          $scope.box = data;
          $scope.boxNames = $scope.boxes.getBoxNames();
          $scope.setupPdf();
          $scope.index = 0;
        }
      });
    } else {
      $scope.box = $scope.boxes.getCashedBox($scope.boxName);
      $scope.boxNames = $scope.boxes.getBoxNames();
      $scope.setupPdf();
      $scope.index = 0;
    }

    /*
    // dev
    $scope.user = User;
    if ($scope.boxes.isCashed($scope.boxName) === false) {
      $scope.user.get({'name': 'a'}, function(user) {
        angular.forEach(user.Dirs, function(v, i) {
          $scope.boxes.addBox(i, v);
        });
        // Run LoadDirecotry
        var boxName = $scope.boxName
        var err = $scope.boxes.loadBox(boxName, function (data, err) {
          if (err !== undefined) {
            console.log("Error LoadBox: "+ err);
          } else {
            console.log("loadbox");
            $scope.box = data;
            $scope.boxNames = $scope.boxes.getBoxNames();
            $scope.index = 0;
            $scope.setupPdf();
          }
        });
      })
    } else {
      console.log("cashedbox");
      $scope.box = $scope.boxes.getCashedBox($scope.boxName);
      $scope.boxNames = $scope.boxes.getBoxNames();
      $scope.index = 0;
      $scope.setupPdf();
    }

    // dev end
    */

  }
]);
