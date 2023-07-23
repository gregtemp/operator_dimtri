
var trisimps = new Dict();
trisimps.import_json("tri_simplices.json");
var tripoints = new Dict();
tripoints.import_json("tri_points.json")


var dict_celltosimps = new Dict();
dict_celltosimps.import_json("cell_to_simplices.json");
var celltosimps = {};


sketch.ortho3d(); //like default3d but uses orthographic projection // idk why we need this but it seems to need it
var vbrgb = [0.0,0.0,0.,1.]; // background color
var vfrgb = [1.000, 0.710, 0.196, 1.000]; // foreground color
var w = [0,0,0];
var vx = 0;
var vy = 0;
var finex = 0;
var finey = 0;
var vradius = 0.1;

var cx = 0;
var cy = 0;

var mycell_x = 12;
var mycell_y = 12;

var zoom_amt = 8.;

var tri_amount = 0;
var tri_corners = [];

var potentialsimps = {};

function pass_dict(dict) {
	post(dict.getkeys());
}

function init() {
	var cellsimpkeys = dict_celltosimps.getkeys();

	for (var i = 0; i < cellsimpkeys.length; i++) {
		var outerKey = cellsimpkeys[i];
		var innerDict = dict_celltosimps.get(outerKey);
		var innerKeys = innerDict.getkeys();
		
		var innerObject = {};
		if (Array.isArray(innerKeys)) {
			for (var j = 0; j < innerKeys.length; j++) {
				var innerKey = innerKeys[j];
				var arrayValue = innerDict.get(innerKey);
				innerObject[innerKey] = [arrayValue[0]*2.-1., arrayValue[1]*2.-1., 0.0,
										arrayValue[2]*2.-1., arrayValue[3]*2.-1., 0.0,
										arrayValue[4]*2.-1., arrayValue[5]*2.-1., 0.0];
			}
		} else {
			// innerKeys is a string, so use it directly as a key
			var arrayValue = innerDict.get(innerKeys);
			innerObject[innerKeys] = [arrayValue[0]*2.-1., arrayValue[1]*2.-1., 0.0,
										arrayValue[2]*2.-1., arrayValue[3]*2.-1., 0.0,
										arrayValue[4]*2.-1., arrayValue[5]*2.-1., 0.0];
			//post("arrayValue:  [" + outerKey + "] [" + innerKeys + "] " + arrayValue + "\n");
		}
		
		celltosimps[outerKey] = innerObject;
	}
	cells();
}

function draw()
{
	with (sketch) {
		
		glclearcolor(vbrgb);			
		glclear();
		gllinewidth(2.);	
		glcolor(vfrgb);
		moveto([w[0], w[1], 0.1]);
		glcolor(vfrgb);
		circle(vradius/5.);
		glcolor([0.,0.,0.,1.]);
		framecircle(vradius/5.);
		for (var k = 0; k < tri_corners.length; k++) {
			var corns = tri_corners[k];
			glcolor([0.,0.,0.,1.]);
            tri(corns);
			glcolor([0.427, 0.843, 1.000, 1.]);
			frametri(corns);
		}

		moveto([0., 0., 0.01]);
		glcolor([1.000, 0.047, 0.973, 1.000]);
		circle(vradius/8.);
		gllinewidth(1.);
		lineto(w);
		
    }
    refresh();
}


function zoom_and_center(corns) {
	var new_corns = new Array (corns.length);
	for (var i = 0; i < corns.length; i++) {
		if (i%3 == 0) {
			new_corns[i] = (corns[i]-cx) * zoom_amt;
		}
		else if (i%3 == 1) {
			new_corns[i] = (corns[i]-cy) * zoom_amt;
		}
		else{
			new_corns[i] = 0.;
		}
	}
	return new_corns;
}

function cells() {
	//var potentialsimps = [];
	if (arguments.length > 0) {
		mycell_x = arguments[0];
		mycell_y = arguments[1];
	}
	var x = mycell_x;
	var y = mycell_y;
	potentialsimps = {};
	for (var i = -1; i <= 1; i ++){
		for (var j = -1; j <= 1; j++){
			if (x + i >= 0 && x + i <= 24 && y + j >= 0 && y + j <= 24) {
				var cellstr = (x + i).toString() + " " + (y + j).toString();
				var keys = Object.keys(celltosimps[cellstr]);
				for (var k = 0; k < keys.length; k++) {
					potentialsimps[keys[k]] = celltosimps[cellstr][keys[k]];
					
				}
			}
		}
	}
	var current_simps = Object.keys(potentialsimps);
	tri_corners = [];
	for (var l = 0; l < current_simps.length; l++) {
		tri_corners.push(zoom_and_center(potentialsimps[current_simps[l]]));
	}
	//post(tri_corners[0] + "\n"); 
	//draw();
}


function radius(v)
{
	vradius = v;
}

function getvalueof()
{
	var a = new Array(vx,vy);
	return a;
}

function onresize(w,h)
{
	//draw();
	//refresh();
}
onresize.local = 1; //private

function onclick(x,y)
{
	ondrag(x,y);
}
onclick.local = 1; //private

function ondrag(x,y)
{
	var width = box.rect[2] - box.rect[0];
	var height = box.rect[3] - box.rect[1];
		
	if (x<0) x = 0;
	else if (x>width) x = width;
	if (y<0) y = 0;
	else if (y>height) y = height;
	
	w = sketch.screentoworld(x,y);

	vx = (x/width);
	vy = (1- y/height);
	outx = vx*2.-1.;
	outy = vy*2.-1.;
	outlet(0, outx/zoom_amt + cx, outy/zoom_amt + cy);

    //draw();
	
	//notifyclients();

}
ondrag.local = 1; //private 

function set_center() {
    cx = arguments[0];
    cy = arguments[1];
    w = [0., 0., 0.];
	vx = 0.5;
	vy = 0.5;
    //post(cx + " " + cy + "\n");
}

function set_zoom() {
	zoom_amt = arguments[0];
	cells();
}

function draw_now(){
    draw();
}

function automation_input() {
	var inx = arguments[0];
	var iny = arguments[1];
	ondrag(inx, iny);
}

fsaa = 1;
init();