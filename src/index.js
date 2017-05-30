import * as d3 from 'd3'
import { contourDensity } from 'd3-contour'
import 'index.html'
import 'style.css'
import 'favicon.ico'
import 'faithful.tsv'
import json from '../giraf.json'
console.log(json)

import { createEmbed, loadStylesheet, onResize} from './GirafEmbed'

const x = d3.scaleLinear()
const y = d3.scaleLinear()

createEmbed(
  'giraf-repo-example',
  (player, app) => {
    loadStylesheet(
      player.directory + 'style.css',
      () => initialize(player.el, player.directory + 'faithful.tsv')
    )
  }
)

function initialize(el, url) {
  d3.tsv(url, function(d) {
    d.eruptions = +d.eruptions;
    d.waiting = +d.waiting;
    return d;
  }, function(error, data) {
    if (error) throw error;
    render(el, data)
    onResize(function() {
      el.innerHTML = ''
      render(el, data)
    })
  })
}

function render(el, data) {
  const { width } = el.getBoundingClientRect()
  const height = width * .66
  var svg = d3.select(el).append("svg").attr("width", width).attr("height", height),
      margin = {top: 20, right: 30, bottom: 30, left: 40};

  x.rangeRound([margin.left, width - margin.right]);
  y.rangeRound([height - margin.bottom, margin.top]);

  x.domain(d3.extent(data, function(d) { return d.waiting; })).nice();
  y.domain(d3.extent(data, function(d) { return d.eruptions; })).nice();

  svg.insert("g", "g")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
    .selectAll("path")
    .data(contourDensity()
        .x(function(d) { return x(d.waiting); })
        .y(function(d) { return y(d.eruptions); })
        .size([width, height])
        .bandwidth(40)
      (data))
    .enter().append("path")
      .attr("d", d3.geoPath());

  svg.append("g")
      .attr("stroke", "white")
    .selectAll("circle")
    .data(data)
    .enter().append("circle")
      .attr("cx", function(d) { return x(d.waiting); })
      .attr("cy", function(d) { return y(d.eruptions); })
      .attr("r", 2);

  svg.append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(d3.axisBottom(x))
    .select(".tick:last-of-type text")
    .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
      .attr("y", -3)
      .attr("dy", null)
      .attr("font-weight", "bold")
      .text("Idle (min.)");

  svg.append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(d3.axisLeft(y))
    .select(".tick:last-of-type text")
    .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
      .attr("x", 3)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Erupting (min.)");
}
