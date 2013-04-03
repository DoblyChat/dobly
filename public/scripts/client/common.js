var common = {
	enterKeyPressed : function(event) {
	  var keyCode = (event.which ? event.which : event.keyCode);
	  return keyCode === 13;
	},

	focus : function(selector) {		
		if (!browser.isSafari() && !browser.isIE()){ 
      $(selector).focus();
		}
	},

  delayedFocus: function(selector, delay, hook){
    setTimeout(function () { 
      common.focus(selector);
      if(hook) hook();
    }, delay ? delay : 400);
  },
};

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