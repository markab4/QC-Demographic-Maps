$( function() {
    $( "#slider" ).slider({
        value:2007,
        min: 2007,
        max: 2018,
        step: 1,
        slide: function( event, ui ) {
            $( "#amount" ).val( ui.value );
        }
    });
    $( "#amount" ).val($( "#slider" ).slider( "value" ) );
} );

var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Students: </strong><span class='details'>" + format(isNaN(d.students2007) ? 0 : d.students2007) +"</span>";
    });

var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold()
    .domain([0,1,5,10,25,50,100,250,500,1000])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);

var path = d3.geoPath();

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('class', 'map');

var projection = d3.geoMercator()
    .scale(130)
    .translate( [width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
    .defer(d3.json, "world_countries.json")
    // .defer(d3.tsv, "world_students2007.tsv")
    .defer(d3.tsv, "ancestry_by_year.tsv")
    .await(ready);

function ready(error, data, students2007) {
    var countryById = {};
    console.log("data", data, "students2007", students2007);
    students2007.forEach(function(d) { countryById[d.id] = +d.students2007; });
    data.features.forEach(function(d) { d.students2007 = countryById[d.id] });

    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function(d) {
            return countryById[d.id] ? color(countryById[d.id]) : "rgb(247,251,255)";
        })
        .style('stroke', 'white')
        .style('stroke-width', 1.5)
        .style("opacity",0.8)
        // tooltips
        .style("stroke","white")
        .style('stroke-width', 0.3)
        .on('mouseover',function(d){
            tip.show(d);

            d3.select(this)
                .style("opacity", 1)
                .style("stroke","white")
                .style("stroke-width",3);
        })
        .on('mouseout', function(d){
            tip.hide(d);

            d3.select(this)
                .style("opacity", 0.8)
                .style("stroke","white")
                .style("stroke-width",0.3);
        });

    svg.append("path")
        .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
        // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);

    document.getElementsByTagName("svg")[0].classList.add("map-container", "row");
}
