requirejs.config({
    baseUrl: '//localhost:3000/scripts',
    
    paths: {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min',
        'jquery-ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min',
        'nanoscroller': 'lib/jquery.nanoscroller.min',
        'hoverIntent': 'lib/jquery.hoverIntent.min',
        'placeholder': 'lib/jquery.placeholder.min',
        'highlight': 'lib/jquery.highlight.min',
        'chosen': 'lib/chosen.jquery.min',
        'knockout': '//ajax.aspnetcdn.com/ajax/knockout/knockout-2.2.0',
        'modernizr': '//modernizr.com/downloads/modernizr-latest',
        'date': 'lib/date',
        'jasmine': '/lib/jasmine-1.3.1/jasmine',
        'jasmine-html': '/lib/jasmine-1.3.1/jasmine-html',
        'jasmine-jquery': '/lib/jasmine-jquery',
        'globalVars': '/globalVars'
    },

    shim: {
        'jquery-ui': ['jquery'],
        'nanoscroller': ['jquery'],
        'hoverIntent': ['jquery'],
        'placeholder': ['jquery'],
        'highlight': ['jquery'],
        'modernizr': {
            exports: 'Modernizr'
        },
        'jasmine': {
            exports: 'jasmine'
        },
        'jasmine-html': {
            exports: 'jasmine',
            deps: ['jasmine']
        },
        'jasmine-jquery': ['jasmine-html'],
        'globalVars': ['jasmine-html']
    }
});

require(['jquery', 'jasmine-html', 'globalVars', 'jasmine-jquery'], function($, jasmine, globalVars){
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmine.getFixtures().fixturesPath = 'fixtures';

    jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
    };

    var currentWindowOnload = window.onload;

    var specs = [
        'spec/common.spec.js',
        'spec/message.spec.js',
        'spec/navigation.spec.js',
        'spec/changeTopic.spec.js',
        'spec/group.spec.js',
        'spec/timeout.spec.js',
        'spec/allConversations.spec.js',
        'spec/conversation.spec.js',
        'spec/desktop.spec.js',
        'spec/newConversation.spec.js',
        'spec/conversation.search.spec.js'
    ];

    $.extend(window, globalVars);
    execJasmine();

    function execJasmine() {
      require(specs, function(){
        jasmineEnv.execute();
      });
    }
  });