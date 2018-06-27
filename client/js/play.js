var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var firstTouch = true;

$(window).on("load", function() {
	var movie = $("#movie").get(0);
	if(isMobile)
	{
		$(".display-3").removeClass("display-3").addClass("display-4");
		$("body").on("click", "#mobile-overlay", function() {
			movie.play();
			if (movie.requestFullscreen) {
				movie.requestFullscreen();
				} else if (movie.mozRequestFullScreen) {
				movie.mozRequestFullScreen();
				} else if (movie.webkitRequestFullscreen) {
				movie.webkitRequestFullscreen();
			}
			$("#mobile-overlay").remove();
		});
	}
	$("body").on("keyup", function(e) {
		e.preventDefault();
		switch(e.keyCode) {
			case 32:
				movie.paused ? movie.play() : movie.pause();
				break;
			case 39:
				movie.currentTime += 35;
				break;
			case 37:
				movie.currentTime -= 35;
				break;
			case 40:
				movie.volume -= .15;
				break;
			case 38:
				movie.volume += .15;
				break;
		}
	
	});
	$("#movie-name").click(function() {
		$(this).stop();
		$("#overlay").fadeOut(500);
			if(false)
				$("body").prepend('<div id="mobile-overlay"></div>');
			movie.play();
			$("#main-section").fadeIn(700)
	});
	$.when($("#movie-name").delay(650).fadeIn(850)).done(function() {
		$.when($("#movie-name").delay(1100).fadeOut(550)).done(function() {
			$("#overlay").fadeOut(500);
			if(isMobile)
				$("body").prepend('<div id="mobile-overlay"></div>');
			movie.play();
			$("#main-section").fadeIn(700);
		});
	});
});	