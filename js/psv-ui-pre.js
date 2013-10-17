//var bootSpin;
var RES_URLS_BOOT = new Array(
	"js/jquery-1.10.2.min.js",
	"js/psv-ui.js",
	"js/Detector.js",
	"js/three.min.js",
	"js/stats.min.js",
	"js/webgl.js");
var bootFileSizeTotal = 0;
var bootFileSizeCounted = 0;
var bootFileSizeLoaded;
var bootPercentage = 0;

boot1();

function boot1() {
	console.log("boot1(loading spin and file header)");
	/*var xhr;
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
			console.log("korsc");
		}
	}
	//xhr.addEventListener("progress", onUpdateProgress, false); 
	xhr.open("GET", "resources/boot_spin.png", true);
	xhr.send();*/
	var xhrArray = new Array();
	for (var i = 0; i < RES_URLS_BOOT.length; i++) {
		xhrArray[i] = new XMLHttpRequest();
		xhrArray[i].open("HEAD", RES_URLS_BOOT[i], true);
		xhrArray[i].send();
		xhrArray[i].addEventListener("readystatechange", function(){
			if (this.readyState == 4 && this.status == 200) {
				bootFileSizeCounted++;
				bootFileSizeTotal += parseInt(this.getResponseHeader("Content-Length"));
				if(bootFileSizeCounted == RES_URLS_BOOT.length){
					console.log("boot1(finished, size of files to be loaded:"+" "+bootFileSizeTotal+")");
					boot2();
				}
			}
		}, false);
	}
}

function boot2(){
	console.log("boot2(loading files' content, be patient)");

	var xhrArray = new Array();
	bootFileSizeLoaded = new Array(RES_URLS_BOOT.length);

	for (var i = 0; i < RES_URLS_BOOT.length; i++) {
		bootFileSizeLoaded[i] = 0;
		xhrArray[i] = new XMLHttpRequest();
		xhrArray[i].open("GET", RES_URLS_BOOT[i], true);
		xhrArray[i].send();
		xhrArray[i].addEventListener("readystatechange", function(e){
			if (this.readyState == 4 && this.status == 200) {
				if(bootPercentage == 1) console.log("boot2done!");
			}
		}, false);
		xhrArray[i].addEventListener("progress", function(e){
			for(var i = 0; i < xhrArray.length; i++){
				if(this == xhrArray[i]){
					bootFileSizeLoaded[i] = e.position;
					var sum = 0;
					for(x in bootFileSizeLoaded){
						sum += bootFileSizeLoaded[x];
					}
					bootPercentage = sum / bootFileSizeTotal
					console.log(bootPercentage);
				}
			}
		}, false);
	}
}