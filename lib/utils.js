/*

AUTHOR: TECHBLOGOGY

ALL RIGHT RESERVED

This is a utility library, which is designed to make Javascript + WebGL Game Development Easier

*/

var S_FLOAT = 4;

function LoadScreen() 
{
	this.container;

	this.progressBar; //HTML Loading Progress Bar
	this.logo; //HTML Loading Logo
	this.text; //HTML Text Element

	//Initializes Loading Screen
	this.initLScreen = function () {
		this.createContainer(); //Makes A Loading Screen Container
		this.createBar(); //Make A Progress Bar
		this.createLogo();

		document.body.appendChild(this.container); //Add Screen Div To Document
		this.container.appendChild(this.progressBar); //Add Progress Bar To Container
		this.container.appendChild(this.logo); //Add Progress Bar To Container
	}

	//Creates Container
	this.createContainer = function () {
		this.container = document.createElement("div");
		this.container.id = "loadDiv";
	}

	//Creates Progress Bar
	this.createBar = function () {
		this.progressBar = document.createElement("progress");
		this.progressBar.id = "loadingBar";
	}

	//Creates Image Logo
	this.createLogo = function () {
		this.logo = document.createElement("image");
		this.logo.src = "./res/logo.png";
	}
}

//Text Wrapper Class
function Text()
{
	this.txtVals = []; //Text In ASCII Decimal
	this.txt; //Text

	this.w; //Width Of Text In Characters
	this.h; //Height Of Text In Characters

	this.txtMap; //Text Tilemap

	//Initializes Text Object
	this.initText = function (width, font, size) {
		this.w = width;
		this.h = Math.ceil(this.txt.length/this.w);

		//console.log(this.txt.length/this.w);

		this.txt = this.txt.toUpperCase();

		for (var i=0; i<this.txt.length; i++) {
			this.txtVals[i] = this.txt.charCodeAt(i) - " ".charCodeAt(0) + 1;
		}

		this.txtMap = new Tilemap();
		this.txtMap.getTilemapData(font, size, this.w, this.h, this.txtVals, 128, 8);
	}
}

//Keyboard Wrapper
function Keyboard() 
{
	this.keys = {};

	this.addListeners = function () {
		window.addEventListener("keydown", this.keyDown, false);
		window.addEventListener("keyup", this.keyUp, false);

		window.keys = this.keys;
	}

	this.removeListeners = function () {
		window.removeEventListener("keydown", this.keyDown, false);
		window.removeEventListener("keyup", this.keyUp, false);
	}

	this.keyDown = function (e) {
		// console.log(String.fromCharCode(e.keyCode));
		this.keys[String.fromCharCode(e.keyCode)] = true;
	}

	this.keyUp = function (e) {
		// console.log(String.fromCharCode(e.keyCode));
		this.keys[String.fromCharCode(e.keyCode)] = false;
	}
}

//Camera Class
function Camera() 
{
	//Matrixes
	this.viewMatrix; //Camera View Matrix
	this.projMatrix; //Projection Matrix

	//Vectors
	this.position; //Position Vector
	this.direction; //Direction Vector

	//Constant Vectors
	this.forward = vec3.fromValues(0,0,-1); //Constant Forward Vector
	this.up = vec3.fromValues(0,1,0); //Constant Up Vector

	//Sets Up Camera. PARAMETERS: Projection Type, Width, Height
	this.initCamera = function (type, w, h) {
		this.viewMatrix = mat4.create();
		this.projMatrix = mat4.create();

		this.position = vec3.create();
		this.direction = vec3.create(); 

		this.initProjection(type, w, h);
		this.updateView();
	}

	//Sets Up Appropriate Projection. PARAMETERS: Projection Type, Width, Height
	this.initProjection = function (type, w, h) {
		switch (type)
		{
			case "ortho":
				mat4.ortho(this.projMatrix, -(w/h), (w/h), -1, 1, 0.001, 100.0); //Create Orthogaphic
			break;

			case "projection":

			break;
		}
	}

	//Sets Up View Matrix
	this.updateView = function () {
		vec3.add(this.direction, this.position, this.forward); //Init Direction

		mat4.lookAt(
			this.viewMatrix,

			this.position,
			this.direction,

			this.up
		);
	}
}

