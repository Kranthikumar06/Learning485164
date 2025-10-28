# Notification System Documentation

## Overview
The notification system provides elegant toast notifications that slide up from the bottom of the screen and automatically disappear. It's designed to be non-intrusive and provide important feedback to users.

## Features
- ✨ **Smooth Animations**: Slides up from bottom with smooth cubic-bezier transitions
- 🎨 **Multiple Types**: Success, Error, Info, and Warning notifications
- 🎯 **Auto-dismiss**: Automatically disappears after specified duration
- 👆 **Click to Dismiss**: Users can click to dismiss immediately
- 🎭 **Non-intrusive**: Positioned at bottom-right, doesn't block content
- 📱 **Responsive**: Works on all screen sizes
- 🔄 **Reusable**: Single file can be used across entire application

## File Location
```
public/javascripts/notification.js
```

## Implementation

### 1. Include the Script
Add the notification script to your page:

```jade
script(src="/javascripts/notification.js")
```

### 2. Basic Usage

#### Success Notification
```javascript
showSuccessNotification('Action completed successfully!');
```

#### Error Notification
```javascript
showErrorNotification('Something went wrong!');
```

#### Info Notification
```javascript
showInfoNotification('Here is some information.');
```

#### Warning Notification
```javascript
showWarningNotification('Please be careful!');
```

#### Email Verification Notification
```javascript
showVerificationEmailSent('user@anurag.edu.in');
```

### 3. Advanced Usage

#### Custom Duration
```javascript
// Show notification for 10 seconds
showNotification('Custom message', 'success', 10000);
```

#### Persistent Notification (No Auto-dismiss)
```javascript
// Duration = 0 means it won't auto-dismiss
showNotification('Important message', 'warning', 0);
```

#### Custom Notification
```javascript
showNotification(
  'Your custom message here',
  'success',  // Type: 'success', 'error', 'info', or 'warning'
  5000        // Duration in milliseconds
);
```

## Integration Examples

### Signup Flow
When a user signs up, they're redirected to signin page with notification:

**Backend (users.js):**
```javascript
res.redirect('/users/signin?verificationSent=true&email=' + encodeURIComponent(email));
```

**Frontend (signin.jade):**
```jade
script(src="/javascripts/notification.js")
script.
  const urlParams = new URLSearchParams(window.location.search);
  const verificationSent = urlParams.get('verificationSent');
  const email = urlParams.get('email');
  
  if (verificationSent === 'true' && email) {
    setTimeout(() => {
      showVerificationEmailSent(email);
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 500);
  }
```

### Form Submission
```javascript
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: new FormData(e.target)
    });
    
    if (response.ok) {
      showSuccessNotification('Form submitted successfully!');
    } else {
      showErrorNotification('Failed to submit form. Please try again.');
    }
  } catch (error) {
    showErrorNotification('Network error. Please check your connection.');
  }
});
```

### AJAX Request
```javascript
fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    showSuccessNotification('Data loaded successfully!');
  })
  .catch(error => {
    showErrorNotification('Failed to load data.');
  });
```

## Styling

### Notification Types & Colors

| Type | Background Gradient | Icon | Use Case |
|------|-------------------|------|----------|
| Success | Green (#10b981 → #059669) | ✓ | Completed actions, successful operations |
| Error | Red (#ef4444 → #dc2626) | ✕ | Failed operations, validation errors |
| Info | Blue (#3b82f6 → #2563eb) | ⓘ | General information, updates |
| Warning | Orange (#f59e0b → #d97706) | ⚠ | Warnings, important notices |

### Animation Details
- **Entrance**: Slides up from 100px below viewport with fade-in
- **Duration**: 0.4s with cubic-bezier(0.68, -0.55, 0.265, 1.55) easing
- **Exit**: Fades up 20px with opacity transition
- **Auto-dismiss**: Default 5 seconds for general, 7 seconds for verification

## API Reference

### Functions

#### `showNotification(message, type, duration)`
Main function for showing notifications.

**Parameters:**
- `message` (string): The notification message to display
- `type` (string): Type of notification - 'success', 'error', 'info', or 'warning'
- `duration` (number): Time in milliseconds before auto-dismiss (0 = no auto-dismiss)

**Returns:** Notification DOM element

---

#### `showSuccessNotification(message, duration)`
Shorthand for showing success notifications.

**Parameters:**
- `message` (string): Success message
- `duration` (number, optional): Default 5000ms

---

#### `showErrorNotification(message, duration)`
Shorthand for showing error notifications.

**Parameters:**
- `message` (string): Error message
- `duration` (number, optional): Default 5000ms

---

#### `showInfoNotification(message, duration)`
Shorthand for showing info notifications.

**Parameters:**
- `message` (string): Information message
- `duration` (number, optional): Default 5000ms

---

#### `showWarningNotification(message, duration)`
Shorthand for showing warning notifications.

**Parameters:**
- `message` (string): Warning message
- `duration` (number, optional): Default 5000ms

---

#### `showVerificationEmailSent(email)`
Specialized function for email verification notifications.

**Parameters:**
- `email` (string): The email address where verification was sent

**Duration:** 7000ms (7 seconds)

## Testing

### Demo Page
Open `notification-demo.html` in your browser to test all notification types:

```bash
# From project root
start notification-demo.html
```

### Manual Testing
1. Sign up with a new account
2. After signup, you should see the verification email notification on the signin page
3. The notification should slide up from bottom and disappear after 7 seconds
4. Click the notification to dismiss it early

## Browser Compatibility
- ✅ Chrome/Edge (Modern)
- ✅ Firefox (Modern)
- ✅ Safari (Modern)
- ✅ Mobile browsers

## Performance
- **Lightweight**: ~7KB unminified
- **No Dependencies**: Pure JavaScript, no libraries required
- **Efficient**: Uses CSS transitions for smooth animations
- **Z-index**: 10000 (ensures visibility above other content)

## Troubleshooting

### Notification Not Showing
1. Check that `notification.js` is loaded:
   ```javascript
   console.log(typeof showNotification); // Should return 'function'
   ```

2. Check browser console for errors

3. Ensure z-index of other elements isn't higher than 10000

### Notification Position Issues
The notification container is positioned at `bottom: 20px; right: 20px`. Adjust in the `showNotification` function if needed:

```javascript
container.style.cssText = `
  position: fixed;
  bottom: 20px;  /* Adjust this */
  right: 20px;   /* Adjust this */
  z-index: 10000;
  pointer-events: none;
`;
```

### Multiple Notifications Overlapping
The system automatically stacks multiple notifications. Each has `margin-bottom: 12px` for spacing.

## Best Practices

1. **Keep Messages Concise**: Aim for one line of text
2. **Use Appropriate Types**: Match the notification type to the action
3. **Don't Spam**: Avoid showing too many notifications at once
4. **Provide Context**: Include relevant details (like email address)
5. **Duration**: Use longer durations for important messages
6. **Clean URLs**: Remove query parameters after showing notification

## Future Enhancements

Potential improvements for future versions:
- [ ] Sound effects
- [ ] Progress bar showing remaining time
- [ ] Action buttons within notifications
- [ ] Position options (top-right, top-left, etc.)
- [ ] Queue system for managing many notifications
- [ ] Different animation styles
- [ ] Dark mode support
- [ ] Accessibility improvements (ARIA labels, screen reader support)

## Support

For issues or questions about the notification system:
- Check this documentation
- Test with `notification-demo.html`
- Review browser console for errors
- Verify `notification.js` is properly included

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Author:** Secure My Campus Team
