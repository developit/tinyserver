#!/usr/bin/env node
global.conf={ dir:__dirname, port:8080, host:'*', modules_ext:'.server.js', modules_dir:'server-modules', modules:{} }; global.mimes=('text/plain html text/html js text/javascript css text/css json application/json xml application/xml').split(' '); global.fs=require('fs'); global.path=require('path');
process.argv.slice(2).forEach(function(arg){ conf[(arg=arg.split('='))[0]] = arg.slice(1).join('='); });
(fs.readdirSync(conf.modules_dir) || []).forEach(function(m){ if(m && m[0]!=='.' && m.substring(m.length-conf.modules_ext.length)===conf.modules_ext) conf.modules[path.basename(m,conf.modules_ext)]=require(path.resolve(conf.modules_dir+'/'+m)); });
console.log( 'Starting server...\n' + require('util').inspect(conf, false, 1, true).replace(/([{},](\n\s*)?)+/g,' \n').trim() );
require('http').createServer(function(req, res) {
	var i, file=decodeURIComponent(require('url').parse(req.url, false).pathname), fp=file.replace(/\/$/g,'/index.html');
	for(i in conf.modules){ try{ if(conf.modules[i].handle && conf.modules[i].handle(file, req, res)===true) return; }catch(e){res.writeHead(500);res.end('Module error: '+i+':\n'+e.message); return; } }
	fs.open(conf.dir + fp, 'r', function(err, fd){
		conf.log && console.log(err?400:200,req.method,conf.dir+fp);
		res.writeHead(err?404:200, { 'Content-Type':mimes[err?-1:mimes.indexOf(path.extname(fp).substring(1))+1] });
		err ? res.end('404 Not Found\n'+fp) : fs.createReadStream(conf.dir+fp, {fd:fd}).pipe(res);
	});
}).listen(conf.port, conf.host.replace('*','') || null);
console.log('Running at '+(conf.baseUrl='http://'+conf.host+':'+conf.port+'/'));