//Framebuffer Wrapper Class
function Framebuffer() 
{
	this.fbo; //Stores WebGL Framebuffer
	this.texture; //Stores WebGL Framebuffer Texture

	this.ibo; //WebGL Index Buffer Object
	this.vbo; //WebGL Vertex Buffer Object

	this.iboData; //Index Buffer Data
	this.vboData; //Vertex Buffer Data

	//Initializes Framebuffer. PARAMETERS: WebGL Context, Buffer Width, Buffer Height
	this.initFramebuffer = function (gl, w, h) {
		this.fbo = gl.createFramebuffer(); //Create Framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

		//Create Framebuffer Texture
		this.texture = new Texture();
		this.texture.makeTextureBlank(gl, gl.NEAREST, w, h);

		//Bind Texture To FBO
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		//Create IBO And VBO
		this.initIBO(gl);
		this.initVBO(gl);
	}

	//Creates Framebuffer Index Buffer
	this.initIBO = function (gl) {
		this.iboData = [
			0, 1, 2,
			2, 3, 0
		];

		this.ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.iboData), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	//Creates Framebuffer Vertex Buffer
	this.initVBO = function (gl) {
		this.vboData = [
			-1.0,  1.0, 0.0, 1.0,
			 1.0,  1.0, 1.0, 1.0,
			 1.0, -1.0, 1.0, 0.0,
			-1.0, -1.0, 0.0, 0.0
		];

		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboData), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	//Binds Index And Vertex Buffers
	this.bindBuffers = function (gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
	}

	//Framebuffer Draw Call
	this.drawFBO = function (gl) {
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}
}

