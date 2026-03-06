import React, { useState, useEffect, useRef } from 'react';

const DEPT_COLORS = ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48'];

function fmtCr(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1000) return '₹' + (n / 1000).toFixed(2) + 'K Cr';
  return '₹' + n.toFixed(1) + ' Cr';
}

export default function ChatbotWidget({ yearData, year }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const msgRef = useRef(null);

  useEffect(() => {
    setMessages([{
      type: 'system',
      content: null,
      isIntro: true,
    }]);
  }, [year]);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages]);

  function computeReallocation() {
    if (!yearData?.length) return 'No data available.';
    const depts = {};
    yearData.forEach(d => {
      const key = d.department + ' (' + d.district + ')';
      if (!depts[key]) depts[key] = { alloc: 0, spent: 0, dept: d.department, dist: d.district };
      depts[key].alloc += d.allocated;
      depts[key].spent += d.spent;
    });
    const metrics = Object.values(depts).map(x => ({ ...x, rate: x.alloc > 0 ? x.spent / x.alloc : 0, balance: x.alloc - x.spent }));
    metrics.sort((a, b) => b.rate - a.rate);
    const topPerformers = metrics.filter(m => m.rate > 0.85);
    metrics.sort((a, b) => a.rate - b.rate);
    const slowSpenders = metrics.filter(m => m.rate < 0.6 && m.balance > 100);
    if (topPerformers.length > 0 && slowSpenders.length > 0) {
      const source = slowSpenders[0], target = topPerformers[0];
      const amt = Math.round(source.balance * 0.4);
      return `💡 **Active Policy Recommendation**\n\nReallocate **₹${amt.toLocaleString()} Cr** from **${source.dept}** (${source.dist}) → **${target.dept}** (${target.dist}).\n\nJustification: Source is at ${(source.rate*100).toFixed(1)}% utilization with high lapse risk. Target operates at ${(target.rate*100).toFixed(1)}%, near maximum capacity.`;
    }
    return 'No significant reallocation differentials detected.';
  }

  function computeLapseRisks() {
    if (!yearData?.length) return 'No data available.';
    const depts = {};
    yearData.forEach(d => {
      const key = d.department + ' (' + d.district + ')';
      if (!depts[key]) depts[key] = { alloc: 0, spent: 0, dept: d.department, dist: d.district };
      depts[key].alloc += d.allocated;
      depts[key].spent += d.spent;
    });
    const metrics = Object.values(depts).map(x => ({ ...x, rate: x.alloc > 0 ? x.spent / x.alloc : 0, balance: x.alloc - x.spent }));
    metrics.sort((a, b) => a.rate - b.rate);
    const critical = metrics.filter(m => m.rate < 0.4 && m.balance > 500);
    if (critical.length > 0) {
      const risk = critical[0];
      return `⚠️ **Fund Lapse Prevention Notice**\n\nRisk: **${risk.dept}** (${risk.dist})\n\nThis node holds **₹${risk.balance.toLocaleString()} Cr** of unutilized capital at only ${(risk.rate*100).toFixed(1)}% absorption. Immediate intervention required to prevent year-end lapse.`;
    }
    return 'No critical year-end fund lapse scenarios detected.';
  }

  async function handleAction(action, label) {
    setMessages(m => [...m, { type: 'user', content: label }]);
    await new Promise(r => setTimeout(r, 900));

    let result = '';
    if (action === 'reallocate') result = computeReallocation();
    else if (action === 'lapse') result = computeLapseRisks();
    else result = '📊 Fetching anomaly analysis from the detection engine…\n\nSee the **Anomaly Detection** section for a full statistical breakdown using Z-score analysis across all departments.';

    setMessages(m => [...m, { type: 'system', content: result }]);
  }

  return (
    <div className="ai-chat-widget">
      <button id="ai-chat-trigger" className="ai-chat-trigger" onClick={() => setIsOpen(o => !o)}>
        <span className="ai-sparkle">✨</span> AI Policy Advisor
      </button>

      <div id="ai-chat-window" className={`ai-chat-window${isOpen ? ' active' : ''}`}>
        <div className="ai-chat-header">
          <div className="ai-chat-title"><span className="ai-sparkle">✨</span> Policy Recommendation Engine</div>
          <button id="ai-chat-close" className="ai-chat-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div id="ai-chat-messages" className="ai-chat-messages" ref={msgRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ai-msg-${msg.type}`}>
              {msg.isIntro ? (
                <>
                  Hello! I am your AI Policy Advisor. I continuously analyze the budget pipeline to propose actionable interventions.<br /><br />
                  What would you like me to analyze for FY {year}?
                  <div className="ai-suggestions">
                    <button className="ai-btn-suggest" onClick={() => handleAction('reallocate', 'Find Reallocation Opportunities')}>Find Reallocation Opportunities</button>
                    <button className="ai-btn-suggest" onClick={() => handleAction('investigate', 'Investigate Spending Spikes')}>Investigate Spending Spikes</button>
                    <button className="ai-btn-suggest" onClick={() => handleAction('lapse', 'Identify Fund Lapse Risks')}>Identify Fund Lapse Risks</button>
                  </div>
                </>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          ))}
        </div>

        <div className="ai-chat-footer">
          <input type="text" id="ai-chat-input" placeholder="Select an action above..." readOnly />
        </div>
      </div>
    </div>
  );
}
