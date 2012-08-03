var config = require('./config'),
    connect = require('connect'),
    ElizaBot = require('./elizabot'),
    urlParse = require('url').parse;

if (config.DAEMON)
	require('daemon').daemonize({stdout: 'msg.log'}, 'irabu.pid');

var BOTS = {};
var TIMEOUT = 60 * 60 * 1000;

var OKAERI = [
	"Hello again. Let's discuss your problem.",
	"Welcome back. Please tell me what's been bothering you.",
	"Are you still troubled?",
];

function respond(msg, id, cb) {
	var resp = '...';
	var bot = BOTS[id];
	var delay;
	if (!bot) {
		BOTS[id] = bot = new ElizaBot;
		resp = bot.getInitial();
		delay = 1000;
	}
	else if (msg == 'helloagain')
		resp = OKAERI[Math.floor(Math.random() * OKAERI.length)];
	else
		resp = bot.transform(msg);

	if (bot.timeout)
		clearTimeout(bot.timeout);

	if (!bot.quit)
		bot.timeout = setTimeout(kill_bot.bind(null, id), TIMEOUT);
	else {
		resp = {msg: resp, quit: true};
		delete BOTS[id];
	}

	var text = resp.msg || resp;
	if (!delay)
		delay = 40 * text.length + 1000 * Math.random();

	console.log(id + ' > ' + msg);
	console.log('\t\t< ' + text);
	setTimeout(function () {
		cb(null, resp);
	}, delay);
}

function kill_bot(id) {
	console.log(id + ' killed.');
	delete BOTS[id];
}

var app = connect();

app.use(function (req, resp, next) {
	if (!prefers_json(req.headers.accept))
		return next();

	var url = urlParse(req.url, true);
	if (req.method == 'GET' && url.pathname == '/') {
		var msg = url.query.msg, id = url.query.id;
		if (!msg || !id) {
			resp.writeHead(400);
			resp.end("Bad request.");
			return;
		}
		if (msg.match(/dump/))
			console.log(bot);
		respond(msg, id, function (err, msg) {
			if (err)
				msg = {msg: err, col: 'red'};
			if (!msg.msg)
				msg = {msg: msg};
			resp.writeHead(200, noCacheJsonHeaders);
			resp.end(JSON.stringify(msg));
		});
	}
	else
		next();
});

function prefers_json(accept) {
	/* Not technically correct but whatever */
	var mimes = (accept || '').split(',');
	for (var i = 0; i < mimes.length; i++) {
		if (mimes[i].match(/json/i))
			return true;
		else if (mimes[i].match(/(html|xml|plain|image)/i))
			return false;
	}
	return false;
}

var noCacheJsonHeaders = {
	'Content-Type': 'application/json',
	'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT',
	'Cache-Control': 'no-cache',
};

app.use(connect.static('pub'));
app.listen(config.LISTEN_PORT);
