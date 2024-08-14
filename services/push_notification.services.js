const appId = process.env.ONE_SIGNAL_APP_ID;
const ApiKey = process.env.ONE_SIGNAL_API_KEY;

async function SendNotification(data, callback){
    var headers = {
        "Content-Type" : "application/json; charset=utf-8",
        Authorization : "Basic " + ApiKey,
    };
    
    var options = {
        host : "onesignal.com",
        port : 443,
        path : '/api/v1/notifications',
        method : "POST",
        headers : headers
    };
    var https = require("https");
    var req = https.request(options, function(res){
        res.on("data", function(data){
            console.log(JSON.parse(data));

            return callback(null, JSON.parse(data));
        });
    });
    req.write(JSON.stringify(data));
    req.end();
}

module.exports = {
    SendNotification
}
