export interface LeadData {
  website?: string;
  phone?: string;
  rating?: number;
  opinionCount?: number;
}

export function calculateLeadScore(lead: LeadData): { score: number; category: string } {
  let score = 25; // Base score

  // Core missing data (Huge opportunities)
  if (!lead.website || lead.website.trim() === "") {
    score += 55;
  }
  
  if (!lead.phone || lead.phone.trim() === "") {
    score += 40;
  }

  // Rating analysis
  if (lead.rating !== undefined && lead.rating > 0) {
    if (lead.rating < 4.0) {
      score += 30; // Needs reputation management
    }
    
    if (lead.rating < 3.7 && lead.opinionCount !== undefined && lead.opinionCount >= 15) {
      score += 25; // Very bad reputation with significant volume -> Urgent need
    }
    
    // High activity penalties (Hard to sell to)
    if (lead.rating >= 4.5 && lead.opinionCount !== undefined) {
      if (lead.opinionCount >= 500) score -= 40;
      else if (lead.opinionCount >= 100) score -= 25;
      else if (lead.opinionCount >= 50) score -= 15;
    }
  }

  // Opinion volume analysis
  if (lead.opinionCount !== undefined && lead.opinionCount < 12) {
    score += 22; // Very few reviews -> Needs SEO/Review generation
  }

  // Ensure score stays between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine category
  let category = "COLD";
  if (score >= 90) category = "HOT";
  else if (score >= 60) category = "WARM";

  return { score, category };
}
