/**
 * Local Storage Database Management System for iMaps
 * Handles user registration, authentication, POIs, notes, and categories
 */

class LocalStorageDB {
  constructor() {
    this.initializeDB();
  }

  initializeDB() {
    if (!localStorage.getItem('imaps_users')) {
      localStorage.setItem('imaps_users', JSON.stringify({}));
    }
    if (!localStorage.getItem('imaps_current_user')) {
      localStorage.setItem('imaps_current_user', null);
    }
    
    // Initialize empty categories - only admin can create them
    if (!localStorage.getItem('imaps_admin_categories')) {
      localStorage.setItem('imaps_admin_categories', JSON.stringify([]));
    }
  }

  // User Management
  registerUser(email, password, name = '') {
    const users = this.getUsers();
    
    if (users[email]) {
      return { success: false, message: 'User already exists' };
    }

    const userData = {
      id: Date.now().toString(),
      email,
      password, // In production, hash this
      name,
      plan: 'free',
      role: 'user',
      createdAt: new Date().toISOString(),
      pois: [],
      notes: [],
      customIcons: [],
      userCategories: [] // This array will store categories specific to this user
    };

    users[email] = userData;
    localStorage.setItem('imaps_users', JSON.stringify(users));
    
    return { success: true, message: 'User registered successfully', user: userData };
  }

  loginUser(email, password) {
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
    const users = this.getUsers();
    const user = users[email];

    if (!user || user.password !== password) {
      return { success: false, message: 'Invalid email or password' };
    }

    localStorage.setItem('imaps_current_user', JSON.stringify(user));
    return { success: true, user, isAdmin: false };
  }

  getCurrentUser() {
    const currentUser = localStorage.getItem('imaps_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  logoutUser() {
    localStorage.removeItem('imaps_current_user');
  }

  getUsers() {
    return JSON.parse(localStorage.getItem('imaps_users')) || {};
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
  addPOI(poi) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    const poiData = {
      id: Date.now().toString(),
      ...poi,
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      categoryId: poi.categoryId || null // Store the category ID for per-category limits
    };

    const users = this.getUsers();
    if (currentUser.role === 'admin') {
      // Admin POIs are stored separately and visible to all
      const adminPOIs = this.getAdminPOIs();
      adminPOIs.push(poiData);
      localStorage.setItem('imaps_admin_pois', JSON.stringify(adminPOIs));
    } else if (users[currentUser.email]) {
      users[currentUser.email].pois.push(poiData);
      localStorage.setItem('imaps_users', JSON.stringify(users));
      
      // Update current user
      const updatedUser = users[currentUser.email];
      localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
    }
    
    return { success: true, poi: poiData };
  }

  getUserPOIs() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return this.getAllPOIs();
    }
    
