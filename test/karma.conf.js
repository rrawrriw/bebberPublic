module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'ext/jquery/dist/jquery.min.js',
      'ext/angular/angular.js',
      'ext/angular-mocks/angular-mocks.js',
      'ext/angular-route/angular-route.js',
      'ext/angular-resource/angular-resource.js',
      'ext/angular-ui/ui-bootstrap-tpls-0.13.0.min.js',
      'ext/angular-pdf-viewer/angular-pdf-viewer.min.js',
      'js/*.js',
      'test/unit/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            //'karma-firefox-launcher',
            'karma-jasmine'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
