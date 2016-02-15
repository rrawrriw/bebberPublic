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
  'docMaAPI',
  'utils',
  'virtualDir', function($scope,
    $rootScope,
    $log,
    $routeParams,
    $timeout,
    $document,
    $sce,
    $uibModal,
    session,
    docMaAPI,
    utils,
    virtualDir) {

    var doc = undefined;

    var setupCtrl = function() {
      if (session.isExpired()) {
        utils.go2('/sign_in');
      }

      // Init dir
      $scope.dirName = $routeParams.dirName;
      $scope.dirPos = $routeParams.dirPosition;
      try {
        $scope.dir = virtualDir.readDir($scope.dirName)
      } catch ( e ) {
        $log.error(e);
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
      // Man könnte es auch ein Proxy-Objekt nennen.
      $scope.docData = {
        id: doc.id,
        name: doc.name,
        barcode: doc.barcode,
        dateOfScan: doc.date_of_scan,
        dateOfReceipt: doc.date_of_receipt,
        note: doc.note,
        labels: docMaAPI.docs.readAllLabels(doc.id), // ref auf Array
        accountData: docMaAPI.docs.readAccountData(doc.id), // ref auf Obj 
        docNumbers: docMaAPI.docs.readAllDocNumbers(doc.id), // ref auf Array
      };

      $scope.docsCtrl = new DocEventHandlers(
        $log, $timeout, utils, docMaAPI, doc, $scope.docData,
        $scope.dir, $scope.dirName, $scope.dirPos
      );
      $scope.docNumbersCtrl = new DocNumbersEventHandlers(
        $log, $timeout, docMaAPI, utils, $scope.docData
      );
      $scope.accountDataCtrl = new AccountDataEventHandlers(
        $log, $timeout, docMaAPI, utils, $scope.docData
      );

      // Load labels for label selection
      docMaAPI.labels.readAllLabels().$promise.then(function(resp) {
        $scope.labelSelect = new LabelSelectEventHandlers(
          docMaAPI, utils, resp.data, doc, $scope.docData
        );
      }).catch(function(resp) {
        $log.error(resp.data.message);
        utils.globalErrMsg('Cannot load labels');
      });

      $scope.pdf.setup($scope.docData.name);

    }

    // EventHandler for modals
    $scope.modals = {
      changeDocName: {
        modal: undefined,
        open: function() {
          this.modal = $uibModal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/virtualDir/changeDocNameModal.html',
            controller: 'changeDocNameModalCtrl',
            resolve: {
              docData: function() {
                return $scope.docData;
              },
            },
          });

          this.modal.result.then(function(newName) {
            doc.name = newName;
          });
        },
      },

      accountingData: {
        modal: undefined,
        open: function() {
          this.modal = $uibModal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/virtualDir/accountingDataModal.html',
            windowClass: 'accProcess-modal',
            controller: 'showAccountingDataCtrl',
            resolve: {
              docData: function() {
                return $scope.docData;
              },
            },
          });

        },

      },

      docNumberProposal: {
        modal: undefined,
        open: function() {

          this.modal = $uibModal.open({
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
        this.url = $sce.trustAsResourceUrl('/pdfviewer/viewer.html?file=/docfile/' + docName);
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
  '$log',
  '$scope',
  '$rootScope',
  'virtualDir',
  'docMaAPI',
  'utils', function(
    $log,
    $scope,
    $rootScope,
    virtualDir,
    docMaAPI,
    utils) {

    var labels = docMaAPI.labels.findLabelsByName('Neu')

    labels.$promise.then(function(resp) {
      if (labels.length !== 1) {
        throw new Error('Error while loading Neu label');
      }

      return docMaAPI.docs.findDocsByLabel(labels[0].id).$promise;
    }).then(function(resp) {
      var docs = resp.data

      virtualDir.mkdir('Neu', docs);
      $rootScope.searchResultLength = labels.length;

      utils.go2('/virtual_dir/Neu/0');
    }).catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot load Neu label');
    });

  }
]);

