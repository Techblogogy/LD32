attribute vec2 inpCr; 
attribute vec2 texPs; 

varying vec2 vTexPs; 

void main(void) 
{
	vTexPs = vec2(texPs.x,texPs.y); 
	gl_Position = vec4(inpCr, 0.0, 1.0); 
}