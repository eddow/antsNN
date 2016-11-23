import {entity, stain, vector} from "../entities.js";
import {random, tau, torus, modulo} from "../math.js";
import {board} from "../board.js";
import {draw} from "../draw.js";

export class ant extends entity {
	constructor(position, nest) {
		super(position);
		this.direction = random(tau);
		Object.assign(this, {
			drawn: draw.addPolygon(this, 'entities'),
			nest,
			strength: 1,
			manoeuvrability: .5,
			velocity: [.6, 1],
			carry: 1,
			talkative: .1,	//0-> no msg, 1-> a msg each turn
			loaded: false,
			spoken: {}
		});
		this.redraw();
	}
	roundDir(add) {
		if(add) this.direction += add;
		this.direction = modulo(this.direction);
	}
	/**
	 * Turns toward angle {{angle}} turning maximum {{vel}} radians
	 */
	turnTo(angle, vel) {
		angle = torus(angle, this.direction);
		vel = Math.min(vel || this.manoeuvrability, Math.abs(angle));
		if(angle < 0) vel = -vel;
		this.roundDir(vel);
		return this;
	}
	advance(steps) {
		return board.clip(this.add((new vector((steps||1)*this.velocity[this.loaded?0:1])).rotate(this.direction)));
	}
	wound(objects) {
		var o, p;
		for(o of objects.stains) {
			p = o.intensity(this);
			if(p) {
				p = p.strength*o.strength;
				p = Math.min(o.strength, Math.max(p, .001));	//don't take less than .001 or the remaining strength if it is smaller
				this.strength -= p;
				if(0< (o.strength -= p))
					o.redraw();
				else
					o.remove()
			}
		}
		this.strength -= Math.random()/500;
		if(0>= this.strength) this.remove();
	}
	eat(qtt) {
		this.strength = Math.min(1, this.strength+qtt);
	}
	remove() {
		super.remove();
		this.nest.ants.delete(this);
	}
	redraw() {
		var angle = Math.atan(this.strength);
		this.points = [
			(new vector(1)).rotate(this.direction+Math.PI).add(this),
			(new vector(1)).rotate(this.direction+angle).add(this),
			(new vector(1)).rotate(this.direction).add(this),
			(new vector(1)).rotate(this.direction-angle).add(this)
		];
		super.redraw();
	}
	get fill() {
		return {
			h: this.nest.hue,
			s: .5,
			b: this.loaded?.25+this.loaded.grass:.25,
			o: .7
		};
	}
}

export class nest extends stain {
	constructor(hue, position, radius) {
		super(position, radius, 1);
		
		Object.assign(this, {
			hue,
			strength: 1,
			ants: new Set(),
			resource: 0
		});
		this.redraw();
	}
	get fill() {
		return {
			h: this.hue,
			s: this.strength,
			b: .5,
			o: .3
		};
	}
	/**
	 * Spawn ants to this nest
	 */
	spawn(number) {
		var i;
		for(i=0; i<(number||1); ++i)
			this.ants.add(new ant(vector.around(this.radius, this), this));
	}
	eat(qtt) {
		var r = Math.floor(this.resource += 2*qtt);
		if(r) {
			this.spawn(r);
			this.resource -= r;
		}
	}
	clear() {
		for(let ant of this.ants) ant.remove();
		Object.assign(this, {
			strength: 1,
			ants: new Set(),
			resource: 0
		});
	}
}