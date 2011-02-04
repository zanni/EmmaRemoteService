
//Emma remote service is a node.js webservice which allow to
//dynamicly execute file depending on their extension. 

//File are grouped into widget. Each widget is supposed to provide
//needed function to control a resource on the remote system :
// exemple : widget "itunes" provide action (scpt is extension for applescript)
//						- play.scpt
//						- pause.scpt
//						- next.scpt
//						- previous.scpt

var EmmaRemoteService = {};
EmmaRemoteService.DOMAIN = "localhost";
EmmaRemoteService.PORT = 8182;

EmmaRemoteService.SERVICE_PATH = "service/";

//EmmaRemoteService can deal with every kind of file (i.e extension) thanks to
//a dependancy injection mechnism, provided by IoC framework
var IoC = require("../lib/IoC/IoC.js");
var spawn = require('child_process').spawn
var fs = require('fs');
//declaration of constructor injection class
var handlerInterface = function(command){
	var that = {};
	that.command = command;
	that.execute = function(res,file_path, args){
		if(!args)args=[];
		args.unshift(file_path);
		var command = spawn(that.command, args);
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
//initilisation of handlerProvider :
EmmaRemoteService.handlerProvider = IoC.makeProvider(handlerInterface);
//register service "scpt" with "osascript" command
//this handler will execute file with "scpt" extension as follow :
//osascript {file_path} {args}
EmmaRemoteService.handlerProvider.addService("scpt", new handlerInterface("osascript"));
//EmmaRemoteService.handlerProvider.addService("json", new handlerInterface("ls"));

var fileHandlerInterface = function(){
	var that = {};
	that.command = "ls";
	var super = new handlerInterface(that.command);
	that.execute = function(res, file_path, args){
		fs.readFile(file_path ,'utf-8', function(err, data){
			if (err) throw err;
  			var model = JSON.parse(data);
  			var body = JSON.stringify(args)
  			console.log(args);
  			super.execute(res, model.path);
		});	
	};
	return that;
};
EmmaRemoteService.handlerProvider.addService("json", new fileHandlerInterface());




//use Emma model to represent service/action as host/resource
var model = require('./model/Emma_model');
var Emma = model.Emma;

var error = function(name, message){
	return "[EmmaRemoteService] - "+name+" error - "+message;
};

var express = require('express');
var app = express.createServer(
    express.bodyDecoder()
  );
/*
app.get('/discover/*', function(req,res){
	var host = req.params.host;
	var resource = req.params.resource;
});
*/
app.get('/discover/all', function(req,res){
	var hosts = [];
	var path = EmmaRemoteService.SERVICE_PATH;
	console.log(path);
	
	var service = fs.readdirSync(path);
	var exits = false;
	
	for(var i in service){
		var host_component = new Emma.Host({
			ip:"http://"+EmmaRemoteService.DOMAIN+":"+EmmaRemoteService.PORT+"/"+service[i]+"/",
		});
		console.log(path+service[i]);
		var stat = fs.statSync(path+service[i]);
		if(stat && stat.isFile && !stat.isFile()){
			var resource = fs.readdirSync(path+service[i]);
			for(var j in resource){
				
				var extension = resource[j].split(".").pop();
				var name = resource[j].replace("."+extension, "");
				
				if(name && name != ""){
					host_component.resource.push(new Emma.Resource({
						name:name,
						uri:"http://"+EmmaRemoteService.DOMAIN+":"+EmmaRemoteService.PORT+"/"+service[i]+"/"+name,
						data:{
							name:name,
							unit:"",
							value:"",
						},
						meta:{
							name:name,
							type: "integer",
                            min: "0",
                            max: "1",
                            readonly: "0" 
                            
						},
					}));
				}
			}
			hosts.push(host_component);
		}
	}
	
	
	var model ={};
	model.message = [];
	model.message.push({fake:"fake"});
	model.message.push(Emma.PARSER.stringifyResource(hosts));
	res.send(model);
	
	res.send("moaui c cool");
		
	
	

});

app.get('/discover/:host/:resource', function(req,res){
	var host = req.params.host;
	var resource = req.params.resource;
	console.log("[EmmaRemoteService] - GET - /discover/"+host+"/"+resource);
	var hosts = [];
	var path = EmmaRemoteService.SERVICE_PATH+host;
	console.log(path);
	try{
		var files = fs.readdirSync(path);
		var exits = false;
		var host_component = new Emma.Host({
			ip:"http://"+EmmaRemoteService.DOMAIN+":"+EmmaRemoteService.PORT+"/"+host+"/",
		});
		
		for(var i in files){
			var extension = files[i].split(".").pop();
			var name = files[i].replace("."+extension, "");
			
			if(name === resource){
				host_component.resource.push(new Emma.Resource({
					name:name,
					uri:"http://"+EmmaRemoteService.DOMAIN+":"+EmmaRemoteService.PORT+"/"+host+"/"+name
				}));
				
			}
		}
		
		hosts.push(host_component);
		
		
		var model ={};
		model.message = [];
		model.message.push({fake:"fake"});
		model.message.push(Emma.PARSER.stringifyResource(hosts));
		res.send(model);
		
		
	}
	catch(err){
		res.send(error("path","'"+host+"' is not an available service"));
	}


});
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
					if(req.body){
						console.log("body");
						console.log(req.body);
						handler.execute(res,path+"/"+files[i]);
					}
					else handler.execute(res,path+"/"+files[i]);
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



