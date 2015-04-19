function Fade() {
	this.clb; //Callback

	this.fadeO; //Fade Out
	this.fadeI; //Fade In

	this.tm; //Time

	this.vel = 1.0;

	this.tick = function () {
		this.tickOut();
		this.tickIn();
	}

	this.tickOut = function () {
		if (this.fadeO) {
			if (color[3] >= 0)
				color[3] = 1.0 - (this.vel * ((cTime-this.tm)/1000));
			else {
				this.clb();
				this.fadeO = false;
			}
		}
	}

	this.tickIn = function () {
		if (this.fadeI) {
			if (color[3] <= 1)
				color[3] = this.vel * ((cTime-this.tm)/1000);
			else {
				this.clb();
				this.fadeI = false;
			}
		}
	}

	this.fadeOut = function (cb) {
		this.clb = cb;
		this.tm = new Date().getTime();

		this.fadeO = true;
	}

	this.fadeIn = function (cb) {
		this.clb = cb;
		this.tm = new Date().getTime();

		this.fadeI = true;
	}
}

function Door () {
	this.dr; //Stpres Door Sprite

	// this.dr.mn; //Scenen Manager
	// this.dr.sc; //Jump To Scene

	//Creates Door. PARAMETERRS: Scene manager, Scene, JumpTo scene id
	this.initDoor = function (mn, scn, sc, ps) {
		this.dr = new IntSprite();
		this.dr.initIntSpr(2/8*3,2/8*3,256,16,90,0);

		this.dr.mn = mn;
		this.dr.sc = sc;

		this.dr.act = function () {
			// scnMan.prevLv();
			// console.log(this);
			playClickFX();
			this.mn.setLv(this.sc);
		}

		mat4.translate(this.dr.spr.modelMatrix, this.dr.spr.modelMatrix, [(2/8*ps)/as,0.25,0]);
		this.dr.updArrowPos();

		scn.sprites.push(this.dr);
	}
}

function SceneManager () {
	this.scenes = []; //Scenes Array
	this.curS = 0; //Current Scene Id

	this.hTm = 250; //Hold Time
	this.lTm = 0; //Last Time

	this.nextLv = function () {
		if (cTime-this.lTm>=this.hTm) {
			this.lTm = cTime;

			this.curS++;
			player.spr.modelMatrix = this.scenes[this.curS].plPos;
		}
	}

	this.prevLv = function () {
		if (cTime-this.lTm>=this.hTm) {
			this.lTm = cTime;

			this.curS--;
			player.spr.modelMatrix = this.scenes[this.curS].plPos;
		}
	}

	this.setLv = function (id) {
		if (cTime-this.lTm>=this.hTm) {
			this.lTm = cTime;

			player.enabled = false;

			fd.fadeOut(function () {
				scnMan.curS = id;
				player.spr.modelMatrix = scnMan.scenes[scnMan.curS].plPos;

				fd.fadeIn(function () {
					player.enabled = true;
				});
			});

			// console.log(this.scenes[this.curS].plPos);
			// console.log(this.curS);
		}
	}

	this.tick = function (kb) {
		this.scenes[this.curS].tickScene(kb);
	}

	this.render = function (gl, sh) {
		this.scenes[this.curS].drawScene(gl, sh);
	}

	this.renderTxt = function (gl, sh) {
		this.scenes[this.curS].drawText(gl, sh);
	}

	this.bindLight = function (gl) {
		this.scenes[this.curS].bindLight(gl);
	}
}

