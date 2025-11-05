import { fetchJSON, renderProjects } from '../global.js'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Create Project Gallery dynamically
// Fetch data & container element
const projects = await fetchJSON('../lib/projects.json');
const containerElement = document.querySelector('.projects')

// Track selected slice index
let selectedIndex = null;

// Feed data to create Project Gallery
renderProjects(projects, containerElement, '../');
// ----------------------------------------------------------------------------------------------------

// Create Pie Chart using D3.js
function renderPieChart(projectData){
    // // Define data
    let rolledData = d3.rollups(
        projectData,
        (v) => v.length,
        (d) => d.year,
    );
    // Convert rolledData to acceptable format of raw data
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Create D3 pie path string function & generator converts raw data to angle data per slice
    // Instead of calculating start/end angles mannually
    let sliceGenerator = d3.pie().value(d => d.value);
    let arcData = sliceGenerator(data);

    // Create D3 arc path string function & generator converts angle data to SVG path strings in later step
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

    // Create ordinal scaler that convert categories to discrete color values
    // Instead of manually assigning colors to each slice
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Clear previous pie chart & legend
    let old_svg = d3.select('svg#projects-pie-plot');
    old_svg.selectAll('*').remove();

    let old_legend = d3.select('ul.legend');
    old_legend.selectAll('*').remove();

    // Create new pie chart
    let new_svg = d3.selectAll('svg#projects-pie-plot')
        .html('<!-- D3 Pie Chart -->')
        .selectAll('path.slice')
        .data(arcData)
        .join('path')
        .attr('class', 'slice')
        .attr('d', arcGenerator)
        .attr('fill', (d, i) => colors(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 0);

    // Create new legend 
    let new_legend = d3.select('ul.legend');
    data.forEach((d, idx) => {
        new_legend.append('li')
            .attr('style', `color: ${colors(idx)};`)
            .attr('class', 'legend-item')
            .html(`
                <!-- D3 Pie Chart Legend Items -->
                <span style="background-color: ${colors(idx)};" class="swatch"> </span>
                ${d.label} <em> (${d.value}) </em>
        `)
    });

    const slices = new_svg.selectAll('path.slice');

    slices
        .on('click', (event, d) => {
            // Determine selected index
            let index = arcData.indexOf(d);
            selectedIndex = selectedIndex == index ? null : index;

            console.log('Selected Index:', selectedIndex);
            // Render whole project & pie chart if no selected slice
            if (selectedIndex === -1) {
                renderProjects(projects, containerElement, '../');
                renderPieChart(projects);
            // Otherwise, render filtered version
            } else {
                let selectedYear = data[selectedIndex].year;
                projects.filter(
                    (p) => p.year === selectedYear
                );
                renderProjects(projects, containerElement, '../');
                console.log('Filtered Projects:', projects);
                renderPieChart(projects);
            }
        });
};

// Initial render of pie chart
renderPieChart(projects);
// ----------------------------------------------------------------------------------------------------

// Create Search Bar to filter pie plot
let query = '';
// Create an <input> element
let searchInput = document.querySelector('.searchBar');

// Add event listener to capture user input
searchInput?.addEventListener('input', (event) => {
    // Get user input
    query = event.target.value.toLowerCase();
    console.log('User query:', query);

    // Filter the projects (case-insensitive)
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        console.log(values);
        console.log(values.includes(query));
        return values.includes(query);
    });

    // Re-render the pie chart with filtered data
    console.log('Filtered Projects:', filteredProjects);
    renderProjects(filteredProjects, containerElement, '../');
    renderPieChart(filteredProjects);
});
// ----------------------------------------------------------------------------------------------------

// ---------- CONFIG ----------
const axes = ["Hp", "Hp_Regen", "Mana", "Mana_Regen", "Phy_Damage", "Mag_Defence", "Mov_Speed"];
const levels = 5;
const maxValue = 1;
const width = 640, height = 480, margin = 60;
const radius = Math.min(width, height) / 2 - margin;
const colors = d3.schemeTableau10;

// ---------- SETUP ----------
const svg = d3.select("svg#radar")
  .attr("viewBox", [0, 0, width, height])
  .attr("preserveAspectRatio", "xMidYMid meet");

const g = svg.append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

const angleSlice = (2 * Math.PI) / axes.length;
const r = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);

const radialLine = d3.lineRadial()
  .curve(d3.curveLinearClosed)
  .radius((d) => r(d.value))
  .angle((d, i) => i * angleSlice);

