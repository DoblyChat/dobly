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
        'jasmine-jquery': '/lib/jasmine-jquery'
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
        'jasmine-html': ['jasmine'],
        'jasmine-jquery': ['jasmine-html']
    }
});