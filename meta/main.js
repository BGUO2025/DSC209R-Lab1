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
// Main async function
// ---------------------------
async function main() {
  const data = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);

  console.log(commits);
}

main();
