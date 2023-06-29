/*

2d vector control

arguments: fgred fggreen fgblue bgred bggreen bbgblue radius

*/

inlets = 2;
outlets = 2;
sketch.ortho3d(); //like default3d but uses orthographic projection
var vbrgb = [0.01,0.0,0.1,0.]; // background color
var vfrgb = [1.000, 0.710, 0.196, 1.000]; // foreground color
var w = [0,0,0];
var vx = 0;
var vy = 0;
var vradius = 0.1;


// load our dicts
var tripoints = new Dict();
tripoints.import_json("tri_points.json")
var trisimps = new Dict();
trisimps.import_json("tri_simplices.json")


// process arguments
if (jsarguments.length>1)
	vfrgb[0] = jsarguments[1]/255.;
if (jsarguments.length>2)
	vfrgb[1] = jsarguments[2]/255.;
if (jsarguments.length>3)
	vfrgb[2] = jsarguments[3]/255.;
if (jsarguments.length>4)
	vbrgb[0] = jsarguments[4]/255.;
if (jsarguments.length>5)
	vbrgb[1] = jsarguments[5]/255.;
if (jsarguments.length>6)
	vbrgb[2] = jsarguments[6]/255.;
if (jsarguments.length>7)
	vradius = jsarguments[1];

var simp_idx = [];
// var tri_draw_pts = [];
// for (var i = 0; i <= 746; i ++) {
// 	tri_draw_pts.push(get_simp_points(i));
// }
var tri_coords = [];
var total_tri = 1;


function draw_tri() {
	
	

	tri_coords = [];
	for (var i = 0; i < arguments.length; i++){
		tri_coords.push(arguments[i]);
	}

	draw();
	
	
	//outlet(1, tri_coords);
}

function num_tri(the_number){
	total_tri = the_number-1;
}


var mydist = 1.;

function draw()
{
	var str;
	

	with (sketch) {
		
		// if (tri_coords.length % 9 == 0){
		// 	glclearcolor(vbrgb);			
		// 	glclear();			
		// 	glcolor(vfrgb);
		// 	moveto(w);
		// 	circle(vradius/5.);
		// 	glcolor([0.,0.,0.,1.]);
		// 	framecircle(vradius/5.);
		// }
		
		glclearcolor(vbrgb);			
		glclear();	
		gllinewidth(1.);		
		glcolor(vfrgb);
		moveto(w);
		glcolor(vfrgb);
		circle(vradius/5.);
		glcolor([0.,0.,0.,1.]);
		framecircle(vradius/5.);

		for (var i = 0; i < total_tri; i++) {
			mydist = 1.-Math.sqrt(Math.pow(tri_coords[i*9]-w[0],2.)+Math.pow(tri_coords[i*9+1]-w[1], 2.))*2.;
			glcolor([mydist,1.,1.,mydist]);
			tri(tri_coords.slice(i*9,(i+1)*9));
			glcolor([0.,0.,0.,1.]);
			frametri(tri_coords.slice(i*9,(i+1)*9));
		}

		

		//tri(w[0]-0.1, w[1]-0.1, w[2], w[0], w[1]+0.1, w[2], w[0]+0.1, w[1]-0.1, w[2]);
		//point(w[0], w[1], w[2]);
	}
	refresh();
	outlet(1, tri_coords.length);
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
	//draw();
	//refresh();
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

// function get_simp_pts(idx)
// {
// 	var corners = [
// 		tripoints.get("data").get(trisimps.get("data").get(idx)[0])[0], tripoints.get("data").get(trisimps.get("data").get(idx)[0])[1],
// 		tripoints.get("data").get(trisimps.get("data").get(idx)[1])[0], tripoints.get("data").get(trisimps.get("data").get(idx)[1])[1],
// 		tripoints.get("data").get(trisimps.get("data").get(idx)[2])[0], tripoints.get("data").get(trisimps.get("data").get(idx)[2])[1]
// 				];
	
// 	return corners;
// }

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
	//draw();
	//refresh();
}

function brgb(r,g,b)
{
	vbrgb[0] = r/255.;
	vbrgb[1] = g/255.;
	vbrgb[2] = b/255.;
	//draw();
	//refresh();
}

function radius(v)
{
	vradius = v;
	//draw();
	//refresh();
}

function setvalueof(x,y)
{
	list(x,y);
}

function getvalueof()
{
	var a = new Array(vx,vy);
	
	return a;
}

function onresize(w,h)
{
	draw();
	refresh();
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

	vx = x/width;
	vy = 1- y/height;
	notifyclients();
	bang();
}
ondrag.local = 1; //private 