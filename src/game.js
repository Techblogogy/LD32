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

	basementMp: {
		type: "text",
		src: "./res/maps/basement.json"
	},

	povMp: {
		type: "text",
		src: "./res/maps/povLair.json"
	},

	cellMp: {
		type: "text",
		src: "./res/maps/cell.json"
	},

	corMp: {
		type: "text",
		src: "./res/maps/coridor1.json"
	},

	mainSheet: {
		type: "image",
		src: "./res/textures/gameSheet.png"
	},

	lightMapG: {
		type: "image",
		src: "./res/textures/lightG.png"
	},

	lightMapJ: {
		type: "image",
		src: "./res/textures/lightJ.png"
	},

	lightMapK: {
		type: "image",
		src: "./res/textures/lightK.png"
	},

	lightMapB: {
		type: "image",
		src: "./res/textures/lightB.png"
	},

	lightMapP: {
		type: "image",
		src: "./res/textures/lightP.png"
	},

	lightMapC: {
		type: "image",
		src: "./res/textures/lightC.png"
	},

	mFont: {
		type: "image",
		src: "./res/fonts/FontSheet.png"
	},

	theme1: {
		type: "audio",
		src: "./res/sounds/theme1.mp3"
	},

	theme2: {
		type: "audio",
		src: "./res/sounds/theme2.mp3"
	},

	click: {
		type: "audio",
		src: "./res/sounds/blip.mp3"
	},

	walkFx: {
		type: "audio",
		src: "./res/sounds/walk.mp3"
	},

	boomFx: {
		type: "audio",
		src: "./res/sounds/exlod.mp3"
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

var scn; //Garage
var scn2; //Josh Room
var scn3; //Kitchen
var scn4; //Beasement
var scn5; //POV Lair
var scn6; //Prizon Cell
var scn7; //Coridor

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

	res.walkFx.aud.volume = 0.1;
	res.click.aud.volume = 0.2;
	res.theme1.aud.volume = 0.5;
	res.theme2.aud.volume = 0.4;

	res.walkFx.aud.loop = true;
	res.theme1.aud.loop = true;
	res.theme2.aud.loop = true;

	res.theme1.aud.play();

	window.requestAnimationFrame(MainLoop);
}

function InitGL() {
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.clearColor(0,0,0,1);
}

function playClickFX() {
	res.click.aud.pause();
	res.click.aud.currentTime = 0;
	res.click.aud.play();
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

	// gl.bindTexture(gl.TEXTURE_2D, null);

	gl.useProgram(mainSh.program);
}

function InitTextures() {
	mainTex = new Texture();
	mainTex.makeTexture(gl, gl.NEAREST, res.mainSheet);

	fontTex = new Texture();
	fontTex.makeTexture(gl, gl.NEAREST, res.mFont);

	// lightTex = new Texture();
	// lightTex.makeTexture(gl, gl.NEAREST, res.lightMapG);
}

