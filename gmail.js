// const fs = require('fs').promises;
// const path = require('path');
// const MailComposer = require('nodemailer/lib/mail-composer');
// const { error } = require('console');
// const { google } = require("googleapis");
// const ENV = require("./config.json");

// const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// // The file token.json stores the user's access and refresh tokens.
// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
// const mailReceiver = ENV.MAIL_RECEIVER;
// const mailSubject = ENV.MAIL_SUBJECT ? ENV.MAIL_SUBJECT : 'Discord message response SLA violation!';
// const discordWebUrl = 'https://discord.com/channels';
// const debug = ENV.DEBUG ? ENV.DEBUG : false;

// function sendMail(msg) {
//     startSend(msg).catch(error => console.error(error));
// }

// async function startSend(msg) {
//     if (debug) {
//       console.debug("Sending email for message: " + msg.id 
//         + " to receiver: " + mailReceiver
//         + " with subject: " + mailSubject);
//     }
//     const options = {
//         to: mailReceiver,
//         // cc: 'cc1@example.com, cc2@example.com',
//         subject: mailSubject,
//         text: prepareBody(msg),
//         html: prepareBody(msg),
//         textEncoding: 'base64',
//       };

//       const createMail = async (options) => {
//         const mailComposer = new MailComposer(options);
//         const message = await mailComposer.compile().build();
//         return encodeMessage(message);
//       };

//       let auth = await authorize();
//       let rawMessage = await createMail(options);
      
//       const gmail = google.gmail({version: 'v1', auth});
//       const { data: { id } = {} } = await gmail.users.messages.send({
//       userId: 'me',
//       resource: {
//         raw: rawMessage,
//       },
//     });
//     if (debug) {
//         console.debug('Email sent successfully: ', id);
//     }
// }

// const encodeMessage = (message) => {
//     return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
//   };

// const prepareBody = (msg) => {
//     delay = Math.floor(msg.delay/60/60/1000);
//     return '<p>New Discord message from user: ' + msg.author + ', has not been answered for: ' + delay 
//         + ' hours.'+ '<br>'
//         + 'Link: ' + discordWebUrl + '/' + msg.guild_id + '/' + ENV.CHANNEL_ID + '/threads/' + msg.id + '<br><br><br>'
//         + '<small>This is an auto generated email from the Discord notifier bot by Choreo PMM team.</small></p>';
// }

// /**
//  * Reads previously authorized credentials from the save file.
//  *
//  * @return {Promise<OAuth2Client|null>}
//  */
// async function loadSavedCredentialsIfExist() {
//     try {
//       const content = await fs.readFile(TOKEN_PATH);
//       const credentials = JSON.parse(content);
//       return google.auth.fromJSON(credentials);
//     } catch (err) {
//       return null;
//     }
//   }
  
// /**
//  * Load or request or authorization to call APIs.
//  *
//  */
// async function authorize() {
//     let client = await loadSavedCredentialsIfExist();
//     if (client) {
//         return client;
//     }
//     throw error('No credentials found. Please add token.json file.');
// }
  
// module.exports = {
//     sendMail
// };
  