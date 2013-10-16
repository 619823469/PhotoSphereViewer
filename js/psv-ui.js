var titleLogo;

boot();
function boot() {
	console.log("boot...");
	titleLogo = document.createElement("img");
	//document.body.appendChild(bootSpin);
	var xhr;
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	} else {
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			titleLogo.src = "resources/title.png";
			titleLogo.id = "title_logo";
			titleLogo.style.display = "none";
			$("body").prepend(titleLogo);
			$(titleLogo).fadeIn(1000);
		}
	}
	xhr.open("GET", "resources/title.png", true);
	xhr.send();
}
