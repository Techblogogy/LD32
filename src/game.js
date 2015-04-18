var res = {
	vertSh: {
		type: "text",
		src: "./res/shaders/vert.glsl"
	},

	fragSh: {
		type: "text",
		src: "./res/shaders/frag.glsl"
	},

	fragFBO: {
		type: "text",
		src: "./res/shaders/sceneFrag.glsl"
	},

	vertFBO: {
		type: "text",
		src: "./res/shaders/sceneVert.glsl"
	},

	garageMp: {
		type: "text",
		src: "./res/maps/garage.json"
	},

	mainSheet: {
		type: "image",
		src: "./res/textures/gameSheet.png"
	},

	lightMapG: {
		type: "image",
		src: "./res/textures/light.png"
	},

	mFont: {
		type: "image",
		src: "./res/fonts/FontSheet.png"
	}
}

var canvas, gl;
var as;
var resM = new ResourceManager(res);

//Framebuffers
var fbo;

//Shaders
var mainSh; //Main Shader
var fboSh; //Frame Buffer Shader

//Keyboards
var kbrd;

//Cameras
var cam;

//Textures
var mainTex; //Main Sprite Sheet Texture
var lightTex; //Lightmap Textue
var fontTex; //Font Texture

//Maps
var garageMap;

//Sprites
var scienSpr;

//Timing
var cTime = 0, //Current Time
	dTime = 0, //Delta Time
	lTime = 0; //Last Time

//Dialogs
var dlog; //Test Dialog

//Ext
var alloWalk = 0;

window.onload = function () {
	resM.getResources(InitCanvas);
}

function InitCanvas() {
	canvas = document.createElement("canvas");
	canvas.id = "gameCanvas";

	canvas.width = 1024;
	canvas.height = 576;
	as = canvas.width/canvas.height;

	gl = canvas.getContext("webgl");

	document.body.appendChild(canvas);

	console.info("Game Canvas Created");

	InitGame(); //Initializes Game Systems
}

function InitGame() {
	InitGL();
	InitShaders();
	InitFramebuffer();
	InitTextures();
	InitMaps();
	InitSprites();
	InitKeyboard();
	InitDialogs();
	InitCamera();

	mainSh.enableAttributes(gl);

	 // mat4.scale(scienSpr.modelMatrix, scienSpr.modelMatrix, vec3.fromValues(-1,1,1));


	window.requestAnimationFrame(MainLoop);
}

function InitGL() {
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.clearColor(0,0,0,1);
}

function InitShaders() {
	//Create Main Shader Program
	mainSh = new Shader();
	mainSh.setShaders(gl, res.vertSh, res.fragSh);
	mainSh.makeProgram(gl);

	//Set Main Shader as Current Shader
	gl.useProgram(mainSh.program);

	//Get Main Shader Attributes
	mainSh.pushAttribute(gl, "inpCr", 2, 6*S_FLOAT, 0);
	mainSh.pushAttribute(gl, "texPs", 2, 6*S_FLOAT, 2*S_FLOAT);
	mainSh.pushAttribute(gl, "lmpPs", 2, 6*S_FLOAT, 4*S_FLOAT);

	//Get Main Shader Uniforms
	mainSh.pushUniform(gl, "proj");
	mainSh.pushUniform(gl, "model");
	mainSh.pushUniform(gl, "view");
	mainSh.pushUniform(gl, "tex");
	mainSh.pushUniform(gl, "texOff");

	//Create Framebuffer Shader Program
	fboSh = new Shader();
	fboSh.setShaders(gl, res.vertFBO, res.fragFBO);
	fboSh.makeProgram(gl);

	gl.useProgram(fboSh.program);

	//Get Framebuffer Shader Attributes
	fboSh.pushAttribute(gl, "inpCr", 2, 4*S_FLOAT, 0);
	fboSh.pushAttribute(gl, "texPs", 2, 4*S_FLOAT, 2*S_FLOAT);

	//Get Framebuffer Shader Uniforms
	// fboSh.pushUniform(gl, "tex1");
	fboSh.pushUniform(gl, "light");
}

