import { fetchJSON, renderProjects } from '../global.js'

// Fetch data & container element
const projects = await fetchJSON('../lib/projects.json');
const containerElement = document.querySelector('.projects')

// Feed data to create Project Gallery
renderProjects(projects, containerElement);