var urlFilter = /\.(php[1-9]*|phtml)$/gi;

exports.toString = function(){ return 'PHP Env'; };

exports.handle = function(url, req, res) {
		var args;
		url = require('url').parse(req.url, true);
		url.pathname = url.pathname.replace(/^\/+/g,'');
		urlFilter.lastIndex = 0;
		if (urlFilter.test(url.pathname)) {
			req.setEncoding('utf-8');
			req.on('data', function(data) {
				req.body = (req.body || '') + data;
			});
			req.on('end', function() {
				args = {
					url : url,
					get : url.query,
					post : require('querystring').parse(req.body)
				};
				require('fs').readFile(url.pathname, 'utf-8', function(err, code) {
					var proc, status=200, stdout='', stderr='', headerKey=Math.round(Math.random()*999999999).toString(36);
					if (err) { res.writeHead(404); res.end(url.pathname+' Not Found'); return; }
					code = "$g = json_decode(rawurldecode('"+encodeURIComponent(JSON.stringify(args))+"'),TRUE);\n\
						$_GET=$g['get'];\n\
						$_POST=$g['post'];\n\
						$_REQUEST=array_merge($_GET,$_POST);\n\
						$_SERVER['PHP_SELF'] = $_SERVER['SCRIPT_FILENAME'] = $_SERVER['SCRIPT_NAME'] = $g['url']['pathname'];\n\
						$_SERVER['DOCUMENT_ROOT'] = $_SERVER['PWD'];\n\
						$_SERVER['REQUEST_URI'] = $g['url']['path'];\n\
						function shittyPreprocessor_header($t){echo '==_____HEADERLINE_____"+headerKey+"=='.$t.'\n';}\n" 
					+ code.replace(/(^\s*?<\?php|\?>\s*?$)/g,'').replace(/(\b)header(\s*?\()/gi, '$1shittyPreprocessor_header$2');
					proc = require('child_process').spawn('php', ['-r', code], { cwd : process.cwd });
					proc.stdout.on('data', function(data) {
						stdout += data;
					});
					proc.stderr.on('data', function(data) {
						stderr += data;
					});
					proc.on('exit', function() {
						var headers = {},
							body;
						if (stderr) { res.writeHead(500); res.end(stderr+''); return; }
						// parse out header lines
						body = stdout.replace(/(^|\r?\n)==_____HEADERLINE_____([a-z0-9]+)==([^\n]*)/gi, function(s, pre, key, h) {
							var s = h.split(':'),
								k = s[0].replace(/(^\s+|\s+$)/g,'').toLowerCase(),
								v;
							if (key!==headerKey) {
								return s;
							}
							if (s.length===1 && k.match(/^http\/[0-9]\.[0-9]\s/gi)) {
								status = parseInt(k.split(' ')[1], 10);
							}
							else {
								v = s.slice(1).join(':').replace(/(^\s+|\s+$)/g,'');
								if (headers.hasOwnProperty(k)) {
									if (Object.prototype.toString.call(headers[k])!=='[object Array]') {
										headers[k] = [headers[k]];
									}
									headers[k].push(v);
								}
								else {
									headers[k] = v;
								}
							}
							return '';
						});
						body = body.replace(/^\n/g,'');
						res.writeHead(status || 200, headers);
						res.end(body);
						proc = stdout = stderr = url = req = res = null;
					});
				});
			});
			return true;
		}
		return false;
};
