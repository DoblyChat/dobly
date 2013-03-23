function createMessage(data, confirmed) {
  var self = {};

  self.lines = formatContent(data.content);
  self.timestamp = formatTimestamp(data.timestamp, "h:mm tt", "M/d h:mm tt");
  self.createdBy = data.createdBy;
  self.simpleTimestamp = formatTimestamp(data.timestamp, "h:mm tt", "M/d");
  self.confirmedSent = ko.observable(confirmed);

  function formatContent(content){
    return content.split('\n');
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
}