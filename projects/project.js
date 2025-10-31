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
    let old_svg = d3.select('svg');
    old_svg.selectAll('*').remove();

    let old_legend = d3.select('ul.legend');
    old_legend.selectAll('*').remove();

    // Create new pie chart
    let new_svg = d3.selectAll('svg')
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
searchInput.addEventListener('input', (event) => {
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