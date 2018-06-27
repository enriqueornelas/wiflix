var doneLoading = false;
var stopAnimating = false;
var moviesLoaded = 0;
$(window).on("load", function() {
	$("#title").fadeIn("slow");
	$("#sub-title-1").delay(1000).fadeIn(900);
	$.when($("#sub-title-2").delay(2250).fadeIn("slow")).done(function() {
		$.when($("#top-holder").delay(550).fadeOut(900)).done(function() {
			showMovies();
		});
	});
	$(".movie-holder").click(function() {
		window.location.href="./play/"+($(this).data("movie-id"));
	});
	$("body").on("keyup", "#search", function(e) {
		var search = $(this).val().toLowerCase().trim();
		if(!doneLoading)
		{
			stopAnimating = true;
			$.when($(".movie-cell").stop().show()).done(function() {
				doneLoading = true;
				$(".movie").each(function() {
					var movieElem = $(this);
					if(movieElem.text().toLowerCase().indexOf(search) > -1)
					movieElem.parent().stop().fadeIn(240);
					else
					movieElem.parent().stop().fadeOut(200);
				});
			});
		}
		else {
			$(".movie").each(function() {
				if($(this).text().toLowerCase().indexOf(search) > -1)
				$(this).parent().stop().fadeIn(240);
				else
				$(this).parent().stop().fadeOut(200);
			});
		}
	});
	$("body").on("click", "#top-holder", function() {
		$.when($("#top-holder").stop().fadeOut()).done(function() {
			showMovies()
		});
	});
});
function showMovies() {
	$("body").removeClass("hide-overflow");
	$("#search, #search-holder").removeClass("hidden").animate({ opacity : 1 }, "slow");
	$("#movies-holder").show().css("display", "flex");
	var timeout = 0;
	var timeoutMargin = 75;
	var fadeInTime = 370;
	var fadeInTimeDifference = 10;
	$(".movie-cell").each(function() {
		var _t = $(this);
		timeout += timeoutMargin;
		(function(_this, _timeout) {
			setTimeout(function() {
				if(stopAnimating)
				return;
				$.when(_this.fadeIn(fadeInTime)).done(function() {
					if(fadeInTime >= fadeInTimeDifference)
					fadeInTime -= fadeInTimeDifference;
					else {
						fadeInTime = 250;
						timeoutMargin = 10;
					}
					_this.find(".movie").addClass("movie-animation");
					moviesLoaded+=1;
					if(moviesLoaded == $(".movie-cell").length)
					{
						doneLoading = true;
						$(".closing").removeClass("hidden");
					}
				});
			}, _timeout);
		})(_t, timeout);
	});
}