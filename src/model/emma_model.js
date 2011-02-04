

var Emma = {};

Emma.root = [];


//DataModel
Emma.Host = function(spec){

	var that = {};
	
	that.ip = spec.ip || null;
	that.report = spec.report || null;
	that.status = spec.status || null;
	
	that.resource = [];
	
	return that;
	
};

Emma.Resource = function(spec){

	var that = {};
	
	that.type = spec.type || null;
	that.name = spec.name || null;
	that.uri = spec.uri || null;
	that.data = spec.data || null;
	that.meta = spec.meta || null;
	
	that.log = [];
	
	return that;
};

Emma.Log = function(spec){

	var that = {};
	
	that.date = spec.date || null;
	that.value = spec.value || null;
	
	return that;
}


//Parser
Emma.PARSER = {};

Emma.PARSER.parseNode = function(json){

	var hosts = [];
	var model = JSON.parse(json);
	for(var i=0;i<model.payload.length;i++) {
		//instanciate an host
		var host = new Emma.Host({
			ip:model.payload[i].Host,
		});		
		//for each resource
		for(var j=0;j<model.payload[i].ressources.length;j++){
			var text = "";
			//get data
			if(model.payload[i].ressources[j].data){
				var name = model.payload[i].ressources[j].name;
				var uri,data,meta,status,report;
				//status and report resources are saved in host object
				if(name === "status") host.status = model.payload[i].ressources[j].value;	
				else if(name === "report") host.report = model.payload[i].ressources[j].data;
				else {
					//iterate on each element of data array (fu data representation!)
					for(var child in model.payload[i].ressources[j].data){
						//if has uri property, save uri property
						if(model.payload[i].ressources[j].data[child].uri)
							uri = model.payload[i].ressources[j].data[child].uri;
						//and so on ...	
						if(model.payload[i].ressources[j].data[child].data)
							data = model.payload[i].ressources[j].data[child].data;
						if(model.payload[i].ressources[j].data[child].meta)
							meta = model.payload[i].ressources[j].data[child].meta;											
					}
					//if all needed properties have been found
					if(name && uri && data && meta){
						//instanciate resource object
						var resource = new Emma.Resource({
							type:name,
							name:name,
							uri:uri,
							data:data,
							meta:meta,
						});
						if(model.payload[i].ressources[j].log)resource.log = model.payload[i].ressources[j].log;
						host.resource.push(resource);
					}
				} 
			}	
		}	
		hosts.push(host);
	}
	return hosts;
};

Emma.PARSER.parseMessage = function(json){
	
	var model = JSON.parse(json);
	if(model.message){
		var message = JSON.parse(model.message[1]);
		return message;
	}
};

Emma.PARSER.parseLog = function(){
	var model = JSON.parse(json);
	var hosts = [];
	for(var i=0;i<model.payload.length;i++) {
		//instanciate an host
		var host = new Emma.Host({
			ip:model.payload[i].Host,
		});
		
		for(var j=0;j<model.payload[i].ressources.length;j++){
			var resource = new Emma.Resource({
				name:model.payload[i].ressources[j].name,
			});
			for(var k=0;k<model.payload[i].ressources[j].log.length;k++){
				resource.log.push(new Emma.Log({
					date: model.payload[i].ressources[j].log[k].date,
					value: model.payload[i].ressources[j].log[k].value
				}));
			}
			
			host.resource.push(resource);
		}	
		hosts.push(host);
	}
	return hosts;
};

Emma.PARSER.parseData = function(){
	var model = JSON.parse(json);
	var date = model.date;
	var host = new Emma.Host({
		ip:model.headers.x_real_ip,
	});
	for(var i=0;i<model.payload.length;i++) {
		var resource = new Emma.Resource({
			name:model.payload[i].name,
		});
		
		var log = new Emma.Log({
			date: date,
			value : model.payload[i].value,
		});
		
		resource.log.push(log);
		host.resource.push(resource);
	}
	return host;
		

};

//encoder

Emma.PARSER.stringifyHost = function(hosts){
	var result = {};
	result.type = "node";
	result.payload = [];
	
	for(var i in hosts){
		var content = {};
		content.Host = hosts[i].ip;
		result.payload.push(content);
	}
	
	return result;
	
	
};

Emma.PARSER.stringifyResource = function(hosts){
	var result = {};
	result.type = "node";
	result.payload = [];
	
	for(var i in hosts){
		var content = {};
		content.Host = hosts[i].ip;
		content.ressources = [];
		for(var j in hosts[i].resource){
			var resource = {};
			resource.name = hosts[i].resource[j].name;
			resource.data = [];
			resource.data.push({uri:hosts[i].resource[j].uri});
			resource.data.push({meta:hosts[i].resource[j].meta});
			resource.data.push({data:hosts[i].resource[j].data});
			content.ressources.push(resource);
		}
		result.payload.push(content);
	}
	
	return result;
};

Emma.PARSER.stringifyLog = function(hosts){
	var result = {};
	result.type = "log";
	result.payload = [];
	
	for(var i in hosts){
		var content = {};
		content.Host = hosts[i].ip;
		content.ressources = [];
		for(var j in hosts[i].resource){
			var resource = {};
			resource.name = hosts[i].resource[j].name;
			resource.log = hosts[i].resource[j].log;
			content.ressources.push(resource);
		}
		result.payload.push(content);
	}
	
	return result;
};

//utils

Emma.init = function(model){
	Emma.root = model;
};

Emma.findHost = function(host){
	if(host === "*"){
		return Emma.root;
	}
	else{
		for(var i in Emma.root){
			if(Emma.root[i].ip === host){
				var result = [];
				result.push(Emma.root[i]);
				return result;
			}
		}
	}
};

Emma.findResource = function(host,resource){
	var result = [];
	if(host === "*"){
		if(resource === "*"){
			return Emma.root;
		}
		else{
			for(var i in Emma.root){
				var res = [];
				for(var j in Emma.root[i].resource){
					if(Emma.root[i].resource[j].name === resource){
						res.push(Emma.root[i].resource[j]);
					}
				}
				if(res.length > 0){
					//Emma.root[i].resource = res;
					var host = new Emma.Host({ip:Emma.root[i].ip});
					host.resource = res;
					result.push(host);
				}
				
				
			}
		}
	}
	else{
		if(resource === "*"){
			for(var i in Emma.root){
				if(Emma.root[i].ip === host){
					result.push(Emma.root[i]);
				}
			}

		}
		else{
			for(var i in Emma.root){
				if(Emma.root[i].ip === host){
					var res = [];
					for(var j in Emma.root[i].resource){
						
						if(Emma.root[i].resource[j].name === resource){
							res.push(Emma.root[i].resource[j]);
						}
					}
					
					if(res.length > 0){
						var host = new Emma.Host({ip:Emma.root[i].ip});
						host.resource = res;
						result.push(host);
					}
				}
			}
		}
	}
	return result;
}




exports.Emma = Emma;


