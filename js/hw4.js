'use strict';

let data = "no data"
let allYearsData = "no data"
let svgScatterPlot = "" 
let funcs = ""

const m = {
    width: 1000,
    height: 700,
    marginAll: 50
}

svgScatterPlot = d3.select('body')
  .append('svg')
  .attr('width', m.width)
  .attr('height', m.height)

d3.csv("./data/dataEveryYear.csv")
  .then((csvData) => {
    data = csvData
    allYearsData = csvData
    funcs = makeAxesAndLabels()
    populateDropdown()
    makeScatterPlot(1960, funcs)
})
.then(() => {
    d3.select('#dropdown').on('change', function() {
        console.log('clicked') 
        let value = parseInt(d3.select(this).property('value'))
        makeScatterPlot(value, funcs)
      })
})


function populateDropdown() {
  let extent = d3.extent(allYearsData.map((row) => row["time"]))
  d3.select('#dropdown').selectAll("option")
    .data(d3.range(extent[0], extent[1], 1))
  .enter().append("option")
    .attr("value", function (d) { return d; })
    .text(function (d) { return d; })
}


function makeAxesAndLabels() {
    const fertilityData = data.map((row) => parseFloat(row["fertility_rate"]))
    const lifeData = data.map((row) => parseFloat(row["life_expectancy"]))
    const limits = findMinMax(fertilityData, lifeData)

    const funcs = drawAxes(limits, "fertility_rate", "life_expectancy", svgScatterPlot, 
        {min: m.marginAll, max: m.width - m.marginAll}, {min: m.marginAll, max: m.height - m.marginAll})
    makeLabels()

    return funcs
}
  

function makeScatterPlot(year, funcs) {
  filterByYear(year)

  plotData(funcs)

  d3.select('#title').remove()
  svgScatterPlot.append('text')
    .attr('x', 50)
    .attr('y', 30)
    .attr('id', "title")
    .style('font-size', '14pt')
    .text("Countries by Life Expectancy and Fertility Rate (" + data[0]["time"] + ")")
}

function filterByYear(year) {
  data = allYearsData.filter((row) => row['time'] == year)
}

function makeLabels() {
  svgScatterPlot.append('text')
    .attr('x', 50)
    .attr('y', 30)
    .attr('id', "title")
    .style('font-size', '14pt')
    .text("Countries by Life Expectancy and Fertility Rate (" + data[0]["time"] + ")")

  svgScatterPlot.append('text')
    .attr('x',400)
    .attr('y', 690)
    .attr('id', "x-label")
    .style('font-size', '10pt')
    .text('Fertility Rates (Avg Children per Woman)')

  svgScatterPlot.append('text')
    .attr('transform', 'translate(15, 400)rotate(-90)')
    .style('font-size', '10pt')
    .text('Life Expectancy (years)')
}

function plotData(map) {
  let pop_data = data.map((row) => +row["pop_mlns"])
  let pop_limits = d3.extent(pop_data)
  let pop_map_func = d3.scaleLinear()
    .domain([pop_limits[0], pop_limits[1]])
    .range([3, 20])

  let xMap = map.x
  let yMap = map.y

  let div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)

  let update = svgScatterPlot.selectAll('circle')
    .data(data)

  update
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .style('stroke', '#025D8C')
      .style('stroke-width', '2')
      .style('fill', "white")
      .style('fill-opacity', 0)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9)
        div.html(d.location + "<br/>" + "Year: " + d["time"] + "<br/>" + "Life Expectancy: " + d['life_expectancy']  + "<br/>" + "Fertility Rate: " + d['fertility_rate'] + "<br/>" + "Population: " + numberWithCommas(d["pop_mlns"]*1000000))
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px")
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0)
      })

  update.exit().remove()

  update.transition().duration(500)
    .attr('cx', xMap)
    .attr('cy', yMap)
    .attr('r',(d) => pop_map_func(d["pop_mlns"]))

}


function drawAxes(limits, x, y, svg, rangeX, rangeY) {
  let xValue = function(d) { return +d[x] }

  let xScale = d3.scaleLinear()
    .domain([limits.xMin, limits.xMax + 0.5]) 
    .range([rangeX.min, rangeX.max])

  let xMap = function(d) { return xScale(xValue(d)) }
  let xAxis = d3.axisBottom().scale(xScale)
  svg.append("g")
    .attr('transform', 'translate(0, ' + rangeY.max + ')')
    .attr('id', "x-axis")
    .call(xAxis)

  let yValue = function(d) { return +d[y]}

  let yScale = d3.scaleLinear()
    .domain([limits.yMax, limits.yMin - 10]) 
    .range([rangeY.min, rangeY.max])

  let yMap = function (d) { return yScale(yValue(d)) }

  let yAxis = d3.axisLeft().scale(yScale)
  svg.append('g')
    .attr('transform', 'translate(' + rangeX.min + ', 0)')
    .attr('id', "y-axis")
    .call(yAxis)

  return {
    x: xMap,
    y: yMap,
    xScale: xScale,
    yScale: yScale
  }
}

function findMinMax(x, y) {

  let xMin = d3.min(x)
  let xMax = d3.max(x)

  let yMin = d3.min(y)
  let yMax = d3.max(y)

  return {
    xMin : xMin,
    xMax : xMax,
    yMin : yMin,
    yMax : yMax
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
