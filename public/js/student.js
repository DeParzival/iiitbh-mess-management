/**
 * Student Dashboard Logic
 * Handles overview, menu display, meal registration, feedback, announcements
 */

// ─── State ───────────────────────────────────────────────
let weeklyMenu = {};
let todayMenu = {};
let currentMealTab = 'breakfast';
let currentMenuTab = 'breakfast';
let myRegistrations = [];
let myFeedbacks = [];
let announcements = [];

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('student')) return;

  setupUser();
  setupNavigation();
  setupSidebarToggle();
  loadDashboardData();
  setupFeedbackForm();
  setupTodayMealTabs();
  setupMenuMealTabs();
});

// ─── User Setup ──────────────────────────────────────────
function setupUser() {
  const user = getUser();
  if (!user) return;

  $('#user-name').textContent = user.name;
  $('#user-avatar').textContent = getInitials(user.name);
  $('#greeting-text').textContent = `${getGreeting()}, ${user.name.split(' ')[0]}! 👋`;

  const today = new Date();
  $('#today-date').textContent = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('#today-day').textContent = getDayName();

  // Set default feedback date to today
  const fbDate = $('#fb-date');
  if (fbDate) fbDate.value = getTodayDate();
}

// ─── Sidebar Navigation ─────────────────────────────────
function setupNavigation() {
  $$('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      // Update active link
      $$('.sidebar-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show the right section
      $$('.dashboard-section').forEach(s => s.style.display = 'none');
      $(`#section-${section}`).style.display = 'block';

      // Close sidebar on mobile
      $('#sidebar').classList.remove('open');
    });
  });
}

