/**
 *PhotoSphere Viewer
 *Charles Yin
 **/

//
//val declars
var debug;
var xhr, imageURL, exif;
var fpsConsole;
var isCanvas;
var scene, camera, renderer, MAX_TEXTURE_SIZE;
var sphere, sphereGeo, material, texture;
var cube;
var cRadius, cLookX, cLookY, cLookZ, cTheta, cPhi, cDis; //cDis为相机所在位置到相近视景体近平面的垂直距离
var mIsDown, mIsDrag, mDownX, mDownY, mNowX, mNowY, mDownTheta, mDownPhi, mLastX, mLastY, mSpeed, mDirection;
var sCenterX, sCenterY, sHeight, sWidth;
var isAni, isAniStop, isAniSave, isSmoothAni, isSmoothZoomAni;
var phiSmoothDelta;
var isNewWheelVal, wheelZoomTarget, wheelZoom, wheelZoomSmooth;

init();
animate();

function init() {
	console.log("init...");
	//if(window.Worker){console.log("worker");}else{console.log("no worker");}
	debug = false;

	sWidth = $(window).width();
	sHeight = $(window).height();

	isCanvas = !Detector.webgl;

	scene = new THREE.Scene();

	cRadius = 0;
	cTheta = 90;
	cPhi = 0;
	camera = new THREE.PerspectiveCamera(75, sWidth / sHeight, 1, 100);
	camera.lookAt(new THREE.Vector3(1, 0, 0));

	sCenterX = $(window).width() / 2;
	sCenterY = $(window).height() / 2;
	cDis = sHeight / (2 * Math.tan((camera.fov / 2) * Math.PI / 180));

	imageURL = "photos/sphere.jpg"
	//loadPhotoSphere(imageURL);

	if (isCanvas) {
		renderer = new THREE.CanvasRenderer({
			antialias: true
		});
	} else {
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		MAX_TEXTURE_SIZE = renderer.context.getParameter(this.renderer.context.MAX_TEXTURE_SIZE); //get the max size of texture
	}

	renderer.setSize(sWidth, sHeight);
	//renderer.domElement.style.opacity = 0.5;  //set the opacity of the sphere
	$("#gl_window").append(renderer.domElement);

	/*
		DDD    EEEEE  BBBB   U   U   GGG
		D  D   E      B   B  U   U  G   G
		D   D  E      B   B  U   U  G
		D   D  EEEE   BBBB   U   U  G  GG
		D   D  E      B   B  U   U  G   G
		D  D   E      B   B  U   U  G   G
		DDD    EEEEE  BBBB    UUU    GGG
	*/
	fpsConsole = new Stats();
	fpsConsole.domElement.style.position = 'absolute';
	fpsConsole.domElement.style.top = '0px';
	$("#gl_window").append(fpsConsole.domElement);
	/*camera2 = new THREE.PerspectiveCamera(75, sWidth / sHeight, 1, 100);
	camera2.position.x = 0;
	camera2.position.y = 15;
	camera2.lookAt(new THREE.Vector3(0, 0, 0));

	var material2 = new THREE.MeshBasicMaterial({
		color: 0x000000
	});
	cubeGeo = new THREE.CubeGeometry(1, 1, 1);
	cube = new THREE.Mesh(cubeGeo, material2);
	//sphere.doubeSided = false;
	scene.add(cube);

	/*
		DDD    EEEEE  BBBB   U   U   GGG
		D  D   E      B   B  U   U  G   G
		D   D  E      B   B  U   U  G
		D   D  EEEE   BBBB   U   U  G  GG
		D   D  E      B   B  U   U  G   G
		D  D   E      B   B  U   U  G   G
		DDD    EEEEE  BBBB    UUU    GGG
	*/

	window.addEventListener('resize', resize, false);

	wheelZoomTarget = 0;
	wheelZoom = 0;

	isAni = true;
	isSmoothAni = false;
	phiSmoothDelta = 0;
	mIsDown = false;
	mIsDrag = false;
	mSpeed = 0;
	mDirection = new THREE.Vector2(0, 0);
	document.body.addEventListener("mousedown", handleMouseDown, false);
	document.body.addEventListener("mouseup", handleMouseUp, false);
	document.body.addEventListener('mousemove', handleMouseMove, false);
	document.body.addEventListener('mousewheel', handleMouseWheel, false);
	document.body.addEventListener('DOMMouseScroll', handleDOMMouseScroll, false); //for firefox

	console.log("loaded!");
	setTimeout(function(){
		$("#boot_spin").fadeOut();
		$("#boot_spin_img").fadeOut();
	},500);
}

