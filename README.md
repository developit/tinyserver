tinyserver
==========
A very small CLI web server built using Node.JS.  

Uses
----
*A few things tinyserver might be able to help you out with:*

- Quickly serving static files from a directory
- Rapid prototyping of APIs. *(using the API Router module)*
- Running a simple, manageable local server setup. *(instead of trying to manage mirroring a production setup)*
- Serving up PHP in the **worst way you could possibly imagine**. [*(seriously, this is wrong on so many levels)*](server-modules/php.server.js)

---

Run a basic server
==================
> *Listens on the default port of 8080, with all modules enabled.*  
> `node server.js`

Specify Options
---------------
> Just pass them as space-separated key-value pairs.  
> `node server.js option1=value option2=value`


Available Options
-----------------
> `port` --- **Listen on the given port.**  
> *Defaults to 8080*
> 
> `dir` --- **Serve content from the given directory**  
> *Defaults to the working directory.*
> 
> `host` --- **Accept requests to the given hostname.**  
> *Defaults to "\*" (all)*
> 
> `modules_dir` --- **Where to look for modules**  
> *Defaults to "./server-modules"*
> 
> `modules_ext` --- **File extension for modules**  
> *Defaults to ".server.js"*

Example
-------
```bash
node server.js port=1337 dir=$PWD
```

---

---

Modules
=======

Aliases `aliases.server.js`
---------------------------
Adds simple URL redirection and internal proxying, specified in a tiny configuration file.

**Usage**  
Place a file `aliases` in your web root.  
It should contain a configuration of the following format:   
>	Statements are newline-separated groups of "`pattern` `[operator]` `replacement`".  
>	`[operator]` can be either `=>` or `>>` - meaning `redirect` or `proxy`, respectively.  
>	Statements are evaluated in-order until the first match is found.  
>	For comments, everything after a `#` character is omitted from each line.  

*Redirect URLs matching a pattern:*  
`/pattern/(.*?)$ => /replacement/$1`  

*Proxy requests to URLs matching a pattern:*  
`/another-pattern/(.*?)$ >> http://example.com/$1?foo=bar`  

**Sample Config File**  
```bash
# Configuration for tinyserver alias module

# Redirect index.html to root:
/index.html => /

# Proxy all API calls to production:
/api/(.+)$ >> http://prod.example.com/api/$1

# Make all app urls return the bootstrap HTML page:
/app/(.+)$ >> /app/
```

---

API Router `api.server.js`
--------------------------
Adds extremely basic API routing, and a `/server/info` API for querying the server's stats.

**Usage**
By default, the module just exposes the `/server/info` API URL.  
To add your own routes, add server plugins written something like this:  

```JavaScript
process.nextTick(function() {
	// Ensure the API module exists
	if (!global.apiRoutes) {
		return console.error('API module not available.');
	}
	
	// This is a "modifier" route, because it returns false. 
	// Other matching routes will be executed.
	global.apiRoutes['^/api/.*$'] = function(matches, req, res) {
		// wait... is this middleware?
		res.reply = function(response) {
			this.writeHead(200, {
				'content-type' : 'application/json'
			});
			this.end(JSON.stringify(response));
		};
		return false;
	};
	
	// This is a "final" route. 
	// If the URL matches, no other routes will be executed.
	global.apiRoutes['^/api/login$'] = function(matches, req, res) {
		// use that silly middleware:
		res.reply({
			result : true,
			message : "Hello!"
		});
	};
});
```

---

Directory Listings `dirlist.server.js`
--------------------------------------
Adds HTML directory listings if you request a directory URL. They look intentionally similar to Apache's.

**Usage**  
Nothing special to do here, just enable the module and it turns on directory listing pages.

---

PHP Horrible Idea That Should Never Have Been Written `php.server.js`
---------------------------------------------------------------------
Adds PHP scripting support in **the absolute most disgusting way possible**.  
> If you enable this on a public-facing server, you will get hacked.  
> Or at least laughed at.  
> By Me.  

**Usage**  
If you have the module included, it will execute PHP scripts when they are requested (anything ending in .php).  
It's a disgusting crime against humanity, and you should be ashamed to even have read this.
