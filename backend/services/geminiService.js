const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Rule-based fallback for when Gemini is hitting quota limits or unavailable.
 */
function computeRuleBasedAnalysis(data, query) {
  const depts = {};
  data.forEach(d => {
    const key = d.ministry;
    if (!depts[key]) depts[key] = { alloc: 0, spent: 0, dept: d.ministry };
    depts[key].alloc += (d.be2324Total || d.be2223Total || 0);
    depts[key].spent += (d.currentSpent || d.actuals2122Total || 0);
  });

  const metrics = Object.values(depts).map(x => ({ 
    ...x, 
    rate: x.alloc > 0 ? x.spent / x.alloc : 0, 
    balance: x.alloc - x.spent 
  }));

  if (query.toLowerCase().includes('reallocate')) {
    metrics.sort((a, b) => b.rate - a.rate);
    const topPerformers = metrics.filter(m => m.rate > 0.85);
    metrics.sort((a, b) => a.rate - b.rate);
    const slowSpenders = metrics.filter(m => m.rate < 0.6 && m.balance > 100);

    if (topPerformers.length > 0 && slowSpenders.length > 0) {
      const source = slowSpenders[0], target = topPerformers[0];
      const amt = Math.round(source.balance * 0.4);
      return `💡 **Policy Recommendation (Fallback Analysis)**\n\nReallocate **₹${amt.toLocaleString()} Cr** from **${source.dept}** → **${target.dept}**.\n\n*Note: This is an automated rule-based analysis as the AI engine is currently over capacity.*`;
    }
  }

  if (query.toLowerCase().includes('lapse')) {
    metrics.sort((a, b) => a.rate - b.rate);
    const critical = metrics.filter(m => m.rate < 0.4 && m.balance > 500);
    if (critical.length > 0) {
      const risk = critical[0];
      return `⚠️ **Fund Lapse Warning (Fallback Analysis)**\n\nRisk: **${risk.dept}**\n\nThis node holds **₹${risk.balance.toLocaleString()} Cr** of unutilized capital at only ${(risk.rate*100).toFixed(1)}% absorption.\n\n*Note: This is an automated rule-based analysis as the AI engine is currently over capacity.*`;
    }
  }

  return `📊 **Budget Summary (Fallback Analysis)**\n\nI encountered an issue connecting to the AI engine (Quota Exceeded). However, my base analysis shows that the overall utilization rate across all ministries is currently **${(metrics.reduce((s, m) => s+m.rate, 0)/metrics.length*100).toFixed(1)}%**.\n\nPlease try again later when the AI quota resets.`;
}

/**
 * Robust AI Analysis with model fallback.
 * @param {Array} data - The budget records for the current year/context.
 * @param {String} query - The user's specific request.
 * @param {String} year - The fiscal year being analyzed.
 * @param {Boolean} isDetailed - Whether to generate a long-form executive report.
 */
async function getAIAnalysis(data, query, year, isDetailed = false) {
  // Ordered list of models to try
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-pro"
  ];

  const summary = data.slice(0, 20).map(d => ({
    ministry: d.ministry,
    scheme: d.scheme,
    allocated: d.be2324Total || d.be2223Total,
    spent: d.currentSpent || d.actuals2122Total,
    utilization: d.utilizationRate || 0
  }));

    const prompt = isDetailed ? `
      You are a Senior Government Budget Consultant.
      Generate a DETAILED EXECUTIVE REPORT based on this budget data for ${year}:
      
      DATA SUMMARY:
      ${JSON.stringify(summary, null, 2)}
      
      REPORT REQUIREMENTS:
      1. EXECUTIVE SUMMARY: High-level overview of fiscal health.
      2. TOP SECTOR PERFORMANCE: Detailed analysis of the top 3 and bottom 3 schemes by utilization.
      3. CRITICAL RISKS: Identify specific fund lapse risks and spending anomalies.
      4. STRATEGIC REALLOCATION: Provide 3-5 concrete, data-backed reallocation moves.
      5. YEAR-END PREDICTIONS: Forecast the final utilization rate.
      
      FORMATTING:
      - Use professional language.
      - Use clear section headers.
      - Use bullet points for readability.
      - Ensure the output is structured for a PDF document.
    ` : `
      You are an expert Government Financial Advisor for the BudgetFlow IQ platform.
      Analyze the following budget data for Fiscal Year ${year}:
      
      DATA SUMMARY (Top 20 Records):
      ${JSON.stringify(summary, null, 2)}
      
      USER REQUEST:
      ${query}
      
      INSTRUCTIONS:
      - If the user asks to "Find Reallocation Opportunities", identify departments with low utilization (<70%) and high remaining balance, and suggest moving funds to high-performing departments (>85% utilization).
      - If the user asks to "Identify Fund Lapse Risks", highlight departments with very low utilization (<40%) and significant unspent funds.
      - For "Investigate Spending Spikes", look for any anomalies.
      - If the user asks a custom question, provide a professional, data-driven response based on the available data.
      - Keep the response concise, professional, and actionable. 
      - Use markdown formatting (bold, bullet points).
      - Do not make up data that is not there.
    `;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Attempting analysis with model: ${modelName}`);
      const apiVersions = ['v1', 'v1beta'];
      
      for (const apiVer of apiVersions) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVer });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          if (text) {
            console.log(`✅ Success with ${modelName} (${apiVer})`);
            return text;
          }
        } catch (innerErr) {
          // If 429, we know it's quota, move to next model quickly
          if (innerErr.message.includes('429')) {
             console.warn(`🛑 Quota hit for ${modelName} (${apiVer})`);
             break; 
          }
          console.warn(`⚠️ Model ${modelName} failed with ${apiVer}: ${innerErr.message}`);
          lastError = innerErr;
        }
      }
    } catch (err) {
      console.error(`❌ Model ${modelName} failed entirely:`, err.message);
      lastError = err;
    }
  }

  console.log("🔄 All models failed. Falling back to rule-based analysis.");
  return computeRuleBasedAnalysis(data, query);
}

module.exports = { getAIAnalysis };

module.exports = { getAIAnalysis };
