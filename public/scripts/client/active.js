var socket = io.connect(window.location.origin, {
	'sync disconnect on unload': true
});

(function(global){
	global.app = {};
})(window);

$(document).ready(function() {

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#conversations').val());
	
	var viewModel = createViewModel(conversationData, desktopData);

	ko.applyBindings(viewModel);

	app.desktop = viewModel.desktop;
	app.desktop.resize.dualConvo();
	app.desktop.resize.strip();
	app.desktop.setupStripDragAndDrop();

	app.user = JSON.parse($('#currentUser').val());
});

$(window).load(function() {
	app.desktop.resize.convoBody();
	app.desktop.scroll.setup();
});

$(window).resize(function() {
	app.desktop.resize.dualConvo();
	app.desktop.resize.convoBody();
});
