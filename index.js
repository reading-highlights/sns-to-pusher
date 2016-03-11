console.log('Loading function.');

// Load config
var config = require('./config.json');

// Load dependencies
var Promise = require('bluebird');
var rest = require('restler-bluebird');
// var AWS = require('aws-sdk');
// AWS.config.loadFromPath('./config.json');
var ctx = null;
var urlPrefix = 'https://console.aws.amazon.com/lambda/home?region=' + config.region + '#/functions/';
var urlPostfix = '?tab=monitoring';

// Forward Cloudwatch error from SNS to Pushover
exports.handler = function(event, context) {
  ctx = context;
  // console.log('Event: ');
  // console.log(JSON.stringify(event));

  var recordCount = 0;
  Promise.each(event['Records'], function(r) {
    recordCount++;
    return sendToPushover(r);
  }).then(function() {
    console.log('' + recordCount + ' message(s) sent to Pushover');
    ctx.succeed();
  }).catch(function(error) {
    ctx.fail(error);
  });
};

function sendToPushover(record) {
  var j = JSON.parse(record['Sns']['Message']);
  console.log('SNS Message: ');
  console.log(JSON.stringify(j));

  var title = j['AlarmName'];
  var message = j['AlarmDescription'];
  var functionName = j['Trigger']['Dimensions'][0]['value'];
  var lambdaUrl = urlPrefix + functionName + urlPostfix;
  var lambdaUrlTitle = 'Open AWS Lambda Function';

  return rest.post(config.pushoverUrl, {
    data: {
      'token': config.pushoverAppToken,
      'user': config.pushoverUserToken,
      'title': title,
      'message': message,
      'url': lambdaUrl,
      'url_title': lambdaUrlTitle
    }
  }).then(function(result) {
    console.log('Message sent to Pushover');
    console.log('Pushover API response body: ');
    console.log(result);
  }).catch(function(error) {
    console.log('Error: ');
    console.log(error);
  });
}

// FOR TESTING LOCALLY
// var context = {
//   fail: function(msg) {
//     console.log('Error:');
//     console.log(msg);
//   },
//   succeed: function() {
//   }
// };
//
// exports.handler(null, context);
