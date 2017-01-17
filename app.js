'use strict'

var express = require('express');
var bodyParser = require('body-parser')
var request = require('request');
var fs = require('fs');
var busboy = require('express-busboy');
var js2xmlparser = require("js2xmlparser");

var app = express();
busboy.extend(app, {
	upload: true,
	allowedPath: /./
});
var port = 3700;

app.use(bodyParser.json());

// sets where template files are
app.set('views', __dirname + '/templates');
// sets where static files are (css, js...)
app.use(express.static(__dirname + '/static'));

// .pug (jade) view setup - need to install pug
app.set('view engine', 'pug');
app.engine('pug', require('pug').__express);

// Server methods
app.get('/', function(req, res){
	res.render('index');
});

var GlobalResponse;

app.post('/postVote', function(req, res){

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
					console.log('RESPONSE');
					console.log(response.statusCode); // 200 
					response.on('data', function(data) {
						// compressed data as it is received 
						console.log('received ' + data.length + ' bytes of compressed data')
						console.log(data)
					})
					GlobalResponse = response;
				})
				.on('data', function(data) {
					// decompressed data as it is received 
					console.log('decoded chunk: ' + data)
				})
			);

	console.log('POST VOTE');

	// request(options);

	res.redirect('/');
});

app.post('/sendXml', function(req, res){

	var xml = '<?xml version="1.0" encoding="utf-8"?>' +
			'<Element>'+
			'<Test>......</Test></Element>';

	var options = {
		method: 'POST',
		uri: 'http://localhost:8080/CloudStorage/test',
		body: xml,
		headers: {'Content-Type': 'text/xml'},
	};
	
	console.log('SEND XML');

	request(options, function (error, response, body) {
		console.log('ENTROU');
		if (!error && response.statusCode == 200) {
			console.log(body) // Show the HTML.
		}
	}).on('data', function(data) {
		// decompressed data as it is received 
		console.log('decoded chunk: ' + data)
	});

	res.redirect('/');
});

app.post('/upload', function(req, res) {
	
	// Get file from HTML
	var loader = req.files.loader;

	fs.createReadStream(loader.file).on('data', function(dataBuffer) {
		// Parse file to xml
		var xml = js2xmlparser.parse("Element", {
			"key": loader.filename, // Get file name (including extension)
			"data": JSON.stringify(dataBuffer.toJSON().data), // Read buffer from range
		})

		var json = JSON.stringify({
			"key": loader.filename, // Get file name (including extension)
			"data": dataBuffer.toJSON().data,
		})

		// console.log(xml);
		// console.log(json);

		// test with string
		// fs.writeFile(loader.filename, dataBuffer, (err) => {
		// 	if (err) throw err;
		// 	console.log('It\'s saved!');
		// });

		// Set request options
		var options = {
			method: 'POST',
			uri: 'http://localhost:8080/CloudStorage/storeFile',
			body: xml,
			headers: {'Content-Type': 'text/xml'},
		};
		
		// Send request to web service
		request(options, function (error, response, body) {
			console.log('REQUEST DONE');
			if (!error && response.statusCode == 200) {
				// TODO: catch errors and set proper message to frontend (redirect/render properly)
				res.redirect('/');
			}
		});
	});

});

app.listen(port);
console.log("Listening on port " + port);