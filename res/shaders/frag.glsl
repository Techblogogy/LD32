precision highp float; 
precision highp sampler2D; 

varying vec2 vTexPs; 
varying vec2 vLmpPs;

uniform sampler2D tex; 
uniform vec2 texOff;
// uniform sampler2D light;

void main(void) 
{ 
	gl_FragColor = texture2D(tex, vTexPs+texOff)/* texture2D(light, vLmpPs)*/;
}