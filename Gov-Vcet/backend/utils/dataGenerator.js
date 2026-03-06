const departments = ['Health', 'Education', 'Transport', 'Agriculture', 'Rural Development'];
const districts = ['Mumbai', 'Thane', 'Palghar', 'Nashik', 'Pune'];

const generateBudgetData = (monthCount = 1) => {
  const data = [];

  for (let m = 1; m <= monthCount; m++) {
    for (const district of districts) {
      for (const department of departments) {
        // Base allocated budget: between 10 Cr and 100 Cr (in units of 1)
        // Let's use actual numbers so the frontend formatCurrency (x / 10000000) works seamlessly.
        // So 10 Cr = 100,000,000. 100 Cr = 1,000,000,000.
        const allocatedBudget = Math.floor(Math.random() * (1000000000 - 100000000 + 1)) + 100000000;
        
        // Released budget: between 30% and 100% of allocated
        const releasePercentage = Math.random() * (1 - 0.3) + 0.3;
        const releasedBudget = Math.floor(allocatedBudget * releasePercentage);

        // Spent budget: between 10% and 120% of released (to simulate overspending anomalies)
        const spentPercentage = Math.random() * (1.2 - 0.1) + 0.1;
        const spentBudget = Math.floor(releasedBudget * spentPercentage);

        data.push({
          department,
          district,
          allocatedBudget,
          releasedBudget,
          spentBudget,
          month: `Month ${m}`
        });
      }
    }
  }

  return data;
};

module.exports = {
  generateBudgetData
};
