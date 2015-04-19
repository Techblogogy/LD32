precision highp float; 
precision highp sampler2D; 

varying vec2 vTexPs; 
varying vec2 vLmpPs;

uniform sampler2D tex; 
uniform vec2 texOff;
// uniform sampler2D light;

// uniform vec4 col;

void main(void) 
{ 
	gl_FragColor = texture2D(tex, vTexPs+texOff); //* col/* texture2D(light, vLmpPs)*/;
}