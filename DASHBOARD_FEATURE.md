# Dashboard Collection Feature

## Overview
A new "dashboard" collection has been added to the application. This collection stores dashboard-related data that will be displayed on the dashboard page alongside complaints.

## Changes Made

### 1. New Dashboard Model
- **File**: `models/Dashboard.js`
- **Fields**:
  - `title`: String - Title of the dashboard item
  - `description`: String - Description of the dashboard item
  - `data`: Object - Any JSON data to be displayed
  - `createdAt`: Date - Timestamp of creation
  - `updatedAt`: Date - Timestamp of last update

### 2. Updated Dashboard Route
- **File**: `app_server/routes/pages.js`
- The `/dashboard` route now fetches data from the Dashboard collection
- Added a new POST route `/add-dashboard-data` for adding dashboard items (admin only)

### 3. Updated Dashboard View
- **File**: `app_server/views/dashboard.jade`
- Added a new section to display dashboard data above the complaints table
- Dashboard items are displayed in a card layout

### 4. Updated Dashboard Styles
- **File**: `public/stylesheets/dashboard.css`
- Added new CSS styles for the dashboard cards section
- Responsive design for mobile devices

## How to Use

### Adding Dashboard Data

#### Method 1: Using the Helper Script
Run the following command to add sample data:
```bash
node add_dashboard_data.js
```

#### Method 2: Using MongoDB directly
Connect to your MongoDB database and insert data into the `dashboards` collection:
```javascript
db.dashboards.insertOne({
  title: "Your Title",
  description: "Your description",
  data: { key: "value" },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Method 3: Using the API (Admin only)
Send a POST request to `/add-dashboard-data` with the following body:
```json
{
  "title": "Your Title",
  "description": "Your description",
  "data": { "key": "value" }
}
```

### Viewing Dashboard Data
1. Sign in to your account
2. Navigate to the Dashboard page
3. Dashboard data will appear at the top of the page above the complaints table

## Data Structure Example

```javascript
{
  title: "System Statistics",
  description: "Overview of system statistics and metrics",
  data: {
    totalUsers: 150,
    activeComplaints: 23,
    resolvedComplaints: 87,
    averageResolutionTime: "2.5 days"
  }
}
```

## Features
- ✅ Display multiple dashboard items in a grid layout
- ✅ Responsive design for mobile and desktop
- ✅ JSON data is formatted and displayed in a readable format
- ✅ Shows creation date for each dashboard item
- ✅ Only displays when dashboard data exists
- ✅ Admin-only data creation (via API)

## Testing
1. Start your application: `npm start`
2. Add sample data: `node add_dashboard_data.js`
3. Sign in and visit the dashboard page
4. You should see the dashboard data cards displayed at the top

## Notes
- Dashboard data is displayed in reverse chronological order (newest first)
- The dashboard collection is separate from the complaints collection
- All authenticated users can view dashboard data
- Only admins can add new dashboard data via the API endpoint
