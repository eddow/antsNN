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
}

export class entity extends vector {
	remove() {
		draw.remove(this.drawn);
	}
	redraw() {
		this.drawn.redraw();
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
	interraction(position) {
		var intensity = this.intensity(position);
		if(!intensity) return intensity;
		var strength = this.strength * intensity.strength;
		return {
			direction: intensity.position.norm()
				.invert()
				.multiply(new vector(strength, strength)),
			proximity: intensity.proximity,
			strength: intensity.strength
		};
	}
	use(qtt, position) {
		var intensity;
		if(position) {
			intensity = this.intensity(position);
			if(!intensity) return 0;
			qtt *= intensity.strength;	//we take less if we are further
		}
		qtt = Math.min(qtt||this.degeneration||.001, this.strength);
		if(this.strength -= qtt)
			this.redraw();
		else
			this.remove()
		return qtt;
	}
}

export class drawnVector {
	constructor(group) {
		Object.assign(this, {
			group,
			line: draw.addPolygon(this, 'helpers')
		});
	}
	get stroke() {
		return {
			h: this.group.hue,
			s: .5,
			b: .3,
			o: 1
		};
	}
	move(position, direction) {
		if(!position) this.points = [];
		else {
			position = new vector(position);
			this.points = [
				position,
				new vector(direction).add(position)
			]
		}
		this.line.redraw();
	}
}