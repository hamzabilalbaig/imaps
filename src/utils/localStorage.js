/**
 * Local Storage Database Management System for iMaps
 * Handles user registration, authentication, POIs, notes, and categories
 */

import { addUserCategory, createAdminCategory, createPoi, deleteAdminCategory, deleteAdminPoi, deleteUserCategory, deleteUserPoi, getAdminCategories as getAdminCategoriesApi, getAdminNotes, getAdminPois, getAllUsers, updateCategory } from "../api/hooks/useAPI";

class LocalStorageDB {
  constructor() {
    this.initializeDB();
  }

  async initializeDB() {
    if (!localStorage.getItem('imaps_users')) {
      localStorage.setItem('imaps_users', JSON.stringify({}));
    }
    if (!localStorage.getItem('imaps_current_user')) {
      localStorage.setItem('imaps_current_user', null);
    }
    
    // Initialize empty categories - only admin can create them
    if (!localStorage.getItem('imaps_admin_categories')) {
      // localStorage.setItem('imaps_admin_categories', JSON.stringify([]));
      const adminCategories = await getAdminCategoriesApi();
      console.log('Fetched admin categories:', adminCategories);
      localStorage.setItem('imaps_admin_categories', JSON.stringify(adminCategories));
    }
    if (!localStorage.getItem('imaps_admin_notes')) {
      const adminNotes = await getAdminNotes();
      console.log('Fetched admin notes:', adminNotes);
      localStorage.setItem('imaps_admin_notes', JSON.stringify(adminNotes));
    }
    if (!localStorage.getItem('imaps_admin_pois')) {
      localStorage.setItem('imaps_admin_pois', JSON.stringify([]));
    }
  }

  // User Management
  async registerUser(email, password, name = '') {
    // Use createUser API for registration
    try {
      // Check if user already exists (API call)
      const users = await this.getUsers();
      if (users[email]) {
        return { success: false, message: 'User already exists' };
      }

      // Prepare user data for API
      const userData = {
        email,
        password,
        name,
        plan: 'free',
        role: 'user',
      };

      // Call createUser API
      const createdUser = await import('../api/hooks/useAPI').then(mod => mod.createUser(userData));

      // Update local storage after successful registration
      const updatedUsers = { ...users, [email]: {
        ...createdUser,
        pois: [],
        notes: [],
        customIcons: [],
        userCategories: [],
      }};
      localStorage.setItem('imaps_users', JSON.stringify(updatedUsers));

      return { success: true, message: 'User registered successfully', user: updatedUsers[email] };
    } catch (error) {
      return { success: false, message: error?.message || 'Registration failed' };
    }
  }

  async loginUser(email, password) {
    // Admin login
    if (email === 'admin@admin.com' && password === 'admin') {
      const adminUser = {
        id: 'admin',
        email: 'admin@admin.com',
        name: 'Administrator',
        role: 'admin',
        plan: 'unlimited',
        pois: this.getAllPOIs(),
        notes: this.getAllNotes(),
        customIcons: this.getAllCustomIcons()
      };
      localStorage.setItem('imaps_current_user', JSON.stringify(adminUser));
      return { success: true, user: adminUser, isAdmin: true };
    }

    // Regular user login
    const users = await this.getUsers();
    const user = users[email];

    console.log('user password:', user ? user.password : 'not found', 'input password:', password);

    if (!user || user.password !== password) {
      return { success: false, message: 'Invalid email or password' };
    } else {
      localStorage.setItem('imaps_current_user', JSON.stringify(user));
      return { success: true, user, isAdmin: false };
    }
  }

  getCurrentUser() {
    const currentUser = localStorage.getItem('imaps_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  logoutUser() {
    localStorage.removeItem('imaps_current_user');
  }

  async getUsers() {
  const result = await getAllUsers();
  const data = result.reduce((acc, user) => {
    acc[user.email] = { ...user };
    return acc;
  }, {});
  console.log('Fetched users:', data);
  return data;
}

  updateUser(email, updates) {
    const users = this.getUsers();
    if (users[email]) {
      users[email] = { ...users[email], ...updates };
      localStorage.setItem('imaps_users', JSON.stringify(users));
      
      // Update current user if it's the same user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.email === email) {
        localStorage.setItem('imaps_current_user', JSON.stringify(users[email]));
      }
      
      return { success: true, user: users[email] };
    }
    return { success: false, message: 'User not found' };
  }

  // Points of Interest Management
  async addPOI(poi) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    if (currentUser.role === 'admin') {
      // Admins can add POIs without restrictions
      const data = await createPoi(poi);
      const adminPOIs = await getAdminPois();
      adminPOIs.push(data);
      localStorage.setItem('imaps_admin_pois', JSON.stringify(adminPOIs));
      return { success: true, poi: data };
    }

