import {ant, nest} from "./entities/ant.js";
import {objects} from "./entities/objects.js";
import {vector} from "./entities.js";
import {board} from "./board.js";
import {draw} from "./draw.js";
import {intelligence, initIntelligence, endGame} from "./intelligence.nn.js";


var lava = new objects('background', 0), grass = new objects('background', 100),
	queen = new nest(300, [board.middle, board.middle], 10),
	{pheromons} = initIntelligence(clearGame),
	gameLength = 2000, startAnts = 10,
	counter = 0, planCounter = 100;
intelligence.random();

function clearGame() {
	lava.clear();
	lava.spawn(5, {
		number: [20, 50],
		size: [5, 15],
		radius: [1, 3],
		strength: [.1, 1]
	});
	grass.clear();
	grass.spawn(5, {
		number: [20, 50],
		size: [5, 15],
		radius: [1, 3],
		strength: [.1, 1]
	});
	queen.clear();
	queen.spawn(startAnts);
	for(let p in pheromons) pheromons[p].clear();
	counter = 0;
}
function plan(cb) {
	if(draw.draw || !--planCounter) {
		setTimeout(cb, 1);
		planCounter = 200;
	} else cb();
}
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
				if(0< pheromon.strength && !ant.spoken[p] && (!interractn.pheromons[p] || 1 > interractn.pheromons[p].qtt)) {
					ant.spoken[p] = 1;
					pheromons[p].add(ant, pheromon.radius, pheromon.strength).degeneration = pheromon.degeneration;
					ant.strength -= .005;
				}
			}
		}

		ant.turnTo(intel.direction);
		ant.advance(Math.min(intel.velocity||1, 1));
	}
	plan(wound);
}

function wound() {
	for(let ant of queen.ants)
		ant.wound(lava);
	for(let p in pheromons)
		pheromons[p].use();
	plan(redraw);
}

function redraw() {
	for(let a of queen.ants)
		a.redraw();
	plan(conditions);
}

function conditions() {
	$('#counter').text(++counter + ' - ' + queen.ants.size);
	var ants = queen.ants.size, score = false;
	if(!ants)
		score = ((gameLength/counter)-1) * (-startAnts);
	else if(counter > gameLength)
		score = ants;
	if(false!== score)
		endGame(score);
	plan(antAdvance);
}

clearGame();
antAdvance();