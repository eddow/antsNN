import {vector} from "./entities.js";
import {objects} from "./entities/objects.js";
import {random, randomNdx} from "./math.js"

var nests = [], generation = 0, clearGame;
const targetNbrLinks = {min: 30, max: 50}, nbrNests = 100;

function R2one(n) {
	return 2*Math.atan(n)/Math.PI;
}
function one2R(n) {
	if(n>1) n = 1;
	else if(n<-1) n = -1;
	return Math.tan(n*1.5);	//tan(pi/2) : illegal
}
function randomItem(arr) {
	return arr[randomNdx(arr.length)];
}
function randomInputCombo(inputNames) {
	var rv = [];
	while(.3>random())
		rv.push(randomItem(inputNames));
	return rv.join('*');
}
export var intelligence = {
	get raw() {
		return {neurons: this.neurons, defaults: this.defaults, score: this.score};
	},
	set raw(v) {
		Object.assign(this, v);
	},
	defaults: {},
	neurons: {},
	random() {
		var i;
		this.defaults = $.extend(true, {}, this.defaults);
		this.neurons = $.extend(true, {}, this.neurons);
		for(i in this.defaults) this.defaults[i] = one2R(random(1, -1));
		for(i in io.output) {
			this.neurons[i] = {};
			while(.7>random())
				this.neurons[i][randomInputCombo(inputNames)] = one2R(random(1, -1));
		}
		this.score = this.scale = 0;
	},
	mutation() {
		return random(3, -3);
	},
	mutationAddOne() {
		var itm = randomItem(Object.keys(this.neurons)),
			combo = randomInputCombo(inputNames);
		this.neurons[itm][combo] = this.mutation();
	},
	mutationDefaultOne() {
		this.defaults[randomItem(Object.keys(this.defaults))] += this.mutation();
	},
	neuronCount() {
		var nCnt = {}, i, total = 0;
		for(i in io.output) {
			if(!this.neurons[i]) this.neurons[i] = [];
			nCnt[i] = Object.keys(this.neurons[i]);
			total += nCnt[i].length;
		}
		nCnt.total = total;
		return nCnt;
	},
	mutationPick(nCnt) {
		var i, tIndex;
		tIndex = randomNdx(nCnt.total);
		for(i in this.neurons) {
			if(tIndex< nCnt[i].length)
				return {output: i, input: nCnt[i][tIndex]};
			else
				tIndex -= nCnt[i].length;
		}
	},
	mutationChangeOne(nCnt) {
		var {input, output} = this.mutationPick(nCnt),
			b4 = this.neurons[output][input];
		this.neurons[output][input] += this.mutation();
		if(0> b4 * this.neurons[output][input]) {
			delete this.neurons[output][input];
			--nCnt.total;
			nCnt[output].splice(nCnt[output].indexOf(input), 1);
		}
	},
	mutate() {
		var nCnt = this.neuronCount();
		while(.5> random())
			this.mutationDefaultOne();
		while(nCnt.total && 1-(targetNbrLinks.min/nCnt.total)> random())
			this.mutationChangeOne(nCnt);
		while(targetNbrLinks.min/nCnt.total> random()) {
			this.mutationAddOne();
			++nCnt.total;
		}
	},
	layers(ant, interractions) {
		var input = {}, output = {}, me = this;
		function base(type) {
			return 0;
		}
		function defaults(type) {
			if(undefined=== me.defaults[type])
				me.defaults[type] = 0;
			return R2one(me.defaults[type]);
		}
		function inputLoaded(type) {
			input['ant.loaded.'+type] = (ant.loaded && ant.loaded[type]) || defaults('loaded.'+type);
		}
		function inputObjects(type) {
			input['object.'+type+'.qtt'] = R2one(interractions[type] && interractions[type].qtt) || defaults('object.'+type+'.qtt');
			input['object.'+type+'.distance'] = (interractions[type] && interractions[type].proximity) || defaults('object.'+type+'.distance');
			input['object.'+type+'.proximity'] = (interractions[type] && (1-interractions[type].proximity)) || defaults('object.'+type+'.proximity');
			output['object.'+type+'.direction'] = base('object.'+type);
		}
		function inputPheromon(type) {
			input['pheromon.'+type+'.qtt'] = R2one(interractions.pheromons[type] && interractions.pheromons[type].qtt) || defaults('pheromon.'+type+'.qtt');
			input['pheromon.'+type+'.distance'] = (interractions.pheromons[type] && interractions.pheromons[type].proximity) || defaults('pheromon.'+type+'.distance');
			input['pheromon.'+type+'.proximity'] = (interractions.pheromons[type] && (1-interractions.pheromons[type].proximity)) || defaults('pheromon.'+type+'.proximity');
			output['pheromon.'+type+'.direction'] = base('pheromon.'+type+'.direction');
			output['pheromon.'+type+'.radius'] = base('pheromon.'+type+'.radius');
			output['pheromon.'+type+'.strength'] = base('pheromon.'+type+'.strength');
			output['pheromon.'+type+'.degeneration'] = base('pheromon.'+type+'.degeneration');
		}
		inputLoaded('grass');
		//inputLoaded('poison');
		inputObjects('lava');
		inputObjects('grass');
		inputObjects('queen');
		//inputObjects('poison');
		output['action.grab'] = base('action.grab');
		output['action.eat'] = base('action.eat');
		output['velocity'] = base('velocity');
		output['inertia.direction'] = base('velocity');
		input['ant.strength'] = ant.strength*2-1;
		input['random'] = random(1, -1);
		//output['action.drop'] = base('action.drop');
		for(let i = 0; i < 5; ++i)
			inputPheromon('p'+i);
		return {input, output};
	},
	step(ant, interractions) {
		var direction = new vector(0, 0), pheromons = {},
			{input, output} = this.layers(ant, interractions);
		for(let o in output) {
			let neurons = this.neurons[o];
			if(neurons) {
				for(let n in neurons) {
					let tv = neurons[n], comps = n.split('*');
					if(''!== n) for(let i in comps)
						tv *= input[comps[i]];
					output[o] += tv;
				}
				let dst = o.split('.'), tDirection = false;
				if('inertia.direction'=== o)
					direction.add(new vector(output[o]*Math.cos(ant.direction), output[o]*Math.sin(ant.direction)));
				else if('direction'=== dst[2]) {
					if('pheromon'=== dst[0])
						tDirection = interractions.pheromons;
					else if('object'=== dst[0])
						tDirection = interractions;
					tDirection = tDirection[dst[1]];
					if(tDirection) {
						tDirection = tDirection.direction;
						if(!tDirection.isZero())
							direction.add(tDirection.clone().multiply(output[o]));
					}
				} else if('pheromon'=== dst[0]) {
					if(!pheromons[dst[1]])
						pheromons[dst[1]] = {};
					pheromons[dst[1]][dst[2]] = 
						'radius'=== dst[2]? 5*(1+R2one(output[o])):
						'strength'=== dst[2]? R2one(output[o]):
						/*'degeneration'=== dst[2]?*/ Math.pow(.01, 1+R2one(output[o])/2);
				}
			}
		}

		return {
			direction: direction.isZero()?ant.direction:direction.angle(),
			velocity: (1+R2one(output.velocity))/2,
			action: {
				grab: 0<output['action.grab'],
				eat: 0<output['action.eat']/*,
				drop: 0*/
			},
			pheromons
		};
	}
}
var io = intelligence.layers({}, {pheromons:{}}),
	inputNames = Object.keys(io.input);

