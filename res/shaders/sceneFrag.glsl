precision highp float; 

varying vec2 vTexPs;

uniform sampler2D tex; 
uniform sampler2D light;

uniform vec4 amb;

void main(void) 
{ 
	gl_FragColor = texture2D(tex, vTexPs) * texture2D(light, vTexPs) * amb;
}