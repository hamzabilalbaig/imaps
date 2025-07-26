import localDB from '../../utils/localStorage';
import apiClient from '../config';

// Create a new user
export async function createUser(userData) {
    const { data } = await apiClient.post('/users', userData);
    await localDB?.initializeDB();
    return data;
}

// Change user plan
export async function changeUserPlan(id, plan) {
    const { data } = await apiClient.put(`/users/${id}/plan`, { plan });
    await localDB?.initializeDB();
    return data;
}

// Add POI to user
export async function addUserPOI(id, poi) {
    const { data } = await apiClient.post(`/users/${id}/pois`, { poi });
    await localDB?.initializeDB();
    return data;
}

// Add note to user
export async function addUserNote(id, note) {
    const { data } = await apiClient.post(`/users/${id}/notes`, { note });
    await localDB?.initializeDB();
    return data;
}

// Authenticate user
export async function getAllUsers() {
    const { data } = await apiClient.get('/users/');
    await localDB?.initializeDB();
    return data;
}

// Register user
export async function registerUser(userData) {
    const { data } = await apiClient.post('/users/register', userData);
    await localDB?.initializeDB();
    return data;
}

// Create POI
export async function createPoi(poiData) {
    const { data } = await apiClient.post('/admin/pois', poiData);
    await localDB?.initializeDB();
    return data;
}

// Get POIs
export async function getAdminPois() {
    const { data } = await apiClient.get('/admin/pois');
    await localDB?.initializeDB();
    return data;
}

// Get admin categories
export async function getAdminCategories() {
    const { data } = await apiClient.get('/admin/categories');
    await localDB?.initializeDB();
    return data;
}

// Create admin category
export async function createAdminCategory(categoryData) {
    const { data } = await apiClient.post('/admin/categories', categoryData);
    await localDB?.initializeDB();
    return data;
}

export async function addUserCategory(id, category) {
    const { data } = await apiClient.post(`/users/${id}/categories`, { category });
    await localDB?.initializeDB();
    return data;
}

export async function getAdminNotes() {
    const { data } = await apiClient.get('/admin/notes');
    await localDB?.initializeDB();
    return data;
}

export async function createAdminNote(noteData) {
    const { data } = await apiClient.post('/admin/notes', noteData);
    await localDB?.initializeDB();
    return data;
}

export async function deleteAdminNote(id) {
    const { data } = await apiClient.delete(`/admin/notes/${id}`);
    await localDB?.initializeDB();
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
    createAdminNote
  };
}
