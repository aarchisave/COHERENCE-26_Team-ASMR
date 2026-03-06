const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/budgetData.json');

// Read budget data
const getBudgetData = () => {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading budget data:', error);
        return [];
    }
};

// Write budget data
const saveBudgetData = (data) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing budget data:', error);
        throw error;
    }
};

module.exports = {
    getBudgetData,
    saveBudgetData
};
