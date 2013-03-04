
var http = require('http'),
	fs = require('fs'),
	parseUrl = require('url').parse;

var priv = {
	aliases : [],
	apiReg : /^\/?server\/~aliases(?:\/([^\/?]*)|$)/g,
};

exports.name = 'AliasManager';


function reparseAliases(cb) {
	fs.readFile(global.conf.dir.replace(/\/$/g,'') + '/aliases', function(err, data) {
		if (!err && data) {
			parseAliases(data);
		}
	}, 'utf-8');
}

function reparseAliasesSync() {
	var data;
	try {
		data = fs.readFileSync(global.conf.dir.replace(/\/$/g,'') + '/aliases', 'utf-8');
	} catch(err) {
		data = null;
	}
	if (data) {
		parseAliases(data);
	}
}

function parseAliases(data) {
	var arr = [],
		aliases = [], 
		lines, line, i, j, index, currentRule, type, typeSymbol;
	lines = data.replace(/(\r?\n)+/g,'\n').replace(/(?:(?:^|\s+)#.*$|^\s+|\s+$)/gm,'').split('\n');
	for (i=0; i<lines.length; i++) {
		line = trim(lines[i]);
		if (!line) {
			continue;
		}
		if ((index=line.indexOf('=>'))>-1) {
			type = 'redirect';
			typeSymbol = '=>';
		}
		else if ((index=line.indexOf('>>'))>-1) {
			type = 'proxy';
			typeSymbol = '>>';
		}
		else {
			index = -1;
		}
		if (index===-1) {
			if (line) {
				aliases.push( trim(line) );
			}
		}
		else {
			if (index>0) {
				aliases.push( trim(line.substring(0,index)) );
			}
			for (j=0; j<aliases.length; j++) {
				arr.push({
					type : type,
					typeSymbol : typeSymbol,
					patternStr : trim(aliases[j]),
					pattern : new RegExp('^' + trim(aliases[j]).replace(/(^\^|\$$)/g,'').replace(/([\\\/])/g,'\\$1') + '$', 'g'),
					replacement : trim(line.substring(index+2))
				});
			}
			type = typeSymbol = null;
			aliases = [];
		}
	}
	//console.log(arr);
	priv.aliases = arr;
}

function trim(s) {
	return s.replace(/(^\s+|\s+$)/g,'');
}





// @note: review node docs to see if this is correct:
priv.proxy = function(url, req, res) {
	var clientReq, i,
		headers = {},
		urlParsed = parseUrl(url);
	
	req.setEncoding('utf8');
	
	for (i in req.headers) {
		if (i!=='host' && i!=='connection') {
			headers[i] = req.headers[i];
		}
	}
	
	clientReq = http.request({
		port : (urlParsed.hostname ? urlParsed.port : global.conf.port) || 80, 
		hostname : urlParsed.hostname || global.conf.domain || 'localhost',
		method : req.method,
		path : urlParsed.path,
		headers : headers,
		auth : urlParsed.auth
	}, function(clientRes) {
		//console.log('---res: '+clientRes);
		//console.log('status: ', clientRes.statusCode);
		//console.log('headers: ', clientRes.headers);
		//clientRes.setEncoding('utf8');
		res.writeHead(clientRes.statusCode, clientRes.headers);
		clientRes.on('data', function(data) {
			//console.log(data.toString('base64'));
			res.write(data);
		});
		clientRes.on('end', function() {
			//console.log('---res->end');
			res.end();
			headers = clientReq = clientRes = url = req = res = null;
		});
	});
	
	req.on('data', function(data) {
		clientReq.write(data);
	});
	req.on('end', function() {
		clientReq.end();
	});
};



exports.handle = function(url, req, res) {
	var i, alias, m, r, ret;
	for (i=0; i<priv.aliases.length; i++) {
		alias = priv.aliases[i];
		alias.pattern.lastIndex = 0;
		m = alias.pattern.exec(req.url);
		if (m) {
			//console.log(url, m);
			url = req.url.replace(alias.pattern, alias.replacement);
			if (alias.type==='proxy') {
				priv.proxy(url, req, res, alias, m);
			}
			else if (alias.type==='redirect') {
				res.writeHead(302, {
					'Location' : url
				});
				res.end('302 Found: <a href="' + url + '">'+url+'</a>');
			}
			else {
				res.writeHead(500);
				res.end('Configuration Error: Unknown alias rule type for rule: ' + alias.patternStr + alias.patternTypeSymbol + alias.replacement);
			}
			return true;
		}
	}
	priv.apiReg.lastIndex = 0;
	if ((m=priv.apiReg.exec(req.url))) {
		r = m[1];
		ret = {};
		if (r==='reparse' || r==='parse') {
			reparseAliasesSync();
			ret.message = 'Aliases re-parsed, ' + priv.aliases.length + ' found.';
		}
		else if (r==='list') {
			ret.message = 'Listing ' + priv.aliases.length + ' aliases.';
			ret.aliases = [];
			for (i=0; i<priv.aliases.length; i++) {
				ret.aliases.push({
					type : priv.aliases[i].type,
					pattern : priv.aliases[i].patternStr,
					target : priv.aliases[i].replacement
				});
			}
		}
		else {
			ret.message = 'Try /reparse or /list';
		}
		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end(JSON.stringify(ret));
		return true;
	}
	return false;
};




reparseAliasesSync();
