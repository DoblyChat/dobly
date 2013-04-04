var common = (function(){
	var self = {};

  self.enterKeyPressed = function(event) {
	  var keyCode = (event.which ? event.which : event.keyCode);
	  return keyCode === 13;
	};

	self.focus = function(selector) {		
		if (!browser.isSafari() && !browser.isIE()){ 
      $(selector).focus();
		}
	};

  self.delayedFocus = function(selector, delay, hook){
    setTimeout(function () { 
      common.focus(selector);
      if(hook) hook();
    }, delay ? delay : 400);
  };

  self.formatTimestamp = function(timestamp){
    return formatTimestamp(timestamp, "h:mm tt", "M/d h:mm tt")
  };

  self.formatSimpleTimestamp = function(timestamp){
    return formatTimestamp(timestamp, "h:mm tt", "M/d");
  }

  function formatTimestamp(timestampString, todayFormat, otherFormat) {
    var timestamp = new Date(timestampString);
    var datestamp = new Date(timestampString).clearTime();

    if (datestamp.equals(Date.today())) {
      return timestamp.toString(todayFormat);
    } else {
      return timestamp.toString(otherFormat);
    }
  }

  return self;
})();

var browser = {
  getUserAgent : function() {
    return navigator.userAgent.toLowerCase();
  },

  isSafari : function() {
    return browser.getUserAgent().indexOf('safari') > -1 && browser.getUserAgent().indexOf('chrome') <= -1;
  },

  isIE : function() {
    return browser.getUserAgent().indexOf('msie') > -1;
  },
};