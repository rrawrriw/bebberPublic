'use strict';

describe('Filter history', function() {
  beforeEach(module('docMa'));

  var filterHistory;

  beforeEach(inject(function($injector) {
    filterHistory = $injector.get('filterHistory');
  }));

  it('should setup filter history', function() {
    var fh = filterHistory.setup([{}]);
    expect(fh.length).toBe(1);
  });

  it('should return newest filter', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f2 = {
      labels: 'l2',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    }

    var fh = filterHistory.setup([f1, f2]);
    expect(fh.newest()).toEqual(f2);
  });

  it('should return next filter one in list', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };

    var fh = filterHistory.setup([f1]);
    expect(fh.next()).toEqual(f1);
    expect(fh.next()).toEqual(f1);
    expect(fh.next()).toEqual(f1);
  });

  it('should return next filter', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f2 = {
      labels: 'l2',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f3 = {
      labels: 'l3',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };

    var fh = filterHistory.setup([f1, f2, f3]);
    expect(fh.newest()).toEqual(f3);
    expect(fh.next()).toEqual(f1);
    expect(fh.next()).toEqual(f2);
    expect(fh.next()).toEqual(f3);
    expect(fh.next()).toEqual(f1);
  });

  it('should return next and last after push', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f2 = {
      labels: 'l2',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f3 = {
      labels: 'l3',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var fh = filterHistory.setup([f1]);
    fh.push(f2);
    expect(fh.next()).toEqual(f1);
    expect(fh.next()).toEqual(f2);
    fh.push(f3);
    expect(fh.next()).toEqual(f1);
    expect(fh.last()).toEqual(f3);
  });

  it('should return last filter', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f2 = {
      labels: 'l2',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f3 = {
      labels: 'l3',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };

    var fh = filterHistory.setup([f1, f2, f3]);
    expect(fh.newest()).toEqual(f3);
    expect(fh.last()).toEqual(f2);
    expect(fh.last()).toEqual(f1);
    expect(fh.last()).toEqual(f3);
  });

  it('should add new filter', function() {
    var f1 = {
      labels: 'l1',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };
    var f2 = {
      labels: 'l2',
      docNumbers: '',
      dateOfScan: {
        from: '',
        to: ''
      }
    };

    var fh = filterHistory.setup([f1]);
    expect(fh.newest()).toEqual(f1);
    fh.push(f2);
    expect(fh.newest()).toEqual(f2);
  });

});
