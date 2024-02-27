# discord-notifier
This will listen to Discord WS Gateway events and notify on new message events from a Discord Forum channel. This does not support the general text channel type.

## Configurations
A config.json and token.json file with the following elements should be added to the working directory(mount as a secret config in /usr/src/app/ within Choreo).
### config.json
```json
{
    "GW_TOKEN":"<DIscord BOT token>",
    "CHANNEL_ID":"<Discord chanel ID>",
    "ALERT1_MINS": 360,
    "ALERT2_MINS": 960,
    "ALERT3_MINS": 1200,
    "ALERT_INTERVAL_MINS": 15, 
    "ALERT_CHAT_WEBHOOK" : "<Alert chat webhook URL",
    "ESCALATION_CHAT_WEBHOOK" : "<Escalation chat webhook url>",
    "MAIL_RECEIVER":"<Escalation mail recever's mail address>"
}
```
### General configurations
1. ALERT1_MINS - Number of minutes the app should wait to send the first notification.
2. ALERT2_MINS - Number of minutes the app should wait to send the second notification.
3. ALERT3_MINS - Number of minutes the app should wait to send the third notification.
4. ALERT_INTERVAL_MINS - In order to send alerts, app is checking the pending messages periodically. Define this time in minutes. Make sure it is less than the ALERT1_MINS. Each alert may be delayed by the number of minutes specify here (Worse case).
5. DEBUG - This is an optional config with default value false. Set to true to enable debug.

### Discord configurations
1. Get the desired Discord Forum's channel id and specify the CHANNEL_ID config.
2. Create a Discord chat bot and add to the server you wish to receive messages. Make sure to provide Message Create, Manage Threads and Read Message History bot permissions.
3. Generate a bot token and specify as the GW_TOKEN config.

### Google configs
1. ALERT_CHAT_WEBHOOK - The webhook url of the chat group that intended to receive first level alerts.
2. MAIL_RECEIVER - Email address of the receiver of second level alerts.
3. ESCALATION_CHAT_WEBHOOK - The webhook url of the chat group that intended to receive third level escalations.
4. MAIL_SUBJECT - This is an optional config to specify the Subject of the alert mail. Default value is "Discord message response SLA violation!"

### token.json
```json
{
    "type": "authorized_user",
    "client_id": "<Client id>",
    "client_secret": "<Client secret>",
    "refresh_token": "<Refresh token>"
}
```
### Obtaining gmail access tokens
We need to configure a mail account to send emails. This accont will be the sender.

1. Login to google as the designated user.
2. Visit Google API Console, click Create Project, and follow the wizard to create a new project.
3. Go to Credentials -> OAuth Consent Screen, enter a product name to be shown to users, and click Save.
4. On the Credentials tab, click Create Credentials and select OAuth Client ID.
5. Select an application type, enter a name for the application, and specify a redirect URI - https://developers.google.com/oauthplayground
6. Click Create. Your Client ID and Client Secret will appear. 
7. In a separate browser window or tab, visit OAuth 2.0 Playground(https://developers.google.com/oauthplayground). Click on the OAuth 2.0 Configuration icon in the top right corner and click on Use your own OAuth credentials and provide your OAuth Client ID and OAuth Client Secret.
8. Select the required Gmail API scopes from the list of API's, and then click Authorize APIs. 
9. When you receive your authorization code, click Exchange authorization code for tokens to obtain the refresh token and access token.
10. Now you should have all the required tokens for the token.json file.
11. Also enable the Gmail API in your cloud console - https://console.cloud.google.com/apis/api/gmail.googleapis.com
