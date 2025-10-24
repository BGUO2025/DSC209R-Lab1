// Create Navigation Bar dynamically
// Define the pages for the navigation bar
let pages = [
    { url: 'index.html',                  title: 'HOME' },
    { url: 'contact/index.html',          title: 'CONTACT' },
    { url: 'CV/index.html',               title: 'CURRICULUM VITAE' },
    { url: 'projects/index.html',         title: 'PROJECTS' },
    { url: 'projects/project2.html',      title: 'PROJECT 2: DECEPTIVE VISUALIZATION'},
    { url: 'https://github.com/BGUO2025', title: 'PROFILE', openInNewTab: true },
];

// Create a <div> element with being a flex container
let div = document.createElement('div');
div.className = 'flex-container';
// Prepend it to the body
document.body.prepend(div);

// Iterate through the pages array in reverse order
for (let p of pages.reverse()) {
    // Create a <nav> element
    let nav = document.createElement('nav');
    // Prepend it to DOM, but this is stack LIFO, so we need to reverse the array first
    div.prepend(nav);

    // Create an <a> element inside the <nav> element
    let a = document.createElement('a');
    // Edit <a> attributes and content
    // - Attribute href --> Home page will have split length of 3 or less, OR if this is the profile page, 
    // We keep it same level, otherwise, we need to go up one level (../)
    a.href = (location.pathname.split('/').length <= 3 || p.openInNewTab) ? p.url: '../' + p.url;
    // - Attribute target --> If openInNewTab is true, then open in new tab, otherwise, open in same tab
    a.target = (p.openInNewTab) ? '_blank' : '_self';
    // - Attribute id --> Find the navigation link that has the same path info as the current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.id = 'selected';
    }
    // - Content --> The title of the page
    a.textContent = p.title;
    // Prepend it to DOM
    nav.prepend(a);
}

// Create light/dark mode Select Menu dynamically
document.body.insertAdjacentHTML(
'afterbegin',
`<!-- Light/Dark Mode Options -->
<label class="color-scheme">
        Theme:
        <select>
            <option value="light dark"> Auto </option>
            <option value="light"> Light </option>
            <option value='dark'> Dark </option>
        </select>
    </label>
    <!-- Navigation Bar -->`,
);

// Display light/dark mode based on Select Menu option
// Get Select Menu element
let select = document.querySelector('label.color-scheme > select');
// Define function to apply color scheme
function applyColorScheme(scheme) {
    // Get input color scheme with either light or dark
    let color_scheme = scheme;
    // If the color scheme is auto
    if (scheme === 'light dark') {
        // Fetch current system color scheme and assume it's dark, or unless it's light
        let preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        color_scheme = preferDark ? 'dark' : 'light';
    }

    // Remove existing theme classes
    document.body.classList.remove('dark-mode', 'light-mode');
    console.log(color_scheme)
    // Add new theme class
    document.body.classList.add(`${color_scheme}-mode`);

    // Change the color scheme and sync up the select menu option
    document.documentElement.style.setProperty('color-scheme', color_scheme);
    return;
}
// If EXIST saved user preference from localStorage
let savedPref = localStorage.getItem("color-scheme-user-preference");
if (savedPref){
    // Apply the saved user preference color scheme
    applyColorScheme(savedPref);
    // Sync up the select menu option with the saved user preference
    // So it does not confuse the user with mismatched option and displayed color scheme
    select.value = savedPref;
}
// If NO saved user preference from localStorage
// Trigger to change theme color when select menu option is changed
select.addEventListener('input', function (event) {
    // Apply the selected color scheme
    applyColorScheme(event.target.value);
    // Save user preference to localStorage
    localStorage.setItem("color-scheme-user-preference", event.target.value);
});

// Refine Form Submission Result
// Get <form> element
const form = document.querySelector('form');
// Only pause the process whenever you submit
form?.addEventListener('submit', (event) => {
    // Stop the form submission continue
    event.preventDefault();

    // Preprocess input
    const email = "b6guo@ucsd.edu";
    const subject = encodeURIComponent(form.subject.value);
    const body = encodeURIComponent(form.body.value);
    const mailtolink = `mailto:${email}?subject=${subject}&body=${body}`;

    // Conifgure where to send email
    window.location.href = mailtolink;
})

// Fetch project data
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    // Check if reponse is valid
    if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // Return the data
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Fetch Github data
export async function fetchGithubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

// Create project gallery dynamically
export function renderProjects(projects, containerElement) {
    // Make sure "projects" to be a valid array
    if(!Array.isArray(projects)) {
        console.log('renderProjects error: "project" must be an array.');
        return;
    }

    // Make sure "containerElement" to be a valid HTMLElement
    if (!(containerElement instanceof HTMLElement)) {
        console.log('renderProject error: "containerElement" must be a DOM element.');
        return;
    }

    // Before dynamical creation, clear previous content
    containerElement.innerHTML = '';

            // Modify <h1> element
    const projectHeaderContainerElement = document.querySelector('.project-header')
    if (!(projectHeaderContainerElement instanceof HTMLElement)) {
        console.log('renderProject error: "h1" must be a DOM element.');
        return;
    }

    projectHeaderContainerElement.innerHTML = (projects.length == 0 || projects.length == 1)? 
        `<h1> ${projects.length} Project </h1>` : 
        `<h1> ${projects.length} Projects </h1>`;

    // Dynamically create project gallery
    projects.forEach((project) => {
        // Make sure "project" is not empty AND "project" to be a valid object
        if (!project || typeof project != 'object') return;

        // Extract data while handling default values
        const title = project.title || 'Untitled Project';
        const image = project.image || 'https://vis-society.github.io/labs/2/images/empty.svg';
        const description = project.description || 'No description available.';

        // Create <article> element
        const article = document.createElement('article');
        article.innerHTML = `
            <h2> ${title} </h2}>
            <img src="${image}" alt=${title}>
            <p> ${description} </p>
        `;

        // Append <article> as child of container element
        containerElement.appendChild(article);
    })
    if (projects.length == 0) {
        containerElement.innerHTML = '<h2> Projects Are Coming Soon! </h2>'
    }
}

// Create project gallery dynamically
export function renderGithubProfile(githubData, containerElement) {
    // Make sure "containerElement" to be a valid HTMLElement
    if (!(containerElement instanceof HTMLElement)) {
        console.log('renderGithubProfile error: "containerElement" must be a DOM element.');
        return;
    }

    // Before dynamical creation, clear previous content
    containerElement.innerHTML = '';

    // Create Github Stats dynamically
    containerElement.innerHTML = `
        <!-- Github Profile title -->
        <h1> Github Profile </h1>

        <!-- Github data attr -->
        <dl id="profile-container">
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>

        <!-- Preserve spaces -->
        <pre>

        
        </pre>
    `;
}