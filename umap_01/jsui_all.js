outlets = 7;


var trisimps = new Dict();
trisimps.import_json("tri_simplices.json");
var celltosimps = new Dict();
celltosimps.import_json("cell_to_simplices.json");
var operatordata = new Dict();
operatordata.import_json("operatordf.json");
var tripoints = new Dict();
tripoints.import_json("tri_points.json")

var all_corners = []
for (var j = 0; j < trisimps.getkeys().length; j++){
	var simp = trisimps.get(j.toString());
	var corns = simp.map(function(element) {
		return tripoints.get(element.toString());
	  });
	all_corners.push([corns[0][0]*2.-1., corns[0][1]*2.-1., 0., corns[1][0]*2.-1., corns[1][1]*2.-1., 0., corns[2][0]*2.-1., corns[2][1]*2.-1., 0.]);
}

var show_simps = [];
sketch.fsaa = true;

sketch.ortho3d(); //like default3d but uses orthographic projection // idk why we need this but it seems to need it
var vbrgb = [0.0,0.0,0.,0.]; // background color
var vfrgb = [1.000, 0.710, 0.196, 1.000]; // foreground color
var w = [0,0,0];
var vx = 0;
var vy = 0;
var finex = 0;
var finey = 0;
var vradius = 0.1;

var weight = [0., 0., 0.];
var corners = new Array(6);
sketch.glclearcolor(vbrgb);			
sketch.glclear();

var cell_x;
var cell_y;

var mydist = 1.;

var input_dict = new Dict();
var param_names = [];
var obj_ids = [];
var min_amt = [];
var max_amt = [];

function pass_dict(dict) {
	input_dict.name = dict;
	param_names = [];
	obj_ids = new Array(195);
	min_amt = new Array(195);
	max_amt = new Array(195);
	param_names = input_dict.getkeys();
	for (var i = 0; i < param_names.length; i++){
		obj_ids[i] = (input_dict.get(param_names[i])[0]);
		min_amt[i] = (input_dict.get(param_names[i])[1]);
		max_amt[i] = (input_dict.get(param_names[i])[2]);
	}
	//post(min_amt);
}

function zoom_cells(myptx, mypty) {
	outlet(1, "cells", cell_x, cell_y);
}

