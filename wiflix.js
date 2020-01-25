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
var njk = expressNunjucks(app, {
    watch: false,
    noCache: false
});

var movieFileExtensions = [".flv",".webm",".ogg",".avi",".wmv",".yuv",".rm",".asg",".amv",".mp4",".m4v",".m4p",".mpg",".m2v",".svi"];
var mimeTypes = { "swf": "application/x-shockwave-flash", "flv": "video/x-flv", "f4v": "video/mp4", "f4p": "video/mp4", "mp4": "video/mp4", "m4v" : "video/m4v", "asf": "video/x-ms-asf", "asr": "video/x-ms-asf", "asx": "video/x-ms-asf", "avi": "video/x-msvideo", "mpa": "video/mpeg", "mpe": "video/mpeg", "mpeg": "video/mpeg", "mpg": "video/mpeg", "mpv2": "video/mpeg", "mov": "video/quicktime", "movie": "video/x-sgi-movie", "mp2": "video/mpeg", "qt": "video/quicktime", "mp3": "audio/mpeg", "wav": "audio/x-wav", "aif": "audio/x-aiff", "aifc": "audio/x-aiff", "aiff": "audio/x-aiff", "jpe": "image/jpeg", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png" : "image/png", "svg": "image/svg+xml", "tif": "image/tiff", "tiff": "image/tiff", "gif": "image/gif", "vcf": "text/x-vcard", "vrml": "x-world/x-vrml", "webm": "video/webm", "mkv": "video/mkv", "m3u8": "application/x-mpegurl", "ts": "video/mp2t", "ogg": "video/ogg", };
var movies = [];
var logging = false;
var log = logging ? function(l) { console.log("[LOG]", l) } : function() {};

function Movie(path, fileName) {
	this.path = path;
	this.ext = fileName.indexOf(".") > -1 ? fileName.substring(fileName.lastIndexOf(".")+1) : "";
	this.name = fileName.indexOf(".") > -1 ? titleCase(fileName.substring(0, fileName.lastIndexOf("."))) : fileName;
	this.id = shortid.generate();
}

function addMovie(path, fileName) {
	movies.push(new Movie(path, fileName));
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

function getMovie(id) {
	for(var ind in movies) {
		if(movies[ind].id == id) {
			return movies[ind];
		}
	}
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function listenToDirectory(directory) {
	fs.lstat(directory, function(err, stats) {
		if(err)
			return;
		if(stats.isDirectory()) {
			chokidar.watch(directory, {ignored: /(^|[\/\\])\../}).on("add", function(_path) {
				var movieName = path.basename(_path);
				var ext = movieName.substring(movieName.lastIndexOf(".")) || "";
				if(movieFileExtensions.indexOf(ext) > -1) {
					addMovie(_path, movieName);
					log("Added '"+movieName+"', Number of movies: "+movies.length);
				}
				}).on("unlink", function(_path) {
				if(_path.endsWith("/") || _path.endsWith("\\")) {
					return;
				}
				var moviePath = _path;
				for(var ind = 0; ind < movies.length; ind++) {
					if(movies[ind].path == moviePath) {
						log("Removed '"+movies[ind].origName+"', Number of movies: "+movies.length - 1);
						movies.splice(ind, 1);
					}
				}
			}).on("error", function() { });
		}
	});
}

console.log(" __          ___  __ _ _         __    ___    _____  ");
console.log(" \\ \\        / (_)/ _| (_)       / /   |__ \\  / _ \\ \\ ");
console.log("  \\ \\  /\\  / / _| |_| |___  __ | |_   __ ) || | | | |");
console.log("   \\ \\/  \\/ / | |  _| | \\ \\/ / | \\ \\ / // / | | | | |");
console.log("    \\  /\\  /  | | | | | |>  <  | |\\ V // /_ | |_| | |");
console.log("     \\/  \\/   |_|_| |_|_/_/\\_\\ | | \\_/|____(_)___/| |");
console.log("                                \\_\\              /_/");

console.log("Loading Wiflix v2.0, please wait a moment...");

var args = require("minimist")(process.argv.slice(2), {
	string : ["port", "moviesdir"]
});

var moviesFolders = args["moviesdir"] ? args["moviesdir"] : path.join("./", "movies");

if(typeof moviesFolders == typeof "")
	moviesFolders = [moviesFolders];

moviesFolders.push("./movies/");

for(var ind in moviesFolders) {
	var absPath = path.resolve(moviesFolders[ind]);
	var isDir = fs.existsSync(absPath) && fs.lstatSync(absPath).isDirectory();
	if(isDir)
		moviesFolders[ind] = absPath;
}
moviesFolders = moviesFolders.filter(onlyUnique);

for(var ind in moviesFolders)
	listenToDirectory(moviesFolders[ind]);
	
var options = {
	port : parseInt(args["port"]) || 80,
	moviesFolders : moviesFolders
};

app.set("views", path.join(__dirname, "views"));
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
app.get("/movie/:movieid", function(req, res, next) {
	var movieId = req.params.movieid;
	var movie = getMovie(movieId);
	if(!movie) {
		res.end("No movie with that ID found");
		return;
	}
	let file = movie.path;
	fs.stat(file, function(err, stats) {
		if(err) {
			if(err.code === "ENOENT") {
				return res.sendStatus(404);
			}
			else {
				console.log(err);
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
			for(var ext in mimeTypes)
				if(movie.ext == ext)
					mime = mimeTypes[ext];
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
			let stream = fs.createReadStream(file, stream_position);
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

function listen() {
	app.listen(options.port, function() {
		console.log("Listening for connections at http://"+ip.address()+(options.port != 80 ? ":"+options.port : ""));
		console.log("");
		console.log("-----------------------------");
		console.log(" How to use:");
		console.log("-----------------------------");
		console.log("  1) Copy and paste your movies into one of the following folders: ["+moviesFolders.join(", ")+"]");
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
