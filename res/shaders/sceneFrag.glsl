precision highp float; 

varying vec2 vTexPs;

// uniform sampler2D tex1; 
uniform sampler2D light;

void main(void) 
{ 
	gl_FragColor = /*texture2D(tex1, vTexPs) */ texture2D(light, vTexPs);
}