function setupSidebarToggle() {
  const toggle = $('#sidebar-toggle');
  const sidebar = $('#sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// ─── Load All Dashboard Data ─────────────────────────────
async function loadDashboardData() {
  try {
    const [menuData, todayData, regData, fbData, annData] = await Promise.all([
      apiFetch('/menu'),
      apiFetch('/menu/today'),
      apiFetch('/meals/my'),
      apiFetch('/feedback/my'),
      apiFetch('/announcements')
    ]);

    weeklyMenu = menuData.menu;
    todayMenu = todayData.menu;
    myRegistrations = regData.registrations;
    myFeedbacks = fbData.feedbacks;
    announcements = annData.announcements;

    renderTodayMeal();
    renderOverviewStats();
    renderOverviewAnnouncements();
    renderWeeklyMenu();
    renderMealRegistration();
    renderRegistrationHistory();
    renderFeedbackHistory();
    renderAnnouncements();
  } catch (error) {
    showToast('Failed to load dashboard data', 'error');
    console.error(error);
  }
}

// ─── Today's Meal Tabs ───────────────────────────────────
function setupTodayMealTabs() {
  $('#today-meal-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.meal-tab');
    if (!tab) return;

    $$('#today-meal-tabs .meal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMealTab = tab.dataset.meal;
    renderTodayMeal();
  });
}

function renderTodayMeal() {
  const container = $('#today-meal-content');
  const meal = todayMenu[currentMealTab];

  if (!meal) {
    container.innerHTML = '<div class="empty-state"><p>No menu data available</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="meal-time" style="margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.85rem;">
      ⏰ ${meal.time}
    </div>
    <div class="menu-items">
      ${meal.items.map(item => `<span class="menu-item-tag">${item}</span>`).join('')}
    </div>
  `;
}

// ─── Overview Stats ──────────────────────────────────────
function renderOverviewStats() {
  const today = getTodayDate();
  const todayRegs = myRegistrations.filter(r => r.date === today && r.status === 'registered');

  $('#stat-meals-today').textContent = todayRegs.length;
  $('#stat-feedbacks').textContent = myFeedbacks.length;
  $('#stat-announcements').textContent = announcements.length;
}

// ─── Overview Announcements ──────────────────────────────
function renderOverviewAnnouncements() {
  const container = $('#overview-announcements');
  const recent = announcements.slice(0, 3);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No announcements yet</p></div>';
    return;
  }

  container.innerHTML = recent.map(ann => `
    <div class="announcement-card priority-${ann.priority}">
      <div class="ann-title">${ann.title}</div>
      <div class="ann-message">${ann.message}</div>
      <div class="ann-meta">${formatDate(ann.createdAt)}</div>
    </div>
  `).join('');
}

// ─── Weekly Menu ─────────────────────────────────────────
function setupMenuMealTabs() {
  $('#menu-meal-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.meal-tab');
    if (!tab) return;

    $$('#menu-meal-tabs .meal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMenuTab = tab.dataset.meal;
    renderWeeklyMenu();
  });
}

function renderWeeklyMenu() {
  const container = $('#menu-grid');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = getDayName();

  container.innerHTML = days.map(day => {
    const dayMenu = weeklyMenu[day];
    if (!dayMenu) return '';

    const meal = dayMenu[currentMenuTab];
    if (!meal) return '';

    const isToday = day === today;

    return `
      <div class="menu-day-card ${isToday ? 'today' : ''} animate-in">
        <div class="day-name">
          ${day}
          ${isToday ? '<span class="today-badge">Today</span>' : ''}
        </div>
        <div class="meal-time">${meal.time}</div>
        <div class="menu-items">
          ${meal.items.map(item => `<span class="menu-item-tag">${item}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ─── Meal Registration ───────────────────────────────────
function renderMealRegistration() {
  const container = $('#meal-registration-list');
  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const mealIcons = { breakfast: '☀️', lunch: '🌤️', snacks: '🍪', dinner: '🌙' };

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  const tomorrowDay = getDayName(tomorrow);

  container.innerHTML = `
    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
      Registering for: <strong style="color: var(--accent-primary);">${tomorrowDay}, ${formatDate(tomorrowDate)}</strong>
    </p>
    ${meals.map(meal => {
      const existing = myRegistrations.find(
        r => r.date === tomorrowDate && r.mealType === meal
      );
      const isRegistered = existing ? existing.status === 'registered' : false;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-card); border-radius: var(--radius-sm); margin-bottom: 0.5rem; border: 1px solid var(--glass-border);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.3rem;">${mealIcons[meal]}</span>
            <div>
              <div style="font-weight: 600; text-transform: capitalize;">${meal}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${weeklyMenu[tomorrowDay] && weeklyMenu[tomorrowDay][meal]
                  ? weeklyMenu[tomorrowDay][meal].time
                  : 'Time N/A'}
              </div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${isRegistered ? 'checked' : ''}
                   onchange="toggleMealRegistration('${tomorrowDate}', '${meal}', this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }).join('')}
  `;
}

async function toggleMealRegistration(date, mealType, isChecked) {
  try {
    const data = await apiFetch('/meals/register', {
      method: 'POST',
      body: {
        date,
        mealType,
        status: isChecked ? 'registered' : 'skipped'
      }
    });

    // Update local state
    const idx = myRegistrations.findIndex(
      r => r.date === date && r.mealType === mealType
    );
    if (idx >= 0) {
      myRegistrations[idx] = data.registration;
    } else {
      myRegistrations.push(data.registration);
    }

    showToast(
      isChecked ? `Registered for ${mealType}` : `Skipped ${mealType}`,
      isChecked ? 'success' : 'info'
    );

    renderOverviewStats();
    renderRegistrationHistory();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderRegistrationHistory() {
  const container = $('#registration-history');

  const sorted = [...myRegistrations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No registrations yet</h3>
        <p>Start registering for meals above</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Meal</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.slice(0, 20).map(reg => `
          <tr>
            <td>${formatDate(reg.date)}</td>
            <td style="text-transform: capitalize;">${reg.mealType}</td>
            <td>
              <span class="badge ${reg.status === 'registered' ? 'badge-success' : 'badge-warning'}">
                ${reg.status === 'registered' ? '✓ Registered' : '✕ Skipped'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ─── Feedback ────────────────────────────────────────────
function setupFeedbackForm() {
  const form = $('#feedback-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mealType = $('#fb-meal-type').value;
    const date = $('#fb-date').value;
    const comment = $('#fb-comment').value.trim();
    const ratingEl = document.querySelector('input[name="rating"]:checked');
    const submitBtn = $('#fb-submit-btn');

    if (!mealType) {
      showToast('Please select a meal type', 'warning');
      return;
    }

    if (!ratingEl) {
      showToast('Please select a rating', 'warning');
      return;
    }

    if (!comment) {
      showToast('Please write a comment', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Submitting...';

    try {
      const data = await apiFetch('/feedback', {
        method: 'POST',
        body: {
          mealType,
          rating: parseInt(ratingEl.value),
          comment,
          date: date || getTodayDate()
        }
      });

      myFeedbacks.push(data.feedback);
      showToast('Feedback submitted successfully!', 'success');

      // Reset form
      form.reset();
      $('#fb-date').value = getTodayDate();
      renderFeedbackHistory();
      renderOverviewStats();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Feedback';
    }
  });
}

function renderFeedbackHistory() {
  const container = $('#feedback-history');

  const sorted = [...myFeedbacks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>No feedback yet</h3>
        <p>Submit your first feedback above</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sorted.map(fb => `
    <div style="padding: 1rem; background: var(--bg-card); border-radius: var(--radius-sm); margin-bottom: 0.75rem; border: 1px solid var(--glass-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="text-transform: capitalize; font-weight: 600;">${fb.mealType}</span>
        ${renderStars(fb.rating)}
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.35rem;">${fb.comment}</p>
      <span style="font-size: 0.7rem; color: var(--text-muted);">${formatDate(fb.date)}</span>
    </div>
  `).join('');
}

// ─── Announcements ───────────────────────────────────────
function renderAnnouncements() {
  const container = $('#announcements-list');

  if (announcements.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📢</div>
        <h3>No announcements</h3>
        <p>Check back later for updates from the mess administration</p>
      </div>
    `;
    return;
  }

  container.innerHTML = announcements.map(ann => `
    <div class="announcement-card priority-${ann.priority} animate-in">
      <div class="ann-title">${ann.title}</div>
      <div class="ann-message">${ann.message}</div>
      <div class="ann-meta">Posted on ${formatDate(ann.createdAt)}</div>
    </div>
  `).join('');
}
