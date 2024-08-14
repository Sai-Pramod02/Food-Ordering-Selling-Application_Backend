const appId = process.env.ONE_SIGNAL_APP_ID;
const ApiKey = process.env.ONE_SIGNAL_API_KEY;

const pushNotificationService = require('../services/push_notification.services');

exports.SendNotification = (req, res, next) => {
    var message = {
        app_id : appId,
        contents : {en : "Test Push Notification"},
        included_segments : ['All'],
        content_available : true,
        small_icon : "ic_notification_icon",
        data : {
            PushTitle : "CUSTOM NOTIFICATION"
        },
    };

    pushNotificationService.SendNotification(message, (error, results) => {
        if (error){
            return console.error();
        }
        return res.status(200).send({
            message : "Success",
            data : results,
        });
    });
};

exports.SendNotificationToDevice = (req, res, next) => {
    var message = {
        app_id : appId,
        contents : {en : "Test Push Notification"},
        included_segments : ['included_player_ids'],
        include_player_ids : req.body.devices,
        content_available : true,
        small_icon : "ic_notification_icon",
        data : {
            PushTitle : "CUSTOM NOTIFICATION"
        },
    };

    pushNotificationService.SendNotification(message, (error, results) => {
        if (error){
            return console.error();
        }
        return res.status(200).send({
            message : "Success",
            data : results,
        });
    });
};