function Scene () {
	this.sprites = []; //Stores Scene Objects

	this.tileMap; //Scenes Tilemap
	this.dialog; //Dialog Object
	//this.player; //Player Object

	this.plPos = mat4.create(); //Stores Player Position
	mat4.translate(this.plPos, this.plPos, [(2/8*0)/as,0.25,0]);

	this.lightMap;

	this.addTilemap = function (dt, mp) {
		this.tileMap = new Tilemap();
		this.tileMap.getTilemapDataFile(dt, mp, 2/8);
		this.tileMap.initTilemap(gl);

		this.tileMap.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
	}

	this.addLightmap = function (tex) {
		this.lightMap = new Texture();
		this.lightMap.makeTexture(gl, gl.NEAREST, tex);
	}

	this.tickScene = function (kb) {
		this.plPos = player.spr.modelMatrix;

		for (var i=0; i<this.sprites.length; i++) {
			//if (this.sprites.tickSprite != undefined)
			this.sprites[i].tickSprite(kb);
		}

		if (this.dialog != undefined)
			this.dialog.tickDialog(kb); //Dialog Logic
		player.tickPlayer(kb); //Player Logic
	}

	this.drawScene = function (gl, sth) {
		mainTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);

		this.tileMap.drawTilemap(gl, sth); //Renders Tilemap

		//Renders Sprites 
		for (var i=0; i<this.sprites.length; i++) {
			this.sprites[i].drawSprite(gl, sth);
		}

		player.drawPlayer(gl, sth); //Draw Player 
	}

	this.drawText = function (gl, sth) {
		fontTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex); //Bind Font Texture
		if (this.dialog != undefined)
			this.dialog.drawDialog(gl, sth); //Draw Dialog

		mainTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);
		player.drawInv(gl, sth);
	}

	this.bindLight = function (gl) {
		this.lightMap.bindTexture(gl, gl.TEXTURE1, 1, fboSh.uniforms.light);
	}
}

function Player () {
	this.spr; //Player Sprite
	this.enabled = true; //Player State

	this.t = (1/4)/24; //Players Speed

	this.inventory = [];

	this.fliped = false;

	// this.transMatrix = mat4.create(); //Translation Matrix
	// this.rotMatrix = mat4.create(); //Rotation Matrix
	// this.scaleMatrix = mat4.create(); //Scale Matrix

	//Ticks Player
	this.tickPlayer = function (kb) {
		// mat4.scale();
		// this.transMatrix = mat4.create(); //Translation Matrix
		// this.rotMatrix = mat4.create(); //Rotation Matrix
		// this.scaleMatrix = mat4.create(); //Scale Matrix

		// mat4.identity(this.spr.modelMatrix);

		// mat4.translate(this.transMatrix, this.transMatrix, [1-this.spr.w/2/as,1,0]);
		// mat4.scale(this.scaleMatrix, this.scaleMatrix, [-1,1,1]);

		// mat4.multiply(this.spr.modelMatrix, this.transMatrix, this.rotMatrix);
		// mat4.multiply(this.spr.modelMatrix, this.spr.modelMatrix, this.scaleMatrix);

		if (this.enabled) {
			if (kbrd.keys.A) { //Move Left
				// mat4.translate(this.transMatrix, this.transMatrix, [-this.t/as,0,0]);
				res.walkFx.aud.play();

				if (!this.fliped) { this.spr.offset = 3; this.fliped = true; this.spr.animInit(380, 1,4,6); }

				mat4.translate(this.spr.modelMatrix, this.spr.modelMatrix, [-this.t/as,0,0]);
				this.spr.animTick();
			} else if (kbrd.keys.D) { //Move Right
				// mat4.translate(this.transMatrix, this.transMatrix, [this.t/as,0,0]);
				res.walkFx.aud.play();

				if (this.fliped) { this.spr.offset = 0; this.fliped = false; this.spr.animInit(380, 1,1,3); }

				mat4.translate(this.spr.modelMatrix, this.spr.modelMatrix, [this.t/as,0,0]);
				this.spr.animTick();
			} else {
				if (this.fliped) this.spr.offset = 3;
				else this.spr.offset = 0;
				this.spr.animTime = this.spr.animDuration;

				res.walkFx.aud.pause();
			}
		}
	}

	//Adds Object To Inventory. PARAMETERS: Name, Id
	this.addToInv = function (nm, id) {
		var ob = new Sprite();
		ob.createSprite(2/10, 2/10, 256, 16, id);
		// // console.log(ob);
		ob.initSprite(gl);

		ob.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
		mat4.translate(ob.modelMatrix, ob.modelMatrix, [(2/8*(this.inventory.length+0.1))/as,1.78,0]);

		this.inventory.push( {n: nm, o: ob} );

		// console.log(ob);
	}

	this.drawInv = function (gl, sth) {
		for (var i=0; i<this.inventory.length; i++) {
			this.inventory[i].o.drawSprite(gl, sth);
		}
	}

	//Renders Player
	this.drawPlayer = function (gl, sth) {
		this.spr.drawSprite(gl, sth);
	}
}

