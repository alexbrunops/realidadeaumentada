var gl;
var shaderBaseImage	= null;
var shaderAxis		= null;
var shaderObject	= null;
var axis 			= null;
var baseTexture		= null;

var video, 
	videoImage, 
	videoImageContext, 
	videoTexture;

var imageData, 
	detector, 
	posit;

var modelSize 	= 90.0; //millimeters

var rotMat 		= [new Matrix4(), new Matrix4()];
var transMat 	= [new Matrix4(), new Matrix4()];
var scaleMat 	= [new Matrix4(), new Matrix4()];

var lightPos 	= new Vector3();
var cameraPos 	= new Vector3();

var rot			= 0.0;

var yaw 		= 0.0,
	pitch 		= 0.0,
	roll		= 0.0;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

var model			= new Array;

var g_objDoc 		= null;	// The information of OBJ file
var g_drawingInfo 	= null;	// The information for drawing 3D model


// ********************************************************
// ********************************************************
function gotStream(stream)  {
	if (window.URL) {   
		video.src = window.URL.createObjectURL(stream);   
	} 
	else {   
		video.src = stream;   
	}

	video.onerror = function(e) { 
		stream.stop(); 
	};

	stream.onended = noStream;
}

// ********************************************************
// ********************************************************
function noStream(e) {
	var msg = "No camera available.";
	
	if (e.code == 1) {   
		msg = "User denied access to use camera.";   
	}
	document.getElementById("output").textContent = msg;
}

// ********************************************************
// ********************************************************
function initGL(canvas) {
	
	var gl = canvas.getContext("webgl");
	if (!gl) {
		return (null);
	}
	
	gl.viewportWidth 	= canvas.width;
	gl.viewportHeight 	= canvas.height;
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	return gl;
}

// ********************************************************
// ********************************************************
// Read a file
function readOBJFile(fileName, gl, scale, reverse) {
	var request = new XMLHttpRequest();
	
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status !== 404) 
			onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
		}
	request.open('GET', fileName, true); // Create a request to acquire the file
	request.send();                      // Send the request
}

// ********************************************************
// ********************************************************
// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
	var objDoc = new OBJDoc(fileName);	// Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);	// Parse the file
	
	if (!result) {
		g_objDoc 		= null; 
		g_drawingInfo 	= null;
		console.log("OBJ file parsing error.");
		return;
	}
		
	g_objDoc = objDoc;
}

// ********************************************************
// ********************************************************
// OBJ File has been read compleatly
function onReadComplete(gl) {
	
	var groupModel = null;

	g_drawingInfo 	= g_objDoc.getDrawingInfo();
	
	for(var o = 0; o < g_drawingInfo.numObjects; o++) {
		
		groupModel = new Object();

		groupModel.vertexBuffer = gl.createBuffer();
		if (groupModel.vertexBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.vertices[o], gl.STATIC_DRAW);
		}
		else {
			alert("ERROR: can not create vertexBuffer");
		}

		groupModel.normalBuffer = gl.createBuffer();
		if (groupModel.normalBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.normals[o], gl.STATIC_DRAW);
			}
		else {
			alert("ERROR: can not create normalBuffer");
		}
		
		groupModel.indexBuffer = gl.createBuffer();
		if (groupModel.indexBuffer) {		
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groupModel.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_drawingInfo.indices[o], gl.STATIC_DRAW);
		}
		else {
			alert("ERROR: can not create indexBuffer");
		}

		groupModel.numObjects = g_drawingInfo.indices[o].length;
        groupModel.Material = g_drawingInfo.materials[o];
		model.push(groupModel);
	}
}

// ********************************************************
// ********************************************************
function initBaseImage() {
	
var baseImage = new Object(); 
var vPos = new Array;
var vTex = new Array;

	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V1
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	vPos.push(-1.0);	// V3
	vPos.push( 1.0);
	vPos.push( 0.0);
			
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	vTex.push( 1.0);	// V1
	vTex.push( 0.0);
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);
	vTex.push( 0.0);	// V3
	vTex.push( 1.0);
		
	baseImage.vertexBuffer = gl.createBuffer();
	if (baseImage.vertexBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, baseImage.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	}
	else {
		alert("ERROR: can not create vertexBuffer");
	}
	
	baseImage.textureBuffer = gl.createBuffer();
	if (baseImage.textureBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, baseImage.textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTex), gl.STATIC_DRAW);
	}
	else {
		alert("ERROR: can not create textureBuffer");
	}

	baseImage.numItems = vPos.length/3.0;
	
	return baseImage;
}


