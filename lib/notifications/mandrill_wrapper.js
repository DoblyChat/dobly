'use strict';

module.exports = (function() {
    var mandrill = require('mandrill-api/mandrill'),
        mandrill_client = new mandrill.Mandrill(process.env.MANDRILL_APIKEY),
        self = {};

    self.send = function(fromName, fromEmail, to, replyToEmail, subject, text, tags) {
        var message = {
            "html": null,
            "text": text,
            "subject": subject,
            "from_email": fromEmail,
            "from_name": fromName,
            "to": to,
            "headers": {
                "Reply-To": replyToEmail
            },
            "important": false,
            "track_opens": null,
            "track_clicks": null,
            "auto_text": null,
            "auto_html": null,
            "inline_css": null,
            "url_strip_qs": null,
            "preserve_recipients": null,
            "bcc_address": null,
            "tracking_domain": null,
            "signing_domain": null,
            "merge": true,
            "global_merge_vars": [],
            "merge_vars": [],
            "tags": tags,
            "google_analytics_domains": [],
            "google_analytics_campaign": null,
            "metadata": null,
            "recipient_metadata": [],
            "attachments": [],
            "images": []
        };
        var async = false;
        var ip_pool = null;
        var send_at = null;
        
        mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
            console.log('Mandrill API called.');
            console.log(result);
        }, function(e) {
            console.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        });
    };

    return self;
})();