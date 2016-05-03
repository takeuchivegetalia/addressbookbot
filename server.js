var restify = require('restify');
var builder = require('botbuilder');
var tmpdata = {};
var msg = '';

var bot = new builder.BotConnectorBot(
  { appId: 'process.env.appid',
    appSecret: 'process.env.appsecret' });

bot.use(function(session, next) {
  if (!session.userData.addrbook)
    session.userData.addrbook = [];
  next();
});

bot.add('/', new builder.CommandDialog()
  .matches('^.*(表示).*', showList)
  .matches('^.*(検索|探).*', builder.DialogAction.beginDialog('/find'))
  .matches('^.*(登録|追加).*',  builder.DialogAction.beginDialog('/regist'))
  .matches('^.*(全削除).*',  builder.DialogAction.beginDialog('/deleteall'))
  .matches('^.*(削除|消).*',  builder.DialogAction.beginDialog('/delete'))
  .onDefault(function (session) {
    if (session.userData.addrbook.length >= 0)
      msg = 'あなたのアドレス帳は' + session.userData.addrbook.length + '件です。（表示|検索|登録|削除|全削除）';
    session.send(msg);
  }));

function showList(session) {
  if (session.userData.addrbook.length === 0) {
    msg = '表示するデータはありません。';
  } else {
    msg = session.userData.addrbook.map(
      current => '【名前】' + current.name + '【電話番号】' + current.tel).join('　｜　');
  }
  session.send(msg);
}

bot.add('/find', [
  function(session) {
    builder.Prompts.text(session, '検索する名前は何でしょうか？');
  },
  function(session, results) {
    tmpdata.name = results.response;
    if (!tmpdata.name)　{
      msg = '中断しました。'
      session.send(msg);
      session.endDialog();
      return;
    }
    var res = session.userData.addrbook.filter(
      item => item.name == tmpdata.name ? true : false
    );
    if (res[0]) {
      session.send("【名前】" + res[0].name + "【電話番号】" + res[0].tel);
    } else {
      session.send('その名前のデータはありません。');
    }
    session.endDialog();
  }, 
]);

bot.add('/regist', [
  function(session) { 
    builder.Prompts.text(session, '登録する名前は何でしょうか？');
  },
  function(session, results) {
    tmpdata.name = results.response;
    if (!tmpdata.name)　{
      msg = '中断しました。'
      session.send(msg);
      session.endDialog();
      return;
    }
    builder.Prompts.text(session, '登録する電話番号は何でしょうか？');
  },
  function(session, results) {
    tmpdata.tel = results.response;
    if (!tmpdata.tel)　{
      msg = '中断しました。'
      session.send(msg);
      session.endDialog();
      return;
    }
    msg = "【名前】" + tmpdata.name + "【電話番号】" + tmpdata.tel + 'を登録しますか？（はい|いいえ）';
    builder.Prompts.text(session, msg);
  },
  function(session, results) {
    tmpdata.confirm = results.response;
    if (!tmpdata.confirm)　{
      msg = '中断しました。'
      session.send(msg);
    } else if (tmpdata.confirm === 'はい')　{
      session.userData.addrbook.push(tmpdata);
      msg = "【名前】" + tmpdata.name + "【電話番号】" + tmpdata.tel + 'を登録しました。';
      session.send(msg);
    } else {
      msg = '中断しました。'
      session.send(msg);
      session.endDialog();
    }
    session.endDialog();
  }
]);

bot.add('/deleteall', [
  function(session) {
    builder.Prompts.text(session, 'すべてのデータを削除しますか？（はい|いいえ）');
  },
  function(session, results) {
    tmpdata.confirm = results.response;
    if (!tmpdata.confirm)　{
      msg = '削除しませんでした。'
      session.send(msg);
    } else if (tmpdata.confirm === 'はい')　{
      session.userData.addrbook = [];
      msg = 'すべてのデータを削除しました。';
      session.send(msg);
    } else {
      msg = '削除しませんでした。'
      session.send(msg);
    }
    session.endDialog();
  }
]);

bot.add('/delete', [
  function(session) {
    builder.Prompts.text(session, '削除する名前は何でしょうか？');
  },
  function(session, results) {
    tmpdata.name = results.response;
    if (!tmpdata.name)　{
      msg = '中断しました。'
      session.send(msg);
      session.endDialog();
      return;
    }
    var res = session.userData.addrbook.filter(
      item => item.name == tmpdata.name ? true : false
    );
    if (res[0]) {
      tmpdata.name = res[0].name;
      tmpdata.tel = res[0].tel;
      msg = "【名前】" + tmpdata.name + 'を削除しますか？（はい|いいえ）';
      builder.Prompts.text(session, msg);
    } else {
      session.send(tmpdata.name + 'のデータはありません。');
      session.endDialog();
    }
  },
  function(session, results) {
    tmpdata.confirm = results.response;
    if (!tmpdata.confirm)　{
      msg = '削除しませんでした。'
      session.send(msg);
    } else if (tmpdata.confirm === 'はい')　{
      session.userData.addrbook = session.userData.addrbook.filter(function(item){
        return item.name !== tmpdata.name;
      });
      msg = "【名前】" + tmpdata.name + 'を削除しました。';
      session.send(msg);
    } else {
      msg = '削除しませんでした。'
      session.send(msg);
    }
    session.endDialog();
  }
]);

var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 3978, function () {
  console.log('%s listening to %s', server.name, server.url); 
});
