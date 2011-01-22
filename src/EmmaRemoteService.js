var IoC = require("../lib/IoC/IoC.js");
var spawn = require('child_process').spawn
var fs = require('fs');

var EmmaRemoteService = {};
EmmaRemoteService.DOMAIN = "localhost";
EmmaRemoteService.PORT = 8182;
EmmaRemoteService.SERVICE_PATH = "service/";
EmmaRemoteService.HANDLER_PATH = "handler/";

var handlerInterface = function(command){
	var that = {};
	that.command = command;
	that.execute = function(res,file_path, args){
		if(!args)args=[];
		args.unshift(file_path);
		var command = spawn(that.command, args);
		
		//command.stdout.setEncoding('utf8');

		command.stdout.on('data', function (data) {
	      	res.write(data);
	      	res.end();
	    });
	    command.stdout.on('end', function (data) {
	      	res.end();
	    });
		command.stdin.end();
	};
	return that;
};

EmmaRemoteService.handlerProvider = IoC.makeProvider(handlerInterface);
EmmaRemoteService.handlerProvider.addService("scpt", new handlerInterface("osascript"));

var error = function(name, message){
	return "[EmmaRemoteService] - "+name+" error - "+message;
};

var app = require('express').createServer();
app.get('/:service/:action', function(req, res){
	
	var service = req.params.service;
	var action = req.params.action;
	console.log("[EmmaRemoteService] - GET - "+service+"/"+action);
	var path = EmmaRemoteService.SERVICE_PATH+service;
	try{
		var files = fs.readdirSync(path);
		var exits = false;
		for(var i in files){
			var extension = files[i].split(".").pop();
			var name = files[i].replace("."+extension, "");
			if(name === action){
				exists = true;
				if(!EmmaRemoteService.handlerProvider.hasService(extension)){
					res.send(error("action","action can not be handled"));
				}
				else{
					res.writeHead(200,{'Content-Type': 'text/plain'});
					var handler = EmmaRemoteService.handlerProvider.getService(extension);
					handler.execute(res,path+"/"+files[i]);
				}
			}
		}
		if(!exists)res.send(error("action",action+" is not an available action of service "+service));
	}
	catch(err){
		res.send(error("path","'"+service+"' is not an available service"));
	}
});
app.listen(EmmaRemoteService.PORT);
console.log("server running at "+EmmaRemoteService.DOMAIN+" on "+EmmaRemoteService.PORT);



