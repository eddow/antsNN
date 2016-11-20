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
		var p = this.parent;
		this.parts.main.attr(completeColors({
			cx: Math.round(p.x*multiplicator),
			cy: Math.round(p.y*multiplicator),
			r: Math.round(p.radius*multiplicator)
		}, p));
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
			parts: {main: this.addSvg('circle', type)},
			redraw: redraw.circle
		});
	},
	addPolygon(parent, type) {
		return this.add({
			parent,
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