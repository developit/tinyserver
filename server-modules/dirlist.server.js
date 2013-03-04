var fs = require('fs'),
	path = require('path'),
	reg = /^(.+)$/g;

exports.toString = function(){ return "Directory Listing"; };

function isDir(path) {
	var f;
	try {
		f = fs.statSync(path);
	} catch(err) {
		return false;
	}
	return f && f.isDirectory();
}
function html(t) {
	var f = {'<':'&lt;','>':'&gt;','&':'&amp;'};
	return t.replace(/[<>&]/g,function(s){ return f[s] || s; });
}

exports.handle = function(url, req, res) {
	var m, b;
	reg.lastIndex = 0;
	if (m=reg.exec(url)) {
		b = conf.dir + '/' + m[1];
		if (isDir(b)) {
			if (path.existsSync(b+'/index.html')) {
				url = req.url.replace(/\/+$/g,'')+'/index.html';
				res.writeHead(302, {
					'Location' : url
				});
				res.end('302 Found: <a href="' + url + '">'+url+'</a>');
				return true;
			}
			if (m[1].charAt(m[1].length-1)!=='/') {
				res.writeHead(301, { 'Location':(req.url.indexOf('?')>0 ? req.url.replace('?','/?') : (req.url+'/')) });
				res.end('This document has moved to ' + (req.url.indexOf('?')>0 ? req.url.replace('?','/?') : (req.url+'/')));
				return true;
			}
			fs.readdir(b, function(err, files) {
				res.write('<!DOCTYPE html>\n<html><body><h1>Index of '+html(m[1].replace(/\/$/,''))+'</h1><ul>');
				if (!err) {
					res.write('<li><a href="..">Parent Directory</a></li>');
					files.forEach(function(file) {
						if (file[0]!=='.' || conf.dirlist_showhidden) {
							res.write('<li><a href="'+html(file)+'">'+html(file)+'</a></li>');
						}
					});
				}
				res.end('</ul><address>Tiny Server at '+conf.host+' Port '+conf.port+'</address></body></html>');
			});
			return true;
		}
	}
	return false;
};
