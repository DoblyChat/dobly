requirejs.config({
    baseUrl: '/scripts',
    
    paths: {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min',
        'placeholder': 'lib/jquery.placeholder.min',
    },

    shim: {
        'placeholder': ['jquery']
    }
});

require(['jquery', 'placeholder'], function($) {
    $(document).ready(function() {
        $('input').placeholder();
    });
});
