/**
 * SalesCheat Bot — Frontend Application
 * Chat interactions, battle card rendering, and UI state.
 */

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
const state = {
  currentPanel: 'chat',
  isLoading: false,
  sidebarOpen: window.innerWidth > 768
};

// ═══════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════
const $chatMessages = document.getElementById('chat-messages');
const $chatInput = document.getElementById('chat-input');
const $sendBtn = document.getElementById('send-btn');
const $clearChat = document.getElementById('clear-chat');
const $sidebarToggle = document.getElementById('sidebar-toggle');
const $mobileMenu = document.getElementById('mobile-menu');
const $sidebar = document.getElementById('sidebar');
const $templatePanel = document.getElementById('template-panel');

const $aboutPanel = document.getElementById('about-panel');
const $chatInputArea = document.getElementById('chat-input-area');
const $templateList = document.getElementById('template-list');
const $filterSeniority = document.getElementById('filter-seniority');
const $filterIndustry = document.getElementById('filter-industry');

const $navBot = document.getElementById('nav-bot');
const $navTemplates = document.getElementById('nav-templates');

const $navAbout = document.getElementById('nav-about');

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  $sidebar.classList.toggle('collapsed', !state.sidebarOpen);
}

$sidebarToggle.addEventListener('click', toggleSidebar);
$mobileMenu.addEventListener('click', () => {
  state.sidebarOpen = true;
  $sidebar.classList.remove('collapsed');
});

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
function switchPanel(panel) {
  state.currentPanel = panel;

  [$navBot, $navTemplates, $navAbout].forEach(n => n.classList.remove('active'));

  $chatMessages.style.display = 'none';
  $chatInputArea.style.display = 'none';
  $templatePanel.style.display = 'none';

  $aboutPanel.style.display = 'none';

  switch (panel) {
    case 'chat':
      $navBot.classList.add('active');
      $chatMessages.style.display = 'flex';
      $chatInputArea.style.display = 'block';
      break;
    case 'templates':
      $navTemplates.classList.add('active');
      $templatePanel.style.display = 'block';
      loadTemplateLibrary();
      break;

    case 'about':
      $navAbout.classList.add('active');
      $aboutPanel.style.display = 'block';
      break;
  }

  if (window.innerWidth <= 768) {
    state.sidebarOpen = false;
    $sidebar.classList.add('collapsed');
  }
}

$navBot.addEventListener('click', (e) => { e.preventDefault(); switchPanel('chat'); });
$navTemplates.addEventListener('click', (e) => { e.preventDefault(); switchPanel('templates'); });

$navAbout.addEventListener('click', (e) => { e.preventDefault(); switchPanel('about'); });

// ═══════════════════════════════════════════════════════
// CHAT INPUT
// ═══════════════════════════════════════════════════════
$chatInput.addEventListener('input', () => {
  $sendBtn.disabled = $chatInput.value.trim().length === 0;
  $chatInput.style.height = 'auto';
  $chatInput.style.height = Math.min($chatInput.scrollHeight, 110) + 'px';
});

$chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!$sendBtn.disabled) sendMessage();
  }
});

$sendBtn.addEventListener('click', sendMessage);

// ═══════════════════════════════════════════════════════
// EXAMPLES
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.example-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.getAttribute('data-input');
    $chatInput.value = input;
    $chatInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// ═══════════════════════════════════════════════════════
// CLEAR
// ═══════════════════════════════════════════════════════
$clearChat.addEventListener('click', () => {
  const messages = $chatMessages.querySelectorAll('.message:not(.welcome-msg)');
  messages.forEach(m => m.remove());
  showToast('Chat cleared');
});

// ═══════════════════════════════════════════════════════
// SEND
// ═══════════════════════════════════════════════════════
async function sendMessage() {
  const input = $chatInput.value.trim();
  if (!input || state.isLoading) return;

  $chatInput.value = '';
  $chatInput.style.height = 'auto';
  $sendBtn.disabled = true;
  state.isLoading = true;

  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) welcomeMsg.style.display = 'none';

  addMessage('user', input);
  const typingEl = addTypingIndicator();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    const data = await response.json();
    typingEl.remove();

    if (data.success) {
      addBattleCardMessage(data.battleCard, data.matchedTemplates);
    } else {
      addMessage('bot', data.error || 'Something went wrong. Please try again.');
    }
  } catch (error) {
    typingEl.remove();
    addMessage('bot', 'Could not connect to the server. Please check your internet connection or try again later.');
    console.error('[Fetch Error]', error);
  }

  state.isLoading = false;
}