function InitMaps() {
	scnMan = new SceneManager();

	scn = new Scene();
	scn.addTilemap(res.garageMp, res.mainSheet);
	scn.addLightmap(res.lightMapG);
	scnMan.scenes.push(scn);

	scn2 = new Scene();
	scn2.addTilemap(res.joshMp, res.mainSheet);
	scn2.addLightmap(res.lightMapJ);
	scnMan.scenes.push(scn2);

	scn3 = new Scene();
	scn3.addTilemap(res.kitchenMp, res.mainSheet);
	scn3.addLightmap(res.lightMapK);
	scnMan.scenes.push(scn3);

	scn4 = new Scene();
	scn4.addTilemap(res.basementMp, res.mainSheet);
	scn4.addLightmap(res.lightMapB);
	scnMan.scenes.push(scn4);

	scn5 = new Scene();
	scn5.addTilemap(res.povMp, res.mainSheet);
	scn5.addLightmap(res.lightMapP);
	scnMan.scenes.push(scn5);

	scn6 = new Scene();
	scn6.addTilemap(res.cellMp, res.mainSheet);
	scn6.addLightmap(res.lightMapC);
	scnMan.scenes.push(scn6);

	scn7 = new Scene();
	scn7.addTilemap(res.corMp, res.mainSheet);
	scn7.addLightmap(res.lightMapC);
	scnMan.scenes.push(scn7);
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
		playClickFX();

		scn.dialog.setDialogN();
		scn.dialog.enableDialog(this);
	}

	mat4.translate(assist.spr.modelMatrix, assist.spr.modelMatrix, [(2/8*3)/as,(2/8*1),0]);
	assist.updArrowPos();
	scn.sprites.push(assist);

	//Init Bomb Sprite
	bombSpr = new IntSprite();
	bombSpr.initIntSpr(2/8, 2/8, 256, 16, 114,0);
	bombSpr.objs = 0;
	bombSpr.act = function () {
		playClickFX();
		
		if (player.inventory[0] != undefined) {
			if (player.inventory[0].n == "DETONATOR") {
				this.objs++;
				player.inventory.shift();

				scn.dialog.setDialogO("Let's add this vhs player as detonator");
			} else if (player.inventory[0].n == "TOAST") {
				this.objs++;
				player.inventory.shift();

				scn.dialog.setDialogO("Let's add this toast filled with deadly   microbes");
			}
		} else if (player.inventory[1] != undefined) {
			if (player.inventory[1].n == "DETONATOR") {
				this.objs++;
				player.inventory.shift();

				scn.dialog.setDialogO("Let's add this vhs player as detonator");
			} else if (player.inventory[1].n == "TOAST") {
				this.objs++;
				player.inventory.shift();

				scn.dialog.setDialogO("Let's add this toast filled with deadly microbes");
			}
		} else if (bombSpr.objs >= 2) {
			var mib = new IntSprite();
			mib.initIntSpr(2/8*3, 2/8*3, 256, 16, 211, 0);
			mib.act = function () {};

			mat4.translate(mib.spr.modelMatrix, mib.spr.modelMatrix, [(2/8*9)/as,(2/8*1),0]);
			mib.updArrowPos();
			scn.sprites.push(mib);

			player.spr.modelMatrix[12] = (2/8*5)/as;
			player.spr.modelMatrix[13] = (2/8*1);
			player.fliped = false;
			player.spr.offset = 0;

			scn.dialog.act = function () {
				scnMan.setLv(5);
				
				res.theme1.aud.pause();
				res.theme2.aud.play();
			}

			scn.dialog.setDialogO("Hello proffesor! I see you've completed   your bomb. I'm affraid I have to take you to the great pov");
		} else {
			scn.dialog.setDialogO("This is my bomb. It's missing some parts");
		}

		scn.dialog.enableDialog(this);
	}

	mat4.translate(bombSpr.spr.modelMatrix, bombSpr.spr.modelMatrix, [(2/8*8)/as,(2/8*2.7),0]);
	bombSpr.updArrowPos();
	scn.sprites.push(bombSpr);

	//INIT JOSH
	var josh = new IntSprite();
	josh.initIntSpr(2/8*3,2/8*3,256,16,209,2/8);
	josh.act = function () {
		playClickFX();

		scn2.dialog.enableDialog(this);
	}

	mat4.translate(josh.spr.modelMatrix, josh.spr.modelMatrix, [(2/8*6)/as,0.25,0]);
	josh.updArrowPos();
	scn2.sprites.push(josh);

	//INIT TOASTER
	var toaster = new IntSprite();
	toaster.initIntSpr(2/8,2/8,256,16,47,0);
	toaster.act = function () {
		playClickFX();

		player.addToInv("TOAST", 46);
		toaster.spr.offset = 1;
		this.enabledA = false;

		scn3.dialog.enbPrt = false;
		scn3.dialog.setDialogO("Hmm, josh made this toast awhile ago. It  must have developed some deadly bacteria  by now");
		scn3.dialog.enableDialog(this);
	}

	mat4.translate(toaster.spr.modelMatrix, toaster.spr.modelMatrix, [(2/8*6)/as,0.675,0]);
	toaster.updArrowPos();
	scn3.sprites.push(toaster);

	//INIT DETONATOR
	var deton = new IntSprite();
	deton.initIntSpr(2/8,2/8,256,16,31,0);
	deton.act = function () {
		playClickFX();

		player.addToInv("DETONATOR", 31);
		this.enabledA = false;
		this.enabledR = false;

		scn4.dialog.enbPrt = false;
		scn4.dialog.setDialogO("Hmm, I can rig up this old VHS player as adetonator");
		scn4.dialog.enableDialog(this);
	}

	mat4.translate(deton.spr.modelMatrix, deton.spr.modelMatrix, [(2/8*11)/as,0.75,0]);
	deton.updArrowPos();
	scn4.sprites.push(deton);

	// INIT BOMB MIKE
	var bmb2 = new IntSprite();
	bmb2.initIntSpr(2/8, 2/8, 256, 16, 114, 0);
	bmb2.act = function () {
		playClickFX();
	}

	bmb2.enabledA = false;

	mat4.translate(bmb2.spr.modelMatrix, bmb2.spr.modelMatrix, [(2/8*6.2)/as,(2/8*2.9),0]);
	bmb2.updArrowPos();
	scn5.sprites.push(bmb2);

	//INIT MIKE HEAD
	var povHead = new IntSprite();
	povHead.initIntSpr(2/8*2, 2/8*2, 256, 16, 196,0);
	povHead.act = function () {
		playClickFX();
		scn5.dialog.enableDialog(this);
	}

	mat4.translate(povHead.spr.modelMatrix, povHead.spr.modelMatrix, [(2/8*11.1)/as,(2/8*3.07),0]);
	povHead.updArrowPos();
	scn5.sprites.push(povHead);

	//INIT MIKE BODY
	var povBody = new IntSprite();
	povBody.initIntSpr(2/8*3, 2/8*3, 256, 16, 212);
	povBody.act = function () {
		//playClickFX();
	}

	mat4.translate(povBody.spr.modelMatrix, povBody.spr.modelMatrix, [(2/8*11)/as,(2/8*1),0]);
	povBody.updArrowPos();
	scn5.sprites.push(povBody);

	//INIT JUPI
	var jupi = new IntSprite();
	jupi.initIntSpr(2/8*3, 2/8*3, 256, 16, 213, 0);
	jupi.act = function () {
		playClickFX();

		// scn6.dialog.curC = 1;
		scn6.dialog.setDialogN();
		scn6.dialog.enableDialog(this);
	}

	mat4.translate(jupi.spr.modelMatrix, jupi.spr.modelMatrix, [(2/8*4.2)/as,(2/8*1),0]);
	jupi.updArrowPos();
	scn6.sprites.push(jupi);

	//INIT SINK
	var sink = new IntSprite();
	sink.initIntSpr(2/8*2, 2/8*2, 256, 16, 189, 0.2);
	sink.act = function () {
		playClickFX();

		water.enabledR = true;
		dr7.dr.enabledA = true;

		this.spr.offset = 1;

		scn6.dialog.enbPrt = false;
		scn6.dialog.setDialogO("It appears i've broken this sink");
		scn6.dialog.enableDialog(this);

		this.enabledA = false;
	}

	mat4.translate(sink.spr.modelMatrix, sink.spr.modelMatrix, [(2/8*0)/as,(2/8*1),0]);
	sink.updArrowPos();
	scn6.sprites.push(sink);

	var dr7 = new Door();
	dr7.initDoor(scnMan, scn6, 6, 11);
	dr7.dr.enabledA = false;

	//INIT WATER
	var water = new IntSprite();
	water.initIntSpr(as*2, 2/16, 256, 16, 7);
	water.act = function () { }
	water.enabledR = false;

	mat4.translate(water.spr.modelMatrix, water.spr.modelMatrix, [(2/8*0)/as,(2/8*1),0]);
	water.updArrowPos();
	scn6.sprites.push(water);

	//INIT DOORS
	var dr1 = new Door();
	dr1.initDoor(scnMan, scn, 1, 12);

	var dr2 = new Door();
	dr2.initDoor(scnMan, scn2, 0, 0);

	var dr3 = new Door();
	dr3.initDoor(scnMan, scn2, 2, 11.5);

	var dr4 = new Door();
	dr4.initDoor(scnMan, scn3, 1, 0);

	var dr5 = new Door();
	dr5.initDoor(scnMan, scn3, 3, 11.5);

	var dr6 = new Door();
	dr6.initDoor(scnMan, scn4, 2, 0);

	var dr8 = new Door();
	dr8.initDoor(scnMan, scn7, 5, 0);

	var dr9 = new Door();
	dr9.initDoor(scnMan, scn7, 4, 6);
	dr9.dr.act = function () {
		// res.theme1.aud.pause();
		// res.theme2.aud.play();

		playClickFX();
		this.mn.setLv(this.sc);
	}
}

