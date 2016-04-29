var restify = require('restify');
var builder = require('botbuilder');
var tmpdata = {};

var bot = new builder.BotConnectorBot(
  { appId: 'process.env.appid',
    appSecret: 'process.env.appsecret' });

bot.use(function(session, next) {
  if (!session.userData.addrbook)
    session.userData.addrbook = [];
  next();
});

bot.add('/', new builder.CommandDialog()
  .matches('^(regist|add)',  builder.DialogAction.beginDialog('/regist'))
  .matches('^(find|search)', builder.DialogAction.beginDialog('/find'))
  .matches('^list', showList)
  .onDefault(function (session) {
    var msg = 'you have ' + session.userData.addrbook.length + ' data.';
    session.send('Hello, I am address book bot. ' + msg);
  }));

function showList(session) {
  var tmp = session.userData.addrbook.map(
    current => 'name: ' + current.name + ' tel: ' + current.tel);
  session.send(tmp.join(', '));
}

bot.add('/regist', [
  function(session) { 
    builder.Prompts.text(session, 'what name do you want to add ?');
  },
  function(session, results) {
    tmpdata.name = results.response;
    builder.Prompts.text(session, 'telephone number? ');
  },
  function(session, results) {
    tmpdata.tel = results.response;
    session.userData.addrbook.push(tmpdata);
    session.send('registerd!');
    session.endDialog();
  }
]);

bot.add('/find', [
  function(session) {
    builder.Prompts.text(session, 'find? ');
  },
  function(session, results) {
    var target = results.response;
    var res = session.userData.addrbook.filter(
      item => item.name == target ? true : false
    );
    if (res[0]) {
      session.send("name: " + res[0].name + " tel: " + res[0].tel);
    } else {
      session.send('no such data');
    }
    session.endDialog();
  }, 
]);

var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 3978, function () {
  console.log('%s listening to %s', server.name, server.url); 
});