export function initIntelligence(clear) {
	clearGame = clear;
	return {
		pheromons: {
			p0: new objects('pheromons', 250),
			p1: new objects('pheromons', 25),
			p2: new objects('pheromons', 75),
			p3: new objects('pheromons', 150),
			p4: new objects('pheromons', 175)
		}
	}
}

const expAdvantage = 1.1;
function sex(nests) {
	var i, maxR = 0, pheromonChoices = {}, rv = {
		neurons: {},
		defaults: {}
	};
	for(i in nests) nests[i].score = Math.pow(expAdvantage, nests[i].score);
	for(i in nests) maxR += nests[i].score;
	function mix(type, copy) {
		var i, j, chx, pDetect;
		for(i in nests[0][type]) {
			pDetect = i.split('.');
			j = 'pheromon'=== pDetect[0]? pheromonChoices[pDetect[1]] : void 0;
			if(undefined=== j) {
				chx = random(maxR);
				for(j=0; 0< (chx -= nests[j].score); ++j);
				if('pheromon'=== pDetect[0])
					pheromonChoices[pDetect[1]] = j;
			}
			rv[type][i] = copy(nests[j][type][i]);
		}
	}
	mix('neurons', function(x) { return $.extend(true, {}, x); });
	mix('defaults', function(x) { return x; });
	rv.score = 0;
	for(i in nests) rv.score += (nests[i].score = (Math.log(nests[i].score)/Math.log(expAdvantage))-(nests[i].score/maxR));
	rv.score /= nests.length;
	return rv;
}

export function endGame(intelligence, score) {
	if(undefined!== score)
		nests.push($.extend(true, {}, intelligence.raw, {score}));
	nests.sort(function(a, b) { return b.score-a.score; });
	if(nbrNests < nests.length || (nbrNests == nests.length && undefined=== score)) {
		if(undefined!== score)
			nests.pop();	//removes the "loser"
		if(document.getElementById('checkBest').checked)
			intelligence.raw = $.extend(true, {}, nests[0]);
		else {
			var i, index, nbr = randomNdx(3, 1), orgy = [];
			while(orgy.length < nbr) {
				index = random();
				index *= index * nests.length;	//[0..1[ square to chose more probably best ones
				index = Math.floor(index);
				if(0> orgy.indexOf(nests[index]))
					orgy.push(nests[index]);
			}
			if(1== nbr) {
				intelligence.raw = $.extend(true, {}, orgy[0]);
				--orgy[0].score;
			} else
				intelligence.raw = sex(orgy);
			
			intelligence.scale = R2one(intelligence.score/20);
			intelligence.mutate();
		}
	} else
		intelligence.random();
	var average = 0;
	for(let i in nests)
		average += nests[i].score;
	$('#scoreAverage').text(average / nests.length);
	$('#scoreMin').text(nests[nests.length-1].score);
	$('#scoreMax').text(nests[0].score);
	$('#generation').text(++generation);
	clearGame();
	return intelligence;
}

$("#infos").append(`
	<div>Generation:<span id="generation"></span></div>
	<div>Max:<span id="scoreMax"></span></div>
	<div>Average:<span id="scoreAverage"></span></div>
	<div>Min:<span id="scoreMin"></span></div>
	<div>
		<button id="saveCmd">Save</button>
		<input type="file" accept="json" id="loadFile" />
		<button id="loadCmd">Load</button>
	</div>
	<div>
		<input type="checkbox" id="checkBest" /> See the best
	</div>
`);

$('#saveCmd').click(function() {
	var blob = new Blob([JSON.stringify({nests, generation})], {type: "application/json;charset=utf-8"});
	saveAs(blob, "nests.json");
});

var fr;
function receivedText() {
	var vals = JSON.parse(fr.result);
	nests = vals.nests;
	generation = vals.generation-1;
	endGame(intelligence);
}
$('#loadCmd').click(function() {
	var input = $('#loadFile')[0];
	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(input.files[0]);
});