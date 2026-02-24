const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Suppress canvas warnings since we only extract text, not render
process.env.PDFJS_SKIPPED_FEATURES = 'canvas';

const { getDocument } = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Optimized Text Extraction Utility
 * Strictly handles .pdf and .docx
 */
async function extractText(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // 1. Validation: Ensure the file actually exists
    if (!fs.statSync(filePath).isFile()) {
      throw new Error(`Invalid file path provided: ${filePath}`);
    }

    // 2. Processing based on Extension
    if (ext === '.pdf') {
      console.log(`[extractText] Processing PDF: ${path.basename(filePath)}`);
      
      const dataBuffer = fs.readFileSync(filePath);
      const uint8Array = new Uint8Array(dataBuffer);
      const pdf = await getDocument({ data: uint8Array }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      
      console.log('[extractText] PDF extraction successful.');
      return text;
    } 
    
    if (ext === '.docx') {
      console.log(`[extractText] Processing DOCX: ${path.basename(filePath)}`);
      
      const result = await mammoth.extractRawText({ path: filePath });
      
      console.log('[extractText] DOCX extraction successful.');
      return result.value;
    }

    // 3. Rejection: Unsupported formats
    console.warn(`[extractText] Blocked unsupported file type: ${ext}`);
    return '';

  } catch (err) {
    console.error(`[extractText] Critical failure during ${path.extname(filePath)} parsing:`, err.message);
    throw err; // Re-throw so the Controller can handle the error response
  }
}

module.exports = extractText;