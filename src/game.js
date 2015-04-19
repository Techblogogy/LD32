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

	joshMp: {
		type: "text",
		src: "./res/maps/joshRoom.json"
	},

	kitchenMp: {
		type: "text",
		src: "./res/maps/kitchen.json"
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
var scienSpr; //Main Player Sprite
var arrowSpr; //Interactive Object Pointer Arrow
var bombSpr; //Bomb Sprite

//Timing
var cTime = 0, //Current Time
	dTime = 0, //Delta Time
	lTime = 0; //Last Time

//Dialogs
var dlog; //Test Dialog

//Ext
var alloWalk = true;
var color = [1.0,1.0,1.0,1.0];

//Scenes
var scnMan;

var scn;
var scn2;
var scn3;

//Players
var player;

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
	// mainSh.pushUniform(gl, "col");

	// gl.uniform4fv(mainSh.uniforms.col, [1.0,1.0,1.0,1.0]);

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

	fboSh.pushUniform(gl, "amb");
}

function InitFramebuffer() {
	fbo = new Framebuffer();
	fbo.initFramebuffer(gl, canvas.width, canvas.height);

	lightTex = new Texture();
	lightTex.makeTexture(gl, gl.NEAREST, res.lightMapG);

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
	scnMan = new SceneManager();

	scn = new Scene();
	scn.addTilemap(res.garageMp, res.mainSheet);
	scnMan.scenes.push(scn);

	scn2 = new Scene();
	scn2.addTilemap(res.joshMp, res.mainSheet);
	scnMan.scenes.push(scn2);

	scn3 = new Scene();
	scn3.addTilemap(res.kitchenMp, res.mainSheet);
	scnMan.scenes.push(scn3);
}

function InitSprites() {
	player = new Player();
	player.spr = new Sprite();
	player.spr.createSprite(2/8*3, 2/8*3, 256, 16, 241);
	player.spr.initSprite(gl);

	player.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
	mat4.translate(player.spr.modelMatrix, player.spr.modelMatrix, [(2/8*5)/as,0.25,0]);
	player.spr.animInit(380, 1,1,3);

	//INIT ASSISTANT
	var assist = new IntSprite();
	assist.initIntSpr(2/8*3,2/8*3,256,16,210,2/8);
	assist.act = function () {
		scn.dialog.enableDialog(this);
	}

	mat4.translate(assist.spr.modelMatrix, assist.spr.modelMatrix, [(2/8*3)/as,(2/8*1),0]);
	assist.updArrowPos();
	scn.sprites.push(assist);

	//Init Bomb Sprite
	bombSpr = new IntSprite();
	bombSpr.initIntSpr(2/8, 2/8, 256, 16, 114,0);
	bombSpr.act = function () {
		//scn.dialog.enableDialog(this);
		console.log("BOBMS");
	}

	mat4.translate(bombSpr.spr.modelMatrix, bombSpr.spr.modelMatrix, [(2/8*8)/as,(2/8*2.7),0]);
	bombSpr.updArrowPos();
	scn.sprites.push(bombSpr);

	//INIT JOSH
	var josh = new IntSprite();
	josh.initIntSpr(2/8*3,2/8*3,256,16,209,2/8);
	josh.act = function () {
		scn2.dialog.enableDialog(this);
	}

	mat4.translate(josh.spr.modelMatrix, josh.spr.modelMatrix, [(2/8*6)/as,0.25,0]);
	josh.updArrowPos();
	scn2.sprites.push(josh);

	//INIT TOASTER
	var toaster = new IntSprite();
	toaster.initIntSpr(2/8,2/8,256,16,47,0);
	toaster.act = function () {
		player.addToInv("TOAST", 46);
		toaster.spr.offset = 1;
		this.enabledA = false;
	}

	mat4.translate(toaster.spr.modelMatrix, toaster.spr.modelMatrix, [(2/8*10.2)/as,0.675,0]);
	toaster.updArrowPos();
	scn3.sprites.push(toaster);

	//INIT DOORS

	var dr1 = new Door();
	dr1.initDoor(scnMan, scn, 1, 12);

	var dr2 = new Door();
	dr2.initDoor(scnMan, scn2, 0, 0);

	var dr3 = new Door();
	dr3.initDoor(scnMan, scn2, 2, 11.5);

	var dr4 = new Door();
	dr4.initDoor(scnMan, scn3, 1, 0);
}

function InitKeyboard() {
	kbrd = new Keyboard();
	kbrd.addListeners();
}

function InitDialogs() {
	scn.dialog = new Dialog();
	scn.dialog.map = [
		[["Who the hell are you?", "Sir are you allright, I'm your assistant, we work together, remember?",1],
		["What are we doing here?", "Sir we are making a weapon of mass destruction here in garage.",2],
		["Why is it so fucking dark here!", "We don't have money for more light bulbs sir",0],
		["See you around!", "EXIT",0]],

		[["Oh, yes! I've must of hit my had a bit", "Whatever you say",0],
		 ["Ah, now I remember", "Whatever you say",0],
		 ["Thanks!", "Whatever you say",0]],

		[["Of course, how could of I forgotten!", "Are sure you allright, sir?", 2],
		 ["Why are we making it in an old garage?", "So no one would suspect? I don't really know.", 2],
		 ["Can you remind me the guide?", "You've written a guide in your notebook.", 3]],

		[["Can you read it for me?", "We need A) deadly virus, B) detonator and C) Secret Ingredient", 0],
		 ["Yes, I did that. I'm a freaking genious!", "Yes you are, sir", 0]]
		
	];
	scn.dialog.initDialog(gl, res.mFont);
	scn.dialog.setUpText(gl);

	scn2.dialog = new Dialog();
	scn2.dialog.map = [
		[["Hey, what are you doing in my house?!", "Excuse me! It's my house, and you are renting it from me.",1],
		 ["Who are you?", "I'm Josh. Your housemate",0],
		 ["Know a place to get a deadly virus?","Not really. No",0],
		 ["Got any detonators?", "Why would I have those?", 0],
		 ["I'm gonna get a grip", "EXIT", 0]],

		[["Oh, really!", "Yea really, here are the papers",0],
		 ["Liar!", "Here are the papers",0]]
		
	];
	scn2.dialog.initDialog(gl, res.mFont);
	scn2.dialog.setUpText(gl);
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

var sp = 0.001;
var strTime = new Date().getTime();
// color[3] = 0;

function Tick() {
	GetTime();

	scnMan.tick(kbrd);
}

function Render() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// scn.drawScene(gl, mainSh);
	scnMan.render(gl, mainSh);

	//Disable Framebuffer And Main Shader
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	mainSh.disableAttributes(gl);

	gl.bindTexture(gl.TEXTURE_2D, null);

	//Render Framebuffer
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(fboSh.program);

	gl.uniform4fv(fboSh.uniforms.amb, color);

	lightTex.bindTexture(gl, gl.TEXTURE1, 1, fboSh.uniforms.light);
	fbo.texture.bindTexture(gl, gl.TEXTURE0, 0, fboSh.uniforms.tex);

	fbo.bindBuffers(gl);

	fboSh.enableAttributes(gl);
	fboSh.updateAttributes(gl);

	fbo.drawFBO(gl);

	fboSh.disableAttributes(gl);

	gl.useProgram(mainSh.program);
	mainSh.enableAttributes(gl);

	// scn.drawText(gl, mainSh);
	scnMan.renderTxt(gl, mainSh);
}