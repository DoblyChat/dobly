define(function(){
	var elements = document.getElementsByClassName('top-links');

	if(elements.length > 0){
		var links = [], topLinks = elements[0].childNodes, link;

		for(var i = 0; i < topLinks.length; i++){
			link = topLinks.item(i);

			if(link.tagName.toLowerCase() === 'a' && link.hash){
				links.push(link)
			}
		}

		function hashChange(){
			var hash = window.location.hash;
			
			links.forEach(function(link){
				if(link.hash === hash){
					link.className = 'active';
				}else{
					link.className = '';
				}
			});
		}

		window.addEventListener("hashchange", hashChange, false);

		hashChange();
	}
});