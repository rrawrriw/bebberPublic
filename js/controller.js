'use strict'

var bebberCtrl = angular.module('bebberCtrl', ['ngRoute', 'ngResource']);

var buildJsonTagsStr = function (tags) {
  return "" 
}

bebberCtrl.controller('initCtrl', function($scope) {});


bebberCtrl.controller('loginCtrl', ['$scope', '$rootScope', '$http', '$location', '$log', 'User', 
  function($scope, $rootScope, $http, $location, $log, User) {
    angular.element("#username").focus();
    $scope.login = function () {
      var user = {Username: $scope.username,
                  Password: $scope.password}
      $http.post('/Login', user)
        .success(function (data) {
          if (data.Status === 'fail') {
            $log.error(data.Msg);
          } else if (data.Status === 'success') {
            $rootScope.loggedInAs = user.Username;
            $location.url('/files');
          }
        })
        .error(function (data) {
          $log.error(data);
        })
    }

  }
]);

bebberCtrl.controller('singleViewCtrl', ['$scope', '$rootScope', '$http', '$log', 
                                            '$location', '$timeout', '$document', 
                                            'pdfDelegate', 'User',
  function ($scope, $rootScope, $http, $log, $location, $timeout, $document, pdfDelegate, User) {
    $scope.fileIndex = 0;
    $scope.currPdfPage = 1;
    $scope.totalPages = '?';

    var tagFormRef = {
      'Buchhaltungsdaten': function () {
        var modal = angular.element('#Buchhaltungsdaten-modal')
        modal.on('shown.bs.modal', function (e) {
          console.log('ahhh');
          angular.element('.Buchhaltungsdaten-start').focus();
        }).modal('show');
      },
      'Notiz': function () {
        var modal = angular.element('#Notiz-modal')
        modal.on('shown.bs.modal', function (e) {
          console.log('ahhh');
          angular.element('.Notiz-start').focus();
        }).modal('show');
      },

    }

    var tagForm = TagForm(tagFormRef);

    $rootScope.searchKeyEvents = function (keyEvent) {
      if (keyEvent.which === 13) {
        var input = $scope.searchInput
        if (tagForm.contains(input)) {
          var form = tagForm.getForm(input)
          form();
        } else if (input.indexOf(":")+1 === input.length) {
          var modal = angular.element('#valuetag-modal')
          modal.on('shown.bs.modal', function (e) {
            angular.element('.valuetag-start').focus();
          }).modal('show');
          $scope.valueTagname = input;
        } else {
          console.log("simpletag"); 
        }
      }
    };


    $scope.valueTagKeyEvents = function (keyEvent) {

    };
    
    $scope.searchStrAppend = function () {

    }

    /*
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
    */


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
    $scope.user = User;
    $scope.user.get({'name':'a'}, function(user) {
      $log.debug('User: ', user); 
    });

  }
]);
