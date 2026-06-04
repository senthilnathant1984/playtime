/* 
*   NOTE: This sample uses ES6.
*/
import config from './config.js';

let clientApp = {};

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const analyticsApi = new platformClient.AnalyticsApi();
const routingApi = new platformClient.RoutingApi();

var accessToken = null;
var requestParams = new Object();
var basePath = null;
var environment = null;
var querystring = null;

let socket = null;

/*clientApp.checkForEmbravaConnect = function (querystringarg) {
    querystring = querystringarg;
    var requestParams1 = new Object();
    requestParams1.parameter1_Type = "CheckForECPresence";
    requestParams1.parameter1 = "CheckForECPresence";

    try {
        $.ajax({
            type: "GET",
            data: JSON.stringify(requestParams1),
            url: "http://127.0.0.1:9053",
            dataType: "jsonp",
            success: successCallback1,
            error: errorCallback1
        });
    } catch (e) {
        console.log("Exception:" + e);
    }
};*/

clientApp.checkForEmbravaConnect = function (querystringarg) {
    querystring = querystringarg;
    try
    {
        socket = new WebSocket("ws://localhost:9053/");

        socket.onopen = function()
        {
            console.log("Connected");
        };

        socket.onmessage = function(evt)
        {
            console.log(evt.data);
        };

        socket.onerror = function(evt)
        {
            console.log("WebSocket Error");
            console.log(evt);
        };

        socket.onclose = function(evt)
        {
            console.log("Closed");
            console.log(evt);
        };
    }
    catch(ex)
    {
        console.log(ex);
    }
};

function successCallback1(data) {
    console.log("successCallback1 data:" + data);
};

function errorCallback1(data) {
    console.log("errorCallback1 status:" + data.status);
    console.log("errorCallback1 statusText:" + data.statusText);

    if (data.status == 404) {
        window.location.href = "ec-not-running.html?" + querystring;
    }
};

// Will Authenticate through PureCloud
clientApp.setup = function(pcEnv, langTag, html){
	if(pcEnv){
        localStorage.setItem(config.appName + ":environment", pcEnv);
    }else if(localStorage.getItem(config.appName + ":environment")){
        pcEnv = localStorage.getItem(config.appName + ":environment");
    } else {
        pcEnv = config.defaultPcEnvironment;
    }

    if(langTag){
        localStorage.setItem(config.appName + ":langTag", langTag);
    }else if(localStorage.getItem(config.appName + ":langTag")){
        langTag = localStorage.getItem(config.appName + ":langTag");
    } else {
        langTag =  config.defaultLanguage;
    }
	
    let clientId = config.clientID;
    clientApp.langTag = langTag;
	  clientApp.pcEnv = pcEnv;

    // Authenticate via PureCloud
	  client.setPersistSettings(true, config.appName);
    client.setEnvironment(pcEnv);
	
    client.loginImplicitGrant(clientId, config.basePath + html, config.appName)
    .then(data => {
        console.log(data);
        
        if (data != null) {
            accessToken = data.accessToken;
			basePath = client.basePath;
			environment = client.environment;
			
			sendAccessTokenAsHeartBeat();
			// Send the accessToken every 24 hours if the application is running beyond 24 hours continuously
			var appActiveSignalInterval = setInterval(sendAccessTokenAsHeartBeat, 86400000);

      setInterval(sendHeartBeat, 5000);
		}
        // Get Details of current User and save to Client App
        return usersApi.getUsersMe();
    }).then( userMe => {
        clientApp.userId = userMe.id;

        // Create a Notifications Channel
        return notificationsApi.postNotificationsChannels();
    }).then(
        data => console.log("Succesfully set-up Client App.")
    )

    // Error Handling
    .catch(e => console.log(e));
};

// Handler for every Websocket message
clientApp.onSocketMessage = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    console.log(topic);
    console.log(eventBody);    
};

window.onbeforeunload = function () {		
    
    return;
}; 

window.onunload = function () {
    
    return;
};
	
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
};

function sendAccessTokenAsHeartBeat() {
    console.log("Access Token:" + accessToken);

    if (accessToken != null) {
        requestParams.parameter1_Type = "AccessToken";
        requestParams.parameter1 = accessToken;
		
		requestParams.parameter2_Type = "ApiBaseUrl";
        requestParams.parameter2 = basePath;
		
		requestParams.parameter3_Type = "Environment";
        requestParams.parameter3 = environment;
		
        $.ajax({
            type: "GET",
            data: JSON.stringify(requestParams),
            url: "http://127.0.0.1:9052",
            dataType: "jsonp"
        });
    }
};

function sendHeartBeat() {
    console.log("Sending HeartBeat");

    if (accessToken != null) {
        requestParams.parameter1_Type = "HeartBeat";
        requestParams.parameter1 = "HeartBeat";
		
        $.ajax({
            type: "GET",
            data: JSON.stringify(requestParams),
            url: "http://127.0.0.1:9052",
            dataType: "jsonp"
        });
    }
};

export default clientApp
