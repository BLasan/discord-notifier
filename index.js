const WebSocket = require("ws");
const fetch = import('node-fetch');
const ENV = require("./config.json");
const funcs = require("./functions.js");

const baseUrl = "wss://gateway.discord.gg";
const debug = ENV.DEBUG ? ENV.DEBUG : false;

let url = baseUrl, sessionId = "";
let taskInterval = 0;;
let ws;
let interval = 0, seq = -1;
let heartBeatTask;

let payload = {
    op : 2,
    d : {
        token : ENV.GW_TOKEN,
        //   intents : 33280,
         intents : 513,
         properties : {
            os : "mac",
            browser : "chrome",
            device : "chrome"
         }
    }

}

const heartbeat = (ms) => {
    return setInterval(() => {
        ws.send(JSON.stringify({op : 1, d : null}))
    }, ms);
};

const resume = () => {
    const resumePayload = {
        op: 6,
        d: {
            token: ENV.GW_TOKEN,
            sessionId,
            seq
        }
        
    }
    ws.send(JSON.stringify(resumePayload));
};

const   initWebsocket = () => {
    let wasReady = false;
    if (ws && (ws.readystate !== 3 || ws.readystate !== 2)) {
        console.log("Closing WS connection before reconnecting.");
        ws.close();
    }

    console.log("Connecting to Discord gateway...");
    ws = new WebSocket(url + "/?v=10&encoding=json");

    ws.on("open", function open(){
        console.log("Discord gateway connection opened.");
    });

    ws.on("error", function error(e) {
        console.log(e);
    });

    ws.on("close", function close() {
        if(wasReady){
            console.log("Gateway connection closed, trying to reconenct.");
            url = baseUrl;
            setTimeout(() => {
                initWebsocket();
            }, 2500)
        } else {
            console.log("Gateway connection cloded.")
        }
        
    });

    ws.on("message", function incoming (data) {
        let p = JSON.parse(data);
        const {t,op, d, s} = p;
        if (debug) {
            console.log('opcode: ' + op + ' event: ' + t);
        }
        switch (op) {
            case 10:
                const { heartbeat_interval } = d;
                interval = heartbeat_interval;
                wasReady = true;

                if (url === baseUrl) {
                    ws.send(JSON.stringify(payload))
                }
                if (heartBeatTask) {
                    clearInterval(heartBeatTask);
                }
                heartBeatTask = heartbeat(interval);
                break;
            case 0:
                seq = s;
                break;
            case 7:
                console.log("Discord gateway connection require a resume.");
                url = baseUrl;
                ws.close();
                break;
            case 9:
                console.log("Discord gateway connection require a new identify.")
                url = baseUrl;
                ws.close();
                break;
        }

        switch (t) {
            case "READY":
                console.log("Discord gateway connection is ready!");
                url = d.resume_gateway_url;
                sessionId = d.sesson_id;
                if (taskInterval == 0) {
                    task = setInterval(funcs.sendAlerts, ENV.ALERT_INTERVAL_MINS*60*1000);
                }
                break;
            case "RESUMED":
                console.log("Discord gateway conenction resumed!");
                break;
            case "MESSAGE_CREATE":
                funcs.handleMessageCreateEvent(d);    
                //funcs.sendAlerts();
                break;
            case "THREAD_DELETE":
                funcs.handleMessageDeleteEvent(d);
                break;
        }
    })
}

console.log("Starting Discord integration.");
initWebsocket();