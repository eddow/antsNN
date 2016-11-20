import {ant, nest} from "./entities/ant.js";
import {objects} from "./entities/objects.js";
import {vector} from "./entities.js";
import {board} from "./board.js";
import {draw} from "./draw.js";
import {intelligence} from "./intelligence.nn.js";


var lava = new objects('background', 0), grass = new objects('background', 100),
	queen = new nest(300, [board.middle, board.middle], 10),
	pheromons = {
		food: new objects('pheromons', 150),
		danger: new objects('pheromons', 25),
		nest: new objects('pheromons', 275),
		p0: new objects('pheromons', 250),
		p1: new objects('pheromons', 25),
		p2: new objects('pheromons', 75),
		p3: new objects('pheromons', 150),
		p4: new objects('pheromons', 175)
	},
	brain = new intelligence(),
	gameLength = 5000, startAnts = 10;

lava.spawn(5, {
	number: [20, 50],
	size: [5, 15],
	radius: [1, 3],
	strength: [.1, 1]
});
grass.spawn(5, {
	number: [20, 50],
	size: [5, 15],
	radius: [1, 3],
	strength: [.1, 1]
});
queen.spawn(startAnts);
var counter = 0;

function antAdvance() {
	var interractors = {lava, grass, queen};
	for(let ant of queen.ants) {
		let interractn = {pheromons: {}}, intel;
		for(let i in interractors)
			interractn[i] = interractors[i].interraction(ant);
		for(let m in pheromons)
			interractn.pheromons[m] = pheromons[m].interraction(ant);

		intel = intelligence.step(ant, interractn);

		if(ant.loaded) {
			if(intel.action.drop) {
				ant.loaded = false;
			} else if(intel.action.eat) {
				var toQueen = Math.pow(.5, (new vector(ant)).subtract(queen).lengthSq() / (queen.radius*queen.radius));
				queen.eat(toQueen * ant.loaded.grass);
				ant.eat((1-toQueen) * ant.loaded.grass);
				ant.loaded = false;
			}

		} else if(intel.action.grab) {
			var qttAvail = interractn.grass.qtt;
			if(qttAvail) {
				ant.loaded = {
					grass: grass.use(Math.min(1/qttAvail, ant.carry), ant)
				};
			}
		}

		for(let i in ant.spoken)
			if(0>(ant.spoken[i]-= ant.talkative))
				delete ant.spoken[i];

		if(intel.pheromons) {
			for(let p in intel.pheromons) {
				let pheromon = intel.pheromons[p];
			//Don't emit if :
			// - ant spoke lately already
			// - the pheromon is already filling the place
				if(0< pheromon.strenght && !ant.spoken[p] && (!interractn.pheromons[p] || 1 > !interractn.pheromons[p].qtt)) {
					ant.spoken[p] = 1;
					pheromons[p].add(ant, pheromon.radius, pheromon.strength).degeneration = pheromon.degeneration;
				}
			}
		}

		ant.turnTo(intel.direction);
		ant.advance(Math.min(intel.velocity||1, 1));
	}
	setTimeout(wound);
}

function wound() {
	for(let a of queen.ants)
		a.wound(lava);
	for(let p in pheromons)
		pheromons[p].use();
	setTimeout(redraw);
}

function redraw() {
	for(let a of queen.ants)
		a.redraw();
	setTimeout(conditions);
}

function conditions() {
	$('#counter').text(++counter);
	var ants = queen.ants.size;
	if(!ants)
		endGame(((gameLength/counter)-1) * (-startAnts))
	else if(counter > gameLength)
		endGame(ants);
	else
		setTimeout(antAdvance);
}

function endGame(score) {
	alert(score);
}

antAdvance();