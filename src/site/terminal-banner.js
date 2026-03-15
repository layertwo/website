document.addEventListener('DOMContentLoaded', function () {
  var el = document.querySelector('.banner-last-login');
  if (!el) return;
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var d = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var day = String(d.getDate()).padStart(2, ' ');
  var ts = days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + day + ' ' +
           pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' +
           d.getFullYear();
  el.textContent = 'Last login: ' + ts + ' on layertwo.dev';
});
