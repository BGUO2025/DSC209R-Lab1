import { fetchJSON, renderProjects, fetchGithubData, renderGithubProfile} from './global.js';

// Fetch project data and container Element
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
// Render project element
renderProjects(latestProjects, projectsContainer);

// Fetch Github data
const githubData = await fetchGithubData('StevenG777');
const profileStatsContainer = document.querySelector('#profile-stats')
// Render Github element
renderGithubProfile(githubData, profileStatsContainer);