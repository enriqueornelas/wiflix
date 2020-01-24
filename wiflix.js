var fs = require("fs");
var path = require("path");
if(!fs.existsSync(path.join("./", "movies"))) {
	fs.mkdirSync(path.join("./", "movies"));
}
var ip = require("ip");
var express = require("express");
var shortid = require("shortid");
var expressNunjucks = require("express-nunjucks");
var chokidar = require("chokidar");
var app = express();
console.log(" __          ___  __ _ _         __    __   _____  ");
console.log(" \\ \\        / (_)/ _| (_)       / /   /_ | / _ \\ \\ ");
console.log("  \\ \\  /\\  / / _| |_| |___  __ | |_   _| || | | | |");
console.log("   \\ \\/  \\/ / | |  _| | \\ \\/ / | \\ \\ / / || | | | |");
console.log("    \\  /\\  /  | | | | | |>  <  | |\\ V /| || |_| | |");
console.log("     \\/  \\/   |_|_| |_|_/_/\\_\\ | | \\_/ |_(_)___/| |");
console.log("                                \\_\\            /_/ ");
console.log("                                                   ");
console.log("Loading Wiflix v1.0, please wait a moment...");
var args = require("minimist")(process.argv.slice(2), {
	string : ["port", "moviesdir"]
});
var options = {
	port : parseInt(args["port"]) || 80,
	moviesFolder : args["moviesdir"] ? path.resolve(args["moviesdir"]) || path.join(__dirname, "movies") : path.join(__dirname, "movies")	
};
if(options.moviesFolder.indexOf("/") > -1 && !options.moviesFolder.endsWith("/")) {
	options.moviesFolder += "/";
}
if(options.moviesFolder.indexOf("\\") > -1 && !options.moviesFolder.endsWith("\\")) {
	options.moviesFolder += "\\";
}
app.set("views", path.join(__dirname, "views"));
var njk = expressNunjucks(app, {
    watch: false,
    noCache: false
});
var movieNameSplitString = "_7190";
var movieFileExtensions = [".mkv",".flv",".webm",".ogg",".avi",".wmv",".yuv",".rm",".asg",".amv",".mp4",".m4v",".m4p",".mpg",".m2v",".svi"];
var mimeTypes = { "swf": "application/x-shockwave-flash", "flv": "video/x-flv", "f4v": "video/mp4", "f4p": "video/mp4", "mp4": "video/mp4", "m4v" : "video/m4v", "asf": "video/x-ms-asf", "asr": "video/x-ms-asf", "asx": "video/x-ms-asf", "avi": "video/x-msvideo", "mpa": "video/mpeg", "mpe": "video/mpeg", "mpeg": "video/mpeg", "mpg": "video/mpeg", "mpv2": "video/mpeg", "mov": "video/quicktime", "movie": "video/x-sgi-movie", "mp2": "video/mpeg", "qt": "video/quicktime", "mp3": "audio/mpeg", "wav": "audio/x-wav", "aif": "audio/x-aiff", "aifc": "audio/x-aiff", "aiff": "audio/x-aiff", "jpe": "image/jpeg", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png" : "image/png", "svg": "image/svg+xml", "tif": "image/tiff", "tiff": "image/tiff", "gif": "image/gif", "vcf": "text/x-vcard", "vrml": "x-world/x-vrml", "webm": "video/webm", "mkv": "video/mkv", "m3u8": "application/x-mpegurl", "ts": "video/mp2t", "ogg": "video/ogg", };
var movies =[];
var logging = false;
var log = logging ? function(l) { console.log("[LOG]", l) } : function() {};
function Movie(fileName, oldName) {
	this.path = options.moviesFolder+fileName;
	this.origName = fileName;
	this.ext = fileName.substring(fileName.lastIndexOf(".")+1);
	this.name = titleCase(fileName.split(movieNameSplitString)[0]);
	this.id = fileName.split(movieNameSplitString)[1].substring(0, fileName.split(movieNameSplitString)[1].lastIndexOf("."));
	this.oldName = oldName ? oldName : fileName.substring(0, fileName.indexOf(movieNameSplitString))+"."+this.ext;
}
function TempMovie(fileName) {
	this.isValid = movieFileExtensions.indexOf(fileName.substring(fileName.lastIndexOf("."))) > -1;
	this.isAlreadyMovie = this.isValid && fileName.indexOf(movieNameSplitString) > -1;
}
function addMovie(fileName, alreadyExists) {
	if(!alreadyExists) {
		var movieName = fileName.substring(0, fileName.lastIndexOf("."));
		var id = shortid.generate();
		var ext = fileName.substring(fileName.lastIndexOf("."));
		var newName = movieName+movieNameSplitString+id+ext;
		fs.renameSync(options.moviesFolder+fileName, options.moviesFolder+newName);
		log("Renaming '"+fileName+"' to '"+newName+"'");
		movies.push(new Movie(newName));
	}
	else {
		var found = false;
		for(var ind in movies) {
			if(movies[ind].origName == fileName) {
				found = true; 
			}
		}
		if(!found) {
			movies.push(new Movie(fileName));
		}
	}
	sortMovies();
}
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function titleCase(str) {
	return str.replace(/^[a-z]/, function (x) {return x.toUpperCase()});
}
function sortMovies() {
	movies.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
}						
app.use("/client", express.static(path.join(__dirname, "client")));
app.get("/", function(req, res) {
	res.render("index", { movies : movies });
});
app.get("/play/:movieid", function(req, res) {
	var movieId = req.params.movieid;
	var movie = getMovie(movieId);
	if(!movie) {
		res.redirect("../");
		return;
	}
	res.render("play", { movie : movie });
});
function getMovie(id) {
	for(var ind in movies) {
		if(movies[ind].id == id) {
			return movies[ind];
		}
	}
}
app.get("/movie/:movieid", function(req, res, next) {
	var movieId = req.params.movieid;
	var movie = getMovie(movieId);
	if(!movie) {
		res.end("No movie found");
		return;
	}
	let file = movie.path;
	fs.stat(file, function(err, stats) {
		if(err) {
			if(err.code === "ENOENT") {
				return res.sendStatus(404);
			}
			else {
				return next(err);
			}
		}
		let range = req.headers.range;
		if(!range) {
			return res.end("");
		}
		try {
			let positions = range.replace(/bytes=/, "").split("-");
			let start = parseInt(positions[0], 10);
			let file_size = stats.size;
			let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
			let chunksize = (end - start) + 1;
			var mime;
			for(var ext in mimeTypes) {
				if(movie.ext == ext) {
					mime = mimeTypes[ext];
				}
			}
			if(!mime) {
				mime = "video/mp4";
			}
			let head = {
				"Content-Range": "bytes " + start + "-" + end + "/" + file_size,
				"Accept-Ranges": "bytes",
				"Content-Length": chunksize,
				"Content-Type": mime
			};
			res.writeHead(206, head);
			let stream_position = {
				start: start,
				end: end
			};
			let stream = fs.createReadStream(file, stream_position)
			stream.on("open", function() {
				stream.pipe(res);
			});
			stream.on("error", function(err) {
				return next(err);
			});
			} catch(e) {
			log("Error: Could not load '"+file+"'");
		}
		
	});
	
});
if(!fs.existsSync(options.moviesFolder)) {
	log("Error: '"+options.moviesFolder+"' is not a valid directory");
	return;
}
chokidar.watch(options.moviesFolder, {ignored: /(^|[\/\\])\../}).on("add", function(_path) {
	if(_path.endsWith("/") || _path.endsWith("\\")) {
		return;
	}
	var movieName = _path;
	if(movieName.indexOf("\\") > -1) {
		movieName = movieName.substring(movieName.lastIndexOf("\\")+1);
	}
	else {
		movieName = movieName.substring(movieName.lastIndexOf("/")+1);
	}
	var tempMovie = new TempMovie(movieName);
	if(tempMovie.isAlreadyMovie) {
		addMovie(movieName, true);
	}
	else if(tempMovie.isValid) {
		addMovie(movieName);
	}
	else {
		log("Error: '"+movieName+"' is not a playable file");
	}
	log("Added '"+movieName+"', Number of movies: "+movies.length);
	}).on("unlink", function(_path) {
	if(_path.endsWith("/") || _path.endsWith("\\")) {
		return;
	}
	var movieName = _path;
	if(movieName.indexOf("\\") > -1) {
		movieName = movieName.substring(movieName.lastIndexOf("\\")+1);
	}
	else {
		movieName = movieName.substring(movieName.lastIndexOf("/")+1);
	}	
	for(var ind = 0; ind < movies.length; ind++) {
		if(movies[ind].origName == movieName) {
			log("Removed '"+movies[ind].origName+"', Number of movies: "+movies.length - 1);
			movies.splice(ind, 1);
		}
	}
});
function listen() {
	app.listen(options.port, function() {
		console.log("Movies loaded from '"+options.moviesFolder+"'");
		console.log("Listening for connections at http://"+ip.address()+(options.port != 80 ? ":"+options.port : ""));
		console.log("");
		console.log("-----------------------------");
		console.log(" How to use:");
		console.log("-----------------------------");
		console.log("  1) Copy and paste your movies onto the folder '"+options.moviesFolder+"'");
		console.log("  2) Open a web browser on a device under the same Wi-Fi network as this device and visit");
		console.log("       http://"+ip.address()+(options.port != 80 ? ":"+options.port : ""));
		console.log("  3) Enjoy!");
		console.log("-----------------------------");
		console.log("");
		}).on("error", function(err) {
		if(err.code == "EADDRINUSE") {
			options.port = getRandomInt(3000, 5000);
			if(args["port"])
			console.log("Error: Port "+args["port"]+" is currently in use or unavailable, now trying port "+options.port);
			listen();
		}
	});
}
listen();