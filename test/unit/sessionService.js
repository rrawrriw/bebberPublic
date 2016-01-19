'use strict';

describe('Session service', function() {
  beforeEach(module('docMa'));

  var session;

  beforeEach(inject(function($injector) {
    session = $injector.get('session');
  }));

  it('should store a session', function() {
    var d = new Date();
    session.new('123', '1', d);
    expect(session.token).toBe('123');
    expect(session.userID).toBe('1');
    expect(session.expires).toBe(d)
  });

  it('should return false if session not expired', function() {
    var future = new Date();
    future.setDate(future.getDate() + 1);

    session.new('123', '1', future);
    expect(session.isExpired()).toBe(false);
  });

  it('should return true if session expired', function() {
    var past = new Date();
    past.setDate(past.getDate() - 1);

    session.new('123', '1', past);
    expect(session.isExpired()).toBe(true);
  });

});
