const { google } = require("googleapis");
const ENV = require("./config.json");
const email = require("./gmail.js");
const { Console } = require("console");

// Alert time levels in minutes. 
let l0 = ENV.ALERT1_MINS;
let l1 = ENV.ALERT2_MINS;
let l2 = ENV.ALERT3_MINS;
const alertWebhook = ENV.ALERT_CHAT_WEBHOOK;
const escalationWebhook = ENV.ESCALATION_CHAT_WEBHOOK;
const discordWebUrl = 'https://discord.com/channels';
const debug = ENV.DEBUG ? ENV.DEBUG : false;

const noReplyMapAPIM = new Map();
const noReplyMapAPK = new Map();

async function handleMessageCreateEvent(message){
    const { author, id, channel_id, timestamp } = message;
    //console.debug(message);
    if (debug) {
        console.debug("Received message: " + id + " from user: " + author.username);
    }
    
    let {parent_id, guild_id, name} = await getChannelInfo(channel_id);

    if (id == channel_id) {
        if (debug) {
            console.debug("Channel: " + channel_id + " is a thread of parent channel: " 
            + parent_id + " in guild: " + guild_id);
        }
        // this check is required to filter the events from the channel of interest
        if (parent_id == ENV.CHANNEL_ID.APIM) {
            noReplyMapAPIM.set(id, {timestamp: timestamp, author: author.username, level: 0, id: id, 
            guild_id: guild_id, channelType: 'APIM', title: name});
            sendChatAlert(noReplyMapAPIM.get(id), alertWebhook);
        }

        if(parent_id == ENV.CHANNEL_ID.APK){
            noReplyMapAPK.set(id, {timestamp: timestamp, author: author.username, level: 0, id: id, 
                guild_id: guild_id, channelType: 'APK', title: name});
            sendChatAlert(noReplyMapAPK.get(id), alertWebhook);  
        }
        //sendChatAlert(noReplyMapAPIM.get(id), alertWebhook);
    } else {
        if(parent_id == ENV.CHANNEL_ID.APIM){
            if (debug) {
                console.debug("Removing message: " + id + " from noReplyMapAPIM");
            }
            noReplyMapAPIM.delete(channel_id);
        } else if(parent_id == ENV.CHANNEL_ID.APK){
            if (debug) {
                console.debug("Removing message: " + id + " from noReplyMapAPK");
            }
            noReplyMapAPK.delete(channel_id);
        }
    }
}

function handleMessageDeleteEvent(message){
    const { author, id, channel_id, timestamp, parent_id } = message;
    if (debug) {
        //console.debug(JSON.stringify(message));
        console.debug("Received Thread delete event for channel ID: " + id);
    }
    if (parent_id == ENV.CHANNEL_ID.APIM) {
        if (debug) {
            console.debug("Deleting message: " + id + " from APIM Channel");
        }
        noReplyMapAPIM.delete(id);
    } else if (parent_id == ENV.CHANNEL_ID.APK) {
        if (debug) {
            console.debug("Deleting message: " + id + " from APK Channel");
        }
        noReplyMapAPK.delete(id);
    }
}

function getChannelInfo(channel_id) {
    const https = require("https");
    let result;
    const options = {
    hostname: 'discord.com',
    // port: 443,
    path: '/api/channels/'+ channel_id,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bot ' + ENV.GW_TOKEN
    }
    }

    return new Promise ((resolve, reject) => https
    .get('https://discord.com/api/channels/' + channel_id, options, res => {
        let body = "";
        res.on("data", (chunk) => {
            body += chunk;
        });
        res.on("end", () => {
            //console.debug("Received response: " + JSON.stringify(body));
            resolve(JSON.parse(body));
        });
    })
    .on("error", err => {
        console.log("Error: " + err.message);
        reject(err)
    }));

}

