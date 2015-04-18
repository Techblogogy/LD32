function Scene () {
	this.sprites = []; //Stores Scene Objects

	this.tileMap; //Scenes Tilemap
	this.dialog; //Dialog Object
	//this.player; //Player Object

	this.tickScene = function (kb) {
		for (var i=0; i<this.sprites.length; i++) {
			//if (this.sprites.tickSprite != undefined)
			this.sprites[i].tickSprite(kb);
		}

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

		fontTex.bindTexture(gl, gl.TEXTURE0, 0, mainSh.uniforms.tex);
		this.dialog.drawDialog(gl, sth); //Draw Dialog
	}
}

function Player () {
	this.spr; //Player Sprite
	this.enabled = true; //Player State

	this.t = (1/4)/24; //Players Speed

	//Ticks Player
	this.tickPlayer = function (kb) {
		if (kbrd.keys.A) { //Move Left
			mat4.translate(this.spr.modelMatrix, this.spr.modelMatrix, [-this.t/as,0,0]);
			this.spr.animTick();
		} else if (kbrd.keys.D) { //Move Right
			mat4.translate(this.spr.modelMatrix, this.spr.modelMatrix, [this.t/as,0,0]);
			this.spr.animTick();
		} else {
			this.spr.offset = 0;
			this.spr.animTime = this.spr.animDuration;
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

	this.arwCtr = [];

	this.enabledR = true;
	this.enabledA = true;
	this.colliding = false; //Stores Collisiton State

	this.act; //Click Action

	this.pl; //Player Pointer

	this.initIntSpr = function (w, h, tSize, sSize, id) {
		this.spr = new Sprite();
		this.spr.createSprite(w, h, tSize, sSize, id);
		this.spr.initSprite(gl);
		
		this.spr.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);

		this.arw = new Sprite();
		this.arw.createSprite(2/8, 2/8, 256, 16, 16);
		this.arw.initSprite(gl);

		this.arw.setUniformsLocation(mainSh.uniforms.model, mainSh.uniforms.texOff);
	}

	this.updArrowPos = function () {
		this.arwCtr = [this.spr.modelMatrix[12],this.spr.modelMatrix[13]+this.spr.w,0];
		mat4.translate(this.arw.modelMatrix, this.arw.modelMatrix, this.arwCtr);
	}

	this.isColliding = function (mat2, w2) {
		return ( ((this.spr.modelMatrix[12]) < (mat2[12]+w2/as)) && ((this.spr.modelMatrix[12]+this.spr.w/as) > (mat2[12])) );
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

			if (this.colliding && kb.keys[" "]) {
				this.act();
			}
		}
	}

	this.drawSprite = function (gl, sh) {
		if (this.enabledR) {
			this.spr.drawSprite(gl, sh);

			if (this.colliding)
				this.arw.drawSprite(gl, sh);
			}
		}
}

function Dialog()
{
	this.map; //Stores Dilalog Map

	this.txt; //Text Rendering Component
	this.dTxt = ""; //Stores Dialog Rendering Text

	this.font; //Stores Font For Text
	this.s = 2/24; //Letter Size
	this.w = 35; //String Width

	this.curS = 0; //Current Dialog Size
	this.curId = 0; //Current Cursor Id
	this.cursorSpr; //Cursor Sprite

	this.pTime = 0;
	this.holdTime = 100; //Key Hold Time

	this.enabled = false;

	this.initDialog = function (fnt) {
		this.font = fnt;
		this.curS = this.map.length;
		this.curId = this.curS-1;

		for (var i=0; i<this.curS; i++) {
			this.dTxt += " "+this.map[i][0];
			var skip = this.w - this.map[i][0].length-1;

			for (var a=0; a<skip; a++) {
				this.dTxt += " ";
			}
		}
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

		mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,this.curId*this.s,0]);
	}

	this.dialogClick = function () {

	}

	this.tickDialog = function (kb) {
		if (this.enabled) {
			if (kb.keys.S && cTime-this.pTime>=this.holdTime && this.curId >= 1) {
				this.pTime = cTime;
				this.curId--;

				mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,-this.s,0]);
			} else if (kb.keys.W && cTime-this.pTime>=this.holdTime && this.curId <= this.curS-2) {
				this.pTime = cTime;
				this.curId++;

				mat4.translate(this.cursorSpr.modelMatrix, this.cursorSpr.modelMatrix, [0,this.s,0]);
			} else if (kb.keys[" "] && cTime-this.pTime>=this.holdTime) {
				this.pTime = cTime;

				this.dTxt = this.map[this.curS-this.curId-1][1];

				if (this.dTxt == "EXIT") {
					this.enabled = false;
				} else {
					this.setUpText(gl);
				}
			}
		}
	}

	this.drawDialog = function (gl, sth) {
		if (this.enabled) {
			this.txt.txtMap.drawTilemap(gl, sth);
			this.cursorSpr.drawSprite(gl, sth);			
		}
	}
}