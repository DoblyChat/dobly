requirejs.config({
    baseUrl: '/scripts',
    
    paths: {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min',
        'jquery-ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min',
        'placeholder': 'lib/jquery.placeholder.min',
        'date': 'lib/date',
        'common': 'client/common'
    },

    shim: {
        'placeholder': ['jquery'],
        'common': ['date']
    }
});

require(['jquery', 'common', 'placeholder'], function($, common){
	$(document).ready(function(){
	  	common.focus("#email");
	  	$('input, textarea').placeholder();
	});
});


