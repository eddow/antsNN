import {vector} from "./entities.js";

function R2one(n) {
	return Math.atan(n)/Math.PI;
}
function one2R(n) {
	if(n>1) n = 1;
	else if(n<-1) n = -1;
	return Math.tan(n*3);	//tan(pi) : illegal
}

export class intelligence {
	constructor() {
		this.base = {};
		this.defaults = {};
		this.neurons = {};
	}
	layers(ant, interractions) {
		var input = {}, outputs = {object: {}, pheromon: {}};
		function base(type) {
			if(undefined=== this.base[type])
				this.base[type] = 0;
			return this.base[type];
		}
		function defaults(type) {
			if(undefined=== this.defaults[type])
				this.defaults[type] = 0;
			return this.defaults[type];
		}
		function inputLoaded(type) {
			input['loaded.'+type] = (ant.loaded && ant.loaded[type]) || defaults('loaded.'+type);
		}
		function inputObjects(type) {
			input['object.'+type+'.qtt'] = (interractions[type] && interractions[type].qtt) || defaults('object.'+type+'.qtt');
			input['object.'+type+'.proximity'] = (interractions[type] && interractions[type].proximity) || defaults('object.'+type+'.proximity');
			output['object.'+type] = base('object.'+type);
		}
		function inputPheromon(type) {
			input['pheromon.'+type+'.qtt'] = (interractions[type] && interractions[type].qtt) || defaults('pheromon.'+type+'.qtt');
			input['pheromon.'+type+'.proximity'] = (interractions[type] && interractions[type].proximity) || defaults('pheromon.'+type+'.proximity');
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
	}
	step(ant, interractions) {
		var direction = new vector(0, 0),
			layers = this.layers(ant, interractions);
		for(let o in output) {
			let neurons = this.neurons[o];
			if(neurons) {
				for(let n in neurons) {
					let tv = neuron[n], comps = n.split('*');
					for(let i in comps)
						tv *= one2R(input[comps[i]]);
					output[o] += tv;
				}
			}
		}
		return {
			direction: 0,
			velocity: 0,
			action: {
				grab: 0<output['action.grab'],
				eat: 0<output['action.eat']/*,
				drop: 0*/
			},
			pheromons: {}
		};
	}
}