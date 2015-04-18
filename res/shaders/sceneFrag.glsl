precision highp float; 

varying vec2 vTexPs;

uniform sampler2D tex; 
uniform sampler2D light;

void main(void) 
{ 
	gl_FragColor = texture2D(tex, vTexPs) * texture2D(light, vTexPs);
}