// ═══════════════════════════════════════════════════════
// MESSAGE RENDERING
// ═══════════════════════════════════════════════════════
function addMessage(type, text) {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avatar = type === 'user' ? 'MW' : 'SC';

  const msgEl = document.createElement('div');
  msgEl.className = `message ${type}-message`;
  msgEl.innerHTML = `
    <div class="message-avatar"><span>${avatar}</span></div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(text)}</div>
      <span class="message-time">${now}</span>
    </div>
  `;

  $chatMessages.appendChild(msgEl);
  scrollToBottom();
  return msgEl;
}

function addTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'message bot-message';
  el.innerHTML = `
    <div class="message-avatar"><span>SC</span></div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>
  `;
  $chatMessages.appendChild(el);
  scrollToBottom();
  return el;
}

function addBattleCardMessage(battleCardData, templates) {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const { candidate, battleCard, metadata } = battleCardData;

  const msgEl = document.createElement('div');
  msgEl.className = 'message bot-message';

  const skillsHtml = candidate.skills.length > 0
    ? `<div class="skills-list">${candidate.skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}</div>`
    : '';

  const painPointsHtml = battleCard.painPoints.map(pp => `
    <div class="pain-point">
      <div class="pain-severity ${pp.severity}">${pp.id}</div>
      <div class="pain-text">${escapeHtml(pp.text)}</div>
    </div>
  `).join('');

  const strategy = battleCard.approachStrategy;
  const tipsHtml = strategy.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('');

  const templatesHtml = templates.map((t, i) => `
    <div class="template-card" data-template-id="${t.templateId}">
      <div class="template-card-header" onclick="toggleTemplateCard(this)">
        <span class="template-name">
          ${escapeHtml(t.name)}
          <span class="expand-icon">&#9662;</span>
        </span>
        <div class="template-stats">
          <span class="stat">Score <span class="stat-value">${t.performanceScore}</span>/100</span>
          <span class="stat">Reply <span class="stat-value">${(t.responseRate * 100).toFixed(0)}%</span></span>
          <span class="stat">Match <span class="stat-value">${(t.combinedScore * 100).toFixed(0)}%</span></span>
        </div>
      </div>
      <div class="template-card-body" id="template-body-${i}">
        <div class="template-match-reasons">
          ${t.matchReasons.map(r => `<span class="match-reason">${escapeHtml(r)}</span>`).join('')}
        </div>
        <div class="template-preview">${escapeHtml(t.personalizedText || t.text)}</div>
        <div class="template-actions">
          <button class="template-action-btn" onclick="copyToClipboard(\`${escapeForJs(t.personalizedText || t.text)}\`, this)">
            Copy Message
          </button>
          <button class="template-action-btn" onclick="copyToClipboard(\`${escapeForJs(t.personalizedSubject || t.subject)}\`, this)">
            Copy Subject
          </button>
        </div>
      </div>
    </div>
  `).join('');

  msgEl.innerHTML = `
    <div class="message-avatar"><span>SC</span></div>
    <div class="message-content">
      <div class="message-bubble" style="padding:0; background:none; border:none;">
        <div class="battle-card">
          <div class="battle-card-header">
            <h3>Battle Card</h3>
            <span class="confidence-badge">${metadata.confidenceScore}% confidence</span>
          </div>

          <div class="battle-card-section">
            <div class="section-title">Candidate Profile</div>
            <div class="candidate-facts">
              <div class="fact">
                <span class="fact-label">Name</span>
                <span class="fact-value">${escapeHtml(candidate.name)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Title</span>
                <span class="fact-value">${escapeHtml(candidate.title)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Company</span>
                <span class="fact-value">${escapeHtml(candidate.company)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Seniority</span>
                <span class="fact-value">${escapeHtml(candidate.seniorityLabel)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Industry</span>
                <span class="fact-value">${escapeHtml(candidate.industryLabel)}</span>
              </div>
              ${candidate.yearsExperience ? `
              <div class="fact">
                <span class="fact-label">Experience</span>
                <span class="fact-value">${candidate.yearsExperience}+ years</span>
              </div>` : ''}
            </div>
            ${skillsHtml}
          </div>

          <div class="battle-card-section">
            <div class="section-title">Likely Pain Points</div>
            ${painPointsHtml}
          </div>

          <div class="battle-card-section">
            <div class="section-title">Suggested Hook</div>
            <div class="hook-text">
              ${escapeHtml(battleCard.suggestedHook)}
              <button class="copy-btn" onclick="copyToClipboard(\`${escapeForJs(battleCard.suggestedHook)}\`, this)">Copy</button>
            </div>
          </div>

          <div class="battle-card-section">
            <div class="section-title">Approach Strategy</div>
            <div class="strategy-grid">
              <div class="strategy-item">
                <div class="strategy-label">Tone</div>
                <div class="strategy-value">${escapeHtml(strategy.tone)}</div>
              </div>
              <div class="strategy-item">
                <div class="strategy-label">Best Time</div>
                <div class="strategy-value">${escapeHtml(strategy.timing)}</div>
              </div>
              <div class="strategy-item">
                <div class="strategy-label">Channel</div>
                <div class="strategy-value">${escapeHtml(strategy.channel)}</div>
              </div>
              <div class="strategy-item">
                <div class="strategy-label">Avoid</div>
                <div class="strategy-value">${escapeHtml(strategy.doNot)}</div>
              </div>
            </div>
            <div class="strategy-tips">
              <div class="strategy-label" style="margin-bottom:6px; font-size:0.63rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">Pro Tips</div>
              <ul>${tipsHtml}</ul>
            </div>
          </div>

          <div class="battle-card-section">
            <div class="section-title">Top Matching Templates</div>
            <div class="matched-templates">
              ${templatesHtml}
            </div>
          </div>
        </div>
      </div>
      <span class="message-time">${now}</span>
    </div>
  `;

  $chatMessages.appendChild(msgEl);
  scrollToBottom();
}