//Tilemap Manager
function Tilemap()
{
	//Tilemap Variables
	this.w; //Width Of Tilemap In Tiles
	this.h; //Height Of Tilemap In Tiles

	this.s; //Tilemap Size. Width * Height

	this.spr; //Tilemap Sprite

	this.lightW; //Light Map Tile Width
	this.lightH; //Light Map Tile Height

	this.map; //Tilemap Data

	//Gets Tilemap Data From File. PARAMETERS: Tilemap JSON, SpriteSheet, Relative Tile Size
	this.getTilemapDataFile = function(mapRes, sprRes, tSize)
	{
		//Get Tilemap Tiles, Width, Height
		var txtJSON = JSON.parse(mapRes.txt); //Translate JSON Text To Object
		this.map = txtJSON.layers[0].data;

		this.w = txtJSON.layers[0].width;
		this.h = txtJSON.layers[0].height;

		this.spr = new Sprite();
		this.spr.createSprite(
			tSize, tSize, //Width, Height

			txtJSON.tilesets[0].imagewidth, //Sprite Sheet Size In Pixels
			txtJSON.tilesets[0].tilewidth, //Tile Size In Pixels

			0 //Sprite Id
		);

		//Calculate Tilemap Size
		this.s = this.w * this.h;

		this.tileSize = tSize; //Set Relative Tile Size

		this.lightW = 1/8; //this.w;
		this.lightH = 1/this.h;
	}

	//Gets Tilemap Data From Parameters. PARAMETERS: SpriteSheet, Relative Tile Size, Width Of Map, Height Of Map, Map Data, Sprite Sheet Size, Tile Size
	this.getTilemapData = function(sprRes, tSize, width, height, mp, imagewidth, tilewidth)
	{
		//Get Tilemap Tiles, Width, Height
		this.map = mp; //txtJSON.layers[0].data;

		this.w = width; //txtJSON.layers[0].width;
		this.h = height; //txtJSON.layers[0].height;

		this.spr = new Sprite();
		this.spr.createSprite(
			tSize, tSize, //Width, Height

			imagewidth, //Sprite Sheet Size In Pixels
			tilewidth, //Tile Size In Pixels

			0 //Sprite Id
		);

		//Calculate Tilemap Size
		this.s = this.w * this.h;

		this.tileSize = tSize;

		this.lightW = 1/8; //this.w;
		this.lightH = 1/this.h;
	}

	//Initializes Tilemap For Use. PARAMETERS: 
	this.initTilemap =  function (gl)
	{
		this.VBOIdentity();
		this.IBOIdentity();

		this.spr.initMatrix();

		this.initVBO(gl);
		this.initIBO(gl);
	}

	//Initializes Vertex Buffer Object. PARAMETERS: WebGL Context
	this.initVBO = function (gl)
	{
		// console.log(this.s);
		this.spr.initVBOEmpty(gl, S_FLOAT*this.spr.vboData.length*this.s);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spr.vbo);

		for (var y=(this.h-1); y>=0; y--)
		{
			//Set VBO Data X Identity
			this.spr.vboData[0] = -this.tileSize;
			this.spr.vboData[6] = 0;
			this.spr.vboData[12] = 0;
			this.spr.vboData[18] = -this.tileSize;

			//Set VBO Lightmap Data U Identity
			this.spr.vboData[4] = -this.lightW; //TO-DO. Add Lightmap
			this.spr.vboData[10] = 0;
			this.spr.vboData[16] = 0;
			this.spr.vboData[22] = -this.lightW;

			//Write X Tilemap Data
			for (var x=0; x<this.w; x++)
			{
				this.spr.spriteCoord = this.spr.spriteSheet.getUVArr(this.map[y*this.w+x]);

				for (var i=0; i<this.spr.vboData.length; i+=6)
				{
					this.spr.vboData[i] += this.spr.w; //this.tileSize;

					this.spr.vboData[i+2] = this.spr.spriteCoord[(i/3)];
					this.spr.vboData[i+3] = this.spr.spriteCoord[(i/3)+1];

					this.spr.vboData[i+4] += this.lightW; //TO-DO. Lightmap
				}

				gl.bufferSubData(gl.ARRAY_BUFFER, S_FLOAT*this.spr.vboData.length*(y*this.w+x), new Float32Array(this.spr.vboData));
			}

			//Write Y Tilemap Data
			for (var i=0; i<this.spr.vboData.length; i+=6)
			{
				this.spr.vboData[i+1] += this.spr.h; //this.tileSize;
				this.spr.vboData[i+5] += this.lightH; //To-Do. Lightmap
			}
		}
	}

	//Initializes Index Buffer Object. PARAMETERS: WebGL Context
	this.initIBO = function (gl)
	{
		this.spr.initIBOEmpty(gl, S_FLOAT*6*this.s);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.spr.ibo);

		for (var a=0; a<this.s; a++)
		{
			for (var i=0; i<this.spr.iboData.length; i++)
			{
				this.spr.iboData[i] += 4;	
			}

			gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, S_FLOAT*this.spr.iboData.length*a, new Uint16Array(this.spr.iboData));
		}
	}

	//Puts VBO Array Into Default State
	this.VBOIdentity = function()
	{
		this.spr.vboData = [
			0,           this.spr.h,  this.spr.spriteCoord[0], this.spr.spriteCoord[1],  0,           this.lightH,
			this.spr.w,  this.spr.h,  this.spr.spriteCoord[2], this.spr.spriteCoord[3],  this.lightW, this.lightH,
			this.spr.w,  0,           this.spr.spriteCoord[4], this.spr.spriteCoord[5],  this.lightW, 0,
			0,           0,           this.spr.spriteCoord[6], this.spr.spriteCoord[7],  0,           0
		];
	}

	//Puts IBO Array Into Default State
	this.IBOIdentity = function()
	{
		this.spr.iboData = [
			-4, -3, -2,
			-2, -1, -4
		];
	}

	//Renders Tilemap VBO On Screen
	this.drawTilemap = function(gl, shader)
	{
		this.spr.setBuffers(gl);
		shader.updateAttributes(gl);

		this.spr.updUniforms(gl);
		gl.drawElements(gl.TRIANGLES, this.s*6*2, gl.UNSIGNED_SHORT, 0); //Draw Elements On Screen
	}

	//Collisiton Stuff. WIP
	this.isTileEmpty = function (x,y) {
		//console.log(Math.floor((spr.modelMatrix[12]*as)/0.25));

		console.log((y/this.tileSize)*this.w+(x/this.tileSize));

		if ( (y/this.tileSize)*this.w+(x/this.tileSize)) {
			return true;
		} //else {
		//	return false;
		//}
	}
}

