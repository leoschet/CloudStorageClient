'use strict'

var express = require('express');
var bodyParser = require('body-parser')
var request = require('request');
var fs = require('fs');
var busboy = require('express-busboy');
var js2xmlparser = require("js2xmlparser");
var xml2jsparser = require('xml2js').Parser();

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

app.post('/postVote', function(req, res){

	// var options = {
	// 	method: 'POST',
	// 	uri: 'http://localhost:8080/EuroCupWS-CC16/restapi/postVote/6',
	// };
	
	request
		.post('http://localhost:9000/EuroCupWS-CC16/restapi/postVote/6')
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
		uri: 'http://localhost:8080/cloudstorage/test',
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
	var fileloader = req.files.fileloader;

	fs.createReadStream(fileloader.file).on('data', function(dataBuffer) {
		// Parse file to xml
		var xml = js2xmlparser.parse("Element", {
			"Key": fileloader.filename, // Get file name (including extension)
			"Data": JSON.stringify(dataBuffer.toJSON().data), // Read buffer from range
		})
		var json = JSON.stringify({
			"Key": fileloader.filename, // Get file name (including extension)
			"Data": dataBuffer.toJSON().data,
		})

		// txt: <Buffer 50 6f 6b 65 72 53 74 61 72 73 20 48 61 6e 64 20 23 31 33 39 35 37 39 33 34 34 36 37 39 3a 20 20 48 6f 6c 64 27 65 6d 20 4e 6f 20 4c 69 6d 69 74 20 28 ... >
		// pdf: <Buffer 25 50 44 46 2d 31 2e 37 0d 0a 25 a1 b3 c5 d7 0d 0a 31 20 30 20 6f 62 6a 0d 0a 3c 3c 2f 43 6f 75 6e 74 20 31 2f 4b 69 64 73 5b 20 36 20 30 20 52 20 5d ... >
		console.log(dataBuffer);
		
		// Set request options
		var options = {
			method: 'POST',
			uri: 'https://cloudstorage-ws.herokuapp.com/cloudstorage/storeFile',
			body: xml,
			headers: {'Content-Type': 'text/xml'},
		};
		
		// Send request to web service
		request(options, function (error, response, body) {
			console.log('REQUEST DONE');
			console.log(response.statusCode)
			res.redirect('/');
		});
	});

});

app.post('/getFile', function(req, res) {
	console.log('AEE ' + req.body.filename);
	request
		.get('https://cloudstorage-ws.herokuapp.com/cloudstorage/getFile/?key=' + req.body.filename)
		.on('response', function(response) {
			
			console.log('RESPONSE');
			console.log(response.statusCode); // 200 
			res.redirect('/');
		})
		.on('data', function(data) {
			
			// txt: <Buffer 3c 3f 78 6d 6c 20 76 65 72 73 69 6f 6e 3d 22 31 2e 30 22 20 65 6e 63 6f 64 69 6e 67 3d 22 55 54 46 2d 38 22 20 73 74 61 6e 64 61 6c 6f 6e 65 3d 22 79 ... >
			// pdf: <Buffer 3c 3f 78 6d 6c 20 76 65 72 73 69 6f 6e 3d 22 31 2e 30 22 20 65 6e 63 6f 64 69 6e 67 3d 22 55 54 46 2d 38 22 20 73 74 61 6e 64 61 6c 6f 6e 65 3d 22 79 ... >
			console.log(data);
			
			xml2jsparser.parseString(data, function (err, xmlObj) {
				if(!err)
				{
					console.log('AFTER PARSE');
					console.log(xmlObj);
					// console.log(xmlObj.Element.Data);
					// console.log(xmlObj.Element.Data[0]); // eh um json
					
					var dataObj = JSON.parse(xmlObj.Element.Data[0]);
					
					// console.log(dataObj);
					// console.log(dataObj[0]);
					// console.log(dataObj[1]);
					// console.log(dataObj[2]);
					// console.log(dataObj[3]);
					
					const buf = Buffer.from(dataObj);
					
					// <Buffer 50 6f 6b 65 72 53 74 61 72 73 20 48 61 6e 64 20 23 31 33 39 35 37 39 33 34 34 36 37 39 3a 20 20 48 6f 6c 64 27 65 6d 20 4e 6f 20 4c 69 6d 69 74 20 28 ... >
					console.log(buf);
					fs.writeFile(__dirname + '/downloads/' + req.body.filename, buf.toString(), (err) => {
						if (err) throw err;
						console.log('It\'s saved!');
					});

				} else{
					console.log('bugou')
					console.log(err);
				}
			});
			
			
		});
});

