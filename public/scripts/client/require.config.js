requirejs.config({
    baseUrl: "/scripts",
    
    paths: {
        "jquery": "lib/jquery.min",
        "jquery-ui": "lib/jquery-ui.min",
        "nanoscroller": "lib/jquery.nanoscroller.min",
        "hoverIntent": "lib/jquery.hoverIntent.min",
        "placeholder": "lib/jquery.placeholder.min",
        "highlight": "lib/jquery.highlight.min",
        "chosen": "lib/chosen.jquery.min",
        "knockout": "lib/knockout-2.3.0.min",
        "date": "lib/date",
        "socket-io": "/socket.io/socket.io"
    },

    shim: {
        "jquery-ui": ['jquery'],
        "nanoscroller": ['jquery'],
        "hoverIntent": ['jquery'],
        "placeholder": ['jquery'],
        "highlight": ['jquery'],
        "modernizr": {
            exports: 'Modernizr'
        }
    }
});

if(window.app && app.PRODUCTION_MODE){
    requirejs(["release/main"], function(){
        require(['client/main']);
    });
}else{
    requirejs(["client/main"]);
}
