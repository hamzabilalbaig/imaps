import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { localDB } from '../utils/localStorage';

const CategoryExample = () => {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#FF6B6B',
    icon: '📍'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const availableCategories = localDB.getAvailableCategories();
    setCategories(availableCategories);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      setMessage('Category name is required');
      return;
    }

    const result = await localDB.addCategory(newCategory);
    
    if (result.success) {
      setMessage('Category created successfully!');
      setNewCategory({ name: '', color: '#FF6B6B', icon: '📍' });
      loadCategories();
    } else {
      setMessage(result.message);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    const result = localDB.deleteCategory(categoryId);
    
    if (result.success) {
      setMessage('Category deleted successfully!');
      loadCategories();
    } else {
      setMessage(result.message);
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to view categories.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Category Management</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p><strong>Current User:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Plan:</strong> {user.plan}</p>
      </div>

      {/* Category Creation (Admin Only) */}
      {isAdmin && (
        <div className="mb-8 p-4 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">Create New Category (Admin Only)</h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter category name"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  className="w-16 h-10 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  className="w-20 p-2 border rounded text-center"
                  placeholder="📍"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Category
            </button>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Available Categories {!isAdmin && '(Read Only)'}
        </h3>
        
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="p-4 border rounded-lg shadow-sm"
                style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">How Categories Work:</h4>
        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
          <li>• <strong>Admin:</strong> Can create, edit, and delete categories that all users can see</li>
          <li>• <strong>Users:</strong> Can only select from admin-created categories when adding POIs</li>
          <li>• <strong>Global:</strong> All categories are shared across the entire application</li>
          <li>• <strong>POI Creation:</strong> When adding a POI, you can select from these categories</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryExample;
