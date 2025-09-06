import apiClient from '../config';

// Create a new user
export async function createUser(userData) {
    const { data } = await apiClient.post('/users', userData);
    return data;
}

// Change user plan
export async function changeUserPlan(id, plan) {
    const { data } = await apiClient.put(`/users/${id}/plan`, { plan });
    return data;
}

// Add POI to user
export async function addUserPOI(id, poi) {
    const { data } = await apiClient.post(`/users/${id}/pois`, { poi });
    return data;
}

// Add note to user
export async function addUserNote(id, note) {
    const { data } = await apiClient.post(`/users/${id}/notes`, { note });
    return data;
}

// Get user notes
export async function getUserNotes(id) {
    if (!id) {
        console.log('getUserNotes called with invalid user ID:', id);
        return [];
    }
    
    try {
        const { data } = await apiClient.get(`/users/${id}/notes`);
        return data;
    } catch (error) {
        console.error('Error fetching user notes:', error);
        return [];
    }
}

// Authenticate user
export async function getAllUsers() {
    const { data } = await apiClient.get('/users/');
    return data;
}

// Register user
export async function registerUser(userData) {
    const { data } = await apiClient.post('/users/register', userData);
    return data;
}

// Create POI
export async function createPoi(poiData, selectedIcon) {
    const { data } = await apiClient.post('/admin/pois', { ...poiData, selectedIcon });
    return data;
}

// Get POIs
export async function getAdminPois() {
    const { data } = await apiClient.get('/admin/pois');
    return data;
}

// Get admin categories
export async function getAdminCategories() {
    const { data } = await apiClient.get('/admin/categories');
    return data;
}

// Create admin category
export async function createAdminCategory(categoryData) {
    const { data } = await apiClient.post('/admin/categories', categoryData);
    return data;
}

export async function addUserCategory(id, category) {
    const { data } = await apiClient.post(`/users/${id}/categories`, { category });
    return data;
}

export async function getAdminNotes() {
    const { data } = await apiClient.get('/admin/notes');
    return data;
}

export async function createAdminNote(noteData) {
    const { data } = await apiClient.post('/admin/notes', noteData);
    return data;
}

export async function deleteAdminNote(id) {
    const { data } = await apiClient.delete(`/admin/notes/${id}`);
    return data;
}

export async function checkout(planId, customerId, userEmail) {
    const { data } = await apiClient.post('/stripe/checkout', { 
        plan: planId, 
        customerId, 
        userEmail 
    });
    return data;
}

export async function verifyCheckoutSession(sessionId) {
    const { data } = await apiClient.get(`/stripe/session/${sessionId}`);
    return data;
}

export async function cancelSubscription(subscriptionId, userId) {
    const { data } = await apiClient.post('/stripe/cancel-subscription', { 
        subscriptionId, 
        userId 
    });
    return data;
}

export async function cancelSubscriptionAtPeriodEnd(subscriptionId) {
    const { data } = await apiClient.post('/stripe/cancel-subscription-period-end', { 
        subscriptionId 
    });
    return data;
}

export async function reactivateSubscription(subscriptionId) {
    const { data } = await apiClient.post('/stripe/reactivate-subscription', { 
        subscriptionId 
    });
    return data;
}

export async function getSubscriptionDetails(subscriptionId) {
    const { data } = await apiClient.get(`/stripe/subscription/${subscriptionId}`);
    return data;
}

export async function getUserSubscription(userId) {
    const { data } = await apiClient.get(`/users/${userId}/subscription`);
    return data;
}

export async function updateUserPlan(userId, plan, stripeSubscriptionId, stripeCustomerId) {
    const { data } = await apiClient.put(`/users/${userId}/plan`, { 
        plan, 
        stripeSubscriptionId, 
        stripeCustomerId 
    });
    return data;
}

export async function deleteUserPoi(id, poiId) {
    const { data } = await apiClient.delete(`/users/${id}/pois/${poiId}`);
    return data;
}

export async function deleteUserCategory(id, categoryId) {
    const { data } = await apiClient.delete(`/users/${id}/categories/${categoryId}`);
    return data;
}

export async function deleteAdminCategory(categoryId) {
    const { data } = await apiClient.delete(`/admin/categories/${categoryId}`);
    return data;
}

export async function deleteAdminPoi(poiId) {
    const { data } = await apiClient.delete(`/admin/pois/${poiId}`);
    return data;
}

