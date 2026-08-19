/* ─────────────────────────────────────────────────────────────────────────
   NutriBot Frontend — app.js
   Handles: form steps, validation, API calls, chat demo animation
   ───────────────────────────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:3000/api';

// ─── NAV SCROLL ───────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ─── CHAT DEMO ────────────────────────────────────────────────────────────────
const chatMessages = [
  { type: 'bot', text: 'Hi Ahmed! 👋 What did you have for lunch today?' },
  { type: 'user', text: '2 rotis with chicken karahi and a glass of lassi' },
  { type: 'bot', text: '⏳ Analysing your meal...' },
  { type: 'bot', text: '✅ Logged! That\'s ~650 kcal.\n\n🎯 *Remaining today:*\n• 890 kcal • 48g protein\n\n💡 You\'re a bit low on protein. Try adding some daal or eggs at dinner!' },
  { type: 'user', text: 'today' },
  { type: 'bot', text: '📊 *Today\'s Progress*\n▓▓▓▓▓▓░░░░ 60%\n🔥 1310 / 2200 kcal\n🥩 52g / 100g protein\n💪 Keep going!' },
];

let chatIndex = 0;
const chatBody = document.getElementById('chat-demo');

function appendChatMessage(msg, delay) {
  setTimeout(() => {
    if (!chatBody) return;

    // Remove typing indicator
    const typing = chatBody.querySelector('.chat-typing');
    if (typing) typing.remove();

    const el = document.createElement('div');
    el.className = `chat-msg ${msg.type}`;
    el.style.whiteSpace = 'pre-line';
    el.textContent = msg.text;
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add typing indicator for next bot message
    if (chatIndex < chatMessages.length) {
      const nextMsg = chatMessages[chatIndex];
      if (nextMsg && nextMsg.type === 'bot') {
        setTimeout(() => {
          const typingEl = document.createElement('div');
          typingEl.className = 'chat-typing';
          typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
          chatBody.appendChild(typingEl);
          chatBody.scrollTop = chatBody.scrollHeight;
        }, 300);
      }
    }
  }, delay);
}

function runChatDemo() {
  let delay = 600;
  chatMessages.forEach((msg) => {
    const gap = msg.type === 'bot' ? 1800 : 1200;
    appendChatMessage(msg, delay);
    chatIndex++;
    delay += gap;
  });

  // Restart demo loop
  setTimeout(() => {
    if (!chatBody) return;
    chatBody.innerHTML = '';
    chatIndex = 0;
    runChatDemo();
  }, delay + 3000);
}

// Start chat demo when visible
const chatPreview = document.querySelector('.chat-preview');
if (chatPreview && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      obs.disconnect();
      runChatDemo();
    }
  }, { threshold: 0.3 });
  obs.observe(chatPreview);
} else {
  runChatDemo();
}

// ─── FORM STEPS ───────────────────────────────────────────────────────────────
let currentStep = 1;
const totalSteps = 3;

function updateProgressBar() {
  const bar = document.getElementById('form-progress-bar');
  if (bar) bar.style.width = `${(currentStep / totalSteps) * 100}%`;
}

function showStep(step) {
  for (let i = 1; i <= totalSteps; i++) {
    const el = document.getElementById(`step-${i}`);
    if (el) el.classList.toggle('active', i === step);
  }
  currentStep = step;
  updateProgressBar();

  // Scroll to form
  document.getElementById('profile-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nextStep(from) {
  if (validateStep(from)) showStep(from + 1);
}

function prevStep(from) {
  showStep(from - 1);
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
function setError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.toggle('error', !!message);
  if (error) error.textContent = message || '';
  return !!message;
}

function clearErrors(...errorIds) {
  errorIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function validateStep(step) {
  let hasError = false;

  if (step === 1) {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (setError('name', 'name-error', name.length < 2 ? 'Please enter your full name (at least 2 characters)' : '')) hasError = true;
    if (setError('phone', 'phone-error', !/^\d{7,15}$/.test(phone) ? 'Enter digits only, 7–15 characters (e.g. 923001234567)' : '')) hasError = true;
    if (email && setError('email', 'email-error', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address' : '')) hasError = true;
  }

  if (step === 2) {
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;

    if (setError('age', 'age-error', !age || age < 10 || age > 100 ? 'Age must be between 10 and 100' : '')) hasError = true;
    if (setError('gender', 'gender-error', !gender ? 'Please select your gender' : '')) hasError = true;
    if (setError('weight', 'weight-error', !weight || weight < 20 || weight > 300 ? 'Weight must be between 20 and 300 kg' : '')) hasError = true;
    if (setError('height', 'height-error', !height || height < 100 || height > 250 ? 'Height must be between 100 and 250 cm' : '')) hasError = true;
  }

  if (step === 3) {
    const activity = document.querySelector('input[name="activityLevel"]:checked');
    if (setError(null, 'activity-error', !activity ? 'Please select your activity level' : '')) hasError = true;
  }

  return !hasError;
}

// ─── FORM SUBMISSION ──────────────────────────────────────────────────────────
document.getElementById('profile-form-el').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(3)) return;

  // Build payload
  const form = e.target;
  const activity = document.querySelector('input[name="activityLevel"]:checked');
  const payload = {
    name: form.name.value.trim(),
    phoneNumber: form.phoneNumber.value.trim(),
    email: form.email.value.trim() || undefined,
    age: Number(form.age.value),
    gender: form.gender.value,
    weightKg: Number(form.weightKg.value),
    heightCm: Number(form.heightCm.value),
    activityLevel: activity ? activity.value : '',
    conditions: form.conditions.value.trim() || undefined,
    allergies: form.allergies.value.trim() || undefined,
  };

  // Show loading state
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');
  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  submitSpinner.classList.remove('hidden');

  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    showSuccess(data);
  } catch (err) {
    showError(err.message || 'Could not connect to server. Is the backend running?');
  } finally {
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    submitSpinner.classList.add('hidden');
  }
});

// ─── SUCCESS STATE ────────────────────────────────────────────────────────────
function showSuccess(data) {
  // Hide form, show success
  document.getElementById('profile-form-el').classList.add('hidden');
  document.getElementById('form-progress-bar').style.width = '100%';

  const successEl = document.getElementById('success-state');
  successEl.classList.remove('hidden');

  // Message
  document.getElementById('success-message').textContent = data.message || 'Your nutrition targets are ready!';

  // Targets grid
  const user = data.user;
  const targetsGrid = document.getElementById('targets-grid');
  targetsGrid.innerHTML = `
    <div class="target-item">
      <div class="target-label">Daily Calories</div>
      <div class="target-value" style="color:#14b8a6;">${user.dailyCalorieTarget}</div>
      <div class="target-unit">kcal</div>
    </div>
    <div class="target-item">
      <div class="target-label">Protein</div>
      <div class="target-value" style="color:#3b82f6;">${user.proteinGrams}g</div>
      <div class="target-unit">per day</div>
    </div>
    <div class="target-item">
      <div class="target-label">Carbs</div>
      <div class="target-value" style="color:#f59e0b;">${user.carbsGrams}g</div>
      <div class="target-unit">per day</div>
    </div>
    <div class="target-item">
      <div class="target-label">Fat</div>
      <div class="target-value" style="color:#ef4444;">${user.fatGrams}g</div>
      <div class="target-unit">per day</div>
    </div>
  `;

  // WhatsApp link
  const wpBtn = document.getElementById('whatsapp-btn');
  if (data.whatsappLink) wpBtn.href = data.whatsappLink;

  successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── ERROR STATE ──────────────────────────────────────────────────────────────
function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('profile-form-el').classList.add('hidden');
}

function hideError() {
  document.getElementById('error-state').classList.add('hidden');
  document.getElementById('profile-form-el').classList.remove('hidden');
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetForm() {
  document.getElementById('profile-form-el').reset();
  document.getElementById('success-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
  document.getElementById('profile-form-el').classList.remove('hidden');
  showStep(1);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
updateProgressBar();