app.post('/getFiles', function(req, res) {
	console.log('AEE ' + req.body.filename);
	request
		.get('https://cloudstorage-ws.herokuapp.com/cloudstorage/getFiles/?firstKey=' + req.body.filenameStart + '&lastKey=' + req.body.filenameEnd)
		.on('response', function(response) {
			
			console.log('RESPONSE');
			console.log(response.statusCode); // 200 
			res.redirect('/');
		})
		.on('data', function(data) {
			
			// txt: <Buffer 3c 3f 78 6d 6c 20 76 65 72 73 69 6f 6e 3d 22 31 2e 30 22 20 65 6e 63 6f 64 69 6e 67 3d 22 55 54 46 2d 38 22 20 73 74 61 6e 64 61 6c 6f 6e 65 3d 22 79 ... >
			// pdf: <Buffer 3c 3f 78 6d 6c 20 76 65 72 73 69 6f 6e 3d 22 31 2e 30 22 20 65 6e 63 6f 64 69 6e 67 3d 22 55 54 46 2d 38 22 20 73 74 61 6e 64 61 6c 6f 6e 65 3d 22 79 ... >
			console.log(data);
			
			xml2jsparser.parseString(data, function (err, xmlObj) {
				if(!err)
				{
					console.log('AFTER PARSE');
					console.log(xmlObj);
					console.log(xmlObj.Bucket.Element);
					console.log(xmlObj.Bucket.Element[0]); 
					console.log(xmlObj.Bucket.Element[1]); 
					
					// var dataObj = JSON.parse(xmlObj.Element.Data[0]);

					var buf;
					var dataObj;
					for (var i = xmlObj.Bucket.Element.length - 1; i >= 0; i--) {
						dataObj = JSON.parse(xmlObj.Bucket.Element[i].Data);

						buf = Buffer.from(dataObj);
					
						// <Buffer 50 6f 6b 65 72 53 74 61 72 73 20 48 61 6e 64 20 23 31 33 39 35 37 39 33 34 34 36 37 39 3a 20 20 48 6f 6c 64 27 65 6d 20 4e 6f 20 4c 69 6d 69 74 20 28 ... >
						console.log(buf);
						fs.writeFile(__dirname + '/downloads/' + xmlObj.Bucket.Element[i].Key, buf.toString(), (err) => {
							if (err) throw err;
							console.log('It\'s saved!');
						});
					}
					

				} else{
					console.log('bugou')
					console.log(err);
				}
			});
			
			
		});
});

app.post('/deleteFile', function(req, res) {
//onsubmit="return updateLoaderAction()"
	console.log('AEE ' + req.body.filename);
	request
		.post('https://cloudstorage-ws.herokuapp.com/cloudstorage/delete/?key=' + req.body.filename)
		.on('response', function(response) {
			
			console.log('RESPONSE');
			console.log(response.statusCode); // 200 
			if (response.statusCode == 200) {
				// TODO: catch errors and set proper message to frontend (redirect/render properly)
				res.redirect('/');
			}

		})
});

app.post('/exportDatabase', function(req, res) {

	request
		.get('https://cloudstorage-ws.herokuapp.com/cloudstorage/exportDatabase')
		.on('response', function(response) {
			
			console.log('RESPONSE');
			console.log(response.statusCode); // 200 
			if (response.statusCode == 200) {
				// TODO: catch errors and set proper message to frontend (redirect/render properly)
				res.redirect('/');
			}

		})
		.on('data', function(data) {
			xml2jsparser.parseString(data, function (err, data) {
				if(!err)
				{
					var today = new Date();

					console.dir(data);
					fs.writeFile('/downloads/database_backup' + today.now(), data, (err) => {
						if (err) throw err;
						console.log('It\'s saved!');
					});

				} else{
					console.log(err);
				}
			});
			
			
		});
});

app.post('/importDatabase', function(req, res) {
	
	// Get file from HTML
	var fileloader = req.files.fileloader;

	fs.createReadStream(fileloader.file).on('data', function(dataBuffer) {
		// Parse file to xml
		var xml = js2xmlparser.parse("Element", {
			"Key": fileloader.filename, // Get file name (including extension)
			"Data": JSON.stringify(dataBuffer.toJSON().data), // Read buffer from range
		})

		// Set request options
		var options = {
			method: 'POST',
			uri: 'https://cloudstorage-ws.herokuapp.com/cloudstorage/importDatabase',
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

app.listen(process.env.PORT || port);
console.log("Listening on port " + port);