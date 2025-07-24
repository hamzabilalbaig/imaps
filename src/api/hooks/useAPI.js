import { useCallback } from 'react';
import api from '../api'; // Adjust the import path if needed

export default function useAPI() {
    // Authenticate user
    const authenticateUser = useCallback(async (credentials) => {
        const { data } = await api.post('/users/authenticate', credentials);
        return data;
    }, []);

    // Register user
    const registerUser = useCallback(async (userData) => {
        const { data } = await api.post('/users/register', userData);
        return data;
    }, []);

    // Create POI
    const createPoi = useCallback(async (poiData) => {
        const { data } = await api.post('/admin-pois', poiData);
        return data;
    }, []);

    // Get POIs
    const getPois = useCallback(async () => {
        const { data } = await api.get('/admin-pois');
        return data;
    }, []);

    // Get admin categories
    const getAdminCategories = useCallback(async () => {
        const { data } = await api.get('/admin-categories');
        return data;
    }, []);

    // Create admin category
    const createAdminCategory = useCallback(async (categoryData) => {
        const { data } = await api.post('/admin-categories', categoryData);
        return data;
    }, []);

    return {
        authenticateUser,
        registerUser,
        createPoi,
        getPois,
        getAdminCategories,
        createAdminCategory,
    };
}