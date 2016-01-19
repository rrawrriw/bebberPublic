'use strict';

describe('VirtualDir service', function() {
  beforeEach(module('docMa'));

  var virtualDir;

  beforeEach(inject(function($injector) {
    virtualDir = $injector.get('virtualDir');
  }));

  it('should create a new directory list', function() {
    var test = virtualDir.mkdir('test');
    expect(test).toEqual([]);
  });

  it('should create a new directory with content', function() {
    var init = [1, 2];
    var test = virtualDir.mkdir('test', init);
    expect(test).toEqual(init);
  });

  it('should throw error if direcotry already exists', function() {
    virtualDir.mkdir('test');
    expect(function() {
      virtualDir.mkdir('test')
    }).toThrowError('test already exists');
  });

  it('should read directory', function() {
    virtualDir.mkdir('test', [1, 2]);
    expect(virtualDir.readDir('test')).toEqual([1, 2]);
  });

  it('should update directory', function() {
    virtualDir.mkdir('test', [1, 2]);
    virtualDir.update('test', [3, 4]);
    expect(virtualDir.readDir('test')).toEqual([3, 4]);
  });
});
