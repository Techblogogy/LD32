attribute vec2 inpCr; 
attribute vec2 texPs; 
// attribute vec2 lmpPs;

varying vec2 vTexPs; 
// varying vec2 vLmpPs;

uniform mat4 proj;
uniform mat4 view;
uniform mat4 model;

uniform float lOff;

void main(void) 
{
	// vec4 lmpPsMd = model * vec4(lmpPs,0,1);

	vTexPs = vec2(texPs.x,1.0-texPs.y);
	// vLmpPs = vec2(lmpPsMd.x-lOff,1.0-lmpPsMd.y);

	gl_Position = model * proj * view * vec4(inpCr.x, inpCr.y, 0.0, 1.0); 
}