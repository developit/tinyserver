tinyserver
==========
A very small CLI web server built using Node.JS.  

Uses
----
*A few things tinyserver is good at:*

- Creating quick static fileservers in a directory
- Rapid prototyping of APIs.
- Running a simple, manageable local server setup. *(instead of trying to manage mirroring a production setup)*
- Serving up PHP in the **worst way you could possibly imagine**. [*(seriously, this is wrong on so many levels)*](server-modules/php.server.js)

---

Running
=======

Run a basic server
------------------
*Listens on the default port of 8080, with all modules enabled.*

	node server.js

---

Specifying Options
==================
	node server.js option1=value option2=value

Available Options
-----------------
**`port` - Listen on the given port**  
*Defaults to 8080*  
**`dir` - Serve content from the given directory**  
*Defaults to the working directory.*  
**`host` - Accept requests to the given hostname.**  
*Defaults to "\*" (all)*  
**`modules_dir` - Where to look for modules**  
*Defaults to "./server-modules"*  
**`modules_ext` - File extension for modules**  
*Defaults to ".server.js"*  

Example
-------
	node server.js port=1337 dir=$PWD

---

Modules
=======


