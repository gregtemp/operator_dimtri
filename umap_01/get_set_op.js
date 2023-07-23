

var params = [];
var minmax = [];

var paridx_forminmax = 0;

function init() {
    var path = "live_set this_device canonical_parent";
    var parent = new LiveAPI(path);
    var devices = parent.get("devices");
    for (var i = 0; i < devices.length/2; i++) {
        var name = new LiveAPI("id " + devices[i*2+1]);
        if (name.get("class_name") == "Operator"){
            var params_temp = name.get("parameters");
            for (var j = 0; j < params_temp.length; j+=2){
                var idstr = params_temp[j] + " " + params_temp[j+i];
                params.push(idstr);
				var minmaxpar = new LiveAPI(idstr);
        		minmax.push([minmaxpar.get("min"), minmaxpar.get("max")]);
            }
            break;
        }
    }
    get_minmax_slow();
    post(minmax[194][0]);
    post("\n");
    
    //post(parent.get("devices"));
    
    refresh();
}


//   function randomize() {
//     for (var i = 0; i < params.length; i ++){
//         var newparam = 
//     }
//   }