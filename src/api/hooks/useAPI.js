import localDB from '../../utils/localStorage';
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
    const { data } = await apiClient.get(`/users/${id}/notes`);
    return data;
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

export async function checkout(planId) {
    const { data } = await apiClient.post('/stripe/checkout',  {plan:planId} );
    return data;
}

export async function verifyCheckoutSession(sessionId) {
    const { data } = await apiClient.get(`/stripe/session/${sessionId}`);
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

export default function useAPI() {
  return {
    getAllUsers,
    registerUser,
    createPoi,
    getAdminPois,
    getAdminCategories,
    createAdminCategory,
    createUser,
    changeUserPlan,
    addUserPOI,
    addUserNote,
    getAdminNotes,
    createAdminNote,
    deleteAdminNote,
    addUserCategory,
    getUserNotes,
    checkout,
    verifyCheckoutSession,
    deleteUserPoi,
    deleteUserCategory,
    deleteAdminCategory,
    deleteAdminPoi
  };
}