    try {
      // Use addUserPOI API for user POIs
      const { addUserPOI } = await import('../api/hooks/useAPI');
      // Call API to add POI and get updated user from backend
      const updatedUser = await addUserPOI(currentUser.id, poi);
      if (!updatedUser) {
        return { success: false, message: 'Failed to add POI' };
      }
      // Update local storage with latest user data
      const users = await this.getUsers();
      if (users[currentUser.email]) {
        users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
        localStorage.setItem('imaps_users', JSON.stringify(users));
        localStorage.setItem('imaps_current_user', JSON.stringify(users[currentUser.email]));
        // Return the last added POI
        const lastPOI = updatedUser.pois[updatedUser.pois.length - 1];
        return { success: true, poi: lastPOI };
      }
      return { success: false, message: 'User not found' };
    } catch (error) {
      console.error('Error adding POI:', error);
      return { success: false, message: error.message || 'Failed to add POI' };
    }
  }

  async getUserPOIs() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return await this.getAllPOIs();
    }
    
    return currentUser.pois || [];
  }

  async getAllPOIs() {
    const users = await this.getUsers();
    const adminPOIs = await this.getAdminPOIs();
    let allPOIs = [...adminPOIs];
    
    Object.values(users).forEach(user => {
      allPOIs = allPOIs.concat(user.pois || []);
    });
    
    return allPOIs;
  }

  async getAdminPOIs() {
    // return JSON.parse(localStorage.getItem('imaps_admin_pois') || '[]');
    const adminPOIs = await getAdminPois();
    return adminPOIs;
  }

  updatePOI(poiId, updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    // Check admin POIs first
    if (currentUser.role === 'admin') {
      const adminPOIs = this.getAdminPOIs();
      const poiIndex = adminPOIs.findIndex(poi => poi.id === poiId);
      if (poiIndex !== -1) {
        adminPOIs[poiIndex] = {
          ...adminPOIs[poiIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('imaps_admin_pois', JSON.stringify(adminPOIs));
        return { success: true, poi: adminPOIs[poiIndex] };
      }
    }

    // Check user POIs
    const users = this.getUsers();
    if (users[currentUser.email]) {
      const poiIndex = users[currentUser.email].pois.findIndex(poi => poi.id === poiId);
      if (poiIndex !== -1) {
        users[currentUser.email].pois[poiIndex] = {
          ...users[currentUser.email].pois[poiIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('imaps_users', JSON.stringify(users));
        
        // Update current user
        const updatedUser = users[currentUser.email];
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
        
        return { success: true, poi: users[currentUser.email].pois[poiIndex] };
      }
    }
    
    return { success: false, message: 'POI not found' };
  }

  async deletePOI(poiId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    // Check admin POIs first
    if (currentUser.role === 'admin') {
      // const adminPOIs = this.getAdminPOIs();
      // const filteredAdminPOIs = adminPOIs.filter(poi => poi.id !== poiId);
      // if (filteredAdminPOIs.length !== adminPOIs.length) {
      //   localStorage.setItem('imaps_admin_pois', JSON.stringify(filteredAdminPOIs));
      //   return { success: true };
      // }
      const response = await deleteAdminPoi(poiId);
      if (response) {
        window?.location.reload();
        return response;
      }
    } else {
      const response = await deleteUserPoi(currentUser.id, poiId);
      if (response) {
        window.location.reload(); // Reload to reflect changes
        return { success: true, message: 'POI deleted successfully' };
      }
    }

    // Check user POIs
    // const users = this.getUsers();
    // if (users[currentUser.email]) {
    //   const originalLength = users[currentUser.email].pois.length;
    //   users[currentUser.email].pois = users[currentUser.email].pois.filter(poi => poi.id !== poiId);
      
    //   if (users[currentUser.email].pois.length !== originalLength) {
    //     localStorage.setItem('imaps_users', JSON.stringify(users));
        
    //     // Update current user
    //     const updatedUser = users[currentUser.email];
    //     localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
        
    //     return { success: true };
    //   }
    // }
    
    return { success: false, message: 'POI not found' };
  }

  // Notes Management
  async addNote(note) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };
    if (currentUser.role !== 'admin') {
    const noteData = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };

    const users = this.getUsers();
    if (users[currentUser.email]) {
      users[currentUser.email].notes.push(noteData);
      localStorage.setItem('imaps_users', JSON.stringify(users));
      
      // Update current user
      const updatedUser = users[currentUser.email];
      localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      
      return { success: true, note: noteData };
    }
    
    return { success: false, message: 'User not found' };
  } 
}

  getUserNotes() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return this.getAllNotes();
    }
    
    return currentUser.notes || [];
  }

  getAllNotes() {
    const users = this.getUsers();
    let allNotes = [];
    
    Object.values(users).forEach(user => {
      allNotes = allNotes.concat(user.notes || []);
    });
    
    return allNotes;
  }

  updateNote(noteId, updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    const users = this.getUsers();
    if (users[currentUser.email]) {
      const noteIndex = users[currentUser.email].notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        users[currentUser.email].notes[noteIndex] = {
          ...users[currentUser.email].notes[noteIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('imaps_users', JSON.stringify(users));
        
        // Update current user
        const updatedUser = users[currentUser.email];
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
        
        return { success: true, note: users[currentUser.email].notes[noteIndex] };
      }
    }
    
    return { success: false, message: 'Note not found' };
  }

  async deleteNote(noteId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    const users = this.getUsers();
    if (users[currentUser.email]) {
      users[currentUser.email].notes = users[currentUser.email].notes.filter(note => note.id !== noteId);
      localStorage.setItem('imaps_users', JSON.stringify(users));
      
      // Update current user
      const updatedUser = users[currentUser.email];
      localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      
      return { success: true };
    }
    
    return { success: false, message: 'User not found' };
  }

  // Categories Management (Admin Only)
  async addCategory(category) {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    if (currentUser.role === 'admin') {
      // Admin categories are stored globally
      const categoryData = {
        id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...category,
        createdAt: new Date().toISOString(),
        userId: currentUser.id
      };
      const adminCategories = await this.getAdminCategories();
      adminCategories.push(categoryData);
      const updatedAdminCategories = await createAdminCategory(categoryData);
      // localStorage.setItem('imaps_admin_categories', JSON.stringify(adminCategories));
      localStorage.setItem('imaps_admin_categories', JSON.stringify(updatedAdminCategories));
      return { success: true, category: categoryData };
    } else {
      // For regular users, use addUserCategory API
      // try {
      //   // Add category via API and get updated user from backend
      //   const updatedUser = await addUserCategory(currentUser.id, category);
      //   if (!updatedUser) {
      //     return { success: false, message: 'Failed to add category' };
      //   }
      //   // Update local storage with latest user data
      //   const users = await this.getUsers();
      //   if (users[currentUser.email]) {
      //     users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
      //     localStorage.setItem('imaps_users', JSON.stringify(users));
      //     localStorage.setItem('imaps_current_user', JSON.stringify(users[currentUser.email]));
      //     // Return the last added category
      //     // const lastCategory = users[currentUser.email].userCategories[users[currentUser.email].userCategories.length - 1];
      //     const lastCategory = updatedUser.userCategories[updatedUser.userCategories.length - 1];
      //     localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      //     return { success: true, category: lastCategory };
      //   } else {
      //     return { success: false, message: 'User not found' };
      //   }
      // } catch (error) {
      //   console.error('Error adding category:', error);
      //   return { success: false, message: error?.message || 'Failed to add category' };
      // }
      try {
        const updatedUser = await addUserCategory(currentUser.id, category);
        console.log('Updated user after adding category:', updatedUser);
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
        return { success: true, category: updatedUser?.usercategories[updatedUser?.usercategories?.length - 1] };
      } catch (error) {
        console.error('Error adding category:', error);
        return { success: false, message: error?.message || 'Failed to add category' };
      }
    }
  }

  // Get categories available to the current user (admin-created or user-specific)
  async getAvailableCategories() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return []; // No user logged in, return empty array

    if (currentUser.role === 'admin') {
      return await this.getAdminCategories(); // Admin sees global categories
    } else {
      // Regular user sees their own categories
      return currentUser.usercategories || [];
    }
  }

  // For backward compatibility - now same as getAvailableCategories
  async getUserCategories() {
    return await this.getAvailableCategories();
  }


  async getAdminCategories() {
    // return JSON.parse(localStorage.getItem('imaps_admin_categories') || '[]');
    const adminCategories = await getAdminCategoriesApi();
    console.log('Fetched admin categories:', adminCategories);
    return adminCategories;
  }

  async updateCategory(categoryIdOrName, updates) {
    const user = this.getCurrentUser();
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    if (user.role === 'admin') {
    } else {
      const updatedUser = await updateCategory(user.id, categoryIdOrName, updates);
      console.log('Updated user after updating category:', updatedUser);
      localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      window.location.reload(); // Reload to reflect changes
      return { success: true, category: updatedUser?.usercategories?.find(cat => cat.id === categoryIdOrName) };
    }
    return { success: false, message: 'Category not found' };
  }

  async deleteCategory(categoryNameOrId) {
    const user = this.getCurrentUser();
    // const currentUser = this.getCurrentUser();
    // if (!currentUser) {
    //   return { success: false, message: 'No user logged in' };
    // }

    // if (currentUser.role === 'admin') {
    //   const adminCategories = await this.getAdminCategories();
    //   const filteredAdminCategories = adminCategories.filter(cat => cat.id !== categoryId);
    //   if (filteredAdminCategories.length !== adminCategories.length) {
    //     localStorage.setItem('imaps_admin_categories', JSON.stringify(filteredAdminCategories));
    //     return { success: true };
    //   }
    // } else {
    //   // For regular users, delete from their specific userCategories array
    //   const users = this.getUsers();
    //   if (users[currentUser.email]) {
    //     const originalLength = users[currentUser.email].usercategories.length;
    //     users[currentUser.email].usercategories = users[currentUser.email].usercategories.filter(cat => cat.id !== categoryId);

    //     if (users[currentUser.email].usercategories.length !== originalLength) {
    //       localStorage.setItem('imaps_users', JSON.stringify(users));

    //       // IMPORTANT: Update current user in localStorage
    //       const updatedUser = users[currentUser.email];
    //       localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
    //       return { success: true };
    //     }
    //   } else {
    //     return { success: false, message: 'User not found' };
    //   }
    if (user.role === 'admin') {
      const adminCategories = await deleteAdminCategory(categoryNameOrId);
      console.log('response:::', adminCategories);

    } else {
      const response = await deleteUserCategory(user.id, categoryNameOrId);
      localStorage.setItem('imaps_current_user', JSON.stringify(response));
      if (response) {
        window.location.reload(); // Reload to reflect changes
        return { success: true, message: 'Category deleted successfully' };
      }
    }
    return { success: false, message: 'Category not found' };
  }

  // Get count of POIs in a specific category for the current user
  async getPOICountInCategory(categoryId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 0;

    const userPOIs = await this.getUserPOIs();
    return userPOIs?.filter(poi => poi.categoryId === categoryId)?.length;
  };

  // Get count of user's custom categories
  async getUserCategoryCount() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 0;

    if (currentUser.role === 'admin') {
      return await this.getAdminCategories()?.length;
    } else {
      return (currentUser?.usercategories || [])?.length;
    }
  };

  // Custom Icons Management
  addCustomIcon(iconData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    const customIcon = {
      id: `custom_${Date.now()}`,
      ...iconData,
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };

    if (currentUser.role === 'admin') {
      // Admin icons are global
      const adminIcons = this.getAdminCustomIcons();
      adminIcons.push(customIcon);
      localStorage.setItem('imaps_admin_custom_icons', JSON.stringify(adminIcons));
    } else {
      const users = this.getUsers();
      if (users[currentUser.email]) {
        users[currentUser.email].customIcons.push(customIcon);
        localStorage.setItem('imaps_users', JSON.stringify(users));
        
        // Update current user
        const updatedUser = users[currentUser.email];
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      }
    }
    
    return { success: true, icon: customIcon };
  }

  getUserCustomIcons() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return this.getAllCustomIcons();
    }
    
    // For regular users, return admin icons + user icons
    const adminIcons = this.getAdminCustomIcons();
    const userIcons = currentUser.customIcons || [];
    return [...adminIcons, ...userIcons];
  }

  getAllCustomIcons() {
    const users = this.getUsers();
    const adminIcons = this.getAdminCustomIcons();
    let allIcons = [...adminIcons];
    
    Object.values(users).forEach(user => {
      allIcons = allIcons.concat(user.customIcons || []);
    });
    
    return allIcons;
  }

  getAdminCustomIcons() {
    return JSON.parse(localStorage.getItem('imaps_admin_custom_icons') || '[]');
  }

  // Plan Management
  async updateUserPlan(plan) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    try {
      // Call changeUserPlan API
      const updatedUser = await import('../api/hooks/useAPI').then(mod => mod.changeUserPlan(currentUser.id, plan));
      // Update local storage
      const users = await this.getUsers();
      if (users[currentUser.email]) {
        users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
        localStorage.setItem('imaps_users', JSON.stringify(users));
        localStorage.setItem('imaps_current_user', JSON.stringify(users[currentUser.email]));
        return { success: true, user: users[currentUser.email] };
      }
      return { success: false, message: 'User not found' };
    } catch (error) {
      return { success: false, message: error?.message || 'Failed to update plan' };
    }
  }

  // Utility Methods
  clearAllData() {
    localStorage.removeItem('imaps_users');
    localStorage.removeItem('imaps_current_user');
    localStorage.removeItem('imaps_admin_pois');
    localStorage.removeItem('imaps_admin_categories');
    localStorage.removeItem('imaps_admin_custom_icons');
    this.initializeDB();
  }

  exportUserData() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    return {
      user: currentUser,
      exportedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const localDB = new LocalStorageDB();
export default localDB;