function loadPhotoSphere(url) {
	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xhr = new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			var data = xhr.responseText;
			var imageXmp = data.substring(data.indexOf("<x:xmpmeta"), data.indexOf("</x:xmpmeta>") + "</x:xmpmeta>".length);
			loadExif(imageXmp);
			loadCropTexture(imageURL);
			//console.log(data);
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

function loadExif(xmpp) {
	getAttr = function(attr) {
		x = xmpp.indexOf(attr + '="') + attr.length + 2;
		return xmpp.substring(x, xmpp.indexOf('"', x));
	};

	//exif info can be seen at -> https://developers.google.com/photo-sphere/metadata/?hl=zh-CN
	exif = {
		'validGPano': false,
		'fullWidth': getAttr("GPano:FullPanoWidthPixels"),
		'fullHeight': getAttr("GPano:FullPanoHeightPixels"),
		'cropWidth': getAttr("GPano:CroppedAreaImageWidthPixels"),
		'cropHeight': getAttr("GPano:CroppedAreaImageHeightPixels"),
		'cropLeft': getAttr("GPano:CroppedAreaLeftPixels"),
		'cropTop': getAttr("GPano:CroppedAreaTopPixels")
	}

	if (exif.fullWidth != undefined && isNaN(exif.fullWidth) == false &&
		exif.fullHeight != undefined && isNaN(exif.fullHeight) == false &&
		exif.cropWidth != undefined && isNaN(exif.cropWidth) == false &&
		exif.cropHeight != undefined && isNaN(exif.cropHeight) == false &&
		exif.cropLeft != undefined && isNaN(exif.cropLeft) == false &&
		exif.cropTop != undefined && isNaN(exif.cropTop) == false) {
		exif.validGPano = true;
	}
	console.log(exif);
}

function loadCropTexture(url) {
	if (exif.validGPano == false ||
		(exif.validGPano == true &&
			exif.fullWidth == exif.cropWidth &&
			exif.fullHeight == exif.cropHeight &&
			exif.cropTop == 0 &&
			exif.cropLeft == 0)) {
		//no crop
		createSphere(imageURL);
	} else {
		//crop 
		//must use onload to ensure that operations are done after loaded
		console.log("crop...");
		var img = new Image();
		img.src = url;
		img.onload = function() {
			var canvas = document.createElement('canvas');
			if (MAX_TEXTURE_SIZE != undefined &&
				(MAX_TEXTURE_SIZE < exif.fullWidth || MAX_TEXTURE_SIZE < exif.fullHeight)) {
				//following code is from @kennydude
				var wRatio = this.maxSize / canvas.width;
				var hRatio = this.maxSize / canvas.height;
				if ((wRatio * height) < this.maxSize) {
					// Horizontal
					canvas.height = Math.ceil(wRatio * height);
					canvas.width = this.maxSize;
				} else { // Vertical
					canvas.width = Math.ceil(hRatio * width);
					canvas.height = this.maxSize;
				}
			} else {
				canvas.width = exif.fullWidth;
				canvas.height = exif.fullHeight;
			}
			var context = canvas.getContext("2d");
			var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, "#000000");
			gradient.addColorStop(0.51, "#454545");
			gradient.addColorStop(0.53, "#303030");
			gradient.addColorStop(1, "#000000");
			context.fillStyle = gradient;
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(this, (exif.cropLeft / exif.fullWidth) * canvas.width, (exif.cropTop / exif.fullHeight) * canvas.height, (exif.cropWidth / exif.fullWidth) * canvas.width, (exif.cropHeight / exif.fullHeight) * canvas.height);
			//image = canvas.toDataURL("image/png");
			//console.log(canvas.toDataURL("image/png"));
			createSphere(canvas.toDataURL("image/jpeg"));
			console.log("crop done...");
		}
	}
}

