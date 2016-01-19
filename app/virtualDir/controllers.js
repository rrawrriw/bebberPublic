'use strict';

var m = angular.module('virtualDir.controllers', []);


// Da alle Dokumente in "einem" Verzeichnis abgelegt sind
// gibt es keine sinnvolle Verzeichnisstruktur. 
// Als alternative kann man "Virtuelle Ordner" anlegen. 
// Ein "Virtueller Ordner" ist eine Liste mit Dokumeten. 
// Wie diese Dokumenten Liste entsteht ist nicht festgelegt. 
// Sie kann durch eine Suchergebniss erzeugt werden
// oder durch fest vorgegeben Dokumente. 
// Um dich richtige Liste zu wählen muss ein 
// Verzeichnisname übergeben werden. Die Liste für diesen
// Verzeichnisnamen wird aus dem VirtualDir Service geladen. 
m.controller('VirtualDirDetailViewCtrl', [
  '$scope',
  '$rootScope',
  '$log',
  '$routeParams',
  '$timeout',
  '$document',
  '$sce',
  '$uibModal',
  'session',
  'Doc',
  'docNumberProposal',
  'utils',
  'Label', function($scope,
    $rootScope,
    $log,
    $routeParams,
    $timeout,
    $document,
    $sce,
    $uibModal,
    session,
    Doc,
    utils) {

    var doc = undefined;

    var setupCtrl = function() {
      if (session.isExpired()) {
        utils.go2('/sign_in');
      }

      // Init dir
      $scope.dirName = $routerParams.dirName;
      $scope.dirPos = $routerParams.dirPos;
      try {
        $scope.dir = virtualDir.readDir($scope.dirName)
      } catch ( e ) {
        utils.globalErrMsg('Cannot load documents');
      }

      doc = $scope.dir[$scope.dirPos];

      // Hier werden alle Daten für das Template zusammengefasst.
      // Die in diesem Objekt definierten Attribute werden als
      // ng-model für die Templates verwendet. Ändern der Benutzer
      // Daten werden sie zuerste in diesem Objekt verändert.
      // Werden neu Daten von einem Server geladen werden diese
      // daraufhin mit diesem Objekt abgeglichen. So kann man diese
      // Objekt an verschieden EventHandler übergeben diese können
      // dan direkt dieses Objekt manipulieren. 
      // Man auch ein Proxy-Objekt nennen.
      $scope.docData = {
        id: doc.id,
        name: doc.name,
        barcode: doc.barcode,
        dateOfScan: doc.dateOfScan,
        dateOfReceipt: doc.dateOfReceipt,
        labels: doc.readLabels(), // ref auf Array
        accountData: doc.readAccountData(), // ref auf Obj 
        docNumbers: doc.readDocNumbers(), // ref auf Array
      };

      $scope.docAction = new DocEventHandler(
        utils, Doc, doc, $scope.docData, $scope.dirPos
      );

      // Load labels for label selection
      $http.get('/v2/labels').then(function(resp) {
        $scope.labelSelect = new LabelSelectEventHandler(
          resp.data, Label, doc, $scope.docData
        );
      }).catch(function() {
        utils.globalErrMsg('Cannot load labels');
      });

      $scope.pdf.setup($scope.docName);

    }

    // EventHandler for modals
    $scope.modals = {
      changeDocName: {
        modal: undefined,
        open: function() {
          this.modal = $uibModal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/changeDocNameModal.html',
            controller: 'changeDocNameModalCtrl',
            resolve: {
              doc: function() {
                return doc;
              },
              docName: function() {
                return $scope.docData.name;
              },
            },
          });

          this.modal.result.then(function(newName) {
            $scope.docData.name = newName;
          });

        },
      },

      accountingData: {
        modal: undefined,
        open: function() {
          this.modal = $modal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/accProcessModal.html',
            windowClass: 'accProcess-modal',
            contorller: 'showAccountingDataCtrl',
            resolve: {
              doc: function() {
                return doc;
              },
              accountData: function() {
                return $scope.docData.accountData;
              },
              accountNumbers: function() {
                return $scope.docData.accountNumbers;
              }
            },
          });

        },

      },

      docNumberProposal: {
        modal: undefined,
        open: function() {

          this.modal = $modal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/docNumberProposalModal.html',
            controller: 'docNumberProposalModalCtrl',
          });

          this.modal.result.then(function(proposal) {
            var proposalStr = String(proposal);
            doc.appendDocNumber(proposalStr).catch(function(resp) {
              utils.globalErrMsg('Couldn\'t append new document number');
            })

            doc.removeLabel('Inbox-Buchhaltung').then(function() {
              // If Inbox-Buchhaltung successfully removed,
              // remove label from docData.labels as well.
              // It would be possible to read labels
              // from server (doc.readLabels()) but I think we
              // can safe this response time and just remove
              // it directly from list.
              $scope.docData.labels = _.filter(
                $scope.docData.labels, function(val, index) {
                  if (val.name !== 'Inbox-Buchhaltung') {
                    return val;
                  }
                })
            }).catch(function(resp) {
              utils.globalErrMsg('Couldn\'t remove Inbox-Buchhaltung label');
              $log.error(resp.data.message);
            });

            var result = _.find(
              $scope.docData.labels, function(v) {
                return v === 'Buchungsbeleg';
              });
            if (!angular.isDefined(result)) {
              // If appending fails 
              doc.appendLabel('Buchungsbeleg').then(function() {
                $scope.docData.labels.push('Buchungsbeleg');
                $scope.docData.labels.sort();
              }).catch(function(resp) {
                utils.globalErrMsg('Couldn\'t append Buchungsbeleg label');
                $log.error(resp.data.message);
              });
            }

            var proposalInt = parseInt(proposal);
            if (!isNaN(proposalInt)) {
              docNumberProposal.save(proposalInt).catch(function(resp) {
                utils.globalErrMsg('Cannot update document number proposal');
                $log.error(resp.data.message);
              });
            }

          });
        },
      },

    };

    $scope.docNumbers = {
      input: [],
      save: function() {
        var docName = $scope.doc.Name;
        var that = this;
        doc.appendDocNumbers(this.input).then(function(resp) {
          _.each(that.input, function(val, index, list) {
            $scope.docData.docNumbers.push(val);
          });

          that.input = [];
        }).catch(function(resp) {
          $log.error(resp.data.message);
          utils.globalErrMsg('Couldn\'t append document number(s)');
        });
      },

      keyEvent: function(keyEvent) {
        // hit enter
        if (keyEvent.which === 13) {
          this.save()
        }
      },

      remove: function(number) {
        doc.removeDocNumber(number).catch(function(resp) {
          $log.error(resp.data.message);
          utils.globalErrMsg('Couldn\'t remove document number');
        });
      }
    };

    $scope.pdf = {
      url: '',
      setup: function(docName) {
        var that = this;
        this.url = $sce.trustAsResourceUrl('/pdfviewer/viewer.html?file=/ReadDocFile/' + docName);
      }
    }

    // ----------------
    //
    // Setup controller
    //
    // ----------------
    setupCtrl();

  }
]);