// ********************************************************
// ********************************************************

function initAxisVertexBuffer() {

var axis	= new Object(); // Utilize Object object to return multiple buffer objects
var vPos 	= new Array;
var vColor 	= new Array;

	// X Axis
	// V0
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	// V1
	vPos.push(1.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);

	// Y Axis
	// V0
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(1.0);
	// V2
	vPos.push(0.0);
	vPos.push(1.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(1.0);

	// Z Axis
	// V0
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	// V3
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	
	axis.vertexBuffer = gl.createBuffer();
	if (axis.vertexBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, axis.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	}
	else {
		alert("ERROR: can not create vertexBuffer");
	}
	
	axis.colorBuffer = gl.createBuffer();
	if (axis.colorBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, axis.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vColor), gl.STATIC_DRAW);
	}
	else {
		alert("ERROR: can not create colorBuffer");
	}

	axis.numItems = vPos.length/3.0;
	
	return axis;
}

// ********************************************************
// ********************************************************
function drawTextQuad(o, shaderProgram, MVPMat) {
	
    try {
    	gl.useProgram(shaderProgram);
	}
	catch(err){
        alert(err);
        console.error(err.description);
    }
    	
 	gl.uniformMatrix4fv(shaderProgram.uMVPMat, false, MVPMat.elements);
   	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoImage);
	videoTexture.needsUpdate = false;	
	gl.uniform1i(shaderProgram.SamplerUniform, 0);
		
	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
	}
	else {
		alert("o.vertexBuffer == null");
		return;
	}

	if (o.textureBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.textureBuffer);
		gl.vertexAttribPointer(shaderProgram.vTexAttr, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vTexAttr);
	}
	else {
		alert("o.textureBuffer == null");
  		return;
	}
   	
	gl.drawArrays(gl.TRIANGLES, 0, o.numItems);
}

// ********************************************************
// ********************************************************
function drawSphere(o, shaderProgram) {
    
	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
	}
	else {
		alert("o.vertexBuffer == null");
		return;
	}

	if (o.normalBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.normalBuffer);
		gl.vertexAttribPointer(shaderProgram.vNormalAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vNormalAttr);
		}
	else {
		alert("o.normalBuffer == null");
		return;
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	gl.drawElements(gl.TRIANGLES, o.numObjects, gl.UNSIGNED_SHORT, 0);
}

// ********************************************************
// ********************************************************
function drawAxis(o, shaderProgram, MVPMat) {

    try {
    	gl.useProgram(shaderProgram);
	}
	catch(err){
        alert(err);
        console.error(err.description);
    }
    	
 	gl.uniformMatrix4fv(shaderProgram.uMVPMat, false, MVPMat.elements);
   	
	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
	}
	else {
		alert("o.vertexBuffer == null");
		return;
	}

	if (o.colorBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.colorBuffer);
		gl.vertexAttribPointer(shaderProgram.vColorAttr, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vColorAttr);
	}
	else {
		alert("o.colorBuffer == null");
  		return;
	}

	gl.drawArrays(gl.LINES, 0, o.numItems);
}

