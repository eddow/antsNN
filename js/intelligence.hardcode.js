import {vector} from "./entities.js";

export var intelligence = {
	step(ant, interractions) {
		var direction = new vector(0, 0), pheromons = {};
		direction.subtract(interractions.lava.direction);
		if(interractions.pheromons.danger) direction.subtract(interractions.pheromons.danger.direction);
		if(ant.loaded) {
			if(interractions.queen)
				direction.add(interractions.queen.direction);
			else if(interractions.pheromons.nest)
				direction.add(interractions.pheromons.nest.direction);
			if(interractions.grass && interractions.grass.qtt) {
				pheromons.food = {
					radius: 5,
					strength: 1,
					degeneration: 0.001
				};
			} else if(interractions.pheromons.food) {
				pheromons.food = {
					radius: 5,
					strength: .9*interractions.pheromons.food.qtt*interractions.pheromons.food.proximity,
					degeneration: 0.005
				};
			}
		} else {
			if(interractions.grass.qtt)
				direction.add(interractions.grass.direction);
			else if(interractions.pheromons.food)
				direction.add(interractions.pheromons.food.direction);
			if(interractions.queen && interractions.queen.qtt) {
				pheromons.nest = {
					radius: 5,
					strength: 1,
					degeneration: 0.001
				};
			} else if(interractions.pheromons.nest) {
				pheromons.nest = {
					radius: 5,
					strength: .9*interractions.pheromons.nest.qtt*interractions.pheromons.nest.proximity,
					degeneration: 0.005
				};
			}
		}
		if(interractions.lava.qtt)
			pheromons.danger = {
				radius: 5,
				strength: 1,
				degeneration: 0.001
			};
		if(direction.isZero()) direction = vector.around();
		 
		return {
			direction: direction.angle(),
			velocity: ant.loaded?interractions.queen&&interractions.queen.proximity:interractions.grass.proximity,
			action: {
				grab: interractions.grass.proximity < 0.5,
				eat: interractions.queen && (interractions.queen.proximity < 1.5-ant.strength)
			},
			pheromons
		};
	}
}