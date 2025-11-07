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
const selectedHeroes = [];

// ---------- CREATE SVG & BASE GROUP ----------
// SVG Container
const svg = d3.select("svg#radar")
  .attr("width", width)
  .attr("height", height)
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

function drawRadar(series, rawData) {
  // series refers to normalized selected data
  // rawData refers to raw full data

  // Clear old polygons, dots
  g.selectAll(".area, .dot").remove();

  // PART 6: RADAR POLYGONS GENERATOR
  // Create radial line generator for polygons
    // Closed linear curve
    // Radius: scaled value
    // Angle: index * angleSlice
  const radialLine = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .radius(d => r(d.value))
    .angle((_, i) => i * angleSlice);

  series.forEach((s, i) => {
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
      // Mouseover: increase fill opacity to 1 over 150ms
      // Mouseout: decrease fill opacity to 0.3 over 150ms
    g.append("path")
      .attr("class", `area area-${i}`)
      .attr("fill", colors[i % colors.length])
      .attr("fill-opacity", 0.3)
      .attr("stroke", colors[i % colors.length])
      .attr("stroke-width", 1.5)
      .attr("d", radialLine(pts))
      .on("mouseover", () => highlightHero(i, s, rawData))
      .on("mouseout", clearHighlight);

    // PART 8: DATA POINT DOTS
    // Draw data point dots
      // Class: dot
      // Radius: 3
      // Fill color: from colors array
      // Position: translate based on axis angle and scaled value
    g.selectAll(`.dot-${i}`)
      .data(pts)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 7)
      .attr("fill", colors[i % colors.length])
      .attr("transform", d => {
        const a = axes.indexOf(d.axis) * angleSlice;
        return `translate(${Math.cos(a - Math.PI / 2) * r(d.value)},${Math.sin(a - Math.PI / 2) * r(d.value)})`;
      });

    g.selectAll("path.area")
      .on("mouseover", function(event, d) {
        console.log("Hovered polygon:", this);
        d3.select(this)
          .attr("fill-opacity", 1.0) 
          .attr("stroke-width", 30);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .attr("fill-opacity", 0.3)
          .attr("stroke-width", 1.5);
      });
  });
}

function drawLegend(series, rawData) {
  // Clear old legend
  d3.selectAll(".legend-item").remove();
  // Legend Container
  const legend = d3.select("svg#legend-container")
    .attr("transform", "translate(0, 70)")
    .attr("width", 300)
    .attr("height", 800);

  series.forEach((s, i) => {
    // PART 9: LEGEND ITEMS CONTAINER
    // Draw legend item row
      // Position: translate vertically by index * 18
    const row = legend.append("g")
      .attr("class", `legend-item legend-item-${i}`)
      .attr("transform", `translate(0, ${i * 70})`)
      .on("mouseover", () => {
        highlightHero(i, s, rawData)
        g.selectAll("path.area")
          .attr("fill-opacity", 0.05)
          .attr("stroke-width", 1.5);
        g.select(`path.area.area-${i}`)
          .attr("fill-opacity", 1);
      })
      .on("mouseout", clearHighlight);

    // PART 10: LEGEND COLOR SWATCH
    // Draw color swatch rectangle
      // Width: XYZ
      // Height: XYZ
      // Fill color: from colors array
    row.append("rect")
      .attr("width", 35)
      .attr("height", 35)
      .attr("fill", colors[i % colors.length]);

    // PART 11: LEGEND TEXT
    // Draw legend text
      // X position: XYZ
      // Y position: XYZ
      // Font size: 12px
      // Text: hero name and role
    row.append("text")
      .attr("x", 50)
      .attr("y", 20)
      .style("font-size", "20px")
      .style("font-weight", "500")
      .text(`${s.Name} (${s.Role})`);
  });
}