//Interactive Sprite
function IntSprite() {
	this.spr; //Sprite
	this.arw; //Arrow

	this.arwCtr = []; //Arow Transform Vector

	this.enabledR = true; //Enabled Render
	this.enabledA = true; //Enabled Logic
	this.colliding = false; //Stores Collisiton State

	this.act; //Click Action

	this.pl; //Player Pointer

	this.pTime = 0;
	this.hTime = 200;

	this.wMod = 0;

	this.initIntSpr = function (w, h, tSize, sSize, id, wMd) {
		this.spr = new Sprite();
		this.spr.createSprite(w, h, tSize, sSize, id);
		this.spr.initSprite(gl);
		
		this.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);

		this.arw = new Sprite();
		this.arw.createSprite(2/8, 2/8, 256, 16, 16);
		this.arw.initSprite(gl);

		this.arw.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);

		this.wMod = wMd;
	}

	this.updArrowPos = function () {
		this.arwCtr = [ (this.spr.modelMatrix[12]+this.spr.w/2/as)-(this.arw.w/2/as) ,this.spr.modelMatrix[13]+this.spr.w,0];
		mat4.translate(this.arw.modelMatrix, this.arw.modelMatrix, this.arwCtr);
	}

	this.isColliding = function (mat2, w2) {
		return ( ((this.spr.modelMatrix[12]) < (mat2[12]+w2/as)) && ((this.spr.modelMatrix[12]+(this.spr.w-this.wMod)/as) > (mat2[12])) );
	}

	this.tickSprite = function (kb) {
		if (this.enabledA) {
			//Check For Collision
			if (this.isColliding(player.spr.modelMatrix, player.spr.w)) {
				this.colliding = true;
			} else {
				this.colliding = false;
			}

			//Floating Animation
			if (this.colliding)
				this.arw.modelMatrix[13] = 0.01 * Math.sin(cTime * 2* Math.PI / 2000) + this.arwCtr[1];

			if (this.colliding && kb.keys[" "] && cTime-this.pTime>=this.hTime ) {
				this.pTime = cTime;
				this.act();
			}
		}
	}

	this.drawSprite = function (gl, sh) {
		if (this.enabledR) {
			this.spr.drawSprite(gl, sh);

			if (this.colliding && this.enabledA) //Draw Arrow
				this.arw.drawSprite(gl, sh);
			}
		}
}

// function HintText() {
// 	this.enabled = false;

// 	this.txt; //Text Component
// 	this.sTxt; //Text

// 	this.prt; //Caller Object

// 	this.pTime = 0;
// 	this.hTime = 0;

// 	this.enable = function () {

// 	}

// 	this.disable = function () {

// 	}

// 	this.tickHint = function () {
// 		if 
// 	}

// 	this.drawHint = function () {
// 		if (this.enabled) {
// 			this.txt.
// 		}
// 	}
// }

