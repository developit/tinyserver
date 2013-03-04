#!/usr/bin/env node
var conf = { dir:__dirname, port:8080, host:'localhost', modules:{} },
	mimes = ('text/plain html text/html js text/javascript css text/css json application/json xml application/xml').split(' ');
('fs http url cluster os util').split(' ').forEach(function(l){ global[l]=require(l); });
process.argv.slice(2).forEach(function(arg) { conf[(arg=arg.split('='))[0]] = arg.slice(1).join('='); });
fs.readdirSync('./').forEach(function(m){ if(m.match(/\.server\.js$/g)) conf.modules[m]=require('./'+m); });
if (cluster.isMaster && os.cpus().forEach(cluster.on('death',cluster.fork).fork)!==-1) {
	console.log( 'Starting server ('+os.cpus().length+' workers) ...\n' + require('util').inspect(conf, false, 1, true).replace(/[{},](\n\s*)?/g,' \n ').substring(3) );
	return console.log('Running at '+(conf.baseUrl='http://'+conf.host+':'+conf.port+'/'));
}
http.createServer(function(req, res) {
	var i, path = url.parse(req.url, false).pathname.replace(/\/$/g,'/index.html');
	for(i in conf.modules){ try{ if(conf.modules[i].handle && conf.modules[i].handle(path, req, res)===true) return; }catch(e){res.writeHead(500);res.end('Module error: '+i+':\n'+e.message); return; } }
	fs.readFile(conf.dir + path, function(err, data) {
		conf.log && console.log(err?400:200,req.method,conf.dir+path);
		res.writeHead(err?404:200, { 'Content-Type':mimes[err?-1:mimes.indexOf(((/\.([^\.\/]+)$/gi).exec(path) || [])[1])+1] });
		res.end(err ? ('404 Not Found\n'+path) : data);
	});
}).listen(conf.port, conf.host);