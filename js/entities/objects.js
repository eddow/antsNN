import {entity, stain, vector, drawnVector} from "../entities.js";
import {board} from "../board.js";
import {random} from "../math.js";

class object extends stain {
	constructor(group, position, radius, strength) {
		super(position, radius, strength, group.type)
		Object.assign(this, {group, radius, strength});
		this.redraw();
	}
	remove() {
		this.group.stains.delete(this);
		super.remove();
	}
	get fill() {
		return {
			h: this.group.hue,
			s: 1,
			b: this.group.brightness,
			o: this.strength
		};
	}
}
export class objects {
	constructor(type, hue, brightness = 0.5) {
		var me = this;
		Object.assign(this, {
			type,
			hue,
			brightness,
			stains: new Set()
		});
		board.mouseListeners.add(function(coord) { me.drawVect(coord); });
		this.indic = new drawnVector(this);
	}
	clear() {
		for(let stain of this.stains)
			stain.remove();
	}
	drawVect(coord) {
		if(!coord) this.indic.move();
		else {
			coord = new vector(coord);
			var intrctn = this.interraction(coord);
			this.indic.move(coord, intrctn.direction);
		}
	}
	interraction(coord) {
		var stain, interraction, direction = new vector(0,0), proximity = 1, qtt = 0;
		for(stain of this.stains)
			if(interraction = stain.interraction(coord)) {
				direction.add(interraction.direction);
				proximity *= interraction.proximity;
				qtt += interraction.strength
			}
		return {direction, proximity, qtt};
	}
	use(qtt, coord) {
		var rv = 0;
		for(let stain of this.stains)
			rv += stain.use(qtt, coord);
		return rv;
	}
	add(position, radius, strength) {
		var rv = new object(this, position, radius, strength);
		this.stains.add(rv);
		return rv;
	}
	spawn(clusters, config) {
		/* config:
		-- per cluster
			number: min/max number of items
			size: min/max radius of cluster
		-- per item
			radius: min/max radius of items
			strengt: min/max strength of items
		*/
		var i, j, point, number, size, rv = [];
		function decide(config) {
			if('number'=== typeof config) return config;
			return random(config.max||config[1], config.min||config[0]||0);
		}
		for(i=0; i<(clusters||1); ++i) {
			point = board.randomPoint();
			number = decide(config.number);
			size = decide(config.size);
			for(j=0; j<number; ++j)
				this.add(vector.around(size, point), decide(config.radius), decide(config.strength));
		}
		return rv;
	}
}