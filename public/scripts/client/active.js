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

$(window).load(function() {
	resizeConvoBody();
})

function resizeDualConvo() {
	var includeMargin = true;
	var bodyHeight = $('body').outerHeight(includeMargin);
	var headerHeight = $('#header').outerHeight(includeMargin);
	var stripHeight = $('#strip').outerHeight(includeMargin);
	var convosMargin = $('#convos').outerHeight(includeMargin) - $('#convos').innerHeight();

	$('#convos').height(bodyHeight - headerHeight - stripHeight - convosMargin);
}

function resizeConvoBody() {
	var titleHeight = $('.convo-header').outerHeight();
	var newMessageHeight = $('.convo-new-message').outerHeight();
	var convoHeight = $('#convos').innerHeight();

	$('.convo-body').height(convoHeight - titleHeight - newMessageHeight);
}

$(window).resize(function() {
	resizeDualConvo();
	resizeConvoBody();
});

window.onbeforeunload = function() { 
	socket.emit('remove_active_user'); 
};