m.controller('changeDocNameModalCtrl', [
  '$log',
  '$scope',
  '$uibModalInstance',
  'docMaAPI',
  'utils',
  'docData', function($log,
    $scope,
    $uibModalInstance,
    docMaAPI,
    utils,
    docData) {

    $scope.newDocName = docData.name;

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.save = function() {
      var name = $scope.newDocName;
      docMaAPI.docs.renameDoc(docData.id, name).$promise.then(function() {
        docData.name = name;
        $uibModalInstance.close(name);
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
  '$log',
  '$scope',
  '$uibModalInstance',
  'docMaAPI',
  'utils',
  'docData', function($log,
    $scope,
    $uibModalInstance,
    docMaAPI,
    utils,
    docData) {

    $scope.accountingData = docMaAPI.docs.readAccountingData(docData.id); // ref to array
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
  this.curr = -1;
  this.last = -1;

  if (angular.isDefined(startPos)) {
    this.curr = startPos;
    if ((startPos - 1) < 0) {
      this.last = max
    } else if ((startPos + 1) > max) {
      this.last = 0;
    } else {
      this.last = startPos - 1;
    }
  }

  this.up = function() {
    this.last = this.curr;
    this.curr--;

    if (this.curr < 0) {
      this.curr = max;
    }

    return this.curr;

  };

  this.down = function() {
    this.last = this.curr;
    this.curr++;

    if (this.curr > max) {
      this.curr = 0;
    }

    return this.curr;

  };
};

var LabelSelectEventHandlers = function(docMaAPI, utils, labels, doc, docData) {
  var pos = new PositionCounter(labels.length);

  // Set all label selected attributes to false
  var unselectAll = function(ll) {
    return _.map(ll, function(v, i, l) {
      v.selected = false;
      return v;
    })
  };

  // Unselect one label entry
  var unselect = function(l, pos) {
    if (pos < 0 || pos > (l.length - 1)) {
      return l
    }
    l[pos].selected = false;

    return l;
  };

  var select = function(l, pos) {
    l[pos].selected = true;

    return l
  };

  var filterLabels = function(l, query) {
    console.log('--> ', l);
    console.log('Q-> ', query);
    return _.filter(l, function(val) {
      console.log(val);
      return (val.name.indexOf(query) !== -1)
    });
  };

  this.isHidden = true;
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
    var that = this;
    if (pos < 0 || pos > (this.labels.length - 1)) {
      console.log('Ask if ' + this.input + ' should be created!');

      var d = confirm('Should label be created' + this.input);
      if (!d) {
        return
      }

      var newLabel = this.input;
      docMaAPI.labels.createLabel(newLabel).$promise.then(function(resp) {
        return docMaAPI.docs.joinLabel(doc.id, resp.data.id).$promise;
      }).then(function(resp) {
        var label = {
          id: resp.data.label_id,
          name: newLabel
        };
        docData.labels.push(label);
        docData.labels.sort();

        that.labels.push(label);
        that.labels.sort();
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot join or create label ' + newLabel);
        $log.error(resp.data.message);
      });
    } else {
      var label = this.labels[pos];
      docMaAPI.docs.joinLabel(doc.id, label.id).$promise.then(function() {
        docData.labels.push(label);
        docData.labels.sort();
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot join label with doc, please try it again');
        $log.error(resp.data.message);
      });;
    }
  };

  // Filter label list
  this.keydown = function(e) {
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
        this.labels = filterLabels(labels, this.input);
        console.log(labels);
        console.log(this.labels);
        this.labels = unselectAll(this.labels);
        pos = new PositionCounter(this.labels.length);
        break;
    }
  };

}

var DocEventHandlers = function($log, $timeout, utils, docMaAPI, doc, docData, dir, dirName, dirPos) {
  var posCount = new PositionCounter(dir.length, dirPos);

  this.glowGreen = false;

  this.nextDoc = function() {
    var curr = posCount.down();
    utils.go2('/virtual_dir/' + dirName + '/' + curr);
  }

  this.prevDoc = function() {
    var curr = posCount.up();
    utils.go2('/virtual_dir/' + dirName + '/' + curr);
  }

  this.removeLabel = function(labelID) {
    docMaAPI.docs.detachLabel(doc.id, labelID).then(function(resp) {
      docData.labels = _.filter(docData.labels, function(v) {
        return (v.id != labelID);
      });
    }).catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot remove label');
    })
  };

  this.updateDoc = function() {
    var that = this;
    var change = {
      name: docData.name,
      barcode: docData.barcode,
      date_of_scan: docData.dateOfScan,
      date_of_receipt: docData.dateOfReceipt,
      note: docData.note,
    };
    docMaAPI.docs.updateDoc(doc.id, change).$promise.then(function() {
      that.glowGreen = true;
      $timeout(function() {
        that.glowGreen = false;
      }, 2000);
    }).catch(function(resp) {
      utils.globalErrMsg('Cannot update doc, please try it again');
      $log.error(resp.data.message);
    });

  }

};

var AccountDataEventHandlers = function($log, $timeout, docMaAPI, utils, docData) {
  this.glowGreen = false;

  this.save = function() {
    var that = this;
    var accNumber = parseInt(docData.accountData.account_number);
    var from = docData.accountData.period_from;
    var to = docData.accountData.period_to;
    var accData = {
      account_number: accNumber,
      period_from: from,
      period_to: to,
    }

    docMaAPI.docs.updateAccountData(docData.id, accData).$promise.then(function() {
      that.glowGreen = true;
      $timeout(function() {
        that.glowGreen = false;
      }, 2000);
    }).catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot update account data, please try it again');
    });
  }

}

var DocNumbersEventHandlers = function($log, $timeout, docMaAPI, utils, docData) {
  var that = this;
  this.input = "";

  this.append = function() {
    _.each(this.input, function(v, k, l) {
      docMaAPI.docs.createDocNumber(docData.id, v).$promise.then(function(resp) {
        console.log(resp.data);
        docData.docNumbers.push(resp.data);
        that.input = "";
      }).catch(function(resp) {
        $log.error(resp.data.message);
        utils.globalErrMsg('Cannot append document number');
      });
    });
  };

  this.remove = function(number) {
    docMaAPI.docs.deleteDocNumber(docData.id, number).then(function(resp) {
      docData.docNumbers = _.filter(docData.docNumbers, function(v) {
        return (v.number != number);
      });
    }).catch(function(resp) {
      $log.error(resp.data.message);
      utils.globalErrMsg('Cannot remove document number');
    });
  };
}

