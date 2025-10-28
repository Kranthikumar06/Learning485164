// Notification System for Secure My Campus
// Shows toast notifications that slide up from bottom and disappear

function showNotification(message, type = 'success', duration = 5000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Set notification styles
  notification.style.cssText = `
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                 type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                 type === 'info' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 
                 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    margin-bottom: 12px;
    min-width: 300px;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Poppins', Arial, sans-serif;
    font-size: 15px;
    font-weight: 500;
    pointer-events: auto;
    cursor: pointer;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  `;

  // Add icon based on type
  const icon = document.createElement('span');
  icon.style.cssText = `
    font-size: 24px;
    flex-shrink: 0;
  `;
  icon.innerHTML = type === 'success' ? '✓' : 
                   type === 'error' ? '✕' : 
                   type === 'info' ? 'ⓘ' : '⚠';
  
  // Add message text
  const text = document.createElement('span');
  text.textContent = message;
  text.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;

  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    font-size: 18px;
    cursor: pointer;
    opacity: 0.8;
    flex-shrink: 0;
    margin-left: 8px;
  `;
  closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
  closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';

  notification.appendChild(icon);
  notification.appendChild(text);
  notification.appendChild(closeBtn);
  container.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);

  // Function to remove notification
  const removeNotification = () => {
    notification.style.transform = 'translateY(-20px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  };

  // Click to close
  notification.onclick = removeNotification;
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    removeNotification();
  };

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(removeNotification, duration);
  }

  return notification;
}

// Specific notification functions
function showSuccessNotification(message, duration) {
  return showNotification(message, 'success', duration);
}

function showErrorNotification(message, duration) {
  return showNotification(message, 'error', duration);
}

function showInfoNotification(message, duration) {
  return showNotification(message, 'info', duration);
}

function showWarningNotification(message, duration) {
  return showNotification(message, 'warning', duration);
}

// Email verification specific notification
function showVerificationEmailSent(email) {
  const message = `Verification email sent to ${email}. Please check your inbox and verify your account.`;
  return showNotification(message, 'info', 7000);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showNotification,
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification,
    showWarningNotification,
    showVerificationEmailSent
  };
}