export async function updateCategory(id, categoryName, updates) {
    const { data } = await apiClient.put(`/users/${id}/categories/${categoryName}`, updates);
    return data;
}

export async function updateAdminCategory(categoryId, updates) {
    const { data } = await apiClient.put(`/admin/categories/${categoryId}`, updates);
    return data;
}

export async function editAdminNote(id, updates) {
    const { data } = await apiClient.put(`/admin/notes/${id}`, updates);
    return data;
}


export async function editUserNote(id, noteId, updates) {
    const { data } = await apiClient.put(`/users/${id}/notes/${noteId}`, updates);
    return data;
}

export async function editUserPoi(id, poiId, updates) {
    const { data } = await apiClient.put(`/users/${id}/pois/${poiId}`, updates);
    return data;
}

export async function editAdminPoi(poiId, updates) {
    const { data } = await apiClient.put(`/admin/pois/${poiId}`, updates);
    return data;
}

export async function deleteUserNote(id, noteId) {
    const { data } = await apiClient.delete(`/users/${id}/notes/${noteId}`);
    return data;
}

export async function authenticateUser(email, password) {
    const { data } = await apiClient.post('/users/authenticate', { email, password });
    return data;
}

// Request password reset
export async function requestPasswordReset(email) {
    try {
        const { data } = await apiClient.post('/users/forgot-password', { email });
        return { success: true, data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.response?.data?.message || 'Failed to send reset email' 
        };
    }
}

// Reset password with token
export async function resetPassword(token, newPassword) {
    try {
        const { data } = await apiClient.post('/users/reset-password', { token, newPassword });
        return { success: true, data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.response?.data?.message || 'Failed to reset password' 
        };
    }
}

export async function getAllCategories() {
    const { data } = await apiClient.get('/categories');
    return data;
}

export async function getCategoryById(id) {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
}

export async function createCategory(categoryData) {
    const { data } = await apiClient.post('/categories', categoryData);
    return data;
}

export async function updateCategoryById(id, categoryData) {
    const { data } = await apiClient.put(`/categories/${id}`, categoryData);
    return data;
}

// SubCategories API functions
export async function getAllSubCategories() {
    const { data } = await apiClient.get('/subcategories');
    return data;
}

export async function getSubCategoryById(id) {
    const { data } = await apiClient.get(`/subcategories/${id}`);
    return data;
}

export async function createSubCategory(subCategoryData) {
    const { data } = await apiClient.post('/subcategories', subCategoryData);
    return data;
}

export async function updateSubCategoryById(id, subCategoryData) {
    const { data } = await apiClient.put(`/subcategories/${id}`, subCategoryData);
    return data;
}

// POIs API functions
export async function getAllPOIs() {
    const { data } = await apiClient.get('/pois');
    return data;
}

export async function getPOIById(id) {
    const { data } = await apiClient.get(`/pois/${id}`);
    return data;
}

export async function createPOI(poiData) {
    const { data } = await apiClient.post('/pois', poiData);
    return data;
}

export async function updatePOIById(id, poiData) {
    const { data } = await apiClient.put(`/pois/${id}`, poiData);
    return data;
}

export async function deletePOIById(id) {
    const { data } = await apiClient.delete(`/pois/${id}`);
    return data;
}

// // User management API functions for admin
// export async function updateUserPlan(userId, newPlan) {
//     const { data } = await apiClient.put(`/users/${userId}/plan`, { plan: newPlan });
//     return data;
// }

export async function getUserById(userId) {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
}

export async function updateUserById(userId, userData) {
    const { data } = await apiClient.put(`/users/${userId}`, userData);
    return data;
}

export async function deleteUserById(userId) {
    const { data } = await apiClient.delete(`/users/${userId}`);
    return data;
}

// Admin statistics API functions
export async function getAdminStats() {
    const { data } = await apiClient.get('/admin/stats/stats');
    return data;
}

export async function getPendingPOIs() {
    const { data } = await apiClient.get('/admin/stats/pois/pending');
    return data;
}

export async function getApprovedPOIs() {
    const { data } = await apiClient.get('/pois?approved=true');
    return data;
}

export async function getUserActivity() {
    const { data } = await apiClient.get('/admin/stats/users/activity');
    return data;
}

