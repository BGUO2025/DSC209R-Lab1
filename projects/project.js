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

// ---------- CONFIGURATION ----------
const axes = ["Hp", "Hp_Regen", "Mana", "Mana_Regen", "Phy_Damage", "Phy_Defence", "Mag_Defence", "Mov_Speed"];
const levels = 5;
const width = 1000, height = 800, margin = 80;
const radius = Math.min(width, height) / 2 - margin;
const colors = d3.schemeTableau10;
const angleSlice = (2 * Math.PI) / axes.length;
const r = d3.scaleLinear().domain([0, 1]).range([0, radius]);

// ---------- CREATE SVG & BASE GROUP ----------
// SVG Container
const svg = d3.select("svg#radar")
  .attr("width", width)
  .attr("height", height/2)
  .attr("viewBox", [0, 0, width, height])
  .attr("preserveAspectRatio", "xMidYMid meet");
// Plot Container
const g = svg.append("g")
  .attr("class", "plot")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// ---------- FUNCTIONS ----------
function drawRadarCoordinate() {
  // PART 1: ANGLE AXES LINES
  for (let lvl = 1; lvl <= levels; lvl++) {
    // Render the radial grid circles
      // Define radius for each level
    g.append("circle")
      .attr("class", "grid")
      .attr("r", (lvl / levels) * radius)
  }

  // PART 2: AXES CONTAINER
  // Render the axes groups
    // Using raw data: axes names
    // Join with group elements
    // Rotate each group area by angle - 90deg
  const axis = g.selectAll(".axis")
    .data(axes)
    .join("g")
    .attr("class", "axis");

  // PART 3: ANGLE AXES VALUES
  // Render the radial axis labels
    // X position: r(maxValue) + 12 (slightly outside the axis line)
    // Y position: 4 (slightly below the axis line)
    // Rotate each label back by -angle + 90deg to cancel out the group rotation
    // Text: axis name
  axis.append("text")
    .attr("class", "label")
    .attr("x", (_, i) => Math.cos(angleSlice * i - Math.PI / 2) * (radius + 70))
    .attr("y", (_, i) => Math.sin(angleSlice * i - Math.PI / 2) * (radius + 45))
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "500")
    .text(d => d);

  // PART 4: RADIAL AXES LINES
  // Render the radial axis lines
    // Each line starts at (0,0) from the group’s origin
    // Each line ends at (radius, 0) to the outer radius 
    // Coordinate is relative to the rotated group
  axis.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (_, i) => Math.cos(angleSlice * i - Math.PI / 2) * radius)
    .attr("y2", (_, i) => Math.sin(angleSlice * i - Math.PI / 2) * radius)
    .attr("stroke", "#aaa");

  // PART 5: RADIAL AXES VALUES
  // Render the level labels
    // Using raw data: 1, 2, ..., levels
    // Join with text elements
    // X position: 0
    // Y position: -r(scaled value)
    // DY position: -0.4em (slightly above the ring)
    // Text: scaled value to 1 decimal place
  g.selectAll(".grid-label")
    .data(d3.range(1, levels + 1))
    .join("text")
    .attr("class", "label")
    .attr("x", 0)
    .attr("y", d => -r(d / levels))
    .attr("dy", "-0.4em")
    .text(d => (d / levels).toFixed(1));
}

