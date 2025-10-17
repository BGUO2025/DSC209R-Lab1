// Testing of JS file connection
console.log('IT’S ALIVE!');

// document.addEventListener('DOMContentLoaded', function () {
// Create Navigation Bar dynamically
// Define the pages for the navigation bar
let pages = [
    { url: 'index.html',                  title: 'HOME' },
    { url: 'contact/index.html',          title: 'CONTACT' },
    { url: 'CV/index.html',               title: 'CURRICULUM VITAE' },
    { url: 'projects/index.html',         title: 'PROJECTS' },
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