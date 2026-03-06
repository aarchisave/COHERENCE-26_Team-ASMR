// ============================================================
// chatbot.js — AI Policy Recommendation Engine (Chat Widget)
// National Budget Flow Intelligence Platform
// ============================================================

window.AIChatbot = (function() {

  let chatWindow, chatMessages, chatInput, chatTrigger;
  let isOpen = false;

  function init() {
    injectHTML();
    bindEvents();
  }

  function injectHTML() {
    const chatHtml = `
      <div id="ai-chat-widget" class="ai-chat-widget">
        <button id="ai-chat-trigger" class="ai-chat-trigger">
          <span class="ai-sparkle">✨</span> AI Policy Advisor
        </button>
        
        <div id="ai-chat-window" class="ai-chat-window">
          <div class="ai-chat-header">
            <div class="ai-chat-title">
              <span class="ai-sparkle">✨</span> Policy Recommendation Engine
            </div>
            <button id="ai-chat-close" class="ai-chat-close">✕</button>
          </div>
          
          <div id="ai-chat-messages" class="ai-chat-messages">
            <div class="ai-msg ai-msg-system">
              Hello! I am your AI Policy Advisor. I continuously analyze the budget pipeline to propose actionable interventions that prevent fund lapsing and mitigate risk.
              <br><br>What would you like me to analyze for FY ${window.State ? window.State.selectedYear : 2024}?
              <div class="ai-suggestions">
                <button class="ai-btn-suggest" data-action="reallocate">Find Reallocation Opportunities</button>
                <button class="ai-btn-suggest" data-action="investigate">Investigate Spending Spikes</button>
                <button class="ai-btn-suggest" data-action="lapse">Identify Fund Lapse Risks</button>
              </div>
            </div>
          </div>
          
          <div class="ai-chat-footer">
            <!-- Simulated Input for realism -->
            <input type="text" id="ai-chat-input" placeholder="Select an action above..." readonly />
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    
    chatWindow = document.getElementById('ai-chat-window');
    chatMessages = document.getElementById('ai-chat-messages');
    chatInput = document.getElementById('ai-chat-input');
    chatTrigger = document.getElementById('ai-chat-trigger');
  }

  function bindEvents() {
    chatTrigger.addEventListener('click', () => {
      isOpen = !isOpen;
      chatWindow.classList.toggle('active', isOpen);
      if (isOpen) scrollToBottom();
    });

    document.getElementById('ai-chat-close').addEventListener('click', () => {
      isOpen = false;
      chatWindow.classList.remove('active');
    });

    // Delegate suggestion clicks
    chatMessages.addEventListener('click', (e) => {
      if (e.target.classList.contains('ai-btn-suggest')) {
        const action = e.target.getAttribute('data-action');
        const text = e.target.textContent;
        handleUserRequest(action, text);
        
        // Hide all suggestions in the parent system message
        const parentSuggestions = e.target.closest('.ai-suggestions');
        if (parentSuggestions) parentSuggestions.style.display = 'none';
      }
    });
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendMessage(sender, htmlContent) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ai-msg-${sender}`;
    msgDiv.innerHTML = htmlContent;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  async function handleUserRequest(action, text) {
    // 1. Show User Message
    appendMessage('user', text);
    chatInput.placeholder = "Generating AI synthesis...";

    // 2. Show Typing Indicator
    const typingId = 'typing-' + Date.now();
    appendMessage('system', `<div id="${typingId}" class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>`);

    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 1200));
    
    // Remove typing indicator
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.parentNode.remove();

    // 3. Generate response based on data
    let responseHtml = '';
    const year = window.State ? window.State.selectedYear : 2024;
    const yearData = window.BudgetData.raw.filter(d => d.year === year);
    
    if (action === 'reallocate') {
      responseHtml = computeReallocation(yearData);
    } else if (action === 'investigate') {
      responseHtml = computeInvestigations(yearData);
    } else if (action === 'lapse') {
      responseHtml = computeLapseRisks(yearData);
    }

    // append new suggestions softly
    responseHtml += `
      <div class="ai-suggestions" style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 10px;">
        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform:uppercase; margin-bottom: 6px; display:block;">Follow-up Analysis</span>
        <button class="ai-btn-suggest" data-action="${action === 'reallocate' ? 'investigate' : 'reallocate'}">Try ${action === 'reallocate' ? 'Investigating Spikes' : 'Reallocation Optimizer'}</button>
      </div>
    `;

    appendMessage('system', responseHtml);
    chatInput.placeholder = "Select an action above...";
  }

  // --- Logic Engines ---
  
  function computeReallocation(data) {
    // Find highest utilizer under allocated vs lowest utilizer
    let depts = {};
    data.forEach(d => {
      let key = d.department + " (" + d.district + ")";
      if (!depts[key]) depts[key] = { alloc: 0, spent: 0, dept: d.department, dist: d.district };
      depts[key].alloc += d.allocated;
      depts[key].spent += d.spent;
    });

    let metrics = Object.values(depts).map(x => ({
      ...x,
      rate: x.alloc > 0 ? (x.spent / x.alloc) : 0,
      balance: x.alloc - x.spent
    }));

    // Most efficient (high rate, needs funds)
    metrics.sort((a, b) => b.rate - a.rate);
    const topPerformers = metrics.filter(m => m.rate > 0.85);
    
    // Least efficient (low rate, holding funds)
    metrics.sort((a, b) => a.rate - b.rate);
    const slowSpenders = metrics.filter(m => m.rate < 0.6 && m.balance > 100);

    if (topPerformers.length > 0 && slowSpenders.length > 0) {
      const source = slowSpenders[0];
      const target = topPerformers[0];
      const transferAmount = Math.round(source.balance * 0.4); // Suggest moving 40% of unused
      
      return `
        <div class="ai-card" style="border-left: 3px solid var(--color-info);">
          <div class="ai-card-title" style="color: var(--color-info);">Active Policy Recommendation</div>
          <div style="font-size:0.85rem; margin-top:8px;">
            <strong>Action:</strong> Reallocate <strong class="mono" style="color:var(--text-primary)">₹${transferAmount.toLocaleString()} Cr</strong> from <strong>${source.dept}</strong> (${source.dist}).
            <br><br>
            <strong>Target:</strong> <strong>${target.dept}</strong> (${target.dist}).
            <br><br>
            <strong>Justification:</strong> The source department is critically under-utilizing funds (${(source.rate*100).toFixed(1)}% rate) risking year-end lapse. The target department operates near maximum capacity (${(target.rate*100).toFixed(1)}% rate) and requires immediate capital injection to sustain public works.
            <br><br>
            <button class="btn btn-sm" style="background:var(--color-info-bg); color:var(--color-info); border:1px solid var(--color-info-border); padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;" onclick="alert('Simulation: Executing draft reallocation memo...')">Draft Reallocation Memo</button>
          </div>
        </div>
      `;
    }
    return 'No significant reallocation differentials detected in the current dataset.';
  }

  function computeInvestigations(data) {
    // Identify departments with spending spikes mapping via AnomalyEngine
    const anomalies = window.AnomalyEngine ? window.AnomalyEngine.getAnomalies() : [];
    const urgent = anomalies.filter(a => a.severity === 'High');

    if (urgent.length > 0) {
      const a = urgent[0]; // grab the highest severity
      return `
        <div class="ai-card" style="border-left: 3px solid var(--color-danger);">
          <div class="ai-card-title" style="color: var(--color-danger);">Audit Investigation Recommended</div>
          <div style="font-size:0.85rem; margin-top:8px;">
            <strong>Trigger:</strong> Sudden spending spike detected in <strong>${a.department}</strong> (${a.district}).
            <br><br>
            <strong>Details:</strong> Spending was flagged during <strong>${a.monthName} ${a.year}</strong>. Expected run-rate was breached by a multiple of <strong style="color:var(--color-danger);">${typeof a.flagReason === 'string' ? a.flagReason.split('(')[1].split('x')[0] : '1.9'}x</strong>.
            <br><br>
            <strong>Policy Action:</strong> I recommend initiating a Level 2 CAG Audit on procurement contracts issued within the 30 days preceding this spike.
            <br><br>
            <button class="btn btn-sm" style="background:var(--color-danger-bg); color:var(--color-danger); border:1px solid var(--color-danger-border); padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;" onclick="alert('Simulation: Flagging for official CAG Audit...')">Flag for Official Audit</button>
          </div>
        </div>
      `;
    }
    return "No urgent, high-severity spending spikes detected requiring immediate investigation.";
  }

  function computeLapseRisks(data) {
    // Find high allocation, low spent, in late quarters
    let depts = {};
    data.forEach(d => {
      let key = d.department + " (" + d.district + ")";
      if (!depts[key]) depts[key] = { alloc: 0, spent: 0, dept: d.department, dist: d.district };
      depts[key].alloc += d.allocated;
      depts[key].spent += d.spent;
    });

    let metrics = Object.values(depts).map(x => ({
      ...x,
      rate: x.alloc > 0 ? (x.spent / x.alloc) : 0,
      balance: x.alloc - x.spent
    }));

    metrics.sort((a, b) => a.rate - b.rate);
    const criticalLapse = metrics.filter(m => m.rate < 0.4 && m.balance > 500); // Super low rate, massive balance

    if (criticalLapse.length > 0) {
      const risk = criticalLapse[0];
      return `
        <div class="ai-card" style="border-left: 3px solid var(--color-warning);">
          <div class="ai-card-title" style="color: var(--color-warning);">Fund Lapse Prevention Notice</div>
          <div style="font-size:0.85rem; margin-top:8px;">
            <strong>Risk Target:</strong> <strong>${risk.dept}</strong> (${risk.dist})
            <br><br>
            <strong>Forecast:</strong> This node is sitting on <strong class="mono" style="color:var(--color-warning);">₹${risk.balance.toLocaleString()} Cr</strong> of unutilized capital with an absorption rate of only ${(risk.rate*100).toFixed(1)}%. It is virtually impossible to expend organically before the fiscal year-end without generating a 'March Rush' spending anomaly.
            <br><br>
            <strong>Policy Action:</strong> Accelerate scheduled procurement phases by waiving Level 3 approvals, or immediately clawback 50% of the untendered balance to the Consolidated Fund.
            <br><br>
            <button class="btn btn-sm" style="background:var(--color-warning-bg); color:var(--color-warning); border:1px solid var(--color-warning-border); padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;" onclick="alert('Simulation: Issuing fast-track procurement override...')">Override Approval Workflow</button>
          </div>
        </div>
      `;
    }

    return "No critical year-end fund lapse scenarios detected. Absorption rates are within safe margins.";
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', () => {
    // Wait for other systems to stand up, then init the chatbot
    setTimeout(() => {
        if(window.AIChatbot) window.AIChatbot.init();
    }, 500);
});