export async function bulkApprovePOIs(poiIds) {
    const { data } = await apiClient.post('/admin/stats/pois/bulk-approve', { poiIds });
    return data;
}

export async function bulkRejectPOIs(poiIds) {
    const { data } = await apiClient.post('/admin/stats/pois/bulk-reject', { poiIds });
    return data;
}

// Plan management API functions
export async function getAllPlanConfigurations() {
    const { data } = await apiClient.get('/admin/plans');
    return data;
}

export async function getPlanConfiguration(planName) {
    const { data } = await apiClient.get(`/admin/plans/${planName}`);
    return data;
}

export async function createPlanConfiguration(planData) {
    const { data } = await apiClient.post('/admin/plans', planData);
    return data;
}

export async function updatePlanConfiguration(planName, planData) {
    const { data } = await apiClient.put(`/admin/plans/${planName}`, planData);
    return data;
}

export async function deletePlanConfiguration(planName) {
    const { data } = await apiClient.delete(`/admin/plans/${planName}`);
    return data;
}

export async function initializeDefaultPlans() {
    const { data } = await apiClient.post('/admin/plans/initialize-defaults');
    return data;
}

export async function getPlanUsageStats() {
    const { data } = await apiClient.get('/admin/plans/stats/usage');
    return data;
}

// Map Layers API Functions
export async function getAllMapLayers() {
    const { data } = await apiClient.get('/admin/map-layers');
    return data;
}

export async function getMapLayer(id) {
    const { data } = await apiClient.get(`/admin/map-layers/${id}`);
    return data;
}

export async function createMapLayer(layerData) {
    const { data } = await apiClient.post('/admin/map-layers', layerData);
    return data;
}

export async function updateMapLayer(id, layerData) {
    const { data } = await apiClient.put(`/admin/map-layers/${id}`, layerData);
    return data;
}

export async function deleteMapLayer(id) {
    const { data } = await apiClient.delete(`/admin/map-layers/${id}`);
    return data;
}

export async function uploadMapLayerImage(imageData, fileName, contentType, layerName) {
    // Prefer sending an already-uploaded S3 URL as `imageUrl`.
    // Back-end rejects base64 payloads. If you have imageData as a base64 string, upload to S3 first (client-side) and then call this function with imageUrl.
    const payload = {};
    if (imageData && typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
        payload.imageUrl = imageData;
    } else if (imageData) {
        // If caller passed raw base64, include it but backend will reject it. Caller should upload to S3 instead.
        payload.imageData = imageData;
    }
    if (fileName) payload.fileName = fileName;
    if (contentType) payload.contentType = contentType;
    if (layerName) payload.layerName = layerName;

    const { data } = await apiClient.post('/admin/map-layers/upload-image', payload);
    return data;
}

// My POI API functions
export async function getMyPOISubcategories(userId) {
    const { data } = await apiClient.get(`/my-pois/subcategories/${userId}`);
    return data;
}

export async function createMyPOISubcategory(subcategoryData) {
    const { data } = await apiClient.post('/my-pois/subcategories', subcategoryData);
    return data;
}

export async function getMyPOIs(userId) {
    const { data } = await apiClient.get(`/my-pois/pois/${userId}`);
    return data;
}

export async function createMyPOI(poiData) {
    const { data } = await apiClient.post('/my-pois/pois', poiData);
    return data;
}

export async function getMyPOICategory(userId) {
    const { data } = await apiClient.get(`/my-pois/category/${userId}`);
    return data;
}

// Get user POI statistics (total count and plan limits)
export async function getUserPOIStats(userId) {
    const { data } = await apiClient.get(`/users/${userId}/poi-stats`);
    return data;
}

// Found Locations API functions
export async function getFoundLocations(userId) {
    const { data } = await apiClient.get(`/found-locations/${userId}`);
    return data;
}

export async function addFoundLocation(userId, poiId, notes = null) {
    const { data } = await apiClient.post('/found-locations', { userId, poiId, notes });
    return data;
}

export async function removeFoundLocation(userId, poiId) {
    const { data } = await apiClient.delete(`/found-locations/${userId}/${poiId}`);
    return data;
}

export async function checkIfFound(userId, poiId) {
    const { data } = await apiClient.get(`/found-locations/${userId}/check/${poiId}`);
    return data;
}

// Plan configurations API functions
export async function getPlanConfigurations() {
    const { data } = await apiClient.get('/admin/plans');
    return data;
}
