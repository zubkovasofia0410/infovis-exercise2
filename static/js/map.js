let mapWidth = 800;
let mapHeight = 500;
let map = null;
let mapData = null;

const tooltipIndicators = [
    "Access to electricity (% of population)",
    "Agricultural irrigated land (% of total agricultural land)",
    "Average precipitation in depth (mm per year)",
    "Employment in agriculture (% of total employment) (modeled ILO estimate)",
    "GDP per capita (current US$)",
    "Land area (sq. km)",
    "Population, total"
];

function buildTooltip(countryName, countryData) {

    let html = `<strong>${countryName}</strong><br>`;

    tooltipIndicators.forEach(function(indicator) {

        let value = countryData[indicator];

        if (value !== undefined && value !== null && value !== "") {

            html += `
                ${indicator}: ${value}<br>
            `;
        }
    });

    return html;
}

function initDropdown() {
    let columns = Object.keys(data[0]);

    let indicators = columns.filter(function(col) {
        return col !== "Country Name" &&
               col !== "Country Code" &&
               col !== "year";
    });

    selectedIndicator = indicators[0];

    let dropdown = d3.select("#indicator_change");

    dropdown.selectAll("option")
        .data(indicators)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    dropdown.property("value", selectedIndicator);

    dropdown.on("change", function(event) {
    selectedIndicator = event.target.value;

    updateMapColors();

    if (brushedCountries.length > 0) {
        updateLinePlotMultiple(brushedCountries);
    } else if (selectedCountry !== null) {
        updateLinePlot(selectedCountry);
    }
});
}

function updateMapColors() {

    let filteredData = data.filter(function(d) {
        return +d.year === +selectedYear;
    });

    let valueMap = {};

    filteredData.forEach(function(d) {
        valueMap[d["Country Name"]] = +d[selectedIndicator];
    });

    let values = Object.values(valueMap)
        .filter(v => !isNaN(v));

    let colorScale = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(d3.interpolateReds);

    map.transition()
        .duration(500)
        .attr("fill", function(d) {

            let countryName = d.properties.admin;
            let value = valueMap[countryName];

            if (isNaN(value)) {
                return "#dddddd";
            }

            return colorScale(value);
        });
}


function initMap() {

    // loads the world map as topojson
    d3.json("../static/data/world-topo.json").then(function (countries) {

        // defines the map projection method and scales the map within the SVG
        let projection = d3.geoEqualEarth()
            .scale(180)
            .translate([mapWidth / 2, mapHeight / 2]);

        // generates the path coordinates from topojson
        let path = d3.geoPath()
            .projection(projection);

        // configures the SVG element
        let svg = d3.select("#svg_map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        // map geometry
        mapData = topojson.feature(countries, countries.objects.countries).features;

        // generates and styles the SVG path
        map = svg.append("g")
    .selectAll('path')
    .data(mapData)
    .enter()
    .append('path')
    .attr('class', d => "country country-" + cleanName(d.properties.admin))
    .attr('d', path)
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .attr('fill', 'white')
    .on("mouseover", function(event, d) {
        let countryName = d.properties.admin;

        let countryData = data.find(function(row) {
    return row["Country Name"] === countryName && +row.year === +selectedYear;
});

if (countryData) {
    let tooltipText = buildTooltip(countryName, countryData);

    d3.select("#tooltip")
        .style("display", "block")
        .html(tooltipText)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
}

        d3.select(this)
            .attr("stroke-width", 2)
            .attr("stroke", "blue");

        d3.select(".dot-" + cleanName(countryName))
            .attr("r", 9)
            .attr("fill", "orange");
    })
    .on("mouseout", function(event, d) {
        let countryName = d.properties.admin;

        d3.select("#tooltip")
            .style("display", "none");

        d3.select(this)
            .attr("stroke-width", 0.5)
            .attr("stroke", "black");

        d3.select(".dot-" + cleanName(countryName))
            .attr("r", 5)
            .attr("fill", "steelblue");
    })
        .on("click", function(event, d) {

    let countryName = d.properties.admin;

    selectedCountry = countryName;

    updateLinePlot(selectedCountry);
});
        updateMapColors();
    });


}

