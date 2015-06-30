'use strict'

var appCtrl = angular.module('appCtrl', ['appServices']);

var buildJsonTagsStr = function (tags) {
  return "" 
}

appCtrl.controller('initCtrl', function($scope) {});


appCtrl.controller('loginCtrl', ['$scope', '$rootScope', '$http', '$location', '$log', 'User', 
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
            $location.url('/newDocs');
          }
        })
        .error(function (data) {
          $log.error(data);
        })
    }

  }
]);

appCtrl.controller('newDocsCtrl', ['$scope', '$location', 'Docs', 'Globals',
  function ($scope, $location, Docs, Globals) {
    $scope.globals = Globals;
    $scope.docs = Docs;
    $scope.docs.find('{"labels": {"$in":  ["Neu"]}}')
      .then(function (docs) {
        console.log("find something");
        docs.saveDocs(docs.searchResult);
        var doc = docs.firstDoc();
        $scope.globals.goToDoc(doc.name); 
      });

  }
]);

appCtrl.controller('singleViewCtrl', [
  '$scope', '$rootScope', '$http', '$log', '$routeParams', '$location',
  '$timeout', '$document', 'pdfDelegate', 'User', 'SearchStr', 'Docs',
  'Globals',
  function ($scope, $rootScope, $http, $log, $routeParams, 
    $location, $timeout, $document, pdfDelegate, User, SearchStr, Docs, Globals) {

    var setupCtrl = function () {
      $rootScope.searchStrDraftAmount = 0;

      $scope.globals = Globals;

      $scope.currPDFPage = 1;
      $scope.totalPDFPages = '?';

      $scope.searchStr = SearchStr;

      $scope.docName = $routeParams.docName;
      $scope.docs = Docs;
      $scope.doc = $scope.docs.readDoc($scope.docName);

      // Dev
      $scope.user = User;
      $scope.user.get({'name':'a'}, function(user) {
        $log.debug('User: ', user); 
      });
      // End Dev
      
      setupPDF()
      
    }

    var setupPDF = function () {
      $scope.pdfUrl = '/ReadDocFile/'+ $scope.doc.name;
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

    /*
    var openModal = function (tagName) {
      var modal = angular.element('#'+tagName+'-modal')
      modal.on('shown.bs.modal', function (e) {
        angular.element('.'+tagName+'-start').focus();
      }).modal('show');
    }
    */

    var backToSearchInput = function () {
      $rootScope.searchStrDraftAmount = $scope.searchStr.amountDraft();
      $rootScope.searchStrDrafts = $scope.searchStr.readDraft();

      angular.element('#search-input').val('');
      angular.element('#search-input').focus();
      console.log($scope.searchStr.readDraft());
    }


    var readSearchInput = function () {
      return $scope.searchInput;
    }

    var readPdfHandler = function () {
      return pdfDelegate.$getByHandle('pdfFile')
    }

    var cleanLabelInput = function () {
      angular.element('#label-input').val('');
    }

    $rootScope.searchKeyEvents = function (keyEvent) {
      if (keyEvent.which === 13) {
        var input = $scope.searchInput;
        if (tagCtrls.contains(input)) {
          var tagCtrl = tagCtrls.getCtrl(input);
          tagCtrl.openModal();
        } else if (input.indexOf(":")+1 === input.length) {
          var tagCtrl = tagCtrls.getCtrl('ValueTag');
          tagCtrl.openModal();
        } else {
          $scope.searchStr.append(readSearchInput(), {});
          backToSearchInput();
        }
      }
    };

    $rootScope.removeDraftStr = function (tagName) {
      $scope.searchStr.removeDraft(tagName);
      backToSearchInput();
    }

    $rootScope.openSearchStrDraft = function () {
      angular.element('#searchstr-draft').show();
    }

    $rootScope.closeSearchStrDraft = function () {
      angular.element('#searchstr-draft').hide();
    }

    $rootScope.findFiles = function () {
      console.log($scope.searchStr.make());
    }

    $rootScope.clearSearchStrDraft = function () {
      $scope.searchStr.clearDraft();
      $rootScope.searchStrDraftAmount = $scope.searchStr.amountDraft();
    }

    $scope.modalKeyEvents = function (keyEvent, tagType) {
      if (keyEvent.which === 13) {
        if (tagCtrls.contains(tagType)) {
          var tagCtrl = tagCtrls.getCtrl(tagType);
          var obj = tagCtrl.readModal();
          $scope.searchStr.append(obj.tagName, obj.data);
          angular.element('#'+tagType+'-modal').modal('hide');
          backToSearchInput()
        }
      }
    };
    
    $scope.searchStrAppend = function () {

    }


    $scope.nextPage = function() {
      var pdfDoc = readPdfHandler()
      pdfDoc.next();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.prevPage = function() {
      var pdfDoc = readPdfHandler()
      pdfDoc.prev();
      $scope.currentPage = pdfDoc.getCurrentPage();
      $scope.totalPages = pdfDoc.getPageCount();
    }

    $scope.zoomIn = function() {
      readPdfHandler().zoomIn();
    }

    $scope.zoomOut = function() {
      readPdfHandler().zoomOut();
    }

    $scope.nextDoc = function () {
      var nextDoc = $scope.docs.nextDoc()
      $scope.globals.goToDoc(nextDoc.name);
    }

    $scope.prevDoc = function () {
      var prevDoc = $scope.docs.prevDoc()
      $scope.globals.goToDoc(prevDoc.name);
    }

    $scope.labelInputKeyEvents = function (keyEvent, name, newLabels) {
      if (keyEvent.which === 13) {
        var that = this;
        that.tagErrorMsg = false;
        $scope.docs.appendLabels(name, newLabels)
          .then(function (labels, response) {
            cleanLabelInput();
          });
      }
    }

    $scope.removeDocLabel = function (name, label) {
      $scope.docs.removeLabel(name, label)
        .then(function (label, response) {
          cleanLabelInput();
        });
    }

    $scope.saveNote = function (name, note) {
      $scope.docs.saveNote(name, note).catch(function (response) {
      });
    }

    // Run on start

    setupCtrl();

  }
]);
