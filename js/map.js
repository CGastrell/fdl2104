var width = 480,
		height = $("body").innerHeight();

var projection = d3.geo.azimuthalEqualArea()
		.clipAngle(180 - 1e-3)
		.scale(800)
		.rotate([63,55])
		.translate([width / 2, height / 2])
		.precision(.1);

var continental = {
	rx:62,
	ry:38,
	scale: 1700
}
var bicontinental = projValues = {
	rx:63,
	ry:55,
	scale: 800
}

var path = d3.geo.path()
		.projection(projection);

var graticule = d3.geo.graticule();
var mapDiv = $('#map');
var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height);

svg.append("path")
	.datum(graticule)
	.attr("class", "graticule")
	.attr("d", path);

var provs = svg.insert('g','.graticule');

d3.json("../../provincias_lim_2.json", function(error, world) {
	// console.log(world);
	//aca hay que hacer un each
	var jaumeni = world.objects.provincias_lim.geometries.length;
	var theta = 360 / jaumeni;
	$.each(world.objects.provincias_lim.geometries,function(i,e){
		var angle = theta * i;
		var col = "hsl("+angle+",100%,50%)";
		svg.insert("path",".graticule")
			.datum(topojson.feature(world,e))
			.attr("class", "land provincia")
			// .attr("style","fill:"+col)
			.attr("d", path)
			.attr('data-index',i)
			.on('click', function(){
				var $this = d3.select(this);
				mapDiv.trigger('provinciaclicked',$(this));
				// if($this.classed('selected')) {
				// 	$this.classed('selected',false);
				// }else{
				// 	$this.classed('selected',true);
				// }
			});
	});

	svg.insert("path", ".graticule")
		.datum(topojson.mesh(world, world.objects.provincias_lim, function(a, b) { return a !== b; }))
		.attr("class", "boundary")
		.attr("d", path);
});