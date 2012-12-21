$(document).ready(function() {
	resizeDualConvo();
});

function resizeDualConvo() {
	var bodyHeight = $('body').outerHeight(true);
	var headerHeight = $('#header').outerHeight(true);
	var stripHeight = $('#strip').outerHeight(true);
	var convosMargin = $('#convos').outerHeight(true) - $('#convos').innerHeight();
	$('#convos').height(bodyHeight - headerHeight - stripHeight - convosMargin);
}

$(window).resize(function() {
	resizeDualConvo();
});