var eyefi_server 	= require('express')();
var tar 			= require("tar");
var fs 				= require("fs");
var parseString 	= require('xml2js').parseString;
var bodyParser 		= require('body-parser');
var multer 			= require('multer'); 
var PythonShell 	= require('python-shell');
var serveStatic 	= require('serve-static');
var http 			= require('http').Server(eyefi_server);
var io 				= require('socket.io')(http);
var snonce 			= '30c1ac2479d4ae4b52c80ea9809a6fcc';// has to be changed to random string
var verbose 		= true;

function msg(debugMsg){if(verbose){console.log(debugMsg);}}

eyefi_server.use(bodyParser.urlencoded({extended: true}));
eyefi_server.use(bodyParser.json());
eyefi_server.use(multer({ 
	dest: 'uploads/tar/',
	onFileUploadComplete: function (file, req, res) {
		msg("Upload for File " + file.originalname + " complete");
  		var extractor = tar.Extract({path: __dirname + "/uploads/jpg"})
  					.on('error', function(err){
						msg("An error occurred while extracting File " + file.originalname + " - Details: " + err);
						res.send('<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><ns1:UploadPhotoResponse xmlns:ns1="http://localhost/api/soap/eyefilm"><success>false</success></ns1:UploadPhotoResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>');
  					})
  					.on('end', function(){
						msg("Photo " + file.originalname.slice(0, - 4) + " successfully extracted");
						fs.unlinkSync(__dirname + "/uploads/tar/" + file.name);
						res.send('<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><ns1:UploadPhotoResponse xmlns:ns1="http://localhost/api/soap/eyefilm"><success>true</success></ns1:UploadPhotoResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>');
  						io.sockets.emit('update', {path: file.originalname.slice(0, - 4)});
  					});

			fs.createReadStream(__dirname + "/uploads/tar/" + file.name)
  				.on('error', function(err){
					msg("An error occurred while extracting File " + file.originalname + " - Details: " + err);
					res.send('<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><ns1:UploadPhotoResponse xmlns:ns1="http://localhost/api/soap/eyefilm"><success>false</success></ns1:UploadPhotoResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>');
  				})
  				.pipe(extractor);
	}
}))

eyefi_server.use(function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) { req.rawBody += chunk; });
  req.on('end', next);
});

eyefi_server.post('/api/soap/eyefilm/v1', function (req, res) {
	var headerValue = req.headers.soapaction;

	if(headerValue == "\"urn:StartSession\""){
		msg("Got StartSession request");
		var mac 						= '';
		var cnonce 						= '';
		var transfermode 				= '';
		var transfermodetimestamp 		= '';
		var credential_server_to_client = '';	
		
		parseString(req.rawBody, function (err, result) {
			var	extract 				= result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['ns1:StartSession'][0];
    			mac 					= extract['macaddress'][0];
    			cnonce 					= extract['cnonce'][0];
    			transfermode 			= extract['transfermode'][0];
    			transfermodetimestamp 	= extract['transfermodetimestamp'][0];
		});

		var pyshell = new PythonShell('credential_one.py');
			pyshell.on('message', function (message) {
 					credential_one = message;
					res.send('<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><ns1:StartSessionResponse xmlns:ns1="http://localhost/api/soap/eyefilm"><credential>' + credential_one + '</credential><snonce>' + snonce + '</snonce><transfermode>' + transfermode + '</transfermode><transfermodetimestamp>' + transfermodetimestamp + '</transfermodetimestamp><upsyncallowed>false</upsyncallowed></ns1:StartSessionResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>');
			});
			pyshell.send(cnonce);
			pyshell.send(mac);
		
	}
	else if(headerValue == "\"urn:GetPhotoStatus\""){
		msg("Got GetPhotoStatus request");
      	var mac = '';
      	var filename = '';
      	var filesize = '';
      	var filesignature = '';
      	var flags = '';

		parseString(req.rawBody, function (err, result) {
			var extract 					= result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['ns1:GetPhotoStatus'][0];
    			credential_client_to_server = extract['credential'][0];
      			mac 						= extract['macaddress'][0];
      			filename 					= extract['filename'][0];
      			filesize 					= extract['filesize'][0];
      			filesignature				= extract['filesignature'][0];
      			flags 						= extract['flags'][0];
		});

		var pyshell = new PythonShell('credential_two.py');
			pyshell.on('message', function (credential_expected) {
 					if(credential_expected == credential_client_to_server){
						res.send('<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><ns1:GetPhotoStatusResponse xmlns:ns1="http://localhost/api/soap/eyefilm"><fileid>' + 1 + '</fileid><offset>0</offset></ns1:GetPhotoStatusResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>');
 					}
 					else{
 						//this could mean someone tries to attack the server
 						msg("Eye-Fi SD card failed to authenticate. File " +  filename + " not received. ");
 						res.send('Nice try!');
 					}
			});
			pyshell.send(snonce);
			pyshell.send(mac);
		}
	else{
		res.send('Unknown Request');
	}
});

//This is the part for showing the pictures on a local client (Chrome/Firefox/Safari/IE/Opera...)

eyefi_server.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});

eyefi_server.use('/js', serveStatic(__dirname+'/client/js'));
eyefi_server.use('/css', serveStatic(__dirname+'/client/css'));
eyefi_server.use('/img', serveStatic(__dirname+'/client/img'));
eyefi_server.use('/img', serveStatic(__dirname+'/uploads/jpg'));

io.on('connection', function(socket){
  console.log('a user connected');
  io.sockets.emit('initialize', {paths: "filenamearray"});
});

// takeoff
http.listen(59278);
console.log("Eye-Fi Server started");