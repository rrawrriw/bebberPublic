'use strict'

var appCtrl = angular.module('appCtrl', [
    'appServices',
    'ui.bootstrap',
]);

appCtrl.controller('initCtrl', [
  '$scope',
  '$rootScope',
  '$http', 
  '$modal', 
  'Docs', 
  'Globals',
  function($scope, $rootScope, $http, $modal, Docs, Globals) {

    $rootScope.searchResultLength = 0;
    $scope.globals = Globals;
    $scope.docs = Docs;

    $scope.searchForm = {
      labels: [],
      docNumbers: [],
      fromDateOfScan: null,
      toDateOfScan: null,
      opened: true,

      findDocs: function () {
        console.log("findDocs!");
        var that = this;
        var request = this.makeSearchJSON();

        if (!angular.isDefined(request)) {
          return
        }
        
        $scope.docs.find(request)
          .then(function (response) {
            var result = response.Result;
            var modal = that.openSearchResult(result);
            modal.result.then(function () {
              $rootScope.searchResultLength = $scope.docs.readCurrDocs().length;
              that.toggle();
            });
          })
          .catch(function (response) {
            $scope.globals.globalErrMsg(response.Msg);
          });

      },

      openSearchResult: function (result) {
        console.log('openSearchResult');
        var modal = $modal.open({
          animation: true,
          templateUrl: '/public/angular-tpls/searchResultModal.html',
          controller: 'searchResultModalCtrl',
          size: 'lg',
          resolve: {
            'result': function () { return result },
          },
        });
        return modal;
      },


      toggle: function () {
        this.opened = !this.opened;
      },

      clear: function () {
        this.labels = [];
        this.docNumbers = [];
        this.fromDateOfScan = null;
        this.toDateOfScan = null;
      },

      keyEvents: function (keyEvent) {
        if (keyEvent.which === 13) {
          this.findDocs();
        }
      },

      makeSearchJSON: function () {
        var searchObj = {};
        var valid = 0;
        
        if (this.labels.length > 0) {
          searchObj["Labels"] = this.labels.join(",");
          valid += 1;
        }
        if (this.docNumbers.length > 0) {
          searchObj["AccountData.DocNumbers"] = this.docNumbers.join(",");
          valid += 1;
        }
        if (this.fromDateOfScan !== null || 
            this.toDateOfScan !== null) {
          var tmp = searchObj["Infos.DateOfScan"] = {};
          if (this.formDateOfScan !== null) {
            var d = new Date(this.fromDateOfScan);
            tmp["$gte"] = d.toISOString();
          }
          if (this.toDateOfScan !== null) {
            var d = new Date(this.toDateOfScan);
            tmp["$lte"] = d.toISOString();
          }

          valid += 1;
        }

        if (valid === 0) {
          return undefined;
        } else {
          var searchStr = JSON.stringify(searchObj);
          return searchStr;
        }
      },

      openDatepickerFrom: function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedFrom = true;
      },

      openDatepickerTo: function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedTo = true;
      },

    };

  }
]);

appCtrl.controller('docNumberProposalModalCtrl', ['$scope', '$modalInstance', 'DocNumberProposal', 'Globals',
  function ($scope, $modalInstance, DocNumberProposal, Globals) {

    var startCtrl = function () {
      $scope.docNumberProposal.next()
        .then(function (response) {
          $scope.proposal = response.Proposal;
          $scope.opened = true;
        })
        .catch(function (response) {
          $scope.globals.globalErrMsg(response.Msg);
        });
    }

    $scope.proposal = undefined;
    $scope.globals = Globals;
    $scope.docNumberProposal = DocNumberProposal;

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    $scope.save = function () {
      $modalInstance.close($scope.proposal);
    };

    $scope.keyEvents = function (keyEvent) {
      if (keyEvent.which === 13) {
        $scope.save();
      }
    };

    startCtrl();

  }
]);

appCtrl.controller('changeDocNameModalCtrl', ['$scope', '$modalInstance', 'Doc', 'Docs', 'Globals',
  function ($scope, $modalInstance, Doc, Docs, Globals) {

    $scope.doc = Doc;
    $scope.newDocName = $scope.doc.Name;
    $scope.globals = Globals;
    $scope.docs = Docs;
    $scope.opened = true;

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    $scope.save = function () {
      $scope.docs.changeDocName($scope.doc.Name, $scope.newDocName)
        .then(function (response) {
          $modalInstance.close($scope.newDocName);
        })
        .catch(function (response) {
          $scope.globals.globalErrMsg(response.Msg);
        });
    };

    $scope.keyEvents = function (keyEvent) {
      if (keyEvent.which === 13) {
        $scope.save();
      }
    };

  }
]);

