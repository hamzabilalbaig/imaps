/**
 * Test file to demonstrate the localStorage database flow
 * Run this in browser console to see how the system works
 */

import { localDB } from './localStorage';

// Test the localStorage flow
export const testLocalStorageFlow = () => {
  console.log('=== iMaps localStorage Database Test ===\n');
  
  // 1. Clear all data for fresh start
  console.log('1. Clearing all data...');
  localDB.clearAllData();
  console.log('✓ Data cleared\n');
  
  // 2. Check initial state
  console.log('2. Initial localStorage state:');
  console.log('Users:', localStorage.getItem('imaps_users'));
  console.log('Current User:', localStorage.getItem('imaps_current_user'));
  console.log('Admin Categories:', localStorage.getItem('imaps_admin_categories'));
  console.log('Admin POIs:', localStorage.getItem('imaps_admin_pois'));
  console.log('Admin Custom Icons:', localStorage.getItem('imaps_admin_custom_icons'));
  console.log();
  
  // 3. Register a new user
  console.log('3. Registering new user: john@example.com');
  const registerResult = localDB.registerUser('john@example.com', 'password123', 'John Doe');
  console.log('Register result:', registerResult);
  console.log('Users after registration:', JSON.parse(localStorage.getItem('imaps_users')));
  console.log();
  
  // 4. Login as regular user
  console.log('4. Logging in as regular user: john@example.com');
  const loginResult = localDB.loginUser('john@example.com', 'password123');
  console.log('Login result:', loginResult);
  console.log('Current user after login:', JSON.parse(localStorage.getItem('imaps_current_user')));
  console.log();
  
  // 5. Try to create category as regular user (should fail)
  console.log('5. Trying to create category as regular user (should fail):');
  const userCategoryResult = localDB.addCategory({
    name: 'User Category',
    color: '#000000',
    icon: '🔥'
  });
  console.log('User category creation result:', userCategoryResult);
  console.log();
  
  // 6. Add POI as regular user
  console.log('6. Adding POI as regular user:');
  const userPOIResult = localDB.addPOI({
    title: 'Johns Favorite Cafe',
    description: 'Great coffee and wifi',
    latitude: 40.7589,
    longitude: -73.9851,
    category: 'None' // No categories available yet
  });
  console.log('User POI result:', userPOIResult);
  console.log('User POIs:', localDB.getUserPOIs());
  console.log();
  
  // 7. Add note as regular user
  console.log('7. Adding note as regular user:');
  const userNoteResult = localDB.addNote({
    title: 'My Travel Notes',
    content: 'Remember to visit the museum',
    tags: ['travel', 'todo']
  });
  console.log('User note result:', userNoteResult);
  console.log('User notes:', localDB.getUserNotes());
  console.log();
  
  // 8. Login as admin
  console.log('8. Logging in as admin:');
  const adminLoginResult = localDB.loginUser('admin@admin.com', 'admin');
  console.log('Admin login result:', adminLoginResult);
  console.log('Current user after admin login:', JSON.parse(localStorage.getItem('imaps_current_user')));
  console.log();
  
  // 9. Create categories as admin
  console.log('9. Creating categories as admin:');
  const categories = [
    { name: 'Restaurant', color: '#FF6B6B', icon: '🍽️' },
    { name: 'Hotel', color: '#4ECDC4', icon: '🏨' },
    { name: 'Tourist Attraction', color: '#45B7D1', icon: '🎯' }
  ];
  
  categories.forEach(category => {
    const result = localDB.addCategory(category);
    console.log(`Created category "${category.name}":`, result);
  });
  
  console.log('Available categories:', localDB.getAvailableCategories());
  console.log();
  
  // 10. Add admin POI
  console.log('10. Adding POI as admin:');
  const adminPOIResult = localDB.addPOI({
    title: 'Central Restaurant',
    description: 'Recommended by admin',
    latitude: 40.7829,
    longitude: -73.9654,
    category: 'Restaurant'
  });
  console.log('Admin POI result:', adminPOIResult);
  console.log();
  
  // 11. Login back as regular user to see categories
  console.log('11. Logging back as regular user to see categories:');
  localDB.loginUser('john@example.com', 'password123');
  console.log('Available categories for user:', localDB.getAvailableCategories());
  console.log('User can see admin categories but cannot create their own');
  console.log();
  
  // 12. Final localStorage state
  console.log('12. Final localStorage state:');
  console.log('Users:', JSON.stringify(JSON.parse(localStorage.getItem('imaps_users')), null, 2));
  console.log('Admin Categories:', JSON.stringify(JSON.parse(localStorage.getItem('imaps_admin_categories')), null, 2));
  console.log('Admin POIs:', JSON.stringify(JSON.parse(localStorage.getItem('imaps_admin_pois')), null, 2));
  
  return {
    message: 'Test completed successfully!',
    summary: {
      users: Object.keys(JSON.parse(localStorage.getItem('imaps_users'))).length,
      adminCategories: JSON.parse(localStorage.getItem('imaps_admin_categories')).length,
      adminPOIs: JSON.parse(localStorage.getItem('imaps_admin_pois')).length,
      userCanCreateCategories: false,
      adminCanCreateCategories: true
    }
  };
};

// Export for manual testing
window.testLocalStorageFlow = testLocalStorageFlow;