function drawRadar(series) {
  // Clear old polygons, dots, and legend
  g.selectAll(".area, .dot").remove();
  svg.selectAll(".legend").remove();

  // PART 6: RADAR POLYGONS GENERATOR
  // Create radial line generator for polygons
    // Closed linear curve
    // Radius: scaled value
    // Angle: index * angleSlice
  const radialLine = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .radius(d => r(d.value))
    .angle((_, i) => i * angleSlice);

  series.forEach((s, idx) => {
    // Data points for each axis
    // With format: { axis: axis_name, value: scaled_value }
    const pts = axes.map(a => ({ axis: a, value: s[a] }));

    // PART 7: RADAR POLYGONS
    // Draw polygon area
      // Fill color: from colors array
      // Fill opacity: 0.3
      // Stroke color: from colors array
      // Stroke width: 1.5
      // Path data: from radialLine generator
    g.append("path")
      .attr("class", "area")
      .attr("fill", colors[idx % colors.length])
      .attr("fill-opacity", 0.3)
      .attr("stroke", colors[idx % colors.length])
      .attr("stroke-width", 1.5)
      .attr("d", radialLine(pts));

    // PART 8: DATA POINT DOTS
    // Draw data point dots
      // Class: dot
      // Radius: 3
      // Fill color: from colors array
      // Position: translate based on axis angle and scaled value
    g.selectAll(`.dot-${idx}`)
      .data(pts)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 7)
      .attr("fill", colors[idx % colors.length])
      .attr("transform", d => {
        const a = axes.indexOf(d.axis) * angleSlice;
        return `translate(${Math.cos(a - Math.PI / 2) * r(d.value)},${Math.sin(a - Math.PI / 2) * r(d.value)})`;
      });
  });

  // Create legend container
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${-margin * 4}, ${margin})`);

  series.forEach((s, i) => {
    // PART 9: LEGEND ITEMS CONTAINER
    // Draw legend item row
      // Position: translate vertically by index * 18
    const row = legend.append("g").attr("transform", `translate(0, ${i * 40})`);

    // PART 10: LEGEND COLOR SWATCH
    // Draw color swatch rectangle
      // Width: 12
      // Height: 12
      // Fill color: from colors array
    row.append("rect")
      .attr("width", 24)
      .attr("height", 24)
      .attr("fill", colors[i % colors.length]);

    // PART 11: LEGEND TEXT
    // Draw legend text
      // X position: 18 (slightly right of swatch)
      // Y position: 10 (vertically centered with swatch)
      // Font size: 12px
      // Text: hero name and role
    row.append("text")
      .attr("x", 38)
      .attr("y", 20)
      .style("font-size", "25px")
      .style("font-weight", "500")
      .text(`${s.Name} (${s.Role})`);
  });
}

function createHeroSelectors(data, onSelect) {
  const container = d3.select(".search-container");
  const selectedHeroes = [];

  // Create up to 5 dropdowns
  for (let i = 0; i < 5; i++) {
    // Create dropdown menu
    container.append("select")
      .attr("class", "hero-select")
      .attr("id", `hero-${i}`)
      // Add change event listener
        // Create polygon for selected hero
        // Update all dropdowns to prevent duplicates
      .on("change", function () {
        const name = this.value;
        // data.find() to get full data for selected hero
        selectedHeroes[i] = data.find(d => d.Name === name);
        updateDropdowns();
        onSelect(selectedHeroes.filter(Boolean));
      });
  }

  // Build or rebuild all dropdowns
  function updateDropdowns() {
    // Scope only to hero dropdowns
    container.selectAll("select.hero-select").each(function (_, i) {
      // Current dropdown
      const select = d3.select(this);
      // Names of already chosen heroes, chosen has format : [name1, name2, ...]
      const chosen = selectedHeroes.map(h => h?.Name);
      
      // Clear old options
      select.selectAll("option").remove();
      
      // Add placeholder
      select.append("option").text("-- Select Hero --").attr("value", "");

      // Add heroes that are not already chosen elsewhere
      data.forEach(hero => {
        // If not already chosen or is the current selection, add to options
        if (!chosen.includes(hero.Name) || selectedHeroes[i]?.Name === hero.Name) {
          select.append("option")
            .attr("value", hero.Name)
            .text(hero.Name);
        }
      });

      // Keep previous selection
      if (selectedHeroes[i]) {
        select.property("value", selectedHeroes[i].Name);
      }
    });
  }

  // Initialize the dropdown menus once
  updateDropdowns();
}

function normalizeData(data) {
  const maxValues = {};
  // For each axis, find the maximum value across all heroes
  axes.forEach(axis => maxValues[axis] = d3.max(data, d => d[axis]));
  // For each hero, create a normalized object
    // with Name, Role, and normalized axis values
  return data.map(hero => ({
    Name: hero.Name,
    Role: hero.Primary_Role,
    // ... flattened potentially nested object
    ...Object.fromEntries(axes.map(a => [a, hero[a] / maxValues[a]]))
  }));
}

// ---------- MAIN ----------
(async function init() {
  // Fetch raw data
  const data = await fetchJSON("../lib/heroes.json");
  // Get normalized data
  const normalizedData = normalizeData(data);
  // Draw radar coordinate system
  drawRadarCoordinate();
  // Create hero selectors with callback to draw radar on selection
  createHeroSelectors(normalizedData, drawRadar);
})();