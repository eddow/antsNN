export var tau = 2*Math.PI;
export var abs = Math.abs;
export var cos = Math.cos;
export var sin = Math.sin;
export var min = Math.min;
export var max = Math.max;

export function random(max, min) {
	return (Math.random()*((max||1)-(min||0)))+(min||0);
}
export function randomNdx(max, min) {
	return Math.floor(random(max, min));
}

/**
 * gets the smallest in absolute X-ref considering X == X+k*mod && ref == ref + l*mod
 * eg. compare the angle X to ref - if ref is 6 and X < PI, torus(X, 6, tau) will return (6-tau) that is nearer to X than 6
 */

export function torus(x, ref, mod) {
	if(!mod) mod = tau;
	x-= ref;
	if(x < -mod/2)
		return x + mod;
	if(x > mod/2)
		return x - mod;
	return x;
}

export function modulo(x, mod) {
	if(!mod) mod = tau;
	while(x >= mod)  x -= mod;
	while(x < 0)  x += mod;
	return x;
}