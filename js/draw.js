import {board} from "./board.js";

var w = $(window), multiplicator, svg = $("svg");
function resize() {
	var i, sz = Math.min(w.height(), w.width());
	multiplicator = sz/board.size;
	svg.attr({
		width: sz,
		height: sz
	});
	for(let d of draw.drawn)
		d.redraw();
}
function fireMouse(evt) {
	for(let listener of board.mouseListeners)
		listener(evt);
}
svg.mousemove(function(event) {
	var off = svg.offset();
	fireMouse({x: (event.pageX-off.left)/multiplicator, y: (event.pageY-off.top)/multiplicator});
});
svg.mouseleave(function() {
	fireMouse(false);
});
function hslaCss(hsla) {
	return 'hsla('+Math.round(hsla.h)+','+Math.round(hsla.s*100)+'%,'+Math.round(hsla.b*100)+'%,'+hsla.o+')'
}
function completeColors(svgItem, colorSpec) {
	var fill = colorSpec.fill, stroke = colorSpec.stroke;
	if(fill) svgItem.fill = hslaCss(fill);
	if(stroke) svgItem.stroke = hslaCss(stroke);
	return svgItem;
}
var redraw = {
	circle: function() {
		if(!draw.draw) return;
		var p = this.parent,
			x = p.x, y = p.y, r = p.radius,
			parts = this.parts, type = this.type;
		parts.main.attr(completeColors({
			cx: Math.round(x*multiplicator),
			cy: Math.round(y*multiplicator),
			r: Math.round(r*multiplicator)
		}, p));
		if(board.size< x+r) {
			(parts.left || (parts.left = draw.addSvg('circle', type))).attr(completeColors({
				cx: Math.round(x-board.size*multiplicator),
				cy: Math.round(y*multiplicator),
				r: Math.round(r*multiplicator)
			}, p));
			if(board.size< y+r) {
				(parts.up_left || (parts.up_left = draw.addSvg('circle', type))).attr(completeColors({
					cx: Math.round(x-board.size*multiplicator),
					cy: Math.round(y-board.size*multiplicator),
					r: Math.round(r*multiplicator)
				}, p));
			} else {
				if(parts.up_left) { parts.up_left.remove(); delete parts.up_left; }
			}
			if(0> y-r) {
				(parts.down_left || (parts.down_left = draw.addSvg('circle', type))).attr(completeColors({
					cx: Math.round(x-board.size*multiplicator),
					cy: Math.round(y+board.size*multiplicator),
					r: Math.round(r*multiplicator)
				}, p));
			} else {
				if(parts.down_left) { parts.down_left.remove(); delete parts.down_left; }
			}
		} else {
			if(parts.left) { parts.left.remove(); delete parts.left; }
			if(parts.up_left) { parts.up_left.remove(); delete parts.up_left; }
			if(parts.down_left) { parts.down_left.remove(); delete parts.down_left; }
		}
		if(0> x-r) {
			(parts.right || (parts.right = draw.addSvg('circle', type))).attr(completeColors({
				cx: Math.round(x+board.size*multiplicator),
				cy: Math.round(y*multiplicator),
				r: Math.round(r*multiplicator)
			}, p));
			if(board.size< y+r) {
				(parts.up_right || (parts.up_right = draw.addSvg('circle', type))).attr(completeColors({
					cx: Math.round(x+board.size*multiplicator),
					cy: Math.round(y-board.size*multiplicator),
					r: Math.round(r*multiplicator)
				}, p));
			} else {
				if(parts.up_right) { parts.up_right.remove(); delete parts.up_right; }
			}
			if(0> y-r) {
				(parts.down_right || (parts.down_right = draw.addSvg('circle', type))).attr(completeColors({
					cx: Math.round(x+board.size*multiplicator),
					cy: Math.round(y+board.size*multiplicator),
					r: Math.round(r*multiplicator)
				}, p));
			} else {
				if(parts.down_right) { parts.down_right.remove(); delete parts.down_right; }
			}
		} else {
			if(parts.right) { parts.right.remove(); delete parts.right; }
			if(parts.up_right) { parts.up_right.remove(); delete parts.up_right; }
			if(parts.down_right) { parts.down_right.remove(); delete parts.down_right; }
		}
		if(board.size< y+r) {
			(parts.up || (parts.up = draw.addSvg('circle', type))).attr(completeColors({
				cx: Math.round(x*multiplicator),
				cy: Math.round(y-board.size*multiplicator),
				r: Math.round(r*multiplicator)
			}, p));
		} else {
			if(parts.up) { parts.up.remove(); delete parts.up; }
		}
		if(0> y-r) {
			(parts.down || (parts.down = draw.addSvg('circle', type))).attr(completeColors({
				cx: Math.round(x*multiplicator),
				cy: Math.round(y+board.size*multiplicator),
				r: Math.round(r*multiplicator)
			}, p));
		} else {
			if(parts.down) { parts.down.remove(); delete parts.down; }
		}

	},
	path: function() {
		if(!draw.draw) return;
		var p = this.parent;
		this.parts.main.attr(completeColors({
			d: pathTexts(p.points)
		}, p));
	}
}
function pathTexts(points) {
	function coord(index) {
		return ''+ Math.round(points[index].x*multiplicator) + ' ' + Math.round(points[index].y*multiplicator);
	}
	if(!points || !points.length) return '';
	var i, rv = 'M ' + coord(0);
	for(i=1; i<points.length; ++i)
		rv += ' L ' + coord(i);
	return rv + ' Z';
}
var drawCheck = $('#draw');
drawCheck.click(function() {
	if(drawCheck[0].checked)
		for(let d of draw.drawn)
			d.redraw();
});
export var draw = {
	svg,
	get draw() {
		return drawCheck[0].checked;
	},
	drawn: new Set(),
	addSvg(node, type, spec) {
		var x = $(document.createElementNS("http://www.w3.org/2000/svg", node)), dst = svg;
		if(type) dst = dst.find('#'+type);
		dst.append(x);
		return x;
	},
	add(spec) {
		this.drawn.add(spec);
		return spec;
	},
	addCircle(parent, type) {
		return this.add({
			parent,
			type,
			parts: {main: this.addSvg('circle', type)},
			redraw: redraw.circle
		});
	},
	addPolygon(parent, type) {
		return this.add({
			parent,
			type,
			parts: {main: this.addSvg('path', type)},
			redraw: redraw.path
		});
	},
	remove(sth) {
		var i;
		for(i in sth.parts)
			sth.parts[i].remove();
		i = this.drawn.delete(sth);
	}
};
w.resize(resize);
resize();