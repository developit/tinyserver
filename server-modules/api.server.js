
var routes = {
	'^/server/stop/?$' : function(m, req, res) {
		res.writeHead(200), res.end('stopping');
		//require('child_process').exec(process.argv.join(' ').replace(/\s&$/g,'')+' &');
		process.exit();
	},
	'^/server/info/?$' : function(m, req, res) {
		var os = require('os'),
			props = [],
			obj = {},
			url = require('url').parse(req.url, true),
			op, i, j;
		res.writeHead(200, {'content-type':'text/javascript'});
		for (i in os) {
			if (os.hasOwnProperty(i) && os[i].call && i!=='getNetworkInterfaces') {
				props.push(i);
			}
		}
		if (url.query.list) {
			obj = props;
		}
		else {
			if (url.query.name) {
				props = [].concat(url.query.name || []);
			}
			for (i=0; i<props.length; i++) {
				if (os.hasOwnProperty(props[i]) && os[props[i]].call && props[i]!=='getNetworkInterfaces') {
					obj[props[i]] = os[props[i]]();
				}
			}
		}
		op = JSON.stringify(obj);
		if (url.query.callback) {
			op = url.query.callback + '(' + op + ')';
		}
		res.end(op);
	}
};

exports.name = 'API';

exports.handle = function(url, req, res) {
	var k, m, r;
	for (k in routes) {
		if ((m=new RegExp(k.replace(/([\\\/])/g,'\\$1'),'g').exec(url)) && 
			routes[k](m, req, res)!==false) {
			return true;
		}
	}
	return false;
};
