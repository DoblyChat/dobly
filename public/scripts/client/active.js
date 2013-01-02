var socket = io.connect(window.location.origin);
var resize;

$(document).ready(function() {

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#data').val());
	
	var viewModel = createViewModel(conversationData, desktopData);

	ko.applyBindings(viewModel);

	resize = viewModel.desktop.resize;
	resize.dualConvo();
	resize.strip();
	//viewModel.adjustScrolling();
	//viewModel.desktop.setupSorting();
});

$(window).load(function() {
	resize.convoBody();
})

$(window).resize(function() {
	resize.dualConvo();
	resize.convoBody();
});

window.onbeforeunload = function() { 
	socket.emit('remove_active_user'); 
};