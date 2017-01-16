'use strict'

var express = require('express');
var bodyParser = require('body-parser')
var request = require('request');

var app = express();
var port = 3700;

app.use(bodyParser.json());

// sets where template files are
app.set('views', __dirname + '/templates');
// sets where static files are (css, js...)
app.use(express.static(__dirname + '/static'));

// .html view setup - need to install ejs
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Server methods
app.get('/', function(req, res){
	res.render('index');
});

var xml = '<?xml version="1.0" encoding="utf-8"?>' +
			'<Element>'+
			'<Test>......</Test></Element>';

app.get('/postVote', function(req, res){

	// var options = {
	// 	method: 'POST',
	// 	uri: 'http://localhost:8080/EuroCupWS-CC16/restapi/postVote/6',
	// };
	
	request
		.post('http://localhost:8080/EuroCupWS-CC16/restapi/postVote/6')
		.on('response', function(response) { console.log(response.statusCode); })
		.pipe(request
				.get('http://localhost:8080/EuroCupWS-CC16/restapi/readId/6')
				.on('response', function(response) {
					console.log(response.statusCode); // 200 
					console.log(response.headers['content-type']);
					console.log(response.responseContent);
				})
			);

	console.log('POST VOTE');

	// request(options);

	res.redirect('/');
});

app.get('/sendXml', function(req, res){


	var options = {
		method: 'POST',
		uri: 'http://localhost:8080/CloudStorage/storeElement',
		body: xml,
		headers: {'Content-Type': 'text/xml'},
	};
	
	console.log('SEND XML');

	request(options, function (error, response, body) {
		console.log('ENTROU');
		if (!error && response.statusCode == 200) {
			console.log(body) // Show the HTML.
		}
	});

	// res.redirect('/');
});

app.listen(port);
console.log("Listening on port " + port);