function InitFramebuffer() {
	fbo = new Framebuffer();
	fbo.initFramebuffer(gl, canvas.width, canvas.height);

	//fbo.texture.bindTexture(gl, gl.TEXTURE1, 1, fboSh.uniforms.tex1);

	lightTex = new Texture();
	lightTex.makeTexture(gl, gl.NEAREST, res.lightMapG);
	lightTex.bindTexture(gl, gl.TEXTURE1, 1, fboSh.uniforms.tex1);

	gl.bindTexture(gl.TEXTURE_2D, null);

	gl.useProgram(mainSh.program);
}

function InitTextures() {
	mainTex = new Texture();
	mainTex.makeTexture(gl, gl.NEAREST, res.mainSheet);

	fontTex = new Texture();
	fontTex.makeTexture(gl, gl.NEAREST, res.mFont);
}

function InitMaps() {
	garageMap = new Tilemap();
	garageMap.getTilemapDataFile(res.garageMp, res.mainSheet, 2/8);
	garageMap.initTilemap(gl);

	garageMap.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
}

function InitSprites() {
	scienSpr = new Sprite();
	scienSpr.createSprite(2/8*3, 2/8*3, 256, 16, 241);
	scienSpr.initSprite(gl);

	scienSpr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);

	mat4.translate(scienSpr.modelMatrix, scienSpr.modelMatrix, [(2/8*0)/as,0.25,0]);

	scienSpr.animInit(380, 1,1,3);
}

function InitKeyboard() {
	kbrd = new Keyboard();
	kbrd.addListeners();
}

function InitDialogs() {
	dlog = new Dialog();

	dlog.map = [
		["Who the hell are you?", "Sir are you allright, I'm your assistant, we work together, remember?"],
		["What are we doing here?", "Sir we are making a weapon of mass destruction here in your garage."],
		["Why is it so fucking dark here!", "We don't have money for more light bulbs sir"],
		["See you around!", "EXIT"]
	];

	dlog.initDialog(res.mFont);
	dlog.setUpText(gl);
	dlog.initCursor(gl);
}

function InitCamera() {
	cam = new Camera();
	cam.initCamera("ortho", canvas.width, canvas.height);

	cam.position = vec3.fromValues(as, 1.0, 1.0);
	cam.updateView();

	gl.uniformMatrix4fv(mainSh.uniforms.proj, false, cam.projMatrix);
	gl.uniformMatrix4fv(mainSh.uniforms.view, false, cam.viewMatrix);
}

function GetTime() {
	cTime = new Date().getTime();
	dTime = cTime - lTime;
	lTime = cTime;
}

function MainLoop() {
	Tick();
	Render();

	window.requestAnimationFrame(MainLoop);
}

function Tick() {
	var t = (1/4)/24;

	GetTime();

	dlog.tickDialog(kbrd);

	//Player Tick Thing
	if (kbrd.keys.A) { //Move Left
		mat4.translate(scienSpr.modelMatrix, scienSpr.modelMatrix, [-t/as,0,0]);

		// mat4.scale(scienSpr.modelMatrix, scienSpr.modelMatrix, vec3.fromValues(-1,1,1));

		scienSpr.animTick();
	} else if (kbrd.keys.D) { //Move Right
		mat4.translate(scienSpr.modelMatrix, scienSpr.modelMatrix, [t/as,0,0]);
		scienSpr.animTick();
	} else {
		scienSpr.offset = 0;
		scienSpr.animTime = scienSpr.animDuration;
	}
}

function Render() {
	// gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
	// gl.clear(gl.COLOR_BUFFER_BIT);

	// garageMap.drawTilemap(gl, mainSh);

	// //Disable Framebuffer And Main Shader
	// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	// mainSh.disableAttributes(gl);

	//Render Framebuffer
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	mainTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);

	garageMap.drawTilemap(gl, mainSh); //Draw Level
	scienSpr.drawSprite(gl, mainSh); //Draw Player Scientist

	//Render Dialog
	fontTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);
	dlog.drawDialog(gl, mainSh);

	// gl.useProgram(fboSh.program);
	// fbo.bindBuffers(gl);

	// fboSh.enableAttributes(gl);
	// fboSh.updateAttributes(gl);

	// fbo.drawFBO(gl);

	// fboSh.disableAttributes(gl);

	// gl.useProgram(mainSh.program);
	// mainSh.enableAttributes(gl);
}