appCtrl.controller('searchResultModalCtrl', [
  '$scope', '$modalInstance', 'result', 'Docs', 'Globals',
  function ($scope, $modalInstance, result, Docs, Globals) {
    $scope.docs = Docs;
    $scope.globals = Globals;
    $scope.result = result;

    console.log('searchResultModal');
    console.log(result);

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    $scope.use = function () {
      $scope.docs.saveDocs($scope.result);
      var doc = $scope.docs.firstDoc();
      $modalInstance.close();
      $scope.globals.goToDoc(doc.name)
    };

    $scope.keyEvents = function (keyEvent) {
      if (keyEvent.which === 13) {
        $scope.use();
      }
    };

  }
]);

appCtrl.controller('loginCtrl', [
  '$scope', '$rootScope', '$http', '$location', '$log', 'User', 'Globals', 
  function($scope, $rootScope, $http, $location, $log, User, Globals) {
    angular.element("#username").focus();
    $scope.globals = Globals
    $scope.login = function () {
      var user = {Username: $scope.username,
                  Password: $scope.password}
      $http.post('/Login', user)
        .success(function (response) {
          if (response.Status === 'fail') {
          } else if (response.Status === 'success') {
            $rootScope.loggedInAs = user.Username;
            $rootScope.user = user
            $location.url('/newDocs');
          }
        })
        .error(function (response) {
          $scope.globals.globalErrMsg(response.Msg);
        })
    }

  }
]);

appCtrl.controller('newDocsCtrl', [
  '$scope', '$rootScope', '$location', 'Docs', 'Globals',
  function ($scope, $rootScope, $location, Docs, Globals) {
    $scope.globals = Globals;
    $scope.docs = Docs;
    $scope.docs.find('{"Labels": "Neu"}')
      .then(function (response) {
        $scope.docs.saveDocs(response.Result);
        var doc = $scope.docs.firstDoc();
        $rootScope.searchResultLength = $scope.docs.readCurrDocs().length;
        $scope.globals.goToDoc(doc.Name); 
      })
      .catch(function (response) {
        $scope.globals.globalErrMsg(response.Msg);
      });

  }
]);

