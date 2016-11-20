import {vector} from "./entities.js";
import {objects} from "./entities/objects.js";

var nests = [], nbrNests = 100, generation = 0;

function R2one(n) {
	return 2*Math.atan(n)/Math.PI;
}
function one2R(n) {
	if(n>1) n = 1;
	else if(n<-1) n = -1;
	return Math.tan(n*1.5);	//tan(pi/2) : illegal
}
function randomInputCombo(inputNames) {
	var rv = [];
	while(.3>Math.random())
		rv.push(inputNames[Math.floor(Math.random()*inputNames.length)]);
	return rv.join('*');
}
function randomItem(arr) {
	return arr[Math.floor(Math.random()*arr.length)];
}
export var intelligence = {
	get raw() {
		return {neurons: this.neurons, defaults: this.defaults};
	},
	set raw(v) {
		this.neurons = v.neurons;
		this.defaults = v.defaults;
	},
	defaults: {},
	neurons: {},
	random() {
		var i;
		//for(i in this.base) this.base[i] = one2R(2*Math.random()-1);
		for(i in this.defaults) this.defaults[i] = one2R(2*Math.random()-1);
		for(i in io.output) {
			this.neurons[i] = {};
			while(.7>Math.random())
				this.neurons[i][randomInputCombo(inputNames)] = one2R(2*Math.random()-1);
		}
	},
	mutationAddOne() {
		var itm = randomItem(Object.keys(this.neurons)),
			combo = randomInputCombo(inputNames);
		this.neurons[itm][combo] = one2R(2*Math.random()-1);
	},
	mutationDefaultOne() {
		this.defaults[randomItem(Object.keys(this.defaults))] = one2R(2*Math.random()-1);
	},
	mutationPick() {
		var numbers = {}, i, total = 0;
		for(i in this.neurons) {
			numbers[i] = Object.keys(this.neurons[i]);
			total += numbers[i].length;
		}
		total = Math.floor(Math.random()*total);
		for(i in this.neurons) {
			if(total< numbers[i].length)
				return {output: i, input: numbers[i][total]};
			else
				total -= numbers[i].length;
		}
	},
	mutationChangeOne() {
		var {input, output} = this.mutationPick();
		this.neurons[output][input] = one2R(2*Math.random()-1);
	},
	mutationDeleteOne() {
		var {input, output} = this.mutationPick();
		delete this.neurons[output][input];
	},
	mutate() {
		while(.8> Math.random())
			this.mutationChangeOne();
		while(.5> Math.random())
			this.mutationDefaultOne();
		while(.1> Math.random())
			this.mutationDeleteOne();
		while(.2> Math.random())
			this.mutationAddOne();
	},
	layers(ant, interractions) {
		var input = {}, output = {}, me = this;
		function base(type) {
			return 0;/*
			if(undefined=== me.base[type])
				me.base[type] = 0;
			return me.base[type];*/
		}
		function defaults(type) {
			if(undefined=== me.defaults[type])
				me.defaults[type] = 0;
			return me.defaults[type];
		}
		function inputLoaded(type) {
			input['loaded.'+type] = (ant.loaded && ant.loaded[type]) || defaults('loaded.'+type);
		}
		function inputObjects(type) {
			input['object.'+type+'.qtt'] = (interractions[type] && interractions[type].qtt) || defaults('object.'+type+'.qtt');
			input['object.'+type+'.proximity'] = (interractions[type] && interractions[type].proximity) || defaults('object.'+type+'.proximity');
			output['object.'+type+'.direction'] = base('object.'+type);
		}
		function inputPheromon(type) {
			input['pheromon.'+type+'.qtt'] = (interractions.pheromons[type] && interractions.pheromons[type].qtt) || defaults('pheromon.'+type+'.qtt');
			input['pheromon.'+type+'.proximity'] = (interractions.pheromons[type] && interractions.pheromons[type].proximity) || defaults('pheromon.'+type+'.proximity');
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
						tv *= one2R(input[comps[i]]);
					output[o] += tv;
				}
				let dst = o.split('.'), tDirection = false;
				if('direction'=== dst[2]) {
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
						/*'degeneration'=== dst[2]?*/ Math.pow(.01, 2+R2one(output[o])/2);
				}
			}
		}

		return {
			direction: direction.isZero()?ant.direction:direction.angle(),
			velocity: 1+R2one(output.velocity)/2,
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


export function initIntelligence() {
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

export function endGame(score) {
	if(undefined!== score)
		nests.push(Object.assign(intelligence.raw, {score}));
	nests.sort(function(a, b) { return b.score-a.score; })
	if(nbrNests < nests.length) {
		nests.pop();	//removes the "loser"
		var index = Math.random();
		if(document.getElementById('checkBest').checked)
			index = 0;
		else
			index *= index * nests.length;	//[0..1[ square to chose more probably best ones
		intelligence.raw = nests[Math.floor(index)];
		intelligence.mutate();
	} else {
		intelligence.random();
	}
	var average = 0;
	for(let i in nests)
		average += nests[i].score;
	$('#scoreMin').text(nests[nests.length-1].score);
	$('#scoreMax').text(nests[0].score);
	$('#scoreAverage').text(average / nests.length);
	$('#population').text(nests.length);
	$('#generation').text(++generation);
}

$("#infos").append(`
	<div>Generation:<span id="generation"></span></div>
	<div>population:<span id="population"></span></div>
	<div>Max:<span id="scoreMax"></span></div>
	<div>Average:<span id="scoreAverage"></span></div>
	<div>Min:<span id="scoreMin"></span></div>
	<div>
		<button id="saveCmd">Save</button>
		<button id="loadCmd">Load</button>
	</div>
	<div>
		<input type="checkbox" id="checkBest" /> See the best
	</div>
`);

$('#saveCmd').click(function() {
	var blob = new Blob([JSON.stringify(nests)], {type: "application/json;charset=utf-8"});
	saveAs(blob, "nests.json");
});