//Sprite Manager
function Sprite()
{
	this.w; //Relative Width Of Sprite
	this.h; //Relative Height Of Sprite

	this.tileSizePx; //Sprite Tile Size In Pixels
	this.sprsSizePx; //Sprite Sheet Size In Pixels

	this.spriteSheet; //Spitesheet
	this.spriteCoord = []; //Spritesheet Sprite Coordinates

	this.modelMatrix; //Sprite Model Matrix

	this.offset = 0; //Sprite Sheet Horizontal Offset By Id

	this.vbo; //WebGL Vertex Buffer Object
	this.ibo; //WebGL Index Buffer Object

	this.vboData = []; //Stores Vertex Data
	this.iboData = []; //Stores Indexes

	this.modelUni; //Model Matrix Uniform
	this.spriteUni; //Sprite Offset Uniform

	//Animation
	this.animTime = 0; //Current Animation Time
	this.animDuration = 0; //Animation Duration
	this.spriteStep = 1; //Sprite Tile Step

	this.minId = 0; //Minimum Sprite Id
	this.maxId = 0; //Maximum Sprite Id

	//PARAMETERS: Width Of Sprite, Height Of Sprite, Sprite Sheet Size In Pixels, Tile Size In Pixels, Sprite Id On Tilemap
	this.createSprite = function (width, height, sheetS, tileS, id) {
		this.w = width;
		this.h = height;

		this.sprsSizePx = sheetS;
		this.tileSizePx = tileS;

		this.spriteSheet = new SpriteSheet();
		this.spriteSheet.createSheet(this.sprsSizePx, this.tileSizePx);

		this.spriteCoord = this.spriteSheet.getUVArr(id);
	}

	this.initSprite = function (gl) {
		this.VBOIdentity();
		this.IBOIdentity();

		this.initMatrix();

		this.initVBO(gl);
		this.initIBO(gl);
	}

	this.initMatrix = function () {
		this.modelMatrix = mat4.create();
	}

	this.initVBO = function (gl) {
		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboData), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	this.initIBO = function (gl) {
		this.ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.iboData), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	this.initVBOEmpty = function (gl, size) {
		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	this.initIBOEmpty = function (gl, size) {
		this.ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, size, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	this.VBOIdentity = function () {
		this.vboData = [
			0.0, 	this.h, this.spriteCoord[0], this.spriteCoord[1],  0.0, 1/8,
			this.w, this.h, this.spriteCoord[2], this.spriteCoord[3],  2/8, 1/8,
			this.w, 0.0,	this.spriteCoord[4], this.spriteCoord[5],  2/8, 0.0,
			0.0, 	0.0,	this.spriteCoord[6], this.spriteCoord[7],  0.0, 0.0
		];

		console.log(this.spriteCoord);
	}

	this.VBOFliped = function () {
		this.vboData = [
			0.0, 	this.h, this.spriteCoord[2], this.spriteCoord[1],  0.0, 1/8,
			this.w, this.h, this.spriteCoord[0], this.spriteCoord[3],  2/8, 1/8,
			this.w, 0.0,	this.spriteCoord[6], this.spriteCoord[5],  2/8, 0.0,
			0.0, 	0.0,	this.spriteCoord[4], this.spriteCoord[7],  0.0, 0.0
		];
	}

	this.IBOIdentity = function () {
		this.iboData = [
			0,1,2,
			2,3,0
		];
	}

	//PARAMETERS: WebGL Context, Model Matrix Uniform
	this.setBuffers = function (gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

		// gl.uniformMatrix4fv(this.modelUni, false, this.modelMatrix);
	}

	//Stores Unifroms Locations
	this.setUniformsLocation = function (modelU, spriteU) {
		this.modelUni = modelU;
		this.spriteUni = spriteU;
	}

	//Updates Uniforms
	this.updUniforms = function (gl) {
		gl.uniformMatrix4fv(this.modelUni, false, this.modelMatrix);
		gl.uniform2fv(this.spriteUni, [this.tileSizePx/this.sprsSizePx*this.offset,0]);
	}

	this.drawSprite = function (gl, shader) {
		this.setBuffers(gl);
		this.updUniforms(gl);

		shader.updateAttributes(gl);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

	//Animation

	//Init Animation Variables. PARAMETRS: Animation Duration, Animation Step, Min Animation Id, Max Animation Id 
	this.animInit = function (aDur, aStep, mnId, mxId) {
		this.animDuration = aDur;
		this.spriteStep = aStep;

		this.minId = mnId;
		this.maxId = mxId;
	}

	//Animation Logic
	this.animTick = function () {
		if (this.animTime >= this.animDuration) {
			this.offset += this.spriteStep;
			this.animTime = 0;

			if (this.offset >= this.maxId) this.offset = this.minId;
		} else {
			this.animTime += dTime;
		}
	}
}

//Texture Wraper Class
function Texture()
{
	this.texture; //Stores WebGL Texture

	//Creates OpenGL Texture. PARAMETERS: WebGL Context, GL , Texture Source
	this.makeTexture = function (gl, scl, src)
	{
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, scl);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, scl);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src.img);

		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	this.makeTextureBlank = function (gl, scl, w, h) {
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, scl);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, scl);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	//Binds Texture To Texture Unit. PARAMETERS: WebGL Context, Texture Unit, Texture Unit Number, Texture Shader Uniform
	this.bindTexture = function (gl, texUnit, texUnitNo, uniform) {
		gl.activeTexture(texUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(uniform, texUnitNo);
	}
}

//WebGL Shaders Wrapper Class
function Shader() {
	this.vertex; //Stores GL Vertex Shader
	this.fragment; //Stores GL Frament Shader

	this.program; //Stores GL Shader Program

	this.attirbutes = {}; //Stores Shader Attributes Location
	this.uniforms = {};

	//Creates Shader. PARAMETERS: WebGL Context, Shader Type, Shader Source Object
	this.setShader = function(gl, type, src) {
		var shader; //Refferene To Working Shader

		//Create Shader Of Specified Type
		switch (type) {
			case "fragment":
				this.fragment = gl.createShader(gl.FRAGMENT_SHADER); //Create Fragment Shader
				shader = this.fragment; //Set Shader Refference
			break;

			case "vertex":
				this.vertex = gl.createShader(gl.VERTEX_SHADER); //Create Vertex Shader
				shader = this.vertex; //Set Shader Refference
			break;
		}

		gl.shaderSource(shader, src.txt); //Set Shader Source
		gl.compileShader(shader); //Compile Shader From Source

		//Output Shader Compilaton Error
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("Shader Of Type: "+type+" From: "+src.src+" Failed To Compile:");
			console.error(gl.getShaderInfoLog(shader));
		} else {
			console.info("Successfully Compiled Shader Of Type: "+type+" From: "+src.src);
		}
	}

	//Creates Fragment And Vertex Shaders. PARAMETERS: WebGL context, Fragment Shader, Vertex Shader
	this.setShaders = function(gl, vert, frag) {
		this.setShader(gl, "vertex", vert);
		this.setShader(gl, "fragment", frag);
	}

	//Creates Shader Program. PARAMETERS: WebGL Context
	this.makeProgram = function (gl) {
		this.program = gl.createProgram(); //Create Shader Program Object

		gl.attachShader(this.program, this.vertex); //Attach Vertex Shader
		gl.attachShader(this.program, this.fragment); //Attach Fragment Shader
		gl.linkProgram(this.program); //Link Shader Program

		//Output Linking Errors
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			console.error("Couldn't Create Shader Program: "+gl.getProgramInfoLog(this.program));
		} else {
			console.info("Shader Program Linking Successfull");
		}
	}

	/* Attributes */

	//Sets Shader Attribute. PARAMETERS: WebGL Context, Attibute Name
	this.pushAttribute = function (gl, attrName, lng, str, offs) {
		this.attirbutes[attrName] = { 	
			location: gl.getAttribLocation(this.program, attrName),
			length: lng,
			stride: str,
			pointer: offs
		};
	}

	//Enables All Of Shaders Attributes. PARAMETERS: WebGL Context
	this.enableAttributes = function (gl) {
		for (var attr in this.attirbutes) {
			gl.enableVertexAttribArray(this.attirbutes[attr].location);
		}
	}

	//Disables All Of Shaders Attributes. PARAMETERS: WebGL Context
	this.disableAttributes = function (gl) {
		for (var attr in this.attirbutes) {
			gl.disableVertexAttribArray(this.attirbutes[attr].location);
		}
	}

	//Updates Attributes. PATAMETERS: WebGL Context
	this.updateAttributes = function (gl) {
		for (var attr in this.attirbutes) {
			gl.vertexAttribPointer(
					this.attirbutes[attr].location, 
					this.attirbutes[attr].length, 

					gl.FLOAT, false, 

					this.attirbutes[attr].stride, 
					this.attirbutes[attr].pointer
				);
		}
	}

	/* Uniforms */

	//Pushes Uniform Location To List. PARAMETERS: WebGL Context, Uniform Name
	this.pushUniform = function (gl, unifName) {
		this.uniforms[unifName] = gl.getUniformLocation(this.program, unifName);
	}
}