// ********************************************************
// ********************************************************
function drawScene(markers) {
	
var modelMat 	= new Matrix4();
var ViewMat 	= new Matrix4();
var ProjMat 	= new Matrix4();
var MVPMat 		= new Matrix4();
var color 		= new Float32Array(3);

//Iluminacao
var NormMat 	= new Matrix4();
var lightColor	= new Vector4();
var matAmb		= new Vector4();
var matDif		= new Vector4();
var matSpec		= new Vector4();
    
var Ns;

	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	if (!videoTexture.needsUpdate) {
		return;
	}
	
	//Iluminacao
	lightColor.elements[0] = 1.0;
	lightColor.elements[1] = 1.0;
	lightColor.elements[2] = 1.0;
	lightColor.elements[3] = 1.0;

	modelMat.setIdentity();
	ViewMat.setIdentity();
	ProjMat.setIdentity();
	ProjMat.setOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

	MVPMat.setIdentity();
    MVPMat.multiply(ProjMat);
    MVPMat.multiply(ViewMat);
    MVPMat.multiply(modelMat);
		
	drawTextQuad(baseTexture, shaderBaseImage, MVPMat);
	
	updateScenes(markers);
   		
    ViewMat.setLookAt(	0.0, 0.0, 0.0,
    					0.0, 0.0, -1.0,
    					0.0, 1.0, 0.0 );
    
	ProjMat.setPerspective(40.0, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);

	if (markers.length > 0) {

		try {
	    	gl.useProgram(shaderObject);
		}
		catch(err){
	        alert(err);
	        console.error(err.description);
	    }
        
        if(markers[0] != null) {
            modelMat.setIdentity();
            modelMat.multiply(transMat[0]);
            modelMat.multiply(rotMat[0]);
            modelMat.multiply(scaleMat[0]);

            NormMat.setIdentity();
            NormMat.setInverseOf(modelMat);
			NormMat.transpose();
			
            MVPMat.setIdentity();
            MVPMat.multiply(ProjMat);
            MVPMat.multiply(ViewMat);
            MVPMat.multiply(modelMat);

            gl.uniformMatrix4fv(shaderObject.MMatUniform, false, modelMat.elements);
			gl.uniformMatrix4fv(shaderObject.NMatUniform, false, NormMat.elements);
            gl.uniform3fv(shaderObject.uCamPos, cameraPos.elements);
			gl.uniform4fv(shaderObject.uLightColor, lightColor.elements);
			gl.uniform3fv(shaderObject.uLightPos, lightPos.elements);
						
            gl.uniformMatrix4fv(shaderObject.uMVPMat, false, MVPMat.elements);    
            
            for(var o = 0; o < model.length; o++) {
                matAmb.elements[0] = model[o].Material.Ka.r;
                matAmb.elements[1] = model[o].Material.Ka.g;
                matAmb.elements[2] = model[o].Material.Ka.b;
                matAmb.elements[3] = model[o].Material.Ka.a;

                matDif.elements[0] = model[o].Material.Kd.r;
                matDif.elements[1] = model[o].Material.Kd.g;
                matDif.elements[2] = model[o].Material.Kd.b;
                matDif.elements[3] = model[o].Material.Kd.a;

                matSpec.elements[0] = model[o].Material.Ks.r;
                matSpec.elements[1] = model[o].Material.Ks.g;
                matSpec.elements[2] = model[o].Material.Ks.b;
                matSpec.elements[3] = model[o].Material.Ks.a;
                
                gl.uniform4fv(shaderObject.uMatAmb, matAmb.elements);
                gl.uniform4fv(shaderObject.uMatDif, matDif.elements);
                gl.uniform4fv(shaderObject.uMatSpec, matSpec.elements);
                
                drawSphere(model[o], shaderObject);
            }
            
            rot += 1.0;

            modelMat.rotate(rot, 0.0, 0.0, 1.0);
            modelMat.translate(1.0, 0.0, 0.0);
            
            NormMat.setIdentity();
            NormMat.setInverseOf(modelMat);
			NormMat.transpose();
			
            MVPMat.setIdentity();
            MVPMat.multiply(ProjMat);
            MVPMat.multiply(ViewMat);
            MVPMat.multiply(modelMat);
           
            gl.uniformMatrix4fv(shaderObject.MMatUniform, false, modelMat.elements);
			gl.uniformMatrix4fv(shaderObject.NMatUniform, false, NormMat.elements);
						
            gl.uniformMatrix4fv(shaderObject.uMVPMat, false, MVPMat.elements);
                       
            for(var o = 0; o < model.length; o++) {
                drawSphere(model[o], shaderObject);
            }
        }

        if(markers[1] != null) {

            modelMat.setIdentity();
            modelMat.multiply(transMat[1]);
            modelMat.multiply(rotMat[1]);
            modelMat.multiply(scaleMat[1]);

            MVPMat.setIdentity();
            MVPMat.multiply(ProjMat);
            MVPMat.multiply(ViewMat);
            MVPMat.multiply(modelMat);            
            
            gl.uniformMatrix4fv(shaderObject.uMVPMat, false, MVPMat.elements);
		
            for(var o = 0; o < model.length; o++) {
                drawSphere(model[o], shaderObject);
            }
            
            
            modelMat.rotate(rot, 0.0, 0.0, 1.0);
            modelMat.translate(1.0, 0.0, 0.0);

            MVPMat.setIdentity();
            MVPMat.multiply(ProjMat);
            MVPMat.multiply(ViewMat);
            MVPMat.multiply(modelMat);

            gl.uniformMatrix4fv(shaderObject.uMVPMat, false, MVPMat.elements);
                        
            for(var o = 0; o < model.length; o++) {
                drawSphere(model[o], shaderObject);
            }
        }	    
	}
}

