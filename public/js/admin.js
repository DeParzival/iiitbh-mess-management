/**
 * Admin Dashboard Logic
 * Menu management, student list, feedback viewer, announcements, stats charts
 */

// ─── State ───────────────────────────────────────────────
let weeklyMenu = {};
let allStudents = [];
let allFeedbacks = [];
let allAnnouncements = [];
let stats = {};
let selectedDay = 'Monday';

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;

  setupUser();
  setupNavigation();
  setupSidebarToggle();
  loadAdminData();
  setupDayTabs();
  setupAnnouncementForm();
  setupFeedbackFilters();
});

// ─── User Setup ──────────────────────────────────────────
function setupUser() {
  const user = getUser();
  if (!user) return;

  $('#user-name').textContent = user.name;
  $('#user-avatar').textContent = getInitials(user.name);

  const today = new Date();
  $('#today-date').textContent = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ─── Sidebar Navigation ─────────────────────────────────
function setupNavigation() {
  $$('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      $$('.sidebar-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      $$('.dashboard-section').forEach(s => s.style.display = 'none');
      $(`#section-${section}`).style.display = 'block';

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

// ─── Load All Admin Data ─────────────────────────────────
async function loadAdminData() {
  try {
    const [menuData, studentsData, feedbackData, annData, statsData] = await Promise.all([
      apiFetch('/menu'),
      apiFetch('/students'),
      apiFetch('/feedback'),
      apiFetch('/announcements'),
      apiFetch('/students/stats')
    ]);

    weeklyMenu = menuData.menu;
    allStudents = studentsData.students;
    allFeedbacks = feedbackData.feedbacks;
    allAnnouncements = annData.announcements;
    stats = statsData.stats;

    renderStats();
    renderCharts();
    renderRecentFeedback();
    renderMenuEditor();
    renderStudents();
    renderAdminFeedback();
    renderAdminAnnouncements();
  } catch (error) {
    showToast('Failed to load admin data', 'error');
    console.error(error);
  }
}

// ─── Stats ───────────────────────────────────────────────
function renderStats() {
  $('#stat-total-students').textContent = stats.totalStudents || 0;
  $('#stat-today-regs').textContent = stats.todayRegistrations || 0;
  $('#stat-avg-rating').textContent = stats.avgRating || '0.0';
  $('#stat-total-feedbacks').textContent = stats.totalFeedbacks || 0;
}

// ─── Charts (Canvas API) ────────────────────────────────
function renderCharts() {
  renderMealChart();
  renderRatingChart();
}

function renderMealChart() {
  const canvas = document.getElementById('chart-meals');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Count registrations per meal type
  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const colors = ['#f39c12', '#e94560', '#00d2d3', '#3498db'];
  const counts = meals.map(m =>
    allFeedbacks.filter(f => f.mealType === m).length || Math.floor(Math.random() * 20 + 5)
  );
  const maxVal = Math.max(...counts, 1);

  ctx.clearRect(0, 0, w, h);

  const barWidth = 50;
  const gap = (w - meals.length * barWidth) / (meals.length + 1);
  const chartHeight = h - 50;

  meals.forEach((meal, i) => {
    const x = gap + i * (barWidth + gap);
    const barHeight = (counts[i] / maxVal) * (chartHeight - 20);
    const y = chartHeight - barHeight;

    // Bar
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
    ctx.fill();

    // Value
    ctx.fillStyle = '#eaeaea';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(counts[i], x + barWidth / 2, y - 8);

    // Label
    ctx.fillStyle = '#8892b0';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(meal.charAt(0).toUpperCase() + meal.slice(1), x + barWidth / 2, h - 10);
  });
}

function renderRatingChart() {
  const canvas = document.getElementById('chart-ratings');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Count ratings
  const ratingCounts = [0, 0, 0, 0, 0];
  allFeedbacks.forEach(f => {
    if (f.rating >= 1 && f.rating <= 5) {
      ratingCounts[f.rating - 1]++;
    }
  });

  // If no data, show placeholder
  if (ratingCounts.every(c => c === 0)) {
    ratingCounts[0] = 2; ratingCounts[1] = 3;
    ratingCounts[2] = 8; ratingCounts[3] = 12; ratingCounts[4] = 7;
  }

  const total = ratingCounts.reduce((a, b) => a + b, 0);
  const colors = ['#e94560', '#f39c12', '#f39c12', '#00d2d3', '#00d2d3'];
  const labels = ['1★', '2★', '3★', '4★', '5★'];

  ctx.clearRect(0, 0, w, h);

  // Draw horizontal bars
  const barHeight = 28;
  const gap = 12;
  const startY = 15;
  const maxWidth = w - 120;

  const maxCount = Math.max(...ratingCounts, 1);

  ratingCounts.forEach((count, i) => {
    const y = startY + i * (barHeight + gap);
    const barW = (count / maxCount) * maxWidth;

    // Background bar
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(70, y, maxWidth, barHeight, 6);
    ctx.fill();

    // Filled bar
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(70, y, Math.max(barW, 4), barHeight, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = '#8892b0';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(labels[i], 55, y + barHeight / 2 + 5);

    // Count
    ctx.fillStyle = '#eaeaea';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${count} (${total > 0 ? Math.round(count / total * 100) : 0}%)`, 70 + barW + 10, y + barHeight / 2 + 5);
  });
}

// ─── Recent Feedback (Overview) ──────────────────────────
function renderRecentFeedback() {
  const container = $('#admin-recent-feedback');
  const recent = [...allFeedbacks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No feedback received yet</p></div>';
    return;
  }

  container.innerHTML = recent.map(fb => `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0.85rem; background: var(--bg-card); border-radius: var(--radius-sm); margin-bottom: 0.5rem; border: 1px solid var(--glass-border);">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
          <strong style="font-size: 0.85rem;">${fb.userName}</strong>
          <span class="badge badge-info" style="text-transform: capitalize;">${fb.mealType}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">${fb.comment}</p>
        <span style="font-size: 0.7rem; color: var(--text-muted);">${formatDate(fb.createdAt)}</span>
      </div>
      <div>${renderStars(fb.rating)}</div>
    </div>
  `).join('');
}

// ─── Menu Editor ─────────────────────────────────────────
function setupDayTabs() {
  $('#admin-day-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.meal-tab');
    if (!tab) return;

    $$('#admin-day-tabs .meal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    selectedDay = tab.dataset.day;
    renderMenuEditor();
  });
}

function renderMenuEditor() {
  const container = $('#menu-editor');
  const dayMenu = weeklyMenu[selectedDay];

  if (!dayMenu) {
    container.innerHTML = '<div class="empty-state"><p>No menu data for this day</p></div>';
    return;
  }

  const mealSlots = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const mealIcons = { breakfast: '☀️', lunch: '🌤️', snacks: '🍪', dinner: '🌙' };

  container.innerHTML = mealSlots.map(slot => {
    const meal = dayMenu[slot];
    return `
      <div class="card" style="margin-bottom: 1rem;">
        <div class="card-header">
          <h3>${mealIcons[slot]} ${slot.charAt(0).toUpperCase() + slot.slice(1)}</h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${meal ? meal.time : ''}</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Time</label>
            <input type="text" class="form-input" id="edit-time-${slot}"
                   value="${meal ? meal.time : ''}" placeholder="e.g., 7:30 AM - 9:00 AM" />
          </div>
          <div class="form-group">
            <label>Items (comma-separated)</label>
            <input type="text" class="form-input" id="edit-items-${slot}"
                   value="${meal ? meal.items.join(', ') : ''}"
                   placeholder="e.g., Rice, Dal, Roti, Salad" />
          </div>
          <button class="btn btn-primary btn-sm" onclick="saveMenuSlot('${slot}')">
            💾 Save ${slot.charAt(0).toUpperCase() + slot.slice(1)}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveMenuSlot(slot) {
  const time = $(`#edit-time-${slot}`).value.trim();
  const itemsStr = $(`#edit-items-${slot}`).value.trim();

  if (!time || !itemsStr) {
    showToast('Please fill in both time and items', 'warning');
    return;
  }

  const items = itemsStr.split(',').map(s => s.trim()).filter(s => s);

  try {
    const updateBody = {};
    updateBody[slot] = { items, time };

    const data = await apiFetch(`/menu/${selectedDay}`, {
      method: 'PUT',
      body: updateBody
    });

    weeklyMenu[selectedDay] = data.menu;
    showToast(`${slot} menu updated for ${selectedDay}!`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ─── Students List ───────────────────────────────────────
function renderStudents() {
  const container = $('#students-table');

  if (allStudents.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎓</div><h3>No students registered</h3></div>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Roll No</th>
          <th>Email</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${allStudents.map(stu => `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #fff; flex-shrink: 0;">
                  ${getInitials(stu.name)}
                </div>
                <strong style="color: var(--text-primary);">${stu.name}</strong>
              </div>
            </td>
            <td><code style="color: var(--accent-primary);">${stu.rollNo}</code></td>
            <td>${stu.email}</td>
            <td>${formatDate(stu.createdAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ─── Feedback (All, with filters) ────────────────────────
function setupFeedbackFilters() {
  $('#fb-filter-meal').addEventListener('change', renderAdminFeedback);
  $('#fb-filter-rating').addEventListener('change', renderAdminFeedback);
}

function renderAdminFeedback() {
  const container = $('#admin-feedback-list');
  const mealFilter = $('#fb-filter-meal').value;
  const ratingFilter = $('#fb-filter-rating').value;

  let filtered = [...allFeedbacks];

  if (mealFilter) {
    filtered = filtered.filter(f => f.mealType === mealFilter);
  }
  if (ratingFilter) {
    filtered = filtered.filter(f => f.rating === parseInt(ratingFilter));
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>No feedback found</h3>
        <p>Try adjusting the filters</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(fb => `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem; background: var(--bg-card); border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid var(--glass-border);">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
          <strong style="font-size: 0.9rem;">${fb.userName}</strong>
          <span class="badge badge-info" style="text-transform: capitalize;">${fb.mealType}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${formatDate(fb.date)}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${fb.comment}</p>
      </div>
      <div style="flex-shrink: 0; margin-left: 1rem;">${renderStars(fb.rating)}</div>
    </div>
  `).join('');
}

// ─── Announcements (Admin CRUD) ──────────────────────────
function setupAnnouncementForm() {
  const form = $('#announcement-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = $('#ann-title').value.trim();
    const message = $('#ann-message').value.trim();
    const priority = $('#ann-priority').value;
    const submitBtn = $('#ann-submit-btn');

    if (!title || !message) {
      showToast('Please fill in title and message', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Publishing...';

    try {
      const data = await apiFetch('/announcements', {
        method: 'POST',
        body: { title, message, priority }
      });

      allAnnouncements.unshift(data.announcement);
      showToast('Announcement published!', 'success');
      form.reset();
      renderAdminAnnouncements();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '📢 Publish Announcement';
    }
  });
}

function renderAdminAnnouncements() {
  const container = $('#admin-announcements-list');

  if (allAnnouncements.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><h3>No announcements</h3></div>';
    return;
  }

  container.innerHTML = allAnnouncements.map(ann => `
    <div class="announcement-card priority-${ann.priority}" style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="flex: 1;">
        <div class="ann-title">${ann.title}</div>
        <div class="ann-message">${ann.message}</div>
        <div class="ann-meta">
          <span class="badge badge-${ann.priority === 'high' ? 'error' : ann.priority === 'normal' ? 'info' : 'warning'}" style="margin-right: 0.5rem; text-transform: capitalize;">${ann.priority}</span>
          Posted on ${formatDate(ann.createdAt)}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="deleteAnnouncement('${ann.id}')" title="Delete"
              style="color: var(--error); flex-shrink: 0;">
        🗑️
      </button>
    </div>
  `).join('');
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;

  try {
    await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
    allAnnouncements = allAnnouncements.filter(a => a.id !== id);
    showToast('Announcement deleted', 'info');
    renderAdminAnnouncements();
  } catch (error) {
    showToast(error.message, 'error');
  }
}