// ---------- DRAW GRID ----------
function drawGrid() {
  for (let lvl = 1; lvl <= levels; lvl++) {
    const t = (lvl / levels) * maxValue;
    const ring = d3.range(axes.length).map(i => [
      Math.cos(i * angleSlice - Math.PI / 2) * r(t),
      Math.sin(i * angleSlice - Math.PI / 2) * r(t)
    ]);
    g.append("path")
      .attr("class", "grid")
      .attr("d", d3.line().curve(d3.curveLinearClosed)(ring));
  }

  // radial tick labels
  g.selectAll(".grid-label")
    .data(d3.range(1, levels + 1))
    .join("text")
    .attr("class", "label")
    .attr("x", 0)
    .attr("y", d => -r((d / levels) * maxValue) - 4)
    .text(d => (d / levels * maxValue).toFixed(2));

  // AXES
  const axis = g.selectAll(".axis")
    .data(axes)
    .join("g")
    .attr("class", "axis")
    .attr("transform", (_, i) => {
      const a = i * angleSlice - Math.PI / 2;
      return `rotate(${a * 180 / Math.PI})`;
    });

  axis.append("line")
    .attr("x1", 0).attr("x2", radius)
    .attr("y1", 0).attr("y2", 0);

  axis.append("text")
    .attr("class", "label")
    .attr("x", d => r(maxValue) + 12)
    .attr("y", 4)
    .attr("transform", (_, i) => {
      const a = i * angleSlice - Math.PI / 2;
      return `rotate(${-(a * 180 / Math.PI)})`;
    })
    .text(d => d);
}

// ---------- DRAW RADAR ----------
function drawRadar(series) {
  g.selectAll(".area, .dot").remove();
  const legend = svg.selectAll(".legend").remove();

  series.forEach((s, idx) => {
    const pts = axes.map(axis => ({ axis, value: s[axis] }));
    g.append("path")
      .attr("class", "area")
      .attr("fill", colors[idx % colors.length])
      .attr("stroke", colors[idx % colors.length])
      .attr("d", radialLine(pts));

    g.selectAll(`.dot-${idx}`)
      .data(pts)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("fill", colors[idx % colors.length])
      .attr("transform", d => {
        const a = axes.indexOf(d.axis) * angleSlice;
        return `translate(${Math.cos(a - Math.PI / 2) * r(d.value)},${Math.sin(a - Math.PI / 2) * r(d.value)})`;
      });
  });

  // LEGEND
  const legendGroup = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin},${margin})`);

  series.forEach((s, i) => {
    const row = legendGroup.append("g").attr("transform", `translate(0, ${i * 18})`);
    row.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", colors[i % colors.length]);
    row.append("text")
      .attr("x", 16)
      .attr("y", 10)
      .style("font-size", "12px")
      .text(s.Name);
  });
}

// ---------- HERO SEARCH ----------
function createHeroSelectors(heroes) {
  const container = document.getElementById("hero-selectors");
  for (let i = 0; i < 5; i++) {
    const select = document.createElement("select");
    select.innerHTML = `<option value="">Select hero ${i + 1}</option>` +
      heroes.map(h => `<option value="${h.Name}">${h.Name}</option>`).join("");
    select.addEventListener("change", () => updateSelections(heroes));
    container.appendChild(select);
  }
}

function updateSelections(heroes) {
  const selects = Array.from(document.querySelectorAll("#hero-selectors select"));
  const selectedNames = selects.map(s => s.value).filter(Boolean);
  const uniqueNames = new Set(selectedNames);

  // Prevent duplicates
  selects.forEach(sel => {
    const current = sel.value;
    Array.from(sel.options).forEach(opt => {
      if (opt.value && opt.value !== current && uniqueNames.has(opt.value)) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });
  });

  // Update chart
  const selectedHeroes = heroes.filter(h => selectedNames.includes(h.Name));
  if (selectedHeroes.length > 0) {
    const normalized = normalizeHeroes(selectedHeroes);
    drawRadar(normalized);
  } else {
    g.selectAll(".area, .dot").remove();
    svg.selectAll(".legend").remove();
  }
}

// ---------- NORMALIZE DATA ----------
function normalizeHeroes(selected) {
  const stats = axes;
  const mins = {}, maxs = {};
  stats.forEach(stat => {
    mins[stat] = d3.min(selected, d => d[stat]);
    maxs[stat] = d3.max(selected, d => d[stat]);
  });

  return selected.map(hero => {
    const normHero = { Name: hero.Name };
    stats.forEach(stat => {
      const val = (hero[stat] - mins[stat]) / (maxs[stat] - mins[stat] || 1);
      normHero[stat] = val;
    });
    return normHero;
  });
}

// ---------- MAIN ----------
(async function init() { 
  const heroes = await fetchJSON("../lib/heroes.json"); // adjust path
  drawGrid();
  createHeroSelectors(heroes);
})();
