var bootSpin;
var titleLogo;

boot();

function boot() {
	console.log("boot...");
	bootSpin = document.createElement("div");
	titleLogo = document.createElement("img");
	document.body.appendChild(bootSpin);
	bootSpin.id = "boot_spin";
	bootSpin.class = "round";
	var xhr;
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	} else {
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.responseType = "blob";
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			titleLogo.src = "resources/title.png";
			titleLogo.id = "title_logo";
			titleLogo.style.display = "none";
			$("body").prepend(titleLogo);
			$("#title_logo").fadeIn();
		}
	}
	xhr.open("GET", "resources/title.png", true);
	xhr.send();
}
