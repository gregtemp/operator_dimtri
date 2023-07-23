/*

2d vector control

arguments: fgred fggreen fgblue bgred bggreen bbgblue radius

*/

inlets = 2;
outlets = 2;
sketch.ortho3d(); //like default3d but uses orthographic projection
var vbrgb = [0.01,0.0,0.1,0.]; // background color
var vfrgb = [0.0,0.0,0.3,1.]; // foreground color
var w = [0,0,0];
var vx = 0;
var vy = 0;
var vradius = 0.1;

sketch.fsaa = true;
// load our dicts
var tripoints = new Dict();
tripoints.import_json("tri_points.json")
var trisimps = new Dict();
trisimps.import_json("tri_simplices.json")

var all_corners = []
for (var j = 0; j < trisimps.getkeys().length; j++){
	var simp = trisimps.get(j.toString());
	var corns = simp.map(function(element) {
		return tripoints.get(element.toString());
	  });
	all_corners.push([corns[0][0]*2.-1., corns[0][1]*2.-1., 0., corns[1][0]*2.-1., corns[1][1]*2.-1., 0., corns[2][0]*2.-1., corns[2][1]*2.-1.]);
}


with (sketch) {
    glclearcolor([0., 0., 0., 1.000]);			
    glclear();
	gllinewidth(1.);
	glpointsize(3.);
	glcolor([0.427, 0.843, 1.000, 0.5]);
	// for (var i = 0; i < tripoints.getkeys().length; i++){
	// 	glcolor([0.427, 0.843, 1.000, 0.5]);
	// 	var px = tripoints.get(i.toString())[0] * 2. - 1.;
	// 	var py = tripoints.get(i.toString())[1] * 2. - 1.;
	// 	point(px, py);
	// 	//frametri(tri_coords.slice(0,9));
	// }
	for (var j = 0; j < trisimps.getkeys().length; j++){
		frametri(all_corners[j]);
	}
}


function init(){
	
	with (sketch) {
    	glclearcolor([0., 0., 0., 1.000]);			
    	glclear();
		gllinewidth(1.);
		glcolor([0.427, 0.843, 1.000, 0.5]);
		// glpointsize(3.);
		// for (var i = 0; i < tripoints.getkeys().length; i++){
		// 	glcolor([0.427, 0.843, 1.000, 0.5]);
		// 	var px = tripoints.get(i.toString())[0] * 2. - 1.;
		// 	var py = tripoints.get(i.toString())[1] * 2. - 1.;
		// 	point(px, py);
		// //frametri(tri_coords.slice(0,9));
		// }
		for (var j = 0; j < trisimps.getkeys().length; j++){
			frametri(all_corners[j]);
		}
	}
}


var tri_coords = [];

function draw_tri() {
	tri_coords = [];
	for (var i = 0; i < arguments.length; i++){
		tri_coords.push(arguments[i]);
	}

	draw();
	refresh();
	
}

function draw()
{
	
	

	with (sketch) {
		// glclearcolor(vbrgb);			
		// glclear();			
		
		glcolor([0.427, 0.843, 1.000, 0.5]);
		frametri(tri_coords.slice(0,9));
		

		//tri(w[0]-0.1, w[1]-0.1, w[2], w[0], w[1]+0.1, w[2], w[0]+0.1, w[1]-0.1, w[2]);
		//point(w[0], w[1], w[2]);
	}
	outlet(1, tri_coords);
}

function msg_float(v)
{
	var i = inlet;
	
	if (i==0)
		list(v,vy);
	else
		list(vx,v);	
}

function list()
{
	var width = box.rect[2] - box.rect[0];
	var height = box.rect[3] - box.rect[1];

	if (arguments.length>0)
		vx = arguments[0];
	if (arguments.length>1)
		vy = arguments[1];
		
	if (vx<0) vx = 0;
	else if (vx>1) vx = 1;
	if (vy<0) vy = 0;
	else if (vy>1) vy = 1;
	
	w = sketch.screentoworld(vx*width,(1.-vy)*height);
	notifyclients();
	bang();
}

function set()
{
	if (arguments.length == 1) {
		if (inlet == 0)
			setlist(arguments[0],vy)
		else
			setlist(vx,arguments[0]);
	} else if (arguments.length == 2) {
		setlist(arguments[0], arguments[1]);
	}
}

function setlist(x, y)
{
	var width = box.rect[2] - box.rect[0];
	var height = box.rect[3] - box.rect[1];
	
	vx = x;
	vy = y;
	
	if (vx<0) vx = 0;
	else if (vx>1) vx = 1;
	if (vy<0) vy = 0;
	else if (vy>1) vy = 1;
	
	w = sketch.screentoworld(vx*width,(1.-vy)*height);
	notifyclients();
	draw();
	refresh();
}

function bang()
{
	draw();
	refresh();
	//outlet(1,[w[0], w[1], w[2]]);
	outlet(0,[vx, vy]);
}

function get_tripoint(idx)
{
	//outlet(0, tripoints.get("data").get(idx));
	return(tripoints.get("data").get(idx));
}

function get_simp_points(idx)
{
	var corners = [
		tripoints.get("data").get(trisimps.get("data").get(idx)[0])[0]*2.-1., tripoints.get("data").get(trisimps.get("data").get(idx)[0])[1]*2.-1., 0.,
		tripoints.get("data").get(trisimps.get("data").get(idx)[1])[0]*2.-1., tripoints.get("data").get(trisimps.get("data").get(idx)[1])[1]*2.-1., 0.,
		tripoints.get("data").get(trisimps.get("data").get(idx)[2])[0]*2.-1., tripoints.get("data").get(trisimps.get("data").get(idx)[2])[1]*2.-1., 0.
				];
	
	return corners;
}



function fsaa(v)
{
	sketch.fsaa = v;
	bang();
}

function frgb(r,g,b)
{
	vfrgb[0] = r/255.;
	vfrgb[1] = g/255.;
	vfrgb[2] = b/255.;
	draw();
	refresh();
}

function brgb(r,g,b)
{
	vbrgb[0] = r/255.;
	vbrgb[1] = g/255.;
	vbrgb[2] = b/255.;
	draw();
	refresh();
}

function onresize(w,h)
{
	draw();
	refresh();
}
onresize.local = 1; //private