//Sprite Sheet Managing Class
function SpriteSheet() {
	this.sheetS; //Sprite Sheet Size In Pixels
	this.tileS; //Tile Size In Pixels

	this.sheetSR; //Sprite Sheet Size In Tiles
	this.tileSR; //Relative Tile Size

	//Initialize Tile Sheet. PARAMETERS: Sprite Sheet Size In Pixels, Tile Size In Pixels
	this.createSheet = function (sheetS, tileS) {
		this.sheetS = sheetS; //Set Sheet Size In Pixels
		this.tileS = tileS; //Set Tile Size In Pixels

		this.sheetSR = sheetS/tileS - 1; //Set Sprite Sheet Size In Tiles
		this.tileSR = tileS/sheetS; //Set Relative Tile Size
	}

	//Get U Coordinate. PARAMETERS: Sprite Id 
	this.getU = function (id) {
		return this.tileSR * ((id-1)%(this.sheetSR+1));
	}

	//Get V Coordinate. PARAMETERS: Sprite Id
	this.getV = function (id) {
		return this.tileSR * ( this.sheetSR - (Math.floor((id-1)/(this.sheetSR+1))) );
	}

	//Get UV Coordinates. PARAMETERS: Sprite Id
	this.getUV = function (id) {
		var uv = { //Stores UV Values
			u: 0,
			v: 0
		};

		//Get UV Values
		uv.u = this.getU(id);
		uv.v = this.getV(id);

		return uv;
	}

	//Get UV Coordinates For Quad. PARAMETERS: Sprite Id
	this.getUVArr = function (id) {
		var uv = this.getUV(id); //Get Bottom Left UV Coordinates

		//Set UV Coordiantes For Quad
		var coords = [
			uv.u, 			  uv.v+this.tileSR,
			uv.u+this.tileSR, uv.v+this.tileSR,
			uv.u+this.tileSR, uv.v,
			uv.u, 			  uv.v
		];

		return coords;
	}
}