function find_tri(myptx, mypty) {

    var found_the_simp = false;
	//var myptx = arguments[0];
	//var mypty = arguments[1];
	//post("x: "+ myptx + " y: " + mypty + "\n");
	
	cell_x = Math.floor((myptx) * 24.9999999999);
    cell_y = Math.floor((mypty) * 24.9999999999);
    cell_str = cell_x.toString() + " " + cell_y.toString();

	if (Array.isArray(celltosimps.get(cell_str).getkeys())) {
		var potentialsimps = celltosimps.get(cell_str).getkeys();
		var simpamount = celltosimps.get(cell_str).getkeys().length;
	}
	else {
		var potentialsimps = [celltosimps.get(cell_str).getkeys()];
		var simpamount = 1;
	}
	show_simps = potentialsimps;

    for (var j = 0; j < simpamount; j++){
        if (found_the_simp) break;
		
        var simpidx = potentialsimps[j].toString();
		var cornerpts = celltosimps.get(cell_str).get(simpidx);
		var x1 = cornerpts[0];
	    var y1 = cornerpts[1];
	    var x2 = cornerpts[2];
	    var y2 = cornerpts[3];
	    var x3 = cornerpts[4];
	    var y3 = cornerpts[5];
        corners = [x1*2.-1., y1*2.-1., 0., x2*2.-1., y2*2.-1., 0., x3*2.-1., y3*2.-1., 0.];

	    var den = (y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3);
	    var a = ((y2 - y3)*(myptx - x3) + (x3 - x2)*(mypty - y3)) / den;
	    var b = ((y3 - y1)*(myptx - x3) + (x1 - x3)*(mypty - y3)) / den;
	    var c = 1. - a - b;

		var epsilon = 0.00001;
		var loedge = 0 - epsilon;
		var hiedge = 1 + epsilon;
	    var is_inside = loedge <= a && a <= hiedge && loedge <= b && b <= hiedge && loedge <= c && c <= hiedge;
        
        if (is_inside == 1) {
            found_the_simp = true;
            
            weight[0] = ((mypty - y3) * (x2 - x3) - (myptx - x3) * (y2 - y3)) / ((y1 - y3) * (x2 - x3) - (x1 - x3) * (y2 - y3));
            weight[1] = ((mypty - y3) * (x1 - x3) - (myptx - x3) * (y1 - y3)) / ((y2 - y3) * (x1 - x3) - (x2 - x3) * (y1 - y3));
            weight[2] = 1 - weight[0] - weight[1];
            //var cornerdata = [];
            var data = [];
			
			data.push(operatordata.get(trisimps.get(simpidx)[0].toString()));
            data.push(operatordata.get(trisimps.get(simpidx)[1].toString()));
            data.push(operatordata.get(trisimps.get(simpidx)[2].toString()));
            
            data[0] = data[0].map(function(element){
                return element * weight[0];
            });
            data[1] = data[1].map(function(element){
                return element * weight[1];
            });
            data[2] = data[2].map(function(element){
                return element * weight[2];
            });

			for (var k = 0; k < data[0].length; k ++) {
				var cur_value = data[0][k] + data[1][k] + data[2][k];
				var out_amt = (cur_value * (max_amt[k] - min_amt[k])) + min_amt[k];
				outlet((k%5)+ 2, obj_ids[k]);
				outlet((k%5)+ 2, "set value " + out_amt);
			}

            // var sumArray = data[0].map(function(value, index) {
            //     return value + data[1][index] + data[2][index];
            //   });
			
			// for (var k = 0; k < sumArray.length; k ++) {
			// 	// outarr.push(k%5, sumArray[k] * (max_amt[k] - min_amt[k]) - min_amt[k], obj_ids[k]);
			// 	var out_amt = (sumArray[k] * (max_amt[k] - min_amt[k])) + min_amt[k];
			// 	outlet(0, k%5, out_amt, obj_ids[k]);
			// 	//post(sumArray[k] + " " + param_names[k] + " -- " + max_amt[k] + " " + min_amt[k] + " -- " + obj_ids[k] + "\n");
			// }
            //outlet(0, outarr);
            //outlet(0, "weights", wx, wy, wz);
            
            break;
        }
        
    }
	if (found_the_simp == false) {
		post("outside");
		}
	//draw();

}

function clamp(val) {
	if (val > 1.) {
		val = 1.;
	}
	else if (val < 0.) {
		val = 0.;
	}
	
	return val;
}

function update_tri() {
	var x = arguments[0] /2. + 0.5;
	var y = arguments[1] /2. + 0.5;
	if (x < 0.){
		x = 0.;
	}
	if (x > 1.){
		x = 1.;
	}
	if (y < 0.){
		y = 0.;
	}
	if (y > 1.) {
		y = 1.;
	}
	find_tri(x,y);
}


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
		
		glcolor([weight[0], weight[1], weight[2], 1.]);
		tri(corners);
		gllinewidth(2.);
		//outlet(1, "tri_amt", show_simps.length);
		for (var k = 0; k < show_simps.length; k++){
			var tri_corn = all_corners[show_simps[k]];
			//outlet(1, "tri_corn", k, tri_corn);
			var dist = 1. - Math.sqrt(Math.pow(tri_corn[0] - vx, 2.)+Math.pow(tri_corn[1] - vy, 2.));
			glcolor([weight[0]*dist, weight[1]*dist, weight[2]*dist, 1.]);
			tri(tri_corn);
			glcolor([0.427, 0.843, 1.000, 1.]);
			frametri(tri_corn);
		}
		//outlet(1, "draw_now");
	}

	refresh();
	
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

	vx = (x/width);
	vy = (1- y/height);

    find_tri(vx, vy);
	outlet(1, "set_center", vx*2.-1., vy*2.-1.);
	// outlet(0, vx, vy);
	//notifyclients();
	zoom_cells(vx,vy);
}
ondrag.local = 1; //private 

function fine() {
	finex = arguments[0];
	finey = arguments[1];
	find_tri(vx, vy);
	//post(finex + " " + finey + "\n");
	//find_tri(vx+finex, vy+finey);
}

function draw_now() {
	draw();
}