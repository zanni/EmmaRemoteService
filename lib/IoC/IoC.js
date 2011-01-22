var IoC = {};

exports.makeProvider = function(interface){
	
	return new IoC.provider(interface);
	
};



var error = function(name, message){
	var err = new Error();
	err.name = "[IoC] - "+name+" error";
	err.message = message;
	return err;
};

IoC.provider = function(interface){
	
	//private properties
	var that = {};
	
	that.services = [];
	try{
		that.interface = new interface();
	}
	catch(err){
		//console.log("[IoC] - interface as to be implemented as a class, not a JSON object");
		throw error("provider initialization","interface as to be implemented as a class, not a JSON object");
	}	
	//public properties
	this.addService = function(name, service){
		//check service interface
		for(var attr in that.interface){
			if(!service.hasOwnProperty(attr)){
				throw error("add service", "service "+name+" doesn't implement the correct interface");
			} 				
		}
		that.services[name] = service;
	};	
	this.getService = function(name){
		if(that.services[name]) return that.services[name];
		else throw error("get service", "service "+name+" is not provided");
	};
	this.hasService = function(name){
		if(that.services[name])return true;
		else return false;
	};
	
};

