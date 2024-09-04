var centroids = [], processedData;
    for (let i = 0; i <= 100; i++) {
        var x = Math.floor(Math.random() * 100);
        var y = Math.floor(Math.random() * 100);
        centroids.push([x, y]);
    }
var color = d3.scaleOrdinal().domain(['Astrometry', 'Direct Imaging', 'Disk Kinematics', 'Eclipse Timing Variations', 'Gravitational Microlensing', 'Orbital Brightness Modulation',
                                         'Pulsar Timing', 'Pulsation Timing Variations', 'Radial Velocity', 'Transit'])
    .range(['#FFFFFF', '#FFFF00', '#00FFFF', '#FF0000', '#00FF00', '#FFA500', '#800080', '#FFD700', '#40E0D0', '#0000FF']);
//    .range(d3.schemeSet2);

document.addEventListener("DOMContentLoaded", function () {
    exoplanets = d3.select("#exoplanets");
    starsHeight = exoplanets.style("height").replace("px", "");
    starsWidth = exoplanets.style("width").replace("px", "");

    exoplanets
    .selectAll("path")
    .data(centroids)
    .join("path")
    .attr("d", d3.symbol().type(d3.symbolStar).size(20))
    .attr("fill", "white")
    .attr("opacity", 0)
    .attr("transform", d => `translate(${d[0]*starsWidth/100},${d[1]*starsHeight/100})`)
    .attr("class", "star")

    starsOn();

    Promise.all([d3.csv('static/exoplanets.csv')])
        .then(function (values) {
            wrangleData(values[0]);

        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        mouseover = function(event, d) {
            console.log(d)
            tooltip
                .style("left", event.x + "px")
                .style("top", event.y + "px")
             tooltip.transition().duration(200).style("opacity", 1);
             tooltip.html("Name: "+d.name+"</br>"
                +"Detection-Method: "+d.detection_method+"<br/>"
                +"Discovery-Year: "+d.discovery_year+"<br/>"
                +"Distance(LY): "+d.distance+"<br/>"
                +"Planet-Type: "+d.planet_type+"<br/>"
                +"Stellar-Magnitude: "+d.stellar_magnitude+"<br/>"
                +"Orbital-Period: "+d.orbital_period+"<br/>"
                +"Orbital-Radius: "+d.orbital_radius+"<br/>")
            }

        mousemove = function(event) {
            tooltip
            .style("left", event.x + "px")
            .style("top", event.y + "px")
            }

        mouseout = function() {
             tooltip.transition().duration(200).style("opacity", 0);
            }
            });
})

function starsOn() {
    exoplanets.selectAll('.star')
    .transition().duration(800)
    .delay(function(d,i){ return i * 8 })
    .attr("opacity", "0.6")
    .on("end", starsOff)
}

function starsOff() {
    exoplanets.selectAll('.star')
    .transition().duration(800)
    .delay(function(d,i){ return i * 8 })
    .attr("opacity", "0.1")
    .on("end", starsOn)
}

function setProcessedData(response) {
    processedData = response;
    drawParallelCoordChart();
}

function wrangleData(exoplanets) {
    $.ajax({
                    url: '/processData',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ exoplanets }),
                    success: function(response) {
                        setProcessedData(JSON.parse(response));
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
}

function drawParallelCoordChart() {
    const margin = {top:100, left:50, bottom:70, right:70};
    parallelChart = d3.select("#parallelChart_svg");
    parallelChartHeight = d3.select("#parallelChart").style("height").replace("px", "");
    parallelChartWidth = d3.select("#parallelChart").style("width").replace("px", "");

    var keys = ['discovery_year', 'distance', 'planet_type', 'stellar_magnitude', 'orbital_period', 'orbital_radius']
    var yAxes = new Map();

    yAxes.set('discovery_year', d3.scaleTime()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain([new Date(1992, 0, 1), new Date(2023, 0, 1)]))

    yAxes.set('planet_type', d3.scalePoint()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain(['Gas Giant', 'Neptune-like', 'Super Earth', 'Terrestrial', 'Unknown']))

    yAxes.set('stellar_magnitude', d3.scaleLinear()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain(d3.extent(processedData.map(x => x.stellar_magnitude))))

    yAxes.set('orbital_period', d3.scaleLinear()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain(d3.extent(processedData.map(x => x.orbital_period))))

    yAxes.set('orbital_radius', d3.scaleLinear()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain(d3.extent(processedData.map(x => x.orbital_radius))))

    yAxes.set('distance', d3.scaleLinear()
    .range([0, parallelChartHeight-margin.bottom-margin.top])
    .domain(d3.extent(processedData.map(x => x.distance))))

    const xAxis = d3.scalePoint()
    .range([margin.left, parallelChartWidth-margin.right])
    .domain(keys)

    const line = d3.line()
    .defined(([, value]) => value != null)
    .x(([key]) => xAxis(key))
    .y(([key, value]) => key=='discovery_year'?yAxes.get(key)(new Date(value, 0, 1))+70:yAxes.get(key)(value)+70);

    parallelChart.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 1)
    .selectAll("path")
    .data(processedData)
    .join("path")
    .attr("stroke", function(d) {return color(d.detection_method);})
    .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
    .on("mouseover", _.debounce(mouseover, 300))
    .on("mousemove", mousemove)
    .on("mouseout", mouseout)

    parallelChart.append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
    .attr("class", "axisWhite")
    .attr("transform", (d,i) => `translate(${xAxis(d)}, 70)`)
    .each(function(d) { d3.select(this).call(d3.axisLeft(yAxes.get(d))); })
    .call(g => g.append("text")
    .attr("x", 10)
    .attr("y", margin.top-140)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font", "14px times")
    .attr("transform", "rotate(-25)")
    .text(d => d))
    .call(g => g.selectAll("text")
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke-width", 5)
    .attr("stroke-linejoin", "round")
    .attr("stroke", "red"));

    var xstart = 15, len = 130, detection_methods = ['Astrometry', 'Direct Imaging', 'Disk Kinematics', 'Eclipse Timing Variations', 'Gravitational Microlensing', 'Orbital Brightness Modulation',
    'Pulsar Timing', 'Pulsation Timing Variations', 'Radial Velocity', 'Transit']
    detection_methods.forEach((element) => {
        console.log(element);
        d3.select("#legend").append("line").attr("x1",xstart).attr("y1",15).attr("x2", xstart+=len).attr("y2",15).attr("stroke", color(element))
    })
    d3.select("#legend").append("text").attr("x", 80).attr("y", 10).text("Detection Methods").style("font-size", "15px").style("text-anchor", "middle").attr("stroke", "red")
    var xstart = -50, len = 130;
    detection_methods.forEach((element) => {
        d3.select("#legend").append("text").attr("x", xstart+=len).attr("y", 30).text(element).style("font-size", "8px").style("text-anchor", "middle").attr("stroke", color(element))
    })

}