appCtrl.controller('singleViewCtrl', [
  '$scope', '$rootScope', '$http', '$log', '$routeParams', '$location', '$q',
  '$timeout', '$document', '$modal', 'pdfDelegate', 'User',
  'Docs', 'Globals', 'AccProcess', 'DocNumberProposal',
  function ($scope, $rootScope, $http, $log, $routeParams, 
    $location, $q, $timeout, $document, $modal, pdfDelegate, User,
    Docs, Globals, AccProcess, DocNumberProposal) {
  
    var setupCtrl = function () {
      $scope.globals = Globals;

      if (!angular.isDefined($rootScope.user)) {
        $scope.globals.goToLogin()
        return
      }

      $scope.docNumberProposal = DocNumberProposal;

      $scope.accProcess = AccProcess;

      $scope.currPDFPage = 1;
      $scope.totalPDFPages = '?';

      $scope.docName = $routeParams.docName;
      $scope.docs = Docs;
      $scope.doc = $scope.docs.readDoc($scope.docName);

      $scope.pdf.setup($scope.docName);

    }

    $scope.modals = {
      changeDocName: {
        modal: undefined,
        open: function () {
          var that = this;

          this.modal = $modal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/changeDocNameModal.html', 
            controller: 'changeDocNameModalCtrl',
            resolve: {
              Doc: function () {return $scope.doc},
            },
          });

          this.modal.result.then(function (newName) {
            $scope.doc.Name = newName;
            $scope.globals.goToDoc(newName);
          });

        },
      },

      accProcess: {
        modal: undefined,
        open: function () {
          var that = this;
          var docNumbers = $scope.doc.AccountData.DocNumbers;
          var accNumber = $scope.doc.AccountData.AccNumber;
          var from = $scope.doc.AccountData.DocPeriod.From;
          var to = $scope.doc.AccountData.DocPeriod.To;
          $scope.accProcess.findAll(docNumbers, accNumber, from, to)
            .then(function (accProcess) {

              that.modal = $modal.open({
                animation: true,
                templateUrl: '/public/angular-tpls/accProcessModal.html',
                scope: $scope,
                windowClass: 'accProcess-modal'
              });


            })
            .catch(function (response) {
              $scope.globals.globalErrMsg(response.Msg)
            });
        },
        cancel: function () {
          this.modal.dismiss('cancel');
        },

      },

      docNumberProposal: {
        modal: undefined,
        open: function () {
          
          this.modal = $modal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/docNumberProposalModal.html',
            controller: 'docNumberProposalModalCtrl',
          });

          this.modal.result.then(function (proposal) {
            var proposalStr = String(proposal);
            var proposalInt = parseInt(proposal);
            $scope.docs.appendDocNumbers($scope.doc.Name, [proposalStr])
              .then(function (response) {
                $scope.docNumberProposal.save(proposalInt)
                  .catch(function (response) {
                    $scope.docs.removeDocNumber($scope.doc.Name, proposalStr)
                      .catch(function (response) {
                        $scope.globals.globalErrMsg(response.Msg);
                      });
                    $scope.globals.globalErrMsg(response.Msg);
                  });
              })
              .catch(function (response) {
                $scope.globals.globalErrMsg(response.Msg);
              });

          });

        },
      },

    };

    $scope.labels = {
      input: [],
      save: function () {
        var docName = $scope.doc.Name;
        var that = this;
        $scope.docs.appendLabels(docName, this.input)
          .then(function (response) {
            that.input = [];
          })
          .catch(function (response) {
            $scope.globals.globalErrMsg(response.Msg);
          });
      },
      keyEvent: function (keyEvent) {
        if (keyEvent.which === 13) {
          this.save()
        }
      },
      remove: function (label) {
        var docName = $scope.doc.Name;
        $scope.docs.removeLabel(docName, label)
          .catch(function (response) {
            $scope.globals.globalErrMsg(response);
          });
      }
    };

    $scope.docnumbers = {
      input: [],
      save: function () {
        var docName = $scope.doc.Name;
        var that = this;
        $scope.docs.appendDocNumbers(docName, this.input)
          .then(function (response) {
            that.input = [];
          })
          .catch(function (response) {
            $scope.globals.globalErrMsg(response);
          });
      },
      keyEvent: function (keyEvent) {
        if (keyEvent.which === 13) {
          this.save()
        }
      },
      remove: function (number) {
        $scope.docs.removeDocNumber($scope.doc.Name, number)
          .catch(function (response) {
            $scope.globals.globalErrMsg(response);
          });
      }
    };
    

    $scope.pdf = {
      url: '',
      totalPages: '?',
      currPage: 1,

      zoomIn: function() {
        this.handler().zoomIn();
      },

      zoomOut: function() {
        this.handler().zoomOut();
      },

      nextPage: function() {
        var pdfDoc = this.handler()
        pdfDoc.next();
        this.currPage = pdfDoc.getCurrentPage();
        this.totalPages = pdfDoc.getPageCount();
      },

      prevPage: function() {
        var pdfDoc = this.handler()
        pdfDoc.prev();
        this.currPage = pdfDoc.getCurrentPage();
        this.totalPages = pdfDoc.getPageCount();
      },

      handler: function () {
        return pdfDelegate.$getByHandle('pdfFile')
      },

      setup: function (docName) {
        var that = this;
        this.url = '/ReadDocFile/'+ docName;
        PDFJS.disableWorker = true;
        this.handler().load(this.url);
        this.currPage = 1;

        var timer = $timeout(function() { 
          that.totalPages = that.handler().getPageCount();
        }, 1000);

        $scope.$on('destroy', function () {
          $timeout.cancel(timer);
        });

      /*
      PDFJS.disableWorker = true;
      $http.get($scope.pdfUrl)
        .success(function (data) {
          for(var x=0;x<11;x++) {
          }
          var pdf = PDFJS.getDocument({data: data}).then(function (pdf) {;
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


    }

    $scope.glowGreen = {
      accData: false,
      dateOfReceipt: false,
    }

    $scope.nextDoc = function () {
      var nextDoc = $scope.docs.nextDoc();
      $scope.globals.goToDoc(nextDoc.Name);
    }

    $scope.prevDoc = function () {
      var prevDoc = $scope.docs.prevDoc();
      $scope.globals.goToDoc(prevDoc.Name);
    }

    $scope.saveDateOfReceipt = function() {
      var date = $scope.doc.Infos.DateOfReceipt;
      $scope.docs.changeDateOfReceipt($scope.doc.Name, date)
        .then(function (response) {
          $scope.glowGreen.dateOfReceipt = true;
          $timeout(function () {
            $scope.glowGreen.dateOfReceipt = false;
          }, 2000);
        })
        .catch(function (response) {
          $scope.globals.globalErrMsg(response.Msg);
        });

    }

    $scope.saveAccData = function () {
      var g = $scope.globals
      var docName = $scope.doc.Name;
      var accNumber = parseInt($scope.doc.AccountData.AccNumber);
      var from = $scope.doc.AccountData.DocPeriod.From;
      var to = $scope.doc.AccountData.DocPeriod.To;
      var accData = {
        accNumber: accNumber,
        docPeriod: {
          from: from,
          to: to,
        }
      }
      $scope.docs.saveAccData(docName, accData)
        .then(function (response) {
          $scope.glowGreen.accData = true;
          $timeout(function () {
            $scope.glowGreen.accData = false;
          }, 2000);
        })
        .catch(function (response) {
          $scope.globals.globalErrMsg(response.Msg);
        });
    }

    $scope.saveNote = function () {
      var docName = $scope.doc.Name;
      $scope.docs.saveNote(docName, $scope.doc.Note)
        .then(function (response) {
          $scope.noteGlowGreen = true;
          $timeout(function () {
            $scope.noteGlowGreen = false;
          }, 2000);
        })
        .catch(function (response) {
          $scope.globals.globalErrMsg(response);
        });
    }

    // Run on start
    setupCtrl();

  }
]);
