var bootSpin;

bootPre();

function bootPre() {
	console.log("pre boot...");
	var xhr;
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	} else {
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			bootSpin = document.createElement("div");
			bootSpin.className = "dark_panel";
			bootSpin.id = "boot_spin";
			var img = document.createElement("div");
			img.id = "boot_spin_img";
			img.style.background = "url(\"resources/boot_spin.png\")";
			document.body.insertBefore(bootSpin, document.getElementById("gl_window"));
			document.body.insertBefore(img, document.getElementById("gl_window"));
		}
	}
	xhr.open("GET", "resources/boot_spin.png", true);
	xhr.send();
}