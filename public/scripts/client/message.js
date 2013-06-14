function createMessage(data, confirmed) {
  var self = {};

  self.id = ko.observable(data._id);
  self.content = formatContent(data.content);
  self.rawContent = data.content;
  self.timestamp = common.formatTimestamp(data.timestamp);
  self.createdBy = data.createdBy;
  self.simpleTimestamp = common.formatTimestamp(data.timestamp);
  self.confirmedSent = ko.observable(confirmed);

  function formatContent(content){
    var lines = content.split('\n');
    
    for(var i = 0; i < lines.length; i++){
      lines[i] = common.htmlEncode(lines[i]);
    }

    return parseLinks(lines.join('<br />'));
  }

  function parseLinks(content){
    //URLs starting with http://, https://, or ftp://
    var replacePattern1 = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = content.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    var replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    return replacedText;
  }

  return self;
}