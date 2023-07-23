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

var cornerpts = [0., 0., 0.];
var corners = new Array(6);
sketch.glclearcolor(vbrgb);			
sketch.glclear();

var mydist = 1.;

function draw()
{

	with (sketch) {
		
		glclearcolor(vbrgb);			
		glclear();	
		gllinewidth(1.);		
		glcolor(vfrgb);
		moveto(w);
		glcolor(vfrgb);
		circle(vradius/5.);
		glcolor([0.,0.,0.,1.]);
		framecircle(vradius/5.);
		
		glcolor([cornerpts[0], cornerpts[1], cornerpts[2], 1.]);
		tri(corners);
	}
	refresh();
	//outlet(1, tri_coords.length);
}

function draw_tri() {
	corners[0] = arguments[0];
	corners[1] = arguments[1];
	corners[2] = arguments[2];
	corners[3] = arguments[3];
	corners[4] = arguments[4];
	corners[5] = arguments[5];
	corners[6] = arguments[6];
	corners[7] = arguments[7];
	corners[8] = arguments[8];
	// notifyclients();
	draw();
}

function weights() {
	cornerpts[0] = arguments[0];
	cornerpts[1] = arguments[1];
	cornerpts[2] = arguments[2];
}
function fsaa(v)
{
	sketch.fsaa = v;
	bang();
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
	outlet(0, vx, vy);
	notifyclients();
}
ondrag.local = 1; //private 