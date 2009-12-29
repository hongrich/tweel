var Log = {
    elem: false,
    write: function(text){
        if (!this.elem) 
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (350 - this.elem.offsetWidth / 2) + 'px';
    }
};

function addEvent(obj, type, fn) {
    if (obj.addEventListener) obj.addEventListener(type, fn, false);
    else obj.attachEvent('on' + type, fn);
};

var rgraph;
var json = [];

// Load graph with screen_name as the root node
function load(screen_name) {
    $.ajaxSetup({cache: true});
    $.getJSON("http://twitter.com/users/show.json?screen_name="+screen_name+"&callback=?", function(data) {
        json[0] = {};
        json[0]["id"] = data["id"];
        json[0]["name"] = data["screen_name"];
        json[0]["data"] = {"name": data["name"]};
        json[0]["adjacencies"] = [];
        
        init(screen_name);
    });
}

// TODO: only the <100 friends are loaded for each user, use cursor to fix this
function init(screen_name){
    $.getJSON("http://twitter.com/statuses/friends/"+screen_name+".json?callback=?", function(data) {
        for (var i in data) {
            json.push({"id": data[i].id, "name": data[i].screen_name, "data": {"name": data[i].name}, "adjacencies": []});
            json[0]["adjacencies"].push(""+data[i].id);
        }
        //console.log(json);
        
        //load JSON data
        rgraph.loadJSON(json, 0);
        //compute positions and make the first plot
        rgraph.refresh();
    });
    
    var infovis = document.getElementById('infovis');
    var w = infovis.offsetWidth, h = infovis.offsetHeight;
    
    //init canvas
    //Create a new canvas instance.
    var canvas = new Canvas('mycanvas', {
        //Where to append the canvas widget
        'injectInto': 'infovis',
        'width': w,
        'height': h,
        
        //Optional: create a background canvas and plot
        //concentric circles in it.
        'backgroundCanvas': {
            'styles': {
                'strokeStyle': '#555'
            },
            
            'impl': {
                'init': function(){},
                'plot': function(canvas, ctx){
                    var times = 6, d = 150;
                    var pi2 = Math.PI * 2;
                    for (var i = 1; i <= times; i++) {
                        ctx.beginPath();
                        ctx.arc(0, 0, i * d, 0, pi2, true);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
        }
    });
    //end
    //init RGraph
    rgraph = new RGraph(canvas, {
        //Set Node and Edge colors.
        Node: {
            color: '#ccddee'
        },
        
        Edge: {
            color: '#772277'
        },
        levelDistance: 150,
        onBeforeCompute: function(node){
            Log.write("centering @" + node.name + "...");
        },
        
        onAfterCompute: function(){
            Log.write("done");
        },
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = "<span title='" + node.data.name + " (@" + node.name + ")'>" + node.data.name + "</span>";
            domElement.onclick = function(){
                $.getJSON("http://twitter.com/statuses/friends/"+node.name+".json?callback=?", function(data) {
                    for (var i in data) {
                        rgraph.graph.addAdjacence(rgraph.graph.getNode(node.id), {"id": data[i].id, "name": data[i].screen_name, "data": {"name": data[i].name}, "adjacencies": []});
                    }
                    rgraph.onClick(node.id);
                });
            };
        },
        //Change some label dom properties.
        //This method is called each time a label is plotted.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';

            if (node._depth == 0) {
                style.fontSize = "1.0em";
                style.color = "#ccc";
            }else if (node._depth == 1) {
                style.fontSize = "0.7em";
                style.color = "#ccc";
            
            } else if(node._depth == 2){
                style.fontSize = "0.6em";
                style.color = "#494949";
            
            } else {
                style.display = 'none';
            }

            var left = parseInt(style.left, 10);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        }
    });
    
    //end
}

$(document).ready(function() {
    // Submit event listener
    $("#screen_name_form").submit(function() {
        $("#screen_name_form").css("display", "none");
        $("#infovis").css("display", "block");
        load($("#screen_name").val());
    });
    
    // Parse url to get parameters
    var n = $(document).getUrlParam("screen_name");
    if (n) {
        $("#screen_name_form").css("display", "none");
        $("#infovis").css("display", "block");
        load(n);
    }
});