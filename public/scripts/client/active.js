var socket = io.connect(window.location.origin, {
	'sync disconnect on unload': true
});

(function(global){
	global.app = {};
})(window);

$(document).ready(function() {
	app.user = JSON.parse($('#currentUser').val());
	app.inFocus = true;

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#conversations').val());
	var groupData = JSON.parse($('#group').val());
	
	var viewModel = createViewModel(conversationData, desktopData, groupData);

	ko.applyBindings(viewModel);

	app.desktop = viewModel.desktop;

	setupDesktopUI();
	$('body').show();
});

function setupDesktopUI(){
	app.desktop.resize.dualConvo();
	app.desktop.resize.strip();
	app.desktop.setupStripDragAndDrop();
}

$(window).load(function() {
	app.desktop.resize.convoBody();
	app.desktop.scroll.setup();
});

$(window).resize(function() {
	app.desktop.resize.dualConvo();
	app.desktop.resize.convoBody();
});

$(window).focus(function() {
	app.inFocus = true;
});

$(window).blur(function() {
	app.inFocus = false;
});
