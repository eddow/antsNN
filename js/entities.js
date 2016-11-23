import {random, tau, torus} from "./math.js";
import {board} from "./board.js";
import {draw} from "./draw.js";

export class vector extends Victor {
	constructor(x, y) {
		if('object'=== typeof x) {
			if(x instanceof Array)
				super(x[0], x[1]);
			else
				super(x.x, x.y);
		} else super(x, y);
	}
	static around(maxDist, origin) {
		var v = new vector(random(maxDist||1));
		v.rotate(random(tau));
		if(origin) v.add(origin);
		return v;
	}
	multiplyX(x) {
		if('number'!== typeof x)
			return super.multiplyX(x);
		this.x *= x;
		return this;
	}
	multiplyY(x) {
		if('number'!== typeof x)
			return super.multiplyY(x);
		this.y *= x;
		return this;
	}
	multiply(x) {
		if('number'!== typeof x)
			return super.multiply(x);
		this.x *= x;
		this.y *= x;
		return this;
	}
	divideX(x) {
		if('number'!== typeof x)
			return super.divideX(x);
		this.x /= x;
		return this;
	}
	divideY(x) {
		if('number'!== typeof x)
			return super.divideY(x);
		this.y /= x;
		return this;
	}
	divide(x) {
		if('number'!== typeof x)
			return super.divide(x);
		this.x /= x;
		this.y /= x;
		return this;
	}
	clone() {
		return new vector(this);
	}
}

export class entity extends vector {
	remove() {
		draw.remove(this.drawn);
	}
	redraw() {
		this.drawn.redraw();
	}
	intensity(position) {
		position = board.distance(position, this);
		var dist = position.length();
		if(dist >= this.radius) return false;
		return {
			position,
			strength: 1- (dist/this.radius),
			proximity: dist/this.radius
		};
	}
}

export class stain extends entity {
	constructor(position, radius, strength, type) {
		super(position);
		Object.assign(this, {
			radius: radius,
			strength: strength || 1,
			drawn: draw.addCircle(this, type || 'background')
		});
	}
	interraction(position) {
		var intensity = this.intensity(position);
		if(!intensity) return intensity;
		var strength = this.strength * intensity.strength;
		return {
			direction: intensity.position.norm()
				.invert()
				.multiply(strength),
			proximity: intensity.proximity,
			qtt: intensity.strength
		};
	}
	use(qtt, position) {
		var intensity;
		if(position) {
			intensity = this.intensity(position);
			if(!intensity) return 0;
			qtt *= intensity.strength;	//we take less if we are further
		}
		//don't take less than .001 or the remaining strength if it is smaller
		qtt = Math.min(Math.max(qtt||this.degeneration||0, .001), this.strength);
		if(this.strength -= qtt)
			this.redraw();
		else
			this.remove()
		return qtt;
	}
}