function sendAlerts(){
    if (debug) {
        console.debug("Sending periodic alerts.");
    }
    let now = new Date();

    // Iterate over APIM channel messages
    for (const [key, msg] of noReplyMapAPIM.entries()) {
        const timestamp = new Date(msg.timestamp);
        let delay = now.getTime() - timestamp.getTime();
        if ((delay >= l2*60*1000) && msg.level == 2) {
            if (debug) {
                console.debug("Sending escalation alert for message: " + msg.id);
            }
            msg.delay = delay;
            sendChatAlert(msg, escalationWebhook);
            // We no longer need to send alerts for this msg
            noReplyMapAPIM.delete(key);
        } else if ((delay >= l1*60*1000) && msg.level == 1) {
            if (debug) {
                console.debug("Sending Email alert for message: " + msg.id);
            }
            msg.delay = delay;
            sendChatAlert(msg, alertWebhook);
            msg.level = 2;
            noReplyMapAPIM.set(key,msg);
        } else if ((delay >= l0*60*1000) && msg.level == 0) {
            msg.delay = delay;
            if (debug) {
                console.debug("Sending chat alert for message: " + msg.id);
            }
            sendChatAlert(msg, alertWebhook);
            msg.level = 1;
            noReplyMapAPIM.set(key,msg);
        }
    }

    // Iterate over APK channel messages
    for (const [key, msg] of noReplyMapAPK.entries()) {
        const timestamp = new Date(msg.timestamp);
        let delay = now.getTime() - timestamp.getTime();
        if ((delay >= l2*60*1000) && msg.level == 2) {
            if (debug) {
                console.debug("Sending escalation alert for message: " + msg.id);
            }
            msg.delay = delay;
            sendChatAlert(msg, escalationWebhook);
            // We no longer need to send alerts for this msg
            noReplyMapAPK.delete(key);
        } else if ((delay >= l1*60*1000) && msg.level == 1) {
            if (debug) {
                console.debug("Sending Email alert for message: " + msg.id);
            }
            msg.delay = delay;
            sendChatAlert(msg, alertWebhook);
            msg.level = 2;
            noReplyMapAPK.set(key,msg);
        } else if ((delay >= l0*60*1000) && msg.level == 0) {
            msg.delay = delay;
            if (debug) {
                console.debug("Sending chat alert for message: " + msg.id);
            }
            sendChatAlert(msg, alertWebhook);
            msg.level = 1;
            noReplyMapAPK.set(key,msg);
        }
    }

}

const getChatMessage = (msg) => {
    //console.debug(msg);
    let channelId = ENV.CHANNEL_ID.APIM;
    let message;
    // If the message is from APK channel
    if(msg.channelType && msg.channelType==='APK'){
        channelId = ENV.CHANNEL_ID.APK;
    }
    let date = new Date(msg.timestamp);
    //console.log(date);
    let dateStr = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    let timeStr = new Date(msg.timestamp).toLocaleString("en-US", {timeZone: 'Asia/Kolkata'});
    timeStr = timeStr.replace(" ","").split(',')[1];
    //let timeStr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    let msgTitle = msg.title;
    if(msg.title && msg.title.length>500){
       msgTitle = msg.title.substring(0,500) + '...'; 
    }
    if(msg.delay==undefined){
        message = msgTitle + '\n' + 'Created on ' + dateStr + ' at ' + timeStr + ' by ' +
                  msg.author + '.\n' +
                  'Channel : ' + msg.channelType + '\n' +
                  discordWebUrl + '/' + msg.guild_id + '/' + channelId + '/threads/' + msg.id;
        //return 'New ' + msg.channelType + ' Discord message from user: ' + msg.author + ', has been received. '+'Link: ' + discordWebUrl + '/' + msg.guild_id + '/' + channelId + '/threads/' + msg.id;        
    } else {
        message = msgTitle + '\n' +
                  'Thread created by ' + msg.author +  
                  ' has not been answered for: ' + Math.floor(msg.delay/60/60/1000) + ' hours.\n' +
                  'Channel : ' + msg.channelType + '\n' +
                  discordWebUrl + '/' + msg.guild_id + '/' + channelId + '/threads/' + msg.id;
    }
    return message;
    //return 'New ' + msg.channelType + ' Discord message from user: ' + msg.author + ', has not been answered for: ' + Math.floor(msg.delay/60/60/1000) + 
        //' hours.\n'+ 'Link: ' + discordWebUrl + '/' + msg.guild_id + '/' + channelId + '/threads/' + msg.id;
}

const sendChatAlert = (msg, webhookURL) => {
    const data = JSON.stringify({
        'text': getChatMessage(msg),
      });
      let resp;
      fetch(webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: data,
      }).then((response) => {
        resp = response;
      });
      return resp;
}

module.exports = { 
    handleMessageCreateEvent,
    handleMessageDeleteEvent,
    sendAlerts
};