function Dialog()
{
	this.map; //Stores Dilalog Map

	this.txt; //Text Rendering Component
	this.dTxt = ""; //Stores Dialog Rendering Text

	this.font; //Stores Font For Text
	this.s = 2/24; //Letter Size
	this.w = 42; //String Width

	this.curC = 0; //Current Dialog Screen
	this.curS = 0; //Current Dialog Size
	this.curId = 0; //Current Cursor Id
	this.cursorSpr; //Cursor Sprite

	this.pTime = 0;
	this.holdTime = 200; //Key Hold Time

	this.enabled = false;
	this.answering = false;

	this.prt; //Calling Object
	this.enbPrt = true; //Enable Parent

	this.blk; //Black Sprite

	this.sMode = false;

	this.act; //Action

	this.initDialog = function (gl, fnt) {
		this.font = fnt;

		this.initCursor(gl);
		this.initText(this.map[this.curC]);
		this.initBlk(gl, this.curS);
	}

	this.setUpText = function (gl) {
		this.txt = new Text();
		this.txt.txt = this.dTxt;
		this.txt.initText(this.w, this.font, this.s);

		this.txt.txtMap.initTilemap(gl);
		this.txt.txtMap.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
	}

	this.initCursor = function (gl) {
		this.cursorSpr = new Sprite();
		this.cursorSpr.createSprite(this.s, this.s, 128, 8, 31);
		this.cursorSpr.initSprite(gl);

		this.cursorSpr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);

		//mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,this.curId*this.s,0]);
		//this.cursorSpr.modelMatrix[13] = this.curId*this.s;
	}

	this.initBlk = function (gl, h) {
		this.blk = new Sprite();
		this.blk.createSprite(as*2, this.s*h+0.05, 128, 8, 256);
		this.blk.initSprite(gl);

		this.blk.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
	}

	this.initText = function (mp) {
		this.curS = mp.length;

		this.curId = this.curS-1;
		this.cursorSpr.modelMatrix[13] = this.curId*this.s;

		for (var i=0; i<this.curS; i++) {
			this.dTxt += " " + mp[i][0];
			var skip = this.w - mp[i][0].length-1;

			for (var a=0; a<skip; a++) {
				this.dTxt += " ";
			}
		}
	}

	this.setDialogN = function () {
		this.sMode = false;

		this.dTxt = "";
		// this.curC = this.map[0][0][0];

		this.initText(this.map[this.curC]);
		this.setUpText(gl);
		this.initBlk(gl,this.curS);

		this.answering = false;
	}

	this.setDialogO = function (txt) {
		this.dTxt = txt;

		this.setUpText(gl);
		this.initBlk(gl,this.txt.h);
		this.answering = true;

		this.sMode = true;
	}

	this.enableDialog = function (prt) {
		this.prt = prt;

		player.enabled = false;
		this.enabled = true; 
		this.prt.enabledA = false;

		this.pTime = cTime;

		//Set Cursor
		this.curId = this.curS-1;
		this.cursorSpr.modelMatrix[13] = this.curId*this.s;
	}

	this.disableDialog = function () {
		this.enabled = false;
		player.enabled = true;

		if (this.enbPrt)
		this.prt.enabledA = true;

		this.prt.pTime = cTime;
	}

	this.tickDialog = function (kb) {
		if (this.enabled) {
			if (kb.keys.S && cTime-this.pTime>=this.holdTime && this.curId >= 1 && !this.answering) {
				this.pTime = cTime;
				this.curId--;

				// res.click.aud.play();

				// res.click.aud.pause();
				// res.click.aud.currentTime = 0;
				// res.click.aud.play();

				playClickFX();

				// mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,-this.s,0]);
				this.cursorSpr.modelMatrix[13] = this.curId*this.s;
			} else if (kb.keys.W && cTime-this.pTime>=this.holdTime && this.curId <= this.curS-2 && !this.answering) {
				this.pTime = cTime;
				this.curId++;

				// res.click.aud.play();
				playClickFX();

				// mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,this.s,0]);
				this.cursorSpr.modelMatrix[13] = this.curId*this.s;
			} else if (kb.keys[" "] && cTime-this.pTime>=this.holdTime && !this.answering && !this.sMode) {
				this.pTime = cTime;

				this.dTxt = this.map[this.curC][this.curS-this.curId-1][1];

				// res.click.aud.play();
				playClickFX();

				if (this.dTxt == "EXIT") { //QUIT
					this.disableDialog();
				} else if (this.dTxt == "ACTION") {
					this.act();
					this.disableDialog();
				} else { //RESPOND
					this.setUpText(gl);
					this.initBlk(gl,this.txt.h);
					this.answering = true;
				}
			} else if (kb.keys[" "] && cTime-this.pTime>=this.holdTime && this.answering && !this.sMode) {
				this.pTime = cTime;

				playClickFX();

				this.dTxt = "";
				this.curC = this.map[this.curC][this.curS-this.curId-1][2];

				this.initText(this.map[this.curC]);
				this.setUpText(gl);
				this.initBlk(gl,this.curS);

				this.answering = false;
			} else if (kb.keys[" "] && cTime-this.pTime>=this.holdTime && this.sMode) {
				this.pTime = cTime;
				playClickFX();

				if (this.act != undefined) this.act();

				this.disableDialog();
			}
		}
	}

	this.drawDialog = function (gl, sth) {
		if (this.enabled) {
			this.blk.drawSprite(gl, sth);
			this.txt.txtMap.drawTilemap(gl, sth);

			if (!this.answering)
				this.cursorSpr.drawSprite(gl, sth);			
		}
	}
}