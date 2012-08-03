(function () {

var $body = $('body');
var $log = $('div');
var $input = $('input');
var $sign = $('<span>IN.</span>').appendTo('h1');
var id = localStorage.getItem('erabuId');
if (!id) {
	id = Math.floor(Math.random() * 1e16) + 1;
	localStorage.setItem('erabuId', id);
}
var waiting = true;

function message(data) {
	var $p = $('<p/>');
	$p.text(data.msg);
	if (data.col)
		$p.css({color: data.col});
	$log.append($p);
	$log[0].scrollTop = $log[0].scrollHeight;
	if ($sign.text() == 'OUT.')
		$sign.text('IN.');
	if (!$body.hasClass('doctor'))
		$body.addClass('doctor');
}

function ready() {
	$input.removeClass('wait').focus();
	waiting = false;
}

function leave() {
	$sign.text('OUT.');
	$body.removeClass('doctor');
}

$.ajaxSetup({
	error: function ($xhr, status, err) {
		message({msg: "Can't reach the doctor.", col: 'red'});
		leave();
		ready();
	},
	headers: {Accept: 'application/json'},
	success: function (msg) {
		message(msg);
		if (msg.quit) {
			$input.prop('disabled', true);
			setTimeout(leave, 5000);
		}
		else
			ready();
	},
});

$.ajax({data: {id: id, msg: 'helloagain'}});

function send(text) {
	waiting = true;
	$input.val('').addClass('wait');
	$.ajax({
		data: {msg: text, id: id},
	});
	message({msg: '> ' + text, col: 'gray'});
}

$input.on('keydown', function (e) {
	if (!waiting && e.which == 13) {
		var text = $input.val().trim();
		if (text) {
			send(text);
			e.preventDefault();
		}
	}
});

$input.focus();

})();
