
document.addEventListener('DOMContentLoaded', function() {
  function updateTimers() {
    var now = Date.now();
    var timers = document.querySelectorAll('.timer-dynamic[data-expires-at]');
    timers.forEach(function(el) {
      var expiresAt = parseInt(el.getAttribute('data-expires-at'), 10);
      if (isNaN(expiresAt) || expiresAt < 1000000000000) {
        el.textContent = 'Expired';
        return;
      }
      var secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      if (secondsLeft > 0) {
        var days = Math.floor(secondsLeft / (24 * 60 * 60));
        var hrs = Math.floor((secondsLeft % (24 * 60 * 60)) / 3600);
        el.textContent = 'Time left: ' + days + ' days ' + hrs + ' hrs';
      } else {
        el.textContent = 'Expired';
      }
    });
  }
  setInterval(updateTimers, 1000);
  updateTimers();
});