// Find all docs with label Neu. Then open virtual dir.
m.controller('VirtualDirFindNewDocsCtrl', [
  '$scope',
  '$rootScope',
  'docTools',
  'utils', function(
    $scope,
    $rootScope,
    virtualDir,
    docTools,
    utils) {

    var labels = docTools.findDocsByLabel('Neu')

    labels.$promise
      .then(function(resp) {
        virtualDir.mkdir('Neu', labels);
        $rootScope.searchResultLength = labels.length;
        utils.go2('/virtual_dir/Neu/0');
      })
      .catch(function(response) {
        utils.globalErrMsg(response.Msg);
      });

  }
]);

m.controller('changeDocNameModalCtrl', [
  '$scope',
  '$uibModalInstance',
  'Doc',
  'utils',
  'docName', function($scope,
    $modalInstance,
    Doc,
    utils,
    docName) {

    $scope.newDocName = docName;
    $scope.opened = true;

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.save = function() {
      var change = {
        name: $scope.newDocName
      };

      Doc.update(change, new Doc()).then(function() {
        $modalInstance.close($scope.newDocName);
      }).catch(function(resp) {
        $log.error(resp.data.message);
        utils.globalErrMsg('Couldn\'t change document name');
      });
    };

    $scope.keyEvents = function(keyEvent) {
      // hit enter key
      if (keyEvent.which === 13) {
        $scope.save();
      }
    };

  }
]);

m.controller('showAccountingDataCtrl', [
  '$scope',
  '$log',
  '$uibModalInstance',
  'utils',
  'doc',
  'AccountData',
  'AccountNumbers', function($scope,
    $uibModalInstance,
    doc,
    AccountData,
    AccountNumbers) {

    $scope.accountingData = doc.readAccountingData(); // ref to array
    $scope.accountingData.$promise.catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot load accounting data');
    });

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);

m.controller('docNumberProposalModalCtrl', [
  '$scope',
  '$uibModalInstance',
  'DocNumberProposal',
  'utils', function($scope,
    $modalInstance,
    DocNumberProposal,
    utils) {

    var startCtrl = function() {
      $scope.docNumberProposal.next()
        .then(function(response) {
          $scope.proposal = response.Proposal;
          $scope.opened = true;
        })
        .catch(function(response) {
          utils.globalErrMsg(response.Msg);
        });
    }

    $scope.proposal = undefined;
    $scope.docNumberProposal = DocNumberProposal;

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    $scope.save = function() {
      $modalInstance.close($scope.proposal);
    };

    $scope.keyEvents = function(keyEvent) {
      if (keyEvent.which === 13) {
        $scope.save();
      }
    };

    startCtrl();

  }
]);

