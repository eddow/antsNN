import {vector} from "./entities.js";
import {random, torus, modulo, tau} from "./math.js";

export var board = {
	mouseListeners: new Set(),
	size: 100,
	get middle() { return this.size/2; },
	randomPoint() {
		//return new vector(random(this.size), random(this.size));/*
		var angle = random(tau);
		return new vector(50*(Math.cos(angle)+1), 50*(Math.sin(angle)+1)); //*/
	},
	clip(vect) {
		var s = this.size;
		vect.x = modulo(vect.x, this.size);
		vect.y = modulo(vect.y, this.size);
		return vect;
	},
	/**
	 * Calculate vA-vB in torus world
	 */
	distance(vA, vB) {
		return new vector(
			torus(vA.x, vB.x, board.size),
			torus(vA.y, vB.y, board.size));
	}
};