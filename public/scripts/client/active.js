var socket = io.connect(window.location.origin);

$(document).ready(function() {
	resizeDualConvo();

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#data').val());
	
	var viewModel = createViewModel(conversationData, desktopData);

	ko.applyBindings(viewModel);

	//viewModel.adjustScrolling();
	//viewModel.desktop.setupSorting();
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

window.onbeforeunload = function() { 
	socket.emit('remove_active_user'); 
};