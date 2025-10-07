import { getPlanConfigurations } from '../api/functions/apiFunctions';

// Cache for plan configurations
let planConfigCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch plan configurations from the database and cache them
 * @returns {Promise<Object>} Plan limits object with format matching PLAN_LIMITS
 */
export async function fetchPlanLimits() {
  // Check if we have cached data that's still valid
  if (planConfigCache && lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION) {
    return planConfigCache;
  }

  try {
    // Fetch plan configurations from the API
    const planConfigs = await getPlanConfigurations();
    
    // Convert database format to frontend format
    const planLimits = {};
    
    planConfigs.forEach(plan => {
      planLimits[plan.plan_name] = {
        maxCustomCategories: plan.max_custom_categories === -1 ? Infinity : plan.max_custom_categories,
        totalPOILimit: plan.total_poi_limit === -1 ? Infinity : plan.total_poi_limit,
        allowCustomIcons: plan.allow_custom_icons,
        // Add maxNotes if it exists in the plan, otherwise use sensible defaults
        maxNotes: plan.max_notes !== undefined 
          ? (plan.max_notes === -1 ? Infinity : plan.max_notes)
          : getDefaultMaxNotes(plan.plan_name),
        // Add allowPOIImages - defaults to true if not specified
        allowPOIImages: plan.allow_poi_images !== undefined ? plan.allow_poi_images : true
      };
    });

    // Cache the result
    planConfigCache = planLimits;
    lastFetchTime = Date.now();
    
    return planLimits;
  } catch (error) {
    console.error('Error fetching plan configurations:', error);
    
    // Return fallback hardcoded values if API fails
    return getFallbackPlanLimits();
  }
}

/**
 * Get default max notes for a plan (fallback)
 */
function getDefaultMaxNotes(planName) {
  switch (planName) {
    case 'free': return 5;
    case 'premium': return 50;
    case 'unlimited': return Infinity;
    default: return 5;
  }
}

/**
 * Fallback plan limits if API fails
 */
function getFallbackPlanLimits() {
  return {
    free: { 
      maxCustomCategories: 10,
      totalPOILimit: 100,
      maxNotes: 5,
      allowCustomIcons: false,
      allowPOIImages: false
    },
    premium: { 
      maxCustomCategories: 20,
      totalPOILimit: 400,
      maxNotes: 50,
      allowCustomIcons: false,
      allowPOIImages: true
    },
    unlimited: { 
      maxCustomCategories: Infinity,
      totalPOILimit: Infinity,
      maxNotes: Infinity,
      allowCustomIcons: true,
      allowPOIImages: true
    }
  };
}

/**
 * Clear the plan configuration cache (useful for testing or when plans are updated)
 */
export function clearPlanLimitsCache() {
  planConfigCache = null;
  lastFetchTime = null;
}

/**
 * Get plan limits for a specific plan
 * @param {string} planName - The plan name (free, premium, unlimited)
 * @returns {Promise<Object>} Plan limits for the specific plan
 */
export async function getPlanLimitsForPlan(planName) {
  const allPlanLimits = await fetchPlanLimits();
  return allPlanLimits[planName] || allPlanLimits.free; // Default to free plan if plan not found
}
