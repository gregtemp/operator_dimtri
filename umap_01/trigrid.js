
var trisimps = new Dict();
trisimps.import_json("tri_simplices.json");
var celltosimps = new Dict();
celltosimps.import_json("cell_to_simplices.json");
var operatordata = new Dict();
operatordata.import_json("operatordf.json");



function list()
{
	var found_the_simp = false;
	var myptx = arguments[0];
	var mypty = arguments[1];
	
	
	cell_x = Math.floor(myptx * 25);
    cell_y = Math.floor(mypty * 25);

    cell_str = cell_x.toString() + " " + cell_y.toString();

    var simpamount = celltosimps.get(cell_str).getkeys().length;
	var potentialsimps = celltosimps.get(cell_str).getkeys();
	
    for (var j = 0; j < simpamount; j++){
        if (found_the_simp) break;
		
		if (Array.isArray(potentialsimps)){
			var cornerpts = celltosimps.get(cell_str).get(potentialsimps[j].toString());
		}
		else{
			var cornerpts = celltosimps.get(cell_str).get(potentialsimps.toString());
		}
		
        if (barycentric(cornerpts, myptx, mypty) == 1) {
            found_the_simp = true;
            outlet(0, "data_idx", trisimps.get(j.toString())[0], trisimps.get(j.toString())[1], trisimps.get(j.toString())[2]);
            outlet(0, "draw_tri", cornerpts[0]*2.-1., cornerpts[1]*2.-1., 0., cornerpts[2]*2.-1., cornerpts[3]*2.-1., 0., cornerpts[4]*2.-1., cornerpts[5]*2.-1., 0.);
			break;
        }
    }
	if (found_the_simp == false) {
		post("outside");
		}

}

function barycentric (simpcorners, x, y) {
	
	var x1 = simpcorners[0];
	var y1 = simpcorners[1];
	var x2 = simpcorners[2];
	var y2 = simpcorners[3];
	var x3 = simpcorners[4];
	var y3 = simpcorners[5];

	var den = (y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3);
	var a = ((y2 - y3)*(x - x3) + (x3 - x2)*(y - y3)) / den;
	var b = ((y3 - y1)*(x - x3) + (x1 - x3)*(y - y3)) / den;
	var c = 1. - a - b;

	var is_inside = 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;

	
	if (is_inside == 1) {
		var wx = ((y - y3) * (x2 - x3) - (x - x3) * (y2 - y3)) / ((y1 - y3) * (x2 - x3) - (x1 - x3) * (y2 - y3));
		var wy = ((y - y3) * (x1 - x3) - (x - x3) * (y1 - y3)) / ((y2 - y3) * (x1 - x3) - (x2 - x3) * (y1 - y3));
		var wz = 1 - wx - wy;
		outlet(0, "weights", wx, wy, wz);
	}

	return is_inside;
}

function get_simp_points(key, idx)
{
	//post(key + " " + idx + "\n");
	var corners = [
		cellsimps.get(key).get(idx)[0]*2.-1., cellsimps.get(key).get(idx)[1]*2.-1., 0.,
		cellsimps.get(key).get(idx)[2]*2.-1., cellsimps.get(key).get(idx)[3]*2.-1., 0.,
		cellsimps.get(key).get(idx)[4]*2.-1., cellsimps.get(key).get(idx)[5]*2.-1., 0.
				];
	
	outlet(0, "draw_simp" + corners.toString());
}