function createSphere(data) {
	var texture = new THREE.Texture();
	var material = new THREE.MeshBasicMaterial({
	    map: texture
		//color: 0x666666,
		//overdraw: true,
		//wireframe: true
	});
	var image = new Image();
	image.onload = function() {
		texture.needsUpdate = true;
		material.map.image = this;
		if (sphereGeo == undefined) {
			if (isCanvas) {
				sphereGeo = new THREE.SphereGeometry(10, 20, 20);
			} else {
				sphereGeo = new THREE.SphereGeometry(10, 64, 64);
			}
			//sphereGeo.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1)); //很好的办法，通过使用一个负比例的缩放来使得纹理坐标得到反向（实际上，内侧的表面被翻转到外面）
			sphere = new THREE.Mesh(sphereGeo, material);
			sphere.scale.x = -1;
			//sphere.doubeSided = false;
			scene.add(sphere);
		}
	};
	image.src = data;
}

function handleMouseDown(event) {
	mIsDown = true;
	cDis = sHeight / (2 * Math.tan((camera.fov / 2) * Math.PI / 180));
	/*isloadEXIFAniSave = isAni;
	isAni = false;
	isAniStop = false;
	isSmoothAni = false;*/
	isAniSave = isAni;
	mLastX = mDownX = event.clientX;
	mLastY = mDownY = event.clientY;
	mSpeed = 0;
	mDownTheta = cTheta;
	mDownPhi = cPhi;

	event.preventDefault();
}

function handleMouseUp(event) {
	mIsDown = false;
	$('html').css({
		cursor: 'default'
	});
	if (mIsDrag) {
		//console.log("drag");
		mIsDrag = false;
		isSmoothAni = true;
	} else {
		//console.log("click");
		if (isAniSave == false) {
			isAni = true;
			isAniStop = false;
			//phiSmoothDelta = 0;
		} else {
			isAni = false;
			isAniStop = true;
		}
	}
}

function handleMouseMove(event) {
	if (mIsDown === true) {
		isAni = false;
		isAniStop = false;
		isSmoothAni = false;
		phiSmoothDelta = 0;
		$('html').css({
			cursor: 'default'
		});
		mIsDrag = true;
		mNowX = event.clientX;
		mNowY = event.clientY;

		mSpeed = Math.sqrt(Math.pow((mNowX - mLastX), 2) + Math.pow((mNowY - mLastY), 2));
		mDirection.x = mNowX - mLastX;
		mDirection.y = mNowY - mLastY;
		mLastX = mNowX;
		mLastY = mNowY;

		var deltaTheta = Math.atan((mNowY - sCenterY) / cDis) - Math.atan((mDownY - sCenterY) / cDis);
		var deltaPhi = Math.atan((mNowX - sCenterX) / cDis) - Math.atan((mDownX - sCenterX) / cDis);
		cTheta = mDownTheta - deltaTheta * 180 / Math.PI;
		cPhi = mDownPhi - deltaPhi * 180 / Math.PI;
		updateCamera();
	}
}

function handleMouseWheel(event) {
	event.preventDefault();

	wheelZoomTarget = event.wheelDelta > 300 ? 300 : event.wheelDelta;
	if (wheelZoom * wheelZoomTarget > 0) {
		//同号时
		if (Math.abs(wheelZoom) > Math.abs(wheelZoomTarget)) {
			wheelZoomTarget = wheelZoom;
		} else {
			wheelZoomSmooth = (wheelZoom > wheelZoomTarget ? -1 : 1) * 5;
		}
	} else {
		wheelZoomSmooth = (wheelZoom > wheelZoomTarget ? -1 : 1) * 5; //异号增量时
	}
}

function handleDOMMouseScroll(event) {
	event.preventDefault();
	wheelZoomTarget = -(event.detail > 300 ? 300 : event.detail); //in firefox, value is inverted
	if (wheelZoom * wheelZoomTarget > 0) {
		//同号时
		if (Math.abs(wheelZoom) > Math.abs(wheelZoomTarget)) {
			wheelZoomTarget = wheelZoom;
		} else {
			wheelZoomSmooth = (wheelZoom > wheelZoomTarget ? -1 : 1) * 10;
		}
	} else {
		wheelZoomSmooth = (wheelZoom > wheelZoomTarget ? -1 : 1) * 10; //异号增量时
	}
	console.log(event.detail);
}