//Resource Managing Class
function ResourceManager(rcsComp) {
	this.resources = rcsComp; //Reosurce Storage Object

	var rcsLoaded = 0; //Number Of Resources Loaded
	var rcsSize = 0; //Number Of Resources

	this.clk; //OnLoad Done Callback
	this.rcs; //Resource 

	this.rcsReq; //Resource Request

	//Load Texture And Shaders. PARAMETERS: Callback called on finnish
	this.getResources = function (callback) {
		this.clk = callback;
		this.loadResources();
	}

	//Load Resources From The List. PARAMETERS: Callback called on finnish
	this.loadResources = function () {
		rcsLoaded = 0;
		rcsSize = 0;

		for (var rcs in this.resources) rcsSize++; //Calculate Size Of Resources

		// prgBar.max = rcsSize; //Temp Thing

		for (var rcs in this.resources) {
			this.rcs = this.resources[rcs]; //Set Resource
			this.loadResource(); //Load Resource
		}
	}

	//Load Specific Resource. PARAMETERS: Resource, Callback
	this.loadResource = function () {
		switch (this.rcs.type) {
			case "image":
				this.loadImage();
			break;

			case "text":
				this.loadText();
			break;

			case "audio":
				this.loadAudio();
			break;
		}
	}

	//Image Loading Instructions
	this.loadImage = function () {
		this.rcsReq = new Image(); //Set Request To Image
		this.rcsReq.src = this.rcs.src; //Set Image Path

		this.setLoadData();

		this.rcsReq.onload = function () { //Set Loaded Resource
			this.rcs.img = this;
			this.loadEvent();
		};
	}

	//Text Loading Instructions
	this.loadText = function () {
		this.rcsReq = new XMLHttpRequest(); //Set Request To Text
		this.rcsReq.open("GET", this.rcs.src); //Set Path To Text
		this.rcsReq.send(null); //Send Request

		this.setLoadData();

		this.rcsReq.onload = function () { //Set Loaded Resource
			this.rcs.txt = this.responseText;
			this.loadEvent();
		};
	}

	//Audio Loading Instructions
	this.loadAudio = function () {
		this.rcsReq = new Audio();
		this.rcsReq.src = this.rcs.src;

		this.setLoadData();

		this.rcsReq.onloadeddata = function () { //Set Loaded Resource
			this.rcs.aud = this;
			this.loadEvent();
		};
	}

	//Sets Resources Data In Load Function
	this.setLoadData = function (callback) {
		this.rcsReq.rcs = this.rcs; //Set Resource For OnLoad Function

		this.rcsReq.clk = this.clk; //Set Callback For OnLoad Function
		this.rcsReq.loadEvent = this.loadEvent; //Set Load Tick
	}

	//Logic Tick After Resource Load
	this.loadEvent = function () {
		rcsLoaded++; //Increment Resource Count

		// prgBar.value = rcsLoaded; //Temp Thing

		if (rcsLoaded == rcsSize) this.clk(); //Call Callback When Everything Is Loaded
	}

	//Get Ammount Of Resources
	this.getSize = function () {
		return rcsSize;
	}

	//Get Ammount Of Resources Loaded
	this.getLoaded = function () {
		return rcsLoaded;
	}
}