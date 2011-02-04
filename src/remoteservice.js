require('../lib/json/json.js');
var fs = require('fs');
var model = require('./model/Emma_model');
var Service = model.Emma;


Service.SIMULATOR = {};
Service.SIMULATOR.host = "localhost";
Service.SIMULATOR.port = 8081;


fs.readFile('topology_remoteservice.json','utf-8', function (err, data) {
	  	
  	var model = Service.PARSER.parseNode(data);
  	
  	Service.init(model);
  	
});


var display_handler = function(){
	console.log("[ServiceSimulator] - GET - /display");
	var result = "";
	result += "<div>";
	result += "<ol>";
	for(var i in Service.root){
		result += "<li>"+Service.root[i].ip+"</li>";
		if(Service.root[i].resource.length > 0){
			result += "<ol>";
			for(var j in Service.root[i].resource){
				result += "<li>"+Service.root[i].resource[j].name+"</li>";
				result += "<ol>";
				result += "<li>"+JSON.stringify(Service.root[i].resource[j].uri)+"</li>";
				result += "<li>"+JSON.stringify(Service.root[i].resource[j].data)+"</li>";
				result += "<li>"+JSON.stringify(Service.root[i].resource[j].meta)+"</li>";
				
				if(Service.root[i].resource[j].log.length > 0){
					result += "<ol>";
					for(var k in Service.root[i].resource[j].log){
						result += "<li>"+JSON.stringify(Service.root[i].resource[j].log[k])+"</li>";
					}
					result += "</ol>";
				}
				result += "</ol>";
			}
			result += "</ol>";
		}
		
		
	}
	result += "</ol>";
	result += "</div>";
	return result;
};


var host_handler = function(host) {
	console.log("[ServiceSimulator] - GET - /node/"+host);
	var host = Service.findHost(host);
	return Service.PARSER.stringifyHost(host);
};
var resource_get_handler = function(host, resource){
	
	console.log("[ServiceSimulator] - GET - /node/"+host+"/"+resource);
	var host = Service.findResource(host,resource);
	
	var model ={};
	model.message = [];
	model.message.push({fake:"fake"});
	model.message.push(Service.PARSER.stringifyResource(host));
	return model;
};
var resource_put_handler = function(host, resource, body){
	console.log("[ServiceSimulator] - PUT - /node/"+host+"/"+resource);
	host = "{"+host+"}";
	
	var host = Service.findResource(host,resource);
	var data = body;
	
	host[0].resource[0].data.value = data.value;
	
	var model ={};
	model.message = [];
	model.message.push({fake:"fake"});
	model.message.push(Service.PARSER.stringifyResource(host));
	return model;
	
};


var log_handler = function(host, resource){
	console.log("[ServiceSimulator] - GET - /log/"+host+"/"+resource);
	var host = Service.findResource(host,resource);

	
	var model ={};
	model.message = [];
	model.message.push({fake:"fake"});
	model.message.push(Service.PARSER.stringifyLog(host));
	return model;
};
var express = require('express');
var app = express.createServer(
    express.bodyDecoder()
  );
app.get('/display', function(req, res){
	var response = display_handler();
    res.send(response);
});
app.get('/node/:host', function(req, res){
	var response = host_handler(req.params.host);
    res.send(response);
});
app.get('/node/:host/:resource', function(req, res){
	var response = resource_get_handler(req.params.host, req.params.resource);
    res.send(response);
});
app.put('/node/:host/:resource', function(req, res){

	var response = resource_put_handler(req.params.host, req.params.resource, req.body);
    res.send(response);
});
app.get('/log/:host/:resource', function(req, res){
	var response = log_handler(req.params.host, req.params.resource);
    res.send(response);
});
app.listen(Service.SIMULATOR.port);
console.log("server running at "+Service.SIMULATOR.host+" on "+Service.SIMULATOR.port);