# POI Image Upload Feature - Visual Guide

## Admin Panel - Plans Tab

### Plan Card Display
Each plan card now shows the "POI Images" status:

```
┌─────────────────────────────────────────┐
│  Free Plan                    [⚙️ Edit] │
│  0 users • $0.00/month                  │
│  Basic plan with limited features       │
├─────────────────────────────────────────┤
│  Max Categories          10             │
│  Total POI Limit        100             │
│  Max Notes               5              │
│  POI Images         [Disabled] 🔴       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Premium Plan                 [⚙️ Edit] │
│  2 users • $5.00/month                  │
│  Enhanced plan with more features       │
├─────────────────────────────────────────┤
│  Max Categories          20             │
│  Total POI Limit        400             │
│  Max Notes              50              │
│  POI Images         [Enabled] ✅        │
└─────────────────────────────────────────┘
```

### Edit Plan Dialog

When clicking the ⚙️ Edit button, the dialog now includes:

```
┌────── Edit free Configuration ──────┐
│                                     │
│  Price (per month)                  │
│  $ [0.00]                          │
│                                     │
│  Description                        │
│  [Basic plan with limited...]      │
│                                     │
│  Max Custom Categories              │
│  [10]                              │
│                                     │
│  Total POI Limit                   │
│  [100]                             │
│                                     │
│  Max Notes                         │
│  [5]                               │
│                                     │
│  ⚪ Allow POI Images    ◀── NEW!   │
│  🟢 Plan Active                    │
│                                     │
│  [Cancel]  [Update Plan Config]    │
└────────────────────────────────────┘
```

## User Experience - Create My POI Form & Edit My POI Form

Both the Create and Edit forms behave identically with regards to POI image uploads.

### When POI Images Are ENABLED (Premium/Unlimited)

```
┌─────── Create My POI ──────────┐
│                                │
│  POI Name *                    │
│  [                           ] │
│                                │
│  Description                   │
│  [                           ] │
│                                │
│  Usage Status                  │
│  ℹ️ My POIs: 3/4              │
│  ℹ️ Subcategories: 2/2        │
│                                │
│  POI Image                     │
│  ┌──────────────────────────┐ │
│  │ [📤 Choose Image File]   │ │
│  └──────────────────────────┘ │
│                                │
│  Subcategory *                 │
│  [Restaurants ▼]        [+]    │
│                                │
│  [Cancel]    [Create POI]      │
└────────────────────────────────┘
```

### When POI Images Are DISABLED (Free Plan)

```
┌─────── Create My POI ──────────┐
│                                │
│  POI Name *                    │
│  [                           ] │
│                                │
│  Description                   │
│  [                           ] │
│                                │
│  Usage Status                  │
│  ℹ️ My POIs: 3/4              │
│  ℹ️ Subcategories: 2/2        │
│                                │
│  POI Image                     │
│  ┌──────────────────────────┐ │
│  │ ⚠️ You need to upgrade    │ │
│  │ your plan to use this     │ │
│  │ feature                   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 📤 Choose Image File  🚫 │ │ ◀── DISABLED
│  └──────────────────────────┘ │
│  (Button is grayed out)        │
│                                │
│  Subcategory *                 │
│  [Restaurants ▼]        [+]    │
│                                │
│  [Cancel]    [Create POI]      │
└────────────────────────────────┘
```

## Implementation Details

### Visual States

1. **Enabled State**
   - ✅ Green "Enabled" chip in admin plan cards
   - 📤 Active file upload button
   - Full opacity, normal cursor
   - File input is functional

2. **Disabled State**
   - 🔴 Gray "Disabled" chip in admin plan cards
   - ⚠️ Warning alert with upgrade message
   - 📤 Grayed out file upload button
   - Reduced opacity (50%)
   - Not-allowed cursor
   - No file input rendered

### Color Coding

- **Enabled**: Green chip with green border
- **Disabled**: Gray chip with gray border
- **Warning Alert**: Yellow/Orange background with warning icon

### Message Text

The warning message when disabled:
> "You need to upgrade your plan to use this feature"

This message is clear, actionable, and encourages plan upgrades.

## Edit My POI Form - Example

The Edit My POI form follows the same pattern as Create My POI:

### When DISABLED (Free Plan)

```
┌────────── Edit My POI ──────────┐
│                            [X]  │
│  POI Name *                     │
│  [test edited              ]    │
│                                 │
│  Description                    │
│  [                         ]    │
│                                 │
│  Category *                     │
│  [mysubcat            ▼]        │
│                                 │
│  POI Image (Optional)           │
│  ┌───────────────────────────┐ │
│  │ ⚠️ You need to upgrade     │ │
│  │ your plan to use this      │ │
│  │ feature                    │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 📤 Upload Image       🚫  │ │ ◀── DISABLED
│  └───────────────────────────┘ │
│  (Button is grayed out)         │
│                                 │
│  [Cancel]      [Save Changes]   │
└─────────────────────────────────┘
```

### When ENABLED (Premium/Unlimited)

```
┌────────── Edit My POI ──────────┐
│                            [X]  │
│  POI Name *                     │
│  [test edited              ]    │
│                                 │
│  Description                    │
│  [                         ]    │
│                                 │
│  Category *                     │
│  [mysubcat            ▼]        │
│                                 │
│  POI Image (Optional)           │
│  ┌───────────────────────────┐ │
│  │ 📤 Upload Image           │ │ ◀── ACTIVE
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │    [Current POI Image]    │ │
│  │   (if already uploaded)   │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]      [Save Changes]   │
└─────────────────────────────────┘
```
