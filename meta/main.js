import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---------------------------
// Step 1.1: Load CSV & parse
// ---------------------------
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));

  return data;
}

// ---------------------------
// Step 1.2: Process commits
// ---------------------------
function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;

    const commitObj = {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length
    };

     Object.defineProperty(commitObj, 'lines', {
    // Add lines array as hidden property
     value: lines,
      writable: false,
      enumerable: false,
      configurable: false
    });

    return commitObj;
  });
}

// ---------------------------
// Step 1.3: Render summary stats
// ---------------------------
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Total LOC
  dl.append('dt').html('Total line of codes');
  dl.append('dd').text(d3.sum(data, d => d.length));

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  dl.append('dt').text('Total files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  // Longest line
  const longestLine = d3.max(data, d => d.length);
  dl.append('dt').text('Longest line length');
  dl.append('dd').text(longestLine);

  // Maximum depth
  const maxDepth = d3.max(data, d => d.depth);
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(maxDepth);

  // Most active hour
  const workByHour = d3.rollups(
    data,
    v => v.length,
    d => d.datetime.getHours()
  );
  const mostActiveHour = d3.greatest(workByHour, d => d[1])?.[0];
  dl.append('dt').text('Hour of day with most work');
  dl.append('dd').text(mostActiveHour + ':00');

  // Most active day of week
  const workByDay = d3.rollups(
    data,
    v => v.length,
    d => d.datetime.toLocaleString('en', { weekday: 'long' })
  );
  const mostActiveDay = d3.greatest(workByDay, d => d[1])?.[0];
  dl.append('dt').text('Day of week with most work');
  dl.append('dd').text(mostActiveDay);
}

// ---------------------------
// Step 2, 3, 4: Render scatterplot and configure interactive elements
// ---------------------------
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // SVG container
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Radius scale
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Sort commits so small dots are on top
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Color scale by hour (0 = night blue, 12 = day orange)
  const colorScale = d3
    .scaleLinear()
    .domain([0, 12, 24])
    .range(['#1f77b4', '#ff7f0e', '#1f77b4']); // night -> day -> night

  // Gridlines
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Axes
  const xAxis = d3.
    axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(yAxis);

  // Dots
  svg
    .append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => colorScale(d.hourFrac))
    .attr('opacity', 0.8)
    .on('mouseenter', (event, commit) => {
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      updateTooltipVisibility(false);
    });

  
  svg.call(
    d3.brush()
      .on('start brush end', (event) =>
        brushed(event, commits, xScale, yScale)
      )
  );

  // Keep tooltips above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// ---------------------------
// Step 3: Render tooltip and configure interactive elements
// ---------------------------
// Update tooltip content
function renderTooltipContent(commit) {
  if (!commit) return;

  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;

  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString('en', {
    dateStyle: 'full'
  });

  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

// Show/hide tooltip
function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

// Move tooltip near mouse
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`; // small offset
  tooltip.style.top = `${event.clientY + 10}px`;
}

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  // Return true if dot is inside the selection rectangle
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);

  // Count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM
  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function brushed(event, commits, xScale, yScale) {
  const selection = event.selection;

  // Highlight selected dots
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d, xScale, yScale),
  );

  // Update summary info
  renderSelectionCount(selection, commits, xScale, yScale);
  renderLanguageBreakdown(selection, commits, xScale, yScale);
}

// ---------------------------
// Main async function
// ---------------------------
async function main() {
  const data = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
}

main();
