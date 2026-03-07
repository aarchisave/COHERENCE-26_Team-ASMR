import React, { useState, useEffect, useRef } from 'react';
import { askAI } from '../services/api';

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

  async function handleAction(action, label) {
    setMessages(m => [...m, { type: 'user', content: label }]);
    
    // Add a loading message
    const loadingIdx = messages.length + 1;
    setMessages(m => [...m, { type: 'system', content: 'Analyzing budget data...' }]);

    try {
      const res = await askAI({ year, query: label });
      const result = res.data.response;
      
      setMessages(m => {
        const newMessages = [...m];
        newMessages[loadingIdx] = { type: 'system', content: result };
        return newMessages;
      });
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg = err.response?.data?.error || "Failed to fetch analysis from the engine.";
      setMessages(m => {
        const newMessages = [...m];
        newMessages[loadingIdx] = { type: 'system', content: `AI Error: ${errorMsg}` };
        return newMessages;
      });
    }
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