// ═══════════════════════════════════════════════════════
// TEMPLATE LIBRARY
// ═══════════════════════════════════════════════════════
async function loadTemplateLibrary() {
  try {
    const seniority = $filterSeniority.value;
    const industry = $filterIndustry.value;

    let url = '/api/templates?';
    if (seniority) url += `seniority=${seniority}&`;
    if (industry) url += `industry=${industry}&`;

    const response = await fetch(url);
    const data = await response.json();

    $templateList.innerHTML = data.templates.map((t, i) => `
      <div class="template-card">
        <div class="template-card-header" onclick="toggleTemplateCard(this)">
          <span class="template-name">
            ${escapeHtml(t.name)}
            <span class="expand-icon">&#9662;</span>
          </span>
          <div class="template-stats">
            <span class="stat">Score <span class="stat-value">${t.performanceScore}</span>/100</span>
            <span class="stat">Reply <span class="stat-value">${(t.responseRate * 100).toFixed(0)}%</span></span>
            <span class="stat">Type <span class="stat-value">${t.category}</span></span>
          </div>
        </div>
        <div class="template-card-body">
          <div class="template-match-reasons">
            ${t.seniority.map(s => `<span class="match-reason">${s}</span>`).join('')}
            ${t.industry.slice(0, 3).map(ind => `<span class="match-reason">${ind}</span>`).join('')}
          </div>
          <div class="template-preview">${escapeHtml(t.text)}</div>
          <div class="template-actions">
            <button class="template-action-btn primary" onclick="copyToClipboard(\`${escapeForJs(t.text)}\`, this)">
              Copy Template
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    $templateList.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 32px;">Could not load templates. Is the server running?</p>';
  }
}

$filterSeniority.addEventListener('change', loadTemplateLibrary);
$filterIndustry.addEventListener('change', loadTemplateLibrary);

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════
function toggleTemplateCard(headerEl) {
  const card = headerEl.closest('.template-card');
  const body = card.querySelector('.template-card-body');
  const icon = card.querySelector('.expand-icon');

  body.classList.toggle('expanded');
  icon.classList.toggle('rotated');
}

function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btnEl.innerHTML;
    btnEl.innerHTML = 'Copied!';
    btnEl.classList.add('copied');
    showToast('Copied to clipboard');
    setTimeout(() => {
      btnEl.innerHTML = original;
      btnEl.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard');
  });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    $chatMessages.scrollTop = $chatMessages.scrollHeight;
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeForJs(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n');
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

// Initialize
switchPanel('chat');
