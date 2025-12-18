const Tour = require('../models/Tour');
const Destination = require('../models/Destination');
const Activity = require('../models/Activity');
const KnowledgeBase = require('../models/KnowledgeBase');

// Simple in-memory caches
let destinationsCache = null;
let destinationsCacheTs = 0;
const DEST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[00-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

// Lightweight alias map for common region grouping
const DESTINATION_ALIASES = {
  'an giang': 'ĐBSCL - Cần Thơ',
  'angiang': 'ĐBSCL - Cần Thơ',
  'ca mau': 'ĐBSCL - Cần Thơ',
  'phu quoc': 'Phú Quốc',
  'phú quốc': 'Phú Quốc',
  'da lat': 'Đà Lạt',
  'đà lạt': 'Đà Lạt',
  'sapa': 'Sapa',
  'ho chi minh': 'TP. Hồ Chí Minh',
  'hcm': 'TP. Hồ Chí Minh',
  'hn': 'Hà Nội',
  'ha noi': 'Hà Nội',
  'moi': 'Tây Nguyên'
};

async function loadDestinations() {
  const now = Date.now();
  if (destinationsCache && now - destinationsCacheTs < DEST_CACHE_TTL) return destinationsCache;
  try {
    const docs = await Destination.find({}).select('name slug').lean();
    destinationsCache = docs.map((d) => ({
      name: d.name,
      slug: d.slug || d.name,
      normalizedName: normalizeText(d.name),
      normalizedSlug: normalizeText(d.slug || d.name)
    }));
    destinationsCacheTs = now;
    return destinationsCache;
  } catch (e) {
    // fallback to empty
    destinationsCache = [];
    destinationsCacheTs = now;
    return destinationsCache;
  }
}

function tokenize(str) {
  return normalizeText(str)
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean);
}

function wordOverlapScore(wordsA, wordsB) {
  const setB = new Set(wordsB);
  let score = 0;
  for (const w of wordsA) if (setB.has(w)) score++;
  return score;
}

// Score a single tour against the user query and extracted destination
function scoreTour(tour, queryWords, extractedNormalized) {
  let score = 0;
  const title = normalizeText(tour.title || '');
  const desc = normalizeText(tour.description || '');
  const destName = normalizeText(tour.destinationId?.name || '');
  const destinationNames = [];
  if (tour.destinationIds && Array.isArray(tour.destinationIds)) {
    for (const d of tour.destinationIds) {
      if (d?.name) destinationNames.push(normalizeText(d.name));
    }
  }

  // Destination exact/partial matches are the strongest signals
  if (extractedNormalized) {
    if (destName && (destName === extractedNormalized || destName.includes(extractedNormalized))) score += 80;
    for (const dn of destinationNames) {
      if (dn === extractedNormalized || dn.includes(extractedNormalized)) score += 70;
    }
    if (title.includes(extractedNormalized) || desc.includes(extractedNormalized)) score += 40;
  }

  // Title/desc overlap with query words
  const titleWords = tokenize(title);
  const descWords = tokenize(desc);
  score += wordOverlapScore(queryWords, titleWords) * 8;
  score += wordOverlapScore(queryWords, descWords) * 4;

  // Matching tags/keywords on tour (if available)
  if (Array.isArray(tour.tags)) {
    const tagWords = tour.tags.map((t) => normalizeText(t));
    score += wordOverlapScore(queryWords, tagWords) * 6;
  }

  // Small boost for featured or popular
  if (tour.featured) score += 8;
  if (tour.popular) score += 6;

  // Penalty if tour already started
  if (tour.startDate && new Date(tour.startDate) < new Date()) score -= 50;

  return score;
}

