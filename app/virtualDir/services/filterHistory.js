var s = angular.module('virtualDir.services.filterHistory', []);

s.factory('filterHistory', function() {

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

    this.back = function() {
      this.last = this.curr;
      this.curr--;

      if (this.curr < 0) {
        this.curr = max;
      }

      return this.curr;

    };

    this.next = function() {
      this.last = this.curr;
      this.curr++;

      if (this.curr > max) {
        this.curr = 0;
      }

      return this.curr;

    };
  };


  var History = function(data) {
    this.max = 100;

    this.log = [];
    this.pos = new PositionCounter(0, 0);
    this.length = 0;

    this.setup = function(data) {
      if (angular.isDefined(data)) {
        var that = this;
        var d = [];
        data.forEach(function(v) {
          d.push(that.newFilter(v));
        });
        this.log = d;
        this.pos = new PositionCounter(data.length, this.log.length - 1);
        this.length = this.log.length;
      }

      return this;
    };

    this.next = function() {
      var p = this.pos.next();
      var n = this.log[p];
      return this.newFilter(n);
    };

    this.last = function() {
      var p = this.pos.back();
      var l = this.log[p];
      return this.newFilter(l);
    };

    this.newFilter = function(e) {
      var f = {
        labels: '',
        docNumbers: '',
        dateOfScan: {
          from: '',
          to: '',
        }
      };
      if (angular.isDefined(e.labels)) {
        f.labels = e.labels.valueOf();
      }
      if (angular.isDefined(e.docNumbers)) {
        f.docNumbers = e.docNumbers.valueOf();
      }
      if (angular.isDefined(e.dateOfScan)) {
        if (angular.isDefined(e.dateOfScan.from)) {
          f.dateOfScan.from = e.dateOfScan.from.valueOf();
        }
        if (angular.isDefined(e.dateOfScan.to)) {
          f.dateOfScan.to = e.dateOfScan.to.valueOf();
        }
      }
      return f
    }

    this.push = function(e) {
      if ((this.log.length + 1) > this.max) {
        this.log = this.log.slice(1, this.log.length);
        this.log.push(this.newFilter(e));
        return this;
      } else {
        this.log.push(this.newFilter(e));
        this.pos = new PositionCounter(this.log.length, this.pos.curr + 1);
        this.length = this.log.length;
        return this;
      }
    };

    this.newest = function() {
      return this.newFilter(this.log[this.log.length - 1]);
    };

  };

  return new History();
});
