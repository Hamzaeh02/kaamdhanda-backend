// const { CohereClient } = require('cohere-ai');

// const cohere = new CohereClient({
//   token: process.env.COHERE_API_KEY
// });

// // cosine similarity
// function cosineSimilarity(a, b) {
//   const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
//   const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
//   const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
//   return dot / (magA * magB);
// }

// exports.getAiScores = async (cvText, jobText) => {
//   try {
//     // 🔍 DEBUG: PRINT CV TEXT
//     console.log('\n================ CV TEXT START ================');
//     console.log(cvText);
//     console.log('================ CV TEXT END ==================');
//     console.log('CV TEXT LENGTH:', cvText.length);

//     // 🔍 DEBUG: PRINT JOB TEXT
//     console.log('\n================ JOB TEXT START ===============');
//     console.log(jobText);
//     console.log('================ JOB TEXT END =================');
//     console.log('JOB TEXT LENGTH:', jobText.length);

//     const response = await cohere.embed({
//       model: 'embed-english-v3.0',
//       texts: [cvText, jobText],
//       inputType: 'search_document'
//     });

//     const cvEmbedding = response.embeddings[0];
//     const jobEmbedding = response.embeddings[1];

//     const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);

//     // ⚠️ raw cosine is harsh → normalize
//     const normalizedSimilarity = Math.min(
//       1,
//       Math.max(0, (similarity - 0.2) / 0.6)
//     );

//     const jobMatchScore = Math.round(normalizedSimilarity * 100);

//     // CV quality boost using length
//     const lengthBoost = Math.min(cvText.length / 50, 30);
//     const aiCvScore = Math.min(
//       100,
//       Math.round(jobMatchScore * 0.7 + lengthBoost)
//     );

//     let feedback = 'Strong match for this role';
//     if (jobMatchScore < 40) feedback = 'Low relevance to job';
//     else if (jobMatchScore < 65) feedback = 'Moderate match, improve skills alignment';

//     return {
//       aiCvScore,
//       jobMatchScore,
//       feedback
//     };

//   } catch (error) {
//     console.error('[AI SCORING ERROR]', error);

//     return {
//       aiCvScore: 0,
//       jobMatchScore: 0,
//       feedback: 'AI scoring failed'
//     };
//   }
// };


// utils/aiScoring.js

const { CohereClient } = require('cohere-ai');
const stringSimilarity = require('string-similarity');

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

// -----------------------------
// Cosine similarity for embeddings
// -----------------------------
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

// -----------------------------
// ATS-style CV scoring (Professionalism)
// -----------------------------
function calculateAtsScore(cvText) {
  if (!cvText || cvText.length < 50) return 20; // very short CV
  const lengthScore = Math.min(cvText.length / 2000, 1); // longer = better

  // Keyword richness for professional CV
  const keywords = [
    'education', 'experience', 'skills', 'projects', 'certifications', 'achievements', 
    'profile', 'objective', 'summary', 'work', 'internship', 'developer', 'engineer'
  ];

  const keywordScore = stringSimilarity.findBestMatch(
    cvText.toLowerCase(),
    keywords
  ).bestMatch.rating;

  // Normalize to 0-100
  return Math.round(((lengthScore + keywordScore) / 2) * 100);
}

// -----------------------------
// Job match score (semantic match to job description)
// -----------------------------
async function calculateJobMatchScore(cvText, jobText) {
  try {
    if (!cvText || !jobText) return 0;

    const response = await cohere.embed({
      model: 'embed-english-v3.0',
      texts: [cvText, jobText],
      inputType: 'search_document'
    });

    const cvEmbedding = response.embeddings[0];
    const jobEmbedding = response.embeddings[1];

    const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);

    // Normalize similarity for 0-100
    const normalized = Math.min(1, Math.max(0, (similarity - 0.2) / 0.6));
    return Math.round(normalized * 100);

  } catch (err) {
    console.error('[Job Match Score Error]', err.message);
    return 0;
  }
}

// -----------------------------
// Unified AI scoring
// -----------------------------
exports.getAiScores = async (cvText, jobText = '') => {
  const aiCvScore = calculateAtsScore(cvText);
  const jobMatchScore = jobText ? await calculateJobMatchScore(cvText, jobText) : 0;

  let feedback = 'Strong CV';
  if (aiCvScore < 40) feedback = 'CV needs improvement';
  else if (aiCvScore < 65) feedback = 'Moderate CV quality';
  else feedback = 'Professional CV';

  return {
    aiCvScore,
    jobMatchScore,
    feedback
  };
};