    return currentUser.pois || [];
  }

  getAllPOIs() {
    const users = this.getUsers();
    const adminPOIs = this.getAdminPOIs();
    let allPOIs = [...adminPOIs];
    
    Object.values(users).forEach(user => {
      allPOIs = allPOIs.concat(user.pois || []);
    });
    
    return allPOIs;
  }

  getAdminPOIs() {
    return JSON.parse(localStorage.getItem('imaps_admin_pois') || '[]');
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

  deletePOI(poiId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    // Check admin POIs first
    if (currentUser.role === 'admin') {
      const adminPOIs = this.getAdminPOIs();
      const filteredAdminPOIs = adminPOIs.filter(poi => poi.id !== poiId);
      if (filteredAdminPOIs.length !== adminPOIs.length) {
        localStorage.setItem('imaps_admin_pois', JSON.stringify(filteredAdminPOIs));
        return { success: true };
      }
    }

    // Check user POIs
    const users = this.getUsers();
    if (users[currentUser.email]) {
      const originalLength = users[currentUser.email].pois.length;
      users[currentUser.email].pois = users[currentUser.email].pois.filter(poi => poi.id !== poiId);
      
      if (users[currentUser.email].pois.length !== originalLength) {
        localStorage.setItem('imaps_users', JSON.stringify(users));
        
        // Update current user
        const updatedUser = users[currentUser.email];
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'POI not found' };
  }

  // Notes Management
  addNote(note) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

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

  deleteNote(noteId) {
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
  addCategory(category) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    const categoryData = {
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...category,
      createdAt: new Date().toISOString(),
      userId: currentUser.id // Associate category with user/admin
    };

    if (currentUser.role === 'admin') {
      // Admin categories are stored globally
      const adminCategories = this.getAdminCategories();
      adminCategories.push(categoryData);
      localStorage.setItem('imaps_admin_categories', JSON.stringify(adminCategories));
    } else {
      // For regular users, add to their specific userCategories array
      const users = this.getUsers();
      if (users[currentUser.email]) {
        users[currentUser.email].userCategories.push(categoryData); // Add to user's categories
        localStorage.setItem('imaps_users', JSON.stringify(users));

        // IMPORTANT: Update current user in localStorage to reflect changes
        const updatedUser = users[currentUser.email];
        localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
      } else {
        return { success: false, message: 'User not found' };
      }
    }
    
    return { success: true, category: categoryData };
  }

  // Get categories available to the current user (admin-created or user-specific)
  getAvailableCategories() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return []; // No user logged in, return empty array

    if (currentUser.role === 'admin') {
      return this.getAdminCategories(); // Admin sees global categories
    } else {
      // Regular user sees their own categories
      return currentUser.userCategories || [];
    }
  }

  // For backward compatibility - now same as getAvailableCategories
  getUserCategories() {
    return this.getAvailableCategories();
  }


  getAdminCategories() {
    return JSON.parse(localStorage.getItem('imaps_admin_categories') || '[]');
  }

  updateCategory(categoryId, updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    if (currentUser.role === 'admin') {
      const adminCategories = this.getAdminCategories();
      const categoryIndex = adminCategories.findIndex(cat => cat.id === categoryId);
      if (categoryIndex !== -1) {
        adminCategories[categoryIndex] = {
          ...adminCategories[categoryIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('imaps_admin_categories', JSON.stringify(adminCategories));
        return { success: true, category: adminCategories[categoryIndex] };
      }
    } else {
      // For regular users, update their specific userCategories array
      const users = this.getUsers();
      if (users[currentUser.email]) {
        const categoryIndex = users[currentUser.email].userCategories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex !== -1) {
          users[currentUser.email].userCategories[categoryIndex] = {
            ...users[currentUser.email].userCategories[categoryIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('imaps_users', JSON.stringify(users));

          // IMPORTANT: Update current user in localStorage
          const updatedUser = users[currentUser.email];
          localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
          return { success: true, category: users[currentUser.email].userCategories[categoryIndex] };
        }
      } else {
        return { success: false, message: 'User not found' };
      }
    }
    
    return { success: false, message: 'Category not found' };
  }

  deleteCategory(categoryId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    if (currentUser.role === 'admin') {
      const adminCategories = this.getAdminCategories();
      const filteredAdminCategories = adminCategories.filter(cat => cat.id !== categoryId);
      if (filteredAdminCategories.length !== adminCategories.length) {
        localStorage.setItem('imaps_admin_categories', JSON.stringify(filteredAdminCategories));
        return { success: true };
      }
    } else {
      // For regular users, delete from their specific userCategories array
      const users = this.getUsers();
      if (users[currentUser.email]) {
        const originalLength = users[currentUser.email].userCategories.length;
        users[currentUser.email].userCategories = users[currentUser.email].userCategories.filter(cat => cat.id !== categoryId);

        if (users[currentUser.email].userCategories.length !== originalLength) {
          localStorage.setItem('imaps_users', JSON.stringify(users));

          // IMPORTANT: Update current user in localStorage
          const updatedUser = users[currentUser.email];
          localStorage.setItem('imaps_current_user', JSON.stringify(updatedUser));
          return { success: true };
        }
      } else {
        return { success: false, message: 'User not found' };
      }
    }
    
    return { success: false, message: 'Category not found' };
  }

  // Get count of POIs in a specific category for the current user
  getPOICountInCategory(categoryId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 0;

    const userPOIs = this.getUserPOIs();
    return userPOIs.filter(poi => poi.categoryId === categoryId).length;
  };

  // Get count of user's custom categories
  getUserCategoryCount() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 0;

    if (currentUser.role === 'admin') {
      return this.getAdminCategories().length;
    } else {
      return (currentUser.userCategories || []).length;
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
  updateUserPlan(plan) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user logged in' };

    return this.updateUser(currentUser.email, { plan });
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