// ********************************************************
// ********************************************************
function initTexture() {

	videoTexture = gl.createTexture();		
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	videoTexture.needsUpdate = false;
}

// ********************************************************
// ********************************************************
function webGLStart() {

	if (!navigator.getUserMedia) {
		document.getElementById("output").innerHTML = 
			"Sorry. <code>navigator.getUserMedia()</code> is not available.";
	}
	navigator.getUserMedia({video: true}, gotStream, noStream);

	// assign variables to HTML elements
	video = document.getElementById("monitor");
	videoImage = document.getElementById("videoImage");
	videoImageContext = videoImage.getContext("2d");
	
	// background color if no video present
	videoImageContext.fillStyle = "#005337";
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
	
	
	canvas = document.getElementById("videoGL");
	gl = initGL(canvas);
	
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return;
	}
		
	shaderBaseImage = initShaders("baseImage", gl);
	if (shaderBaseImage == null) {
		alert("Erro na inicilizacao do shaderBaseImage!!");
		return;
	}

	shaderBaseImage.vPositionAttr 	= gl.getAttribLocation(shaderBaseImage, "aVertexPosition");
	shaderBaseImage.vTexAttr 		= gl.getAttribLocation(shaderBaseImage, "aVertexTexture");
	shaderBaseImage.uMVPMat 		= gl.getUniformLocation(shaderBaseImage, "uMVPMat");
	shaderBaseImage.SamplerUniform	= gl.getUniformLocation(shaderBaseImage, "uSampler");

	if ( 	(shaderBaseImage.vertexPositionAttribute < 0) 	||
			(shaderBaseImage.vertexTextAttribute < 0) 		||
			(shaderBaseImage.SamplerUniform < 0) 			||
			!shaderBaseImage.uMVPMat ) {
		alert("Error getAttribLocation shaderBaseImage");
		return;
	}
		
	baseTexture = initBaseImage();
	if (!baseTexture) {
		console.log('Failed to set the baseTexture vertex information');
		return;
	}
	initTexture();
			
	shaderAxis 					= initShaders("Axis", gl);	
	shaderAxis.vPositionAttr 	= gl.getAttribLocation(shaderAxis, "aVertexPosition");		
	shaderAxis.vColorAttr		= gl.getAttribLocation(shaderAxis, "aVertexColor");
	shaderAxis.uMVPMat 			= gl.getUniformLocation(shaderAxis, "uMVPMat");
	
	if (	shaderAxis.vPositionAttr < 0 	|| 
			shaderAxis.vColorAttr < 0 		|| 
			!shaderAxis.uMVPMat	) {
		console.log("Error getAttribLocation shaderAxis"); 
		return;
	}
		
	axis = initAxisVertexBuffer();
	if (!axis) {
		console.log('Failed to set the AXIS vertex information');
		return;
	}

	shaderObject 					= initShaders("Object", gl);	
	shaderObject.vPositionAttr 		= gl.getAttribLocation(shaderObject, "aVertexPosition");
	shaderObject.uColor				= gl.getUniformLocation(shaderObject, "uColor");
	shaderObject.uMVPMat 			= gl.getUniformLocation(shaderObject, "uMVPMat");
	
	shaderObject.uCamPos 			= gl.getUniformLocation(shaderObject, "uCamPos");
	shaderObject.MMatUniform 		= gl.getUniformLocation(shaderObject, "uModelMat");
	shaderObject.NMatUniform 		= gl.getUniformLocation(shaderObject, "uNormMat");
	shaderObject.vNormalAttr 		= gl.getAttribLocation(shaderObject, "aVNorm");
	shaderObject.uLightPos 			= gl.getUniformLocation(shaderObject, "uLPos");
	shaderObject.uLightColor 		= gl.getUniformLocation(shaderObject, "uLColor");
	shaderObject.uMatAmb 			= gl.getUniformLocation(shaderObject, "uMatAmb");
	shaderObject.uMatDif 			= gl.getUniformLocation(shaderObject, "uMatDif");
	shaderObject.uMatSpec			= gl.getUniformLocation(shaderObject, "uMatSpec");

	if (shaderObject.aVNorm < 0	 			|| shaderObject.uLightPos < 0 	|| 
		shaderObject.uLightColor < 0		|| shaderObject.uMatAmb < 0 		|| 
		shaderObject.uMatDif < 0			|| shaderObject.uMatSpec < 0 ) {
		console.log("Error getAttribLocation"); 
		return;
	}
		
	if (	shaderObject.vPositionAttr < 0 	|| 
			shaderObject.uColor < 0 	|| 
			!shaderObject.uMVPMat	) {
		console.log("Error getAttribLocation shaderObject"); 
		return;
	}

	detector 	= new AR.Detector();
	posit 		= new POS.Posit(modelSize, canvas.width);

	rotMat[0].setIdentity();
	transMat[0].setIdentity();	

	readOBJFile("modelos/sphere.obj", gl, 1, true);
	
	var tick = function() {
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			g_objDoc = null;	

			cameraPos.elements[0] 	= 0.0;
			cameraPos.elements[1] 	= 10.0;
			cameraPos.elements[2] 	= 0.0;
            
			lightPos.elements[0]	= 0.0;
			lightPos.elements[1]	= 10.0;
			lightPos.elements[2]	= 0.0;
				
		}
		if (model.length > 0) {
			animate();
		}
		else 
			requestAnimationFrame(tick, canvas);
	};	
	tick();
}

