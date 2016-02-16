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
    var labels = undefined;

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
      labels = docMaAPI.labels.readAllLabels();
      labels.$promise.then(function(resp) {
        $scope.labelSelect = new LabelSelectEventHandlers(
          $log, docMaAPI, utils, resp.data, $scope.docData
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
        open: function() {
          $uibModal.open({
            animation: true,
            templateUrl: '/public/angular-tpls/virtualDir/docNumberProposalModal.html',
            controller: 'docNumberProposalModalCtrl',
            resolve: {
              docData: function() {
                return $scope.docData;
              },
              labels: function() {
                return labels;
              },
            },
          });
        },
      },

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
  '$log',
  '$scope',
  '$uibModalInstance',
  'docMaAPI',
  'utils',
  'docData',
  'labels', function($log,
    $scope,
    $uibModalInstance,
    docMaAPI,
    utils,
    docData,
    labels) {

    // due to focus-me
    $scope.opened = true;

    $scope.proposal = docMaAPI.docNumberProposals.next()
    $scope.proposal.$promise.catch(function(resp) {
      $log.error(resp.data.message)
      utils.globalErrMsg('Cannot load document number proposal');
    });

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.save = function() {
      var proposalStr = String($scope.proposal.value);
      docMaAPI.docs.createDocNumber(docData.id, proposalStr).$promise.then(function() {
        var docNumber = {
          doc_id: docData.id,
          number: $scope.proposal.value,
        };
        docData.docNumbers.push(docNumber);

        var label = _.find(labels, function(v) {
          return v.name === 'Inbox-Buchhaltung';
        });

        $uibModalInstance.close(docNumber);
        return docMaAPI.docs.detachLabel(docData.id, label.id);
      }).then(function() {
        docData.labels = _.filter(
          docData.labels, function(val, index) {
            return (val.name !== 'Inbox-Buchhaltung')
          })
      }).catch(function(resp) {
        $log.error(resp.data.message);
        utils.globalErrMsg('Couldn\'t append new document number');
      })

      var tmp = _.find(docData.labels, function(v) {
        return v.name === 'Buchungsbeleg';
      });
      if (!angular.isDefined(tmp)) {
        var label = _.find(labels, function(v) {
          return v.name === 'Buchungsbeleg';
        });
        // If appending fails 
        docMaAPI.docs.joinLabel(docData.id, label.id).$promise.then(function() {
          docData.labels.push(label.name);
          docData.labels.sort();
        }).catch(function(resp) {
          utils.globalErrMsg('Couldn\'t join ' + label.name + ' label');
          $log.error(resp.data.message);
        });
      }

      // Only store proposal when it is a number but then
      // update due to database table with the string value
      var proposalInt = parseInt($scope.proposal.value);
      if (!isNaN(proposalInt)) {
        var change = {
          name: "docNumberProposal",
          value: $scope.proposal.value,
        }
        docMaAPI.docNumberProposals.update(change).$promise.catch(function(resp) {
          utils.globalErrMsg('Cannot update document number proposal');
          $log.error(resp.data.message);
        });
      }

    };

    $scope.keyEvents = function(keyEvent) {
      if (keyEvent.which === 13) {
        $scope.save();
      }
    };

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

var LabelSelectEventHandlers = function($log, docMaAPI, utils, labels, docData) {
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
    return _.filter(l, function(val) {
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


  this.joinLabel = function() {
    if (this.input === '') {
      return
    }

    var that = this;
    var label = _.find(labels, function(v) {
      return v.name === that.input
    })
    // Create new label 
    if (!angular.isDefined(label)) {
      var newLabel = this.input;

      if (!confirm('Should label be created ' + newLabel)) {
        return
      }

      docMaAPI.labels.createLabel(newLabel).$promise.then(function(resp) {
        return docMaAPI.docs.joinLabel(docData.id, resp.data.id).$promise;
      }).then(function(resp) {
        label = {
          id: resp.data.label_id,
          name: newLabel
        };
        docData.labels.push(label);
        docData.labels.sort();

        that.labels.push(label);
        that.labels.sort();

        that.input = '';
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot join or create label ' + newLabel);
        $log.error(resp.data.message);
      });
    } else {
      // Join existing label to doc
      docMaAPI.docs.joinLabel(docData.id, label.id).$promise.then(function() {
        docData.labels.push(label);
        docData.labels.sort();
        that.input = '';
      }).catch(function(resp) {
        utils.globalErrMsg('Cannot join label with doc, please try it again');
        $log.error(resp.data.message);
      });
    }

  };

  // Filter label list
  this.keyctrl = function(e) {
    switch (e.which) {
      // up
      case 38:
        pos.up();
        this.labels = unselect(this.labels, pos.last);
        this.labels = select(this.labels, pos.curr);
        this.input = this.labels[pos.curr].name;
        break;
      // down
      case 40:
        pos.down();
        this.labels = unselect(this.labels, pos.last);
        this.labels = select(this.labels, pos.curr);
        this.input = this.labels[pos.curr].name;
        break;
      // enter, start append process
      case 13:
        console.log(pos.curr);
        this.joinLabel();
        break;
      // reset filter labels
      default:
        this.labels = filterLabels(labels, this.input);
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

  this.keyctrl = function(e) {
    switch (e.which) {
      // enter, start append process
      case 13:
        this.append();
        break;
    }
  };
}