async function findRelevantToursForQuery(message, limit = 8) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const query = message || '';
  const normalized = normalizeText(query);
  const queryWords = tokenize(query);

  // detect alias first
  for (const [alias, main] of Object.entries(DESTINATION_ALIASES)) {
    if (normalized.includes(normalizeText(alias))) {
      // convert alias into normalized main destination
      const extracted = normalizeText(main);
      // fetch tours with that destination
      const tours = await Tour.find({ isActive: true, startDate: { $gte: today } })
        .populate('destinationId')
        .populate('destinationIds')
        .lean()
        .limit(400);
      const scored = tours.map((t) => ({ score: scoreTour(t, queryWords, extracted), tour: t }));
      scored.sort((a, b) => b.score - a.score);
      return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.tour);
    }
  }

  // load destinations from DB and try to extract
  const destinations = await loadDestinations();
  let extracted = null;
  for (const d of destinations) {
    if (normalized === d.normalizedName || normalized === d.normalizedSlug) {
      extracted = d.normalizedName;
      break;
    }
  }
  if (!extracted) {
    for (const d of destinations) {
      if (normalized.includes(d.normalizedName) || normalized.includes(d.normalizedSlug)) {
        extracted = d.normalizedName;
        break;
      }
    }
  }

  const tours = await Tour.find({ isActive: true, startDate: { $gte: today } })
    .populate('destinationId')
    .populate('destinationIds')
    .lean()
    .limit(800);

  // compute score for each tour
  const scored = tours.map((t) => ({ score: scoreTour(t, queryWords, extracted), tour: t }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.tour);
  return top;
}

// RAG: Retrieve relevant FAQ/knowledge base entries
async function findRelevantKnowledge(message, limit = 3) {
  const normalized = normalizeText(message);
  const queryWords = tokenize(message);

  try {
    // Fetch all active KB entries
    const allKB = await KnowledgeBase.find({ isActive: true }).lean();
    if (!allKB || allKB.length === 0) return [];

    // Score each KB entry
    const scored = allKB.map(kb => {
      let score = 0;
      const qNorm = normalizeText(kb.question || '');
      const aNorm = normalizeText(kb.answer || '');
      const qWords = tokenize(kb.question || '');
      const aWords = tokenize(kb.answer || '');
      const kwWords = (kb.keywords || []).map(k => normalizeText(k));

      // Exact question match
      if (qNorm === normalized) score += 100;
      else if (qNorm.includes(normalized) || normalized.includes(qNorm)) score += 60;

      // Word overlap in question
      score += wordOverlapScore(queryWords, qWords) * 10;

      // Keyword match
      for (const kw of kwWords) {
        if (normalized.includes(kw)) score += 15;
      }

      // Answer relevance (lower weight)
      score += wordOverlapScore(queryWords, aWords) * 3;

      // Priority boost
      score += (kb.priority || 0) * 2;

      return { score, kb };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.kb);
  } catch (e) {
    console.error('FAQ retrieval error:', e);
    return [];
  }
}

async function analyzeIntentAndGetData(message) {
  // RAG pipeline: Retrieve + Augment context + ready for Generation
  const normalized = normalizeText(message);

  // Step 1: Retrieve FAQ/Knowledge (highest priority for exact info)
  const faqs = await findRelevantKnowledge(message, 3);

  // Step 2: activities matching
  const allActivities = await Activity.find({ isActive: true }).populate('destinationId', 'name slug').lean();
  const matchedActivities = allActivities.filter(act => {
    const n = normalizeText(act.name || '');
    return n && (normalized.includes(n) || n.includes(normalized));
  });

  // Step 3: find relevant tours
  const tours = await findRelevantToursForQuery(message, 6);

  // Step 4: detect intent (FAQ takes precedence)
  let intent = 'general';
  if (faqs.length > 0) intent = 'faq';
  else if (matchedActivities.length > 0) intent = 'activity';
  else if (tours.length > 0) intent = 'specific_destination';
  else if (normalized.includes('biển') || normalized.includes('phu quoc') || normalized.includes('phú quốc')) intent = 'beach';
  else if (normalized.includes('tour') || normalized.includes('du lịch') || normalized.includes('đi chơi')) intent = 'search_tour';

  // Step 5: build destinations suggestions (from matched tours)
  const dests = [];
  for (const t of tours) {
    if (t.destinationId) dests.push({ name: t.destinationId.name, slug: t.destinationId.slug });
  }

  return {
    destinations: dests,
    tours,
    activities: matchedActivities.slice(0, 6),
    faqs, // NEW: include FAQ for context augmentation
    intent
  };
}

module.exports = {
  normalizeText,
  loadDestinations,
  findRelevantToursForQuery,
  findRelevantKnowledge,
  analyzeIntentAndGetData
};
