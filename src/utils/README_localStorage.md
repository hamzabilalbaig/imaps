# localStorage Database Structure - Updated

## Overview
The localStorage database now has **no default categories** and **no user categories**. Only admin can manage categories.

## localStorage Keys

### 1. `imaps_users`
Stores all registered users and their data:
```json
{
  "john@example.com": {
    "id": "1720627200000",
    "email": "john@example.com", 
    "password": "password123",
    "name": "John Doe",
    "plan": "Free",
    "role": "user",
    "createdAt": "2025-07-10T14:30:00.000Z",
    "pois": [
      {
        "id": "1720627300000",
        "title": "My Favorite Cafe",
        "description": "Great coffee",
        "latitude": 40.7829,
        "longitude": -73.9654,
        "category": "Restaurant", // Can only use admin categories
        "createdAt": "2025-07-10T14:35:00.000Z",
        "userId": "1720627200000"
      }
    ],
    "notes": [
      {
        "id": "1720627400000", 
        "title": "Travel Notes",
        "content": "Places to visit",
        "createdAt": "2025-07-10T14:40:00.000Z",
        "userId": "1720627200000"
      }
    ],
    "customIcons": []
  }
}
```

### 2. `imaps_current_user`
Stores currently logged-in user:
```json
{
  "id": "1720627200000",
  "email": "john@example.com",
  "name": "John Doe", 
  "plan": "Free",
  "role": "user",
  "pois": [...],
  "notes": [...],
  "customIcons": [...]
}
```

### 3. `imaps_admin_categories` 
**Initially empty** - only admin can add categories:
```json
[]
```

After admin creates categories:
```json
[
  {
    "id": "category-1720627500000-abc123",
    "name": "Restaurant",
    "color": "#FF6B6B", 
    "icon": "🍽️",
    "createdAt": "2025-07-10T14:45:00.000Z",
    "userId": "admin"
  },
  {
    "id": "category-1720627600000-def456", 
    "name": "Hotel",
    "color": "#4ECDC4",
    "icon": "🏨", 
    "createdAt": "2025-07-10T14:50:00.000Z",
    "userId": "admin"
  }
]
```

### 4. `imaps_admin_pois`
Admin-created POIs visible to all users:
```json
[
  {
    "id": "1720627700000",
    "title": "Recommended Restaurant", 
    "description": "Admin recommendation",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "category": "Restaurant",
    "createdAt": "2025-07-10T14:55:00.000Z",
    "userId": "admin",
    "userEmail": "admin@admin.com",
    "userName": "Administrator"
  }
]
```

### 5. `imaps_admin_custom_icons`
Admin-created custom icons:
```json
[
  {
    "id": "custom_1720627800000",
    "name": "Custom Restaurant Icon",
    "url": "data:image/svg+xml;base64,PHN2Zy...",
    "createdAt": "2025-07-10T15:00:00.000Z", 
    "userId": "admin"
  }
]
```

## Key Changes Made

1. **Removed Default Categories**: No categories are created on initialization
2. **Admin-Only Category Management**: Only admin can create, edit, delete categories
3. **Clean Initial State**: Users start with empty category list
4. **No User Categories**: Users cannot create their own categories

## User Flow

### New User Registration:
1. User registers → gets "Free" plan
2. User sees **no categories** initially  
3. User can create POIs without categories or use "None"

### Admin Creates Categories:
1. Admin logs in
2. Admin creates categories (Restaurant, Hotel, etc.)
3. **All users** can now see and use these categories

### User Creates POI:
1. User selects from **admin-created categories only**
2. Cannot create custom categories
3. POI is saved to user's personal POI list

## Benefits

- **Centralized Control**: Admin controls what categories exist
- **Consistency**: All users use same category system
- **Clean Start**: No clutter of default categories
- **Scalable**: Admin can add categories as needed
- **User Isolation**: Each user's POIs and notes are separate