var PositionCounter = function(max, startPos) {
  max = max - 1;
  var curr = -1;
  var last = -1;

  if (angular.isDefined(startPos)) {
    curr = startPos;
    if ((startPos - 1) < 0) {
      last = max
    } else if ((startPos + 1) > max) {
      last = 0;
    } else {
      last = startPos - 1;
    }
  }

  this.up = function() {
    last = curr;
    curr--;

    if (curr < 0) {
      curr = max;
    }

    return curr;

  };

  this.down = function() {
    last = curr;
    curr++;

    if (curr > max) {
      curr = 0;
    }

    return curr;

  };
};

var LabelSelectEventHandler = function(labels, Label, doc, docData) {
  var pos = new PositionCounter(labels.length);

  // Set all label selected attributes to false
  var unselectAll = function(labels) {
    return _.map(labels, function(val, index) {
      val.selected = false;
    })
  };

  // Unselect one label entry
  var unselect = function(labels, pos) {
    if (pos < 0 || pos > (labels.length - 1)) {
      return
    }
    labels[pos].selected = false;

    return labels
  };

  var select = function(labels, pos) {
    console.log("select pos", pos);
    labels[pos].selected = true;
  };

  var filterLabels = function(labels, query) {
    return _.filter(labels, function(val, index) {
      if (val.indexOf(query) !== -1) {
        return val
      }
    });
  };

  this.isHidden = false;
  this.input = "";
  this.labels = labels;

  this.open = function() {
    if (this.labels.length === 0) {
      this.isHidden = true;
      return
    }

    this.labels = unselectAll(this.labels);
    pos = new PositionCounter(this.labels.length);

    this.isHidden = false;
  };

  this.close = function() {
    this.isHidden = true;
  };


  this.joinLabel = function(pos) {
    if (pos < 0 || pos > (this.labels.length - 1)) {
      console.log('Ask if ' + this.input + ' should be created!');
      var label = new Label({
        name: this.labels[pos.curr]
      });
      label.save();
      return
    }

    doc.joinLabel(label).then(function() {
      docData.labels.push(label);
      docData.labels.sort();
    });

  };

  // Filter label list
  this.keydown = function(e) {
    console.log(e.which);
    switch (e.which) {
      // up
      case 38:
        pos.up();
        this.labels = unselect(this.labels, pos.last);
        this.labels = select(this.labels, pos.curr);
        break;
      // down
      case 40:
        pos.down();
        this.labels = unselect(this.labels, pos.last);
        this.labels = select(this.labels, pos.curr);
        break;
      // enter, start append process
      case 13:
        console.log(pos.curr);
        this.joinLabel(pos.curr);
        break;
      // reset filter labels
      default:
        console.log("input ", this.input);
        this.labels = filterLabels(this.labels, function() {});
        this.labels = unselectAll(this.labels);
        pos = new PositionCounter(this.labels.length);
        break;
    }
  };

}

var DocEventHandler = function(utils, Doc, doc, docData, dir, dirPos) {
  var posCount = new PositionCounter(dir.length, dirPos);

  this.glowGreen = {
    accData: false,
    dateOfReceipt: false,
  }

  this.nextDoc = function() {
    posCount.down();
    utils.go2('/virtual_dir/' + dir + '/' + posCount.curr);
  }

  this.prevDoc = function() {
    posCount.up();
    utils.go2('/virtual_dir/' + dir + '/' + posCount.curr);
  }

  this.removeLabel = function(labelID) {};

  this.saveDateOfReceipt = function() {
    var date = docData.dateOfReceipt;
    var change = {
      dateOfReceipt: date,
    };
    Doc.update(change, doc).then(function() {
      this.glowGreen.dateOfReceipt = true;
      $timeout(function() {
        this.glowGreen.dateOfReceipt = false;
      }, 2000);
    }).catch(function(resp) {
      utils.globalErrMessage('Cannot update date of receipt');
      $log.error(resp.data.message);
    });

  }

  this.saveNote = function() {
    var change = {
      note: docData.note,
    };
    Doc.update(change, doc).then(function() {
      this.noteGlowGreen = true;
      $timeout(function() {
        this.noteGlowGreen = false;
      }, 2000);
    }).catch(function(response) {
      utils.globalErrMsg(response);
    });
  }

  this.saveAccountData = function() {
    var accNumber = parseInt(docData.accountData.accNumber);
    var from = docData.accountData.from;
    var to = docData.accountData.to;
    var accData = {
      accNumber: accNumber,
      docPeriod: {
        from: from,
        to: to,
      }
    }

    doc.saveAccountData(accData).then(function() {
      $scope.glowGreen.accData = true;
      $timeout(function() {
        $scope.glowGreen.accData = false;
      }, 2000);
    }).catch(function(response) {
      utils.globalErrMsg(response.Msg);
    });
  }

};

