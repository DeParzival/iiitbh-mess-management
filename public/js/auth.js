/**
 * Authentication Logic
 * Handles login, register, modal toggling, and particle animation
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavScroll();
  initAuthModals();
  checkExistingSession();
});

// ─── Check Existing Session ──────────────────────────────
function checkExistingSession() {
  if (isLoggedIn()) {
    const user = getUser();
    if (user) {
      redirectToDashboard(user.role);
    }
  }
}

function redirectToDashboard(role) {
  if (role === 'admin') {
    window.location.href = '/admin.html';
  } else {
    window.location.href = '/student.html';
  }
}

// ─── Auth Modals ─────────────────────────────────────────
function initAuthModals() {
  const overlay = $('#auth-modal-overlay');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');

  // Open modal buttons
  $$('[data-auth="login"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showLoginForm();
      overlay.classList.add('active');
    });
  });

  $$('[data-auth="register"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showRegisterForm();
      overlay.classList.add('active');
    });
  });

  // Close modal
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('active');
    }
  });

  // Switch between login & register
  $('#switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  $('#switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });

  // Role selector
  $$('.role-option').forEach(option => {
    option.addEventListener('click', () => {
      $$('.role-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
    });
  });

  // Form submissions
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
}

function showLoginForm() {
  $('#login-section').style.display = 'block';
  $('#register-section').style.display = 'none';
}

function showRegisterForm() {
  $('#login-section').style.display = 'none';
  $('#register-section').style.display = 'block';
}

// ─── Login Handler ───────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();

  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const submitBtn = $('#login-btn');

  if (!email || !password) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  // Show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner"></div> Signing in...';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    setToken(data.token);
    setUser(data.user);

    showToast(`Welcome back, ${data.user.name}!`, 'success');

    // Small delay for UX
    setTimeout(() => {
      redirectToDashboard(data.user.role);
    }, 500);
  } catch (error) {
    showToast(error.message || 'Login failed', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In';
  }
}

// ─── Register Handler ────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();

  const name = $('#reg-name').value.trim();
  const email = $('#reg-email').value.trim();
  const rollNo = $('#reg-roll').value.trim();
  const password = $('#reg-password').value;
  const confirmPassword = $('#reg-confirm-password').value;
  const submitBtn = $('#register-btn');

  if (!name || !email || !rollNo || !password) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'warning');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner"></div> Creating account...';

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password, rollNo }
    });

    setToken(data.token);
    setUser(data.user);

    showToast('Account created successfully!', 'success');

    setTimeout(() => {
      redirectToDashboard(data.user.role);
    }, 500);
  } catch (error) {
    showToast(error.message || 'Registration failed', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Create Account';
  }
}

// ─── Navbar Scroll Effect ────────────────────────────────
function initNavScroll() {
  const navbar = $('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ─── Particle Background Animation ──────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrame;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.4 + 0.1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 69, 96, ${this.opacity})`;
      ctx.fill();
    }
  }

  // Create particles
  const count = Math.min(80, Math.floor(canvas.width * canvas.height / 15000));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(233, 69, 96, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawLines();
    animationFrame = requestAnimationFrame(animate);
  }

  animate();
}
