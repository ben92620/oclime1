// ---------------------------------------------------------------------------
// CONFIG
// The Task-Appointments list below needs a Google Calendar API key to fetch
// live events (the iframe embed doesn't support "max 8" / "hide past events").
//
// To get one:
//   1. Go to https://console.cloud.google.com/apis/library/calendar-json.api
//   2. Enable the "Google Calendar API" for a project.
//   3. Go to APIs & Services > Credentials > Create Credentials > API key.
//   4. Restrict the key: Application restrictions > Websites > add
//      https://oclime.com/* (and https://www.oclime.com/* if used).
//      API restrictions > restrict key to "Google Calendar API".
//   5. Paste the key below.
//
// The calendar itself (benocappraiser@gmail.com) must stay set to
// "Make available to public" for this to work.
// ---------------------------------------------------------------------------
const CALENDAR_CONFIG = {
  calendarId: 'benocappraiser@gmail.com',
  apiKey: 'YOUR_GOOGLE_CALENDAR_API_KEY',
  maxResults: 8,
  timeZone: 'America/Los_Angeles'
};

// --- Live clock --------------------------------------------------------
(function () {
  const timeEl = document.getElementById('js-time');
  const dateEl = document.getElementById('js-date');
  const yearEl = document.getElementById('js-year');

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  function tick() {
    const now = new Date();
    if (timeEl) timeEl.textContent = timeFormatter.format(now);
    if (dateEl) dateEl.textContent = dateFormatter.format(now);
    if (yearEl) yearEl.textContent = now.getFullYear();
  }

  tick();
  setInterval(tick, 1000);
})();

// --- Task-Appointments list --------------------------------------------
(function () {
  const listEl = document.getElementById('task-list');
  if (!listEl) return;

  const eventTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_CONFIG.timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const eventClockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_CONFIG.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  function render(events) {
    listEl.innerHTML = '';

    if (!events || events.length === 0) {
      listEl.innerHTML = '<li class="empty-state">No upcoming appointments.</li>';
      return;
    }

    events.slice(0, CALENDAR_CONFIG.maxResults).forEach(function (ev) {
      const isAllDay = !!ev.start.date;
      const startDate = new Date(ev.start.dateTime || ev.start.date);
      const when = isAllDay
        ? eventTimeFormatter.format(startDate) + ' \u00b7 All day'
        : eventTimeFormatter.format(startDate) + ' \u00b7 ' + eventClockFormatter.format(startDate);

      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML =
        '<span class="task-bullet" aria-hidden="true"></span>' +
        '<span><span class="task-title">' + escapeHtml(ev.summary || 'Untitled appointment') + '</span>' +
        '<div class="task-time">' + escapeHtml(when) + '</div></span>';
      listEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function loadEvents() {
    if (!CALENDAR_CONFIG.apiKey || CALENDAR_CONFIG.apiKey === 'YOUR_GOOGLE_CALENDAR_API_KEY') {
      listEl.innerHTML = '<li class="error-state">Add a Google Calendar API key in script.js to show live appointments here.</li>';
      return;
    }

    const now = new Date().toISOString();
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(CALENDAR_CONFIG.calendarId) + '/events' +
      '?key=' + encodeURIComponent(CALENDAR_CONFIG.apiKey) +
      '&timeMin=' + encodeURIComponent(now) +
      '&maxResults=' + CALENDAR_CONFIG.maxResults +
      '&singleEvents=true' +
      '&orderBy=startTime';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Calendar request failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        render(data.items || []);
      })
      .catch(function () {
        listEl.innerHTML = '<li class="error-state">Couldn\'t load appointments right now.</li>';
      });
  }

  loadEvents();
  // Keep the list fresh without a full page reload.
  setInterval(loadEvents, 5 * 60 * 1000);
})();
