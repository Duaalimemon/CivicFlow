import { Complaint, ComplaintCategory, ComplaintPriority, DuplicateMatch, PriorityScoreExplanation } from '../types';

/**
 * Deterministic keyword rules for civic category suggestion
 */
const CATEGORY_KEYWORDS: Record<ComplaintCategory, string[]> = {
  'Roads': ['pothole', 'potholes', 'asphalt', 'crater', 'cracked road', 'damaged road', 'speed breaker', 'sinkhole', 'resurface'],
  'Street Lighting': ['streetlight', 'street light', 'lamp', 'dark street', 'pole', 'flickering', 'bulb', 'illumination', 'blackout'],
  'Water Supply': ['water', 'pipe', 'leak', 'leaking', 'contamination', 'pressure', 'burst', 'drainage', 'sewage leak', 'meter'],
  'Sanitation': ['garbage', 'trash', 'overflow', 'missed collection', 'dump', 'waste', 'smell', 'odor', 'debris', 'litter'],
  'Traffic Signals': ['traffic light', 'traffic signal', 'signal', 'red light', 'blinking', 'malfunctioning light', 'junction', 'intersection'],
};

/**
 * Suggests category based on title & description
 */
export function suggestCategory(title: string, description: string): {
  suggested: ComplaintCategory;
  explanation: string;
} {
  const content = `${title} ${description}`.toLowerCase();

  let bestMatch: ComplaintCategory = 'Roads';
  let highestScore = 0;
  let matchedKeyword = '';

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ComplaintCategory, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (content.includes(kw)) {
        score += kw.split(' ').length > 1 ? 2 : 1;
        if (!matchedKeyword) matchedKeyword = kw;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = cat;
    }
  }

  if (highestScore > 0) {
    return {
      suggested: bestMatch,
      explanation: `Deterministic pattern match triggered by civic keywords like "${matchedKeyword}".`,
    };
  }

  return {
    suggested: 'Roads',
    explanation: 'Default fallback category. No high-confidence civic keyword detected in submission text.',
  };
}

/**
 * Calculates deterministic priority score and breakdown
 */
export function calculatePriority(
  title: string,
  description: string,
  safetyConcern: boolean,
  category: ComplaintCategory
): {
  priority: ComplaintPriority;
  score: number;
  explanation: PriorityScoreExplanation;
} {
  const content = `${title} ${description}`.toLowerCase();
  let baseScore = 20; // Default baseline
  const factors: string[] = ['Standard municipal intake baseline (+20pts)'];

  // Category weight
  if (category === 'Traffic Signals' || category === 'Water Supply') {
    baseScore += 15;
    factors.push(`Critical infrastructure sector: ${category} (+15pts)`);
  } else if (category === 'Street Lighting' || category === 'Roads') {
    baseScore += 10;
    factors.push(`Public transit & mobility sector: ${category} (+10pts)`);
  }

  // Safety concern bonus (flag, not emergency)
  let safetyBonus = 0;
  if (safetyConcern) {
    safetyBonus = 30;
    factors.push('Citizen flagged potential public safety hazard (+30pts review flag)');
  }

  // Urgent keyword indicators
  let keywordBonus = 0;
  const criticalWords = ['danger', 'accident', 'burst', 'flood', 'spark', 'collapsed', 'severe', 'injury', 'urgent', 'hazard'];
  const foundWords = criticalWords.filter(w => content.includes(w));
  if (foundWords.length > 0) {
    keywordBonus = Math.min(25, foundWords.length * 10);
    factors.push(`Urgency signals identified: "${foundWords.join(', ')}" (+${keywordBonus}pts)`);
  }

  const totalScore = Math.min(100, baseScore + safetyBonus + keywordBonus);

  let level: ComplaintPriority = 'Low';
  if (totalScore >= 75) {
    level = 'Urgent';
  } else if (totalScore >= 55) {
    level = 'High';
  } else if (totalScore >= 35) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return {
    priority: level,
    score: totalScore,
    explanation: {
      baseScore,
      safetyBonus,
      keywordBonus,
      totalScore,
      factors,
      level,
    },
  };
}

/**
 * Calculates approximate geospatial distance in km between two lat/lng pairs
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detects possible duplicates against existing complaints
 */
export function detectDuplicates(
  currentComplaint: {
    id?: string;
    title: string;
    description: string;
    category: ComplaintCategory;
    lat?: number;
    lng?: number;
  },
  existingComplaints: Complaint[]
): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];
  const currentTokens = new Set(`${currentComplaint.title} ${currentComplaint.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  for (const item of existingComplaints) {
    if (currentComplaint.id && item.id === currentComplaint.id) continue;

    const reasons: string[] = [];
    let similarityScore = 0;

    // 1. Same category
    if (item.category === currentComplaint.category) {
      similarityScore += 25;
      reasons.push(`Identical civic category (${item.category})`);
    }

    // 2. Token overlap
    const itemTokens = new Set(`${item.title} ${item.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    let commonWords = 0;
    currentTokens.forEach(token => {
      if (itemTokens.has(token)) commonWords++;
    });

    if (commonWords >= 3) {
      const tokenScore = Math.min(45, commonWords * 10);
      similarityScore += tokenScore;
      reasons.push(`${commonWords} matching descriptive terms`);
    }

    // 3. Proximity check if coordinates exist
    if (
      currentComplaint.lat !== undefined &&
      currentComplaint.lng !== undefined &&
      item.location?.lat !== undefined &&
      item.location?.lng !== undefined
    ) {
      const distance = getDistanceKm(
        currentComplaint.lat,
        currentComplaint.lng,
        item.location.lat,
        item.location.lng
      );

      if (distance <= 0.4) {
        similarityScore += 30;
        reasons.push(`Immediate geographic vicinity (${Math.round(distance * 1000)}m away)`);
      } else if (distance <= 1.2) {
        similarityScore += 15;
        reasons.push(`Same municipal zone (${distance.toFixed(1)}km away)`);
      }
    }

    if (similarityScore >= 50) {
      results.push({
        complaintId: item.id,
        trackingId: item.trackingId,
        title: item.title,
        category: item.category,
        similarityScore: Math.min(98, similarityScore),
        reasons,
        dismissed: false,
      });
    }
  }

  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}
