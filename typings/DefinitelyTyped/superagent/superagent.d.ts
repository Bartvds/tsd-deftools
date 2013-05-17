
//raw definitions for superagent

interface SuperAgent {
	get(url:string, data?:SuperAgentData):SuperAgentRequest;
	get(url:string, data?:string):SuperAgentRequest;
	post(url:string, data?:SuperAgentData):SuperAgentRequest;
	post(url:string, data:string):SuperAgentRequest;
	put(url:string, data?:SuperAgentData):SuperAgentRequest;
	put(url:string, data:string):SuperAgentRequest;
	head(url:string):SuperAgent;
	del(url:string):SuperAgent;
}
interface SuperAgentRequest {


	data(value:SuperAgentData):SuperAgentRequest;
	data(value:string):SuperAgentRequest;

	send(data:SuperAgentData):SuperAgentRequest;
	send(data:string):SuperAgentRequest;

	query(data:SuperAgentData):SuperAgentRequest;
	query(data:string):SuperAgentRequest;

	field(name:string, value:any):SuperAgentRequest;
	attach(name:string, path:string):SuperAgentRequest;

	type(contentType:string):SuperAgentRequest;
	part():SuperAgent;

	redirects(limit:number):SuperAgentRequest;
	on(event:string, callback:any):SuperAgentRequest;

	set(header:string, value:string):SuperAgentRequest;
	end(callback:(res:SuperAgentResponse) => void):void;
}


interface SuperAgentResponse  {
	body:any;
	text:string;
	header:SuperAgentHeaders;
	headers:SuperAgentHeaders;
	type:string;
	charset:string;

	status:number;
	statuCode:number;
	statusType:number;

	// basics
	info:bool;
	ok:bool;
	clientError:bool;
	serverError:bool;
	error:SuperAgentError;

	// sugar
	accepted:bool;
	noContent:bool;
	badRequest:bool;
	unauthorized:bool;
	notAcceptable:bool;
	notFound:bool;
}

interface SuperAgentError {
	status:number;
	message:string;
}
interface SuperAgentData {
	[name: string]: any;
}
interface SuperAgentHeaders {
	[name: string]: string;
}