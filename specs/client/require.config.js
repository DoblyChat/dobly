requirejs.config({
    baseUrl: 'public/scripts',
    
    paths: {
        "jquery": "lib/jquery.min",
        "jquery-ui": "lib/jquery-ui.min",
        "nanoscroller": "lib/jquery.nanoscroller.min",
        "hoverIntent": "lib/jquery.hoverIntent.min",
        "placeholder": "lib/jquery.placeholder.min",
        "highlight": "lib/jquery.highlight.min",
        "chosen": "lib/chosen.jquery.min",
        "knockout": "lib/knockout-2.3.0.min",
        'date': 'lib/date',
        'squire': '/specs/client/lib/Squire'
    },

    shim: {
        'jquery-ui': ['jquery'],
        'nanoscroller': ['jquery'],
        'hoverIntent': ['jquery'],
        'placeholder': ['jquery'],
        'highlight': ['jquery'],
        'chosen': ['jquery'],
        'modernizr': {
            exports: 'Modernizr'
        }
    }
});