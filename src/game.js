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

//Maps
var garageMap;

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
	InitTextures();
	InitFramebuffer();
	InitMaps();
	InitKeyboard();
	InitCamera();

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

	//Get Framebuffer Shader Attributes
	fboSh.pushAttribute(gl, "inpCr", 2, 4*S_FLOAT, 0);
	fboSh.pushAttribute(gl, "texPs", 2, 4*S_FLOAT, 2*S_FLOAT);

	//Get Framebuffer Shader Uniforms
	fboSh.pushUniform(gl, "tex1");
	fboSh.pushUniform(gl, "light");
}

function InitFramebuffer() {
	
}

function InitTextures() {
	mainTex = new Texture();
	mainTex.makeTexture(gl, gl.NEAREST, res.mainSheet);

	mainTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);
}

function InitMaps() {
	garageMap = new Tilemap();
	garageMap.getTilemapDataFile(res.garageMp, res.mainSheet, 2/8);
	garageMap.initTilemap(gl);

	garageMap.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
}

function InitKeyboard() {
	kbrd = new Keyboard();
	kbrd.addListeners();
}

function InitCamera() {
	cam = new Camera();
	cam.initCamera("ortho", canvas.width, canvas.height);

	cam.position = vec3.fromValues(as, 1.0, 1.0);
	cam.updateView();

	gl.uniformMatrix4fv(mainSh.uniforms.proj, false, cam.projMatrix);
	gl.uniformMatrix4fv(mainSh.uniforms.view, false, cam.viewMatrix);
}

function MainLoop() {
	Tick();
	Render();

	window.requestAnimationFrame(MainLoop);
}

function Tick() {

}

function Render() {
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	mainSh.enableAttributes(gl);

	garageMap.drawTilemap(gl, mainSh);
}