function animate() {
	var zoomFactor = Math.sqrt(camera.fov / 75);
	if (isAni) {
		if (phiSmoothDelta < 0.15 * zoomFactor) {
			phiSmoothDelta += 0.003 * zoomFactor;
		}else{
			phiSmoothDelta = 0.15 * zoomFactor;
		}
		cPhi += phiSmoothDelta;
		updateCamera();
	}
	if (isAniStop) {
		if (phiSmoothDelta > 0.0) {
			phiSmoothDelta -= 0.003 * zoomFactor;
		} else {
			//phiSmoothDelta = 0;
			isAniStop = false;
			//console.log("ok");
		}
		cPhi += phiSmoothDelta;
		updateCamera();
	}
	if (isSmoothAni && mSpeed > 0.06) {
		var dirFormatter = Math.sqrt(Math.pow((mDirection.x), 2) + Math.pow((mDirection.y), 2));
		cTheta -= 0.04 * mSpeed * mDirection.y / dirFormatter * zoomFactor;
		cPhi -= 0.04 * mSpeed * mDirection.x / dirFormatter * zoomFactor;
		mSpeed -= mSpeed * 0.06;
		//console.log("speed: %f, direction:[%f,%f]", mSpeed, mDirection.x/dirFormatter, mDirection.y/dirFormatter);
		//console.log(mSpeed);
		updateCamera();
	}
	//console.log(camera.fov);
	if (Math.abs(wheelZoomTarget - wheelZoom) > 3) {
		wheelZoom += wheelZoomSmooth;
		//console.log(wheelZoom);
		//console.log(camera.fov);
		var fov = camera.fov + wheelZoomSmooth / 40.0;
		//console.log(wheelZoomTarget - wheelZoom);
		if (fov >= 25 && fov <= 75) {
			camera.fov = fov;

			camera.updateProjectionMatrix();
			//console.log(camera.fov);
		} else if (fov < 25) {
			camera.fov = 25;
		} else if (fov > 75) {
			camera.fov = 75;
		}
	} else if (Math.abs(wheelZoomSmooth) > 0.5) {
		wheelZoomSmooth -= 0.05 * wheelZoomSmooth;
		var fov = camera.fov + wheelZoomSmooth / 40.0;
		if (fov >= 25 && fov <= 75) {
			camera.fov = fov;
			camera.updateProjectionMatrix();
			//console.log(camera.fov);
		} else if (fov < 25) {
			camera.fov = 25;
		} else if (fov > 75) {
			camera.fov = 75;
		}
		wheelZoom = 0;
		wheelZoomTarget = 0;
	}
	/*else{
		wheelZoomSmooth = 0;
		wheelZoom = 0;
		wheelZoomTarget = 0;
	}*/
	requestAnimationFrame(animate);

	/*renderer.setViewport( 0, 0, sWidth, sHeight );
	renderer.setScissor( 0, 0, sWidth, sHeight);
	renderer.enableScissorTest ( true );*/
	renderer.render(scene, camera);

	/*renderer.setViewport( Math.floor(0.5 * sWidth), Math.floor(0.5 * sHeight), Math.floor(0.5 * sWidth), Math.floor(0.5 * sHeight));
	renderer.setScissor( Math.floor(0.5 * sWidth), Math.floor(0.5 * sHeight), Math.floor(0.5 * sWidth), Math.floor(0.5 * sHeight) );
	renderer.enableScissorTest ( true );
	renderer.render(scene, camera2);*/

	fpsConsole.update();
}

function updateCamera() {
	if (cPhi >= 360) cPhi -= 360;
	if (cTheta > 170) cTheta = 170;
	if (cTheta < 10) cTheta = 10;
	camera.position.x = cRadius * Math.cos(cPhi * Math.PI / 180) * Math.sin(cTheta * Math.PI / 180);
	camera.position.y = cRadius * Math.cos(cTheta * Math.PI / 180);
	camera.position.z = cRadius * Math.sin(cPhi * Math.PI / 180) * Math.sin(cTheta * Math.PI / 180);
	camera.lookAt(new THREE.Vector3(Math.cos(cPhi * Math.PI / 180) * Math.sin(cTheta * Math.PI / 180),
		Math.cos(cTheta * Math.PI / 180),
		Math.sin(cPhi * Math.PI / 180) * Math.sin(cTheta * Math.PI / 180)));
	camera.updateProjectionMatrix();
	/*cube.position.x = camera.position.x;
	cube.position.y = camera.position.y;
	cube.position.z = camera.position.z;*/
}


function resize() {
	sWidth = $(window).width();
	sHeight = $(window).height();
	sCenterX = $(window).width() / 2;
	sCenterY = $(window).height() / 2;
	cDis = sHeight / (2 * Math.tan((camera.fov / 2) * Math.PI / 180));

	camera.aspect = sWidth / sHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(sWidth, sHeight);
}