function InitKeyboard() {
	kbrd = new Keyboard();
	kbrd.addListeners();
}

function InitDialogs() {
	scn.dialog = new Dialog();
	scn.dialog.map = [
		[["Who the hell are you?", "Are you allright, I'm your assistant, we  work together, remember?",1],
		["What are we doing here?", "We are making an unconventional bomb here in garage.",2],
		["Why is it so dark here!", "We don't have money for more light bulbs",0],
		["See you around!", "EXIT",0]],

		[["Oh, yes! I've must of hit my had a bit", "Whatever you say",0],
		 ["Ah, now I remember", "Whatever you say",0],
		 ["Thanks!", "Whatever you say",0]],

		[["Of course, how could of I forgotten!", "Are sure you allright, sir?", 2],
		 ["Why are we making it in an old garage?", "So no one would suspect? I don't really   know.", 2],
		 ["Whats the progress on this thing?", "It's still missing a few parts", 3]],

		[["Which parts?", "It's missing a deadly virus and detonator", 0],
		 ["Continue working", "Yes sir", 0]]
		
	];
	scn.dialog.initDialog(gl, res.mFont);
	scn.dialog.setUpText(gl);

	scn2.dialog = new Dialog();
	scn2.dialog.map = [
		[["Who are you?", "I'm Josh. Your housemate",0],
		 ["Know a place to get a deadly virus?","Not really. No",0],
		 ["Got any detonators?", "Why would I have those?", 0],
		 ["I'm gonna get a grip", "EXIT", 0]]
		
	];
	scn2.dialog.initDialog(gl, res.mFont);
	scn2.dialog.setUpText(gl);

	scn3.dialog = new Dialog();
	scn3.dialog.map = [
		[]
	];
	scn3.dialog.initDialog(gl, res.mFont);
	scn3.dialog.setUpText(gl);

	scn4.dialog = new Dialog();
	scn4.dialog.map = [
		[]
	];
	scn4.dialog.initDialog(gl, res.mFont);
	scn4.dialog.setUpText(gl);

	scn5.dialog = new Dialog();
	scn5.dialog.act = function () {
		res.theme2.aud.pause();
		res.boomFx.aud.play();
		fd.fadeOut();
	}
	scn5.dialog.map = [
		[["We meet once again pov", "Hello my old friend", 0],
		 ["Why have you brought me here?", "Should I point out the obvious?", 1]],

		[["Yes", "You've made one powerfull weapon here, if you make me more I can take over the world", 2],
		 ["No", "Excellent", 2]],

		[["I will never join you!", "We'll see about that", 2],
		 ["I'm ending this once and for all!", "ACTION", 0]]
	];
	scn5.dialog.initDialog(gl, res.mFont);
	scn5.dialog.setUpText(gl);
	scn5.plPos[12] = (2/8*8)/as;

	scn6.dialog = new Dialog();
	scn6.dialog.map = [
		[["So, What's your story", "Nothing special, just tried to break into this establishment", 0],
		 ["What's your name?", "Jupiter Hadley, but you can call me jupi", 0],
		 ["How about escape?", "I might have a plan...", 1],
		 ["That's enought chatter for now", "EXIT", 0]],

		[["Spit it out", "Maybe if we find a way to flood this room security systems will unlock the door and guards will be evacuated", 0],
		 ["It's not as good as mine so don't bother", "Prick", 0]]
	];
	scn6.dialog.initDialog(gl, res.mFont);
	scn6.dialog.setUpText(gl);

	scn6.plPos[12] = (2/8*8)/as;

	scn7.dialog = new Dialog();
	scn7.dialog.map = [
		[]
	];
	scn7.dialog.initDialog(gl, res.mFont);
	scn7.dialog.setUpText(gl);
}

function InitCamera() {
	cam = new Camera();
	cam.initCamera("ortho", canvas.width, canvas.height);

	cam.position = vec3.fromValues(as, 1.0, 1.0);
	cam.updateView();

	gl.uniformMatrix4fv(mainSh.uniforms.proj, false, cam.projMatrix);
	gl.uniformMatrix4fv(mainSh.uniforms.view, false, cam.viewMatrix);

	fd.fadeIn(function () {});
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

var fd = new Fade();
// var fdMus = new Fade();

// var sp = 0.85;
// var strTime = 0;

// var fadeI = false;
// function FadeIn () {
// 	fadeI = true;
// 	strTime = new Date().getTime();
// }

// var fadeO = false;
// function FadeOut () {
// 	fadeO = true;
// 	strTime = new Date().getTime();
// }

function Tick() {
	GetTime();

	// console.log(color[3]);
	fd.tick();
	//fdMus.tick();

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

	scnMan.bindLight(gl);
	// lightTex.bindTexture(gl, gl.TEXTURE1, 1, fboSh.uniforms.light);
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