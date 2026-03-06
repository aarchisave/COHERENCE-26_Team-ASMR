// ============================================================
// ingestion.js — Data Ingestion Module (Generic Analysis)
// National Budget Flow Intelligence Platform
// ============================================================

window.DataIngestion = (function() {

  let uploadHistory = []; // Track uploads
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

  /**
   * Parse any generic CSV file. Extracts headers dynamically.
   * Auto-casts numeric values where applicable.
   */
  async function processCSV(fileContent) {
    const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) throw new Error('File is empty.');

    // Simple robust regex for CSV that handles commas inside quotes
    const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    // Parse headers dynamically
    const headers = lines[0].split(csvRegex).map(h => h.replace(/^"|"$/g, '').trim());
    if (headers.length === 0) throw new Error('No column headers detected in CSV.');

    const parsedRecords = [];
    let idCounter = 1;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(csvRegex).map(p => p.replace(/^"|"$/g, '').trim());
      
      // Skip completely empty rows
      if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) continue;

      const record = { _id: idCounter++ };
      
      headers.forEach((h, idx) => {
        let val = parts[idx] !== undefined ? parts[idx] : '';
        
        // Try parsing string as float (removing currency signs / commas typically found in financial data)
        let cleanedNumStr = val.replace(/[\$,₹]/g, '').trim();
        let isOnlyNumbersAndCommas = /^[-+]?[0-9,]*\.?[0-9]+$/.test(cleanedNumStr);
        let numVal = isOnlyNumbersAndCommas ? parseFloat(cleanedNumStr.replace(/,/g, '')) : NaN;

        record[h] = (!isNaN(numVal) && val.trim() !== '') ? numVal : val;
      });

      parsedRecords.push(record);
    }

    return { headers, records: parsedRecords };
  }

  function handleFileUpload(file, onSuccess, onError) {
    const validExt = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
    if (!validExt) {
      onError('Upload requires a CSV file for analytical processing.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError('File exceeds maximum allowed size of 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        
        // Process unconstrained custom CSV
        const { headers, records } = await processCSV(text);

        uploadHistory.push({
          timestamp: new Date(),
          recordCount: records.length,
          status: 'Success'
        });

        onSuccess({
          count: records.length,
          headers: headers,
          records: records,
          preview: records.slice(0, 5) // Return top 5 for preview
        });

      } catch (err) {
        onError(err.message);
      }
    };

    reader.onerror = () => onError('Failed to read file.');
    reader.readAsText(file);
  }

  return {
    uploadHistory,
    handleFileUpload
  };

})();
