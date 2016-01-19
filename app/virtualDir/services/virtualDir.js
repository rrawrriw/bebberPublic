var m = angular.module('virtualDir.services.virtualDir', []);

var VirtualDir = function() {
  var dirs = {};

  this.mkdir = function(name, initList) {

    if (angular.isArray(dirs[name])) {
      throw new Error(name + ' already exists');
    }

    dirs[name] = [];

    if (angular.isDefined(initList)) {
      for (var x = 0; x < initList.length; x++) {
        dirs[name].push(initList[x]);
      }
    }

    return dirs[name];
  }

  this.readDir = function(name) {
    if (!angular.isDefined(dirs[name])) {
      throw new Error(name + ' does not exists');
    }

    return dirs[name]
  }

  this.update = function(name, data) {
    dirs[name] = [];

    for (var x = 0; x < data.length; x++) {
      dirs[name].push(data[x]);
    }

    return dirs[name];
  }
};

m.factory('virtualDir', [function() {
  return new VirtualDir();
}
]);