function highlightHero(selected_idx, hero, rawHeroData) {
  // hero refers to normalized selected instance
  // rawHeroData refers to raw full data

  // Dim all
  d3.selectAll("path.area")
    .attr("fill-opacity", 0.05)
    .attr("stroke-width", 1.5);
  // Highlight selected polygon
  d3.select(`path.area.area-${selected_idx}`)
    .attr("fill-opacity", 1);

  // Dim all legend items
  d3.select("#legend-container")
    .selectAll(".legend-item text")
    .style("opacity", 0.3);
  // Bolden the corresponding legend
  d3.select("#legend-container")
    .select(`.legend-item-${selected_idx} text`)
    .style("opacity", 1)
    .style("font-weight", "700");

  // Show hero metrics
  showHeroStats(selected_idx, rawHeroData.find(h => h.Name === hero.Name));
}

function showHeroStats(selected_idx, hero) {
  // hero refers to raw selected instance

  const panel = d3.select("#stats-panel");
  // Show hero name, role, release year, win ratio and all axis values in a table
  // Format:
  // Name (Role)
  // ----------------
  // Axis1      Value1
  // Axis2      Value2
  // ...
  panel.html(`
    <div style="padding:10px; border-left:3px solid #888;">
      <h1 style="margin-bottom:6px; color: ${colors[selected_idx % colors.length]};">
        ${hero.Name} 
        <span style="font-weight:400; color:#${colors[selected_idx % colors.length]};">(${hero.Primary_Role})</span>
      </h1>

      <table style="border-collapse:collapse; font-size:20px;">
        ${axes.map(a => `
          <tr>
            <td style="padding:2px 8px; color:#444;">${a}</td>
            <td style="padding:2px 8px; text-align:right; font-weight:600;">${hero[a]}</td>
          </tr>`).join("")}
      </table>

      <!-- Small gap below table -->
      <div style="height: 10px;"></div>

      <table style="border-collapse:collapse; font-size:20px;">
          <tr>
            <td style="padding:2px 8px; color:${colors[selected_idx % colors.length]};">Win Rate</td>
            <td style="padding:2px 8px; text-align:right; font-weight:600; color:${colors[selected_idx % colors.length]};">${hero.win_ratio
 * 100}%</td>
          </tr>
          <tr>
            <td style="padding:2px 8px; color:#444;">Release Year</td>
            <td style="padding:2px 8px; text-align:right; font-weight:600;">${hero.Release_Year}</td>
          </tr>
      </table>
    </div>
  `);
}

function clearHighlight() {

  g.selectAll("path.area").attr("fill-opacity", 0.3);
  d3.select("#legend-container")
    .selectAll(".legend-item text").
    style("opacity", 1).
    style("font-weight", "500");

  // Clear metrics
  d3.select("#stats-panel").html("");
}

function createHeroSelectors(data, onSelect) {
  // Data refers to normalized data

  const container = d3.select(".search-container");

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

function createResetButton() {
  const container = d3.select(".search-container");

  // Append a reset button
  container.append("button")
    .attr("id", "reset-btn")
    .text("Reset All")
    .on("click", () => {
      d3.selectAll(".hero-select").property("value", "");
      selectedHeroes.length = 0;
      d3.selectAll(".area, .dot").remove();
      d3.selectAll(".legend-item").remove();
      d3.select("#stats-panel").html("");
    });
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
    Release_Year: hero.release_year,
    // ... flattened potentially nested object
    ...Object.fromEntries(axes.map(a => [a, hero[a] / maxValues[a]]))
  }));
}

// ---------- MAIN ----------
(async function init() {
  // Fetch raw data
  const rawData = await fetchJSON("../lib/heroes.json");
  // Get normalized data
  const normalizedData = normalizeData(rawData);
  // Draw radar coordinate system
  drawRadarCoordinate();
  // Create hero selectors with callback to draw radar on selection
  createHeroSelectors(
    normalizedData, 
    (selected) => {
      drawRadar(selected, rawData);
      drawLegend(selected, rawData);
    });

  // Create reset button
  createResetButton();
})();

// Issue 5: Add ability to select multiple heroes to compare on the Radar Chart.
// ----------------------------------------------------------------------------------------------------