// ********************************************************
// ********************************************************
function animate() {
    requestAnimationFrame(animate);
    render();		
}

// ********************************************************
// ********************************************************
function render() {	
	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height );
		videoTexture.needsUpdate = true;
		imageData = videoImageContext.getImageData(0, 0, videoImage.width, videoImage.height);
		
        var markers = detector.detect(imageData);
 		
 		//Desenha o contorno vermelho e o ponto verde
        drawCorners(markers);
	
        drawScene(markers);
	}
}

// ********************************************************
// ********************************************************
function drawCorners(markers){
  var corners, corner, i, j;

  videoImageContext.lineWidth = 3;

  for (i = 0; i < markers.length; ++ i) {
	corners = markers[i].corners;
	
	if(i === 0) {
        videoImageContext.strokeStyle = "red";
    }
    else {
        if(i === 1) {
        	videoImageContext.strokeStyle = "green";
        }
    }
      
	videoImageContext.beginPath();
	
	for (j = 0; j < corners.length; ++ j) {
		corner = corners[j];
		videoImageContext.moveTo(corner.x, corner.y);
		corner = corners[(j + 1) % corners.length];
		videoImageContext.lineTo(corner.x, corner.y);
	}

	videoImageContext.stroke();
	videoImageContext.closePath();
	
	videoImageContext.strokeStyle = "blue";
	videoImageContext.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
  }
};

// ********************************************************
// ********************************************************
function updateScenes(markers) {
  var corners, corner, pose, i;
  
	if (markers.length > 0) {
		
        for(var j = 0; j < markers.length; j++) {
            corners = markers[j].corners;

            for (i = 0; i < corners.length; ++ i) {
                corner = corners[i];

                corner.x = corner.x - (canvas.width / 2);
                corner.y = (canvas.height / 2) - corner.y;
            }

            pose = posit.pose(corners);

            yaw 	= Math.atan2(pose.bestRotation[0][2], pose.bestRotation[2][2]) * 180.0/Math.PI;
            pitch 	= -Math.asin(-pose.bestRotation[1][2]) * 180.0/Math.PI;
            roll 	= Math.atan2(pose.bestRotation[1][0], pose.bestRotation[1][1]) * 180.0/Math.PI;

            rotMat[j].setIdentity();
            rotMat[j].rotate(yaw, 0.0, 1.0, 0.0);
            rotMat[j].rotate(pitch, 1.0, 0.0, 0.0);
            rotMat[j].rotate(roll, 0.0, 0.0, 1.0);

            transMat[j].setIdentity();
            transMat[j].translate(pose.bestTranslation[0], pose.bestTranslation[1], -pose.bestTranslation[2]);
            scaleMat[j].setIdentity();
            scaleMat[j].scale(modelSize, modelSize, modelSize);
        }
		
		console.log("pose.bestError = " + pose.bestError);
		console.log("pose.alternativeError = " + pose.alternativeError);
	}
	else {
		transMat[0].setIdentity();
		rotMat[0].setIdentity();
		scaleMat[0].setIdentity();
		yaw 	= 0.0;
		pitch 	= 0.0;
		roll 	= 0.0;
	}
};