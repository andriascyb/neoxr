/**
 * admin/components/notify.js
 * Helper notifikasi UI terpadu. Output berupa JS string yang akan disuntik
 * ke <script> oleh admin/index.js.
 *
 * Memberi window.kNotify({type, title, message, timeout}) agar section/JS
 * lain bisa pakai notifikasi seragam menggantikan alert() / bootstrap.Toast
 * yang tersebar.
 *
 * Compat: tetap menyediakan kNotify.success/error/info/warn shortcut.
 * Tidak menggantikan elemen <div id="settings-toast"> bawaan (Bootstrap)
 * agar saveSettings() lama tetap bekerja.
 */

function renderNotifyScript() {
  return `
(function(){
  if (window.kNotify && window.kNotify.__installed) return;
  var STACK_ID = 'kr-notify-stack';
  function ensureStack() {
    var el = document.getElementById(STACK_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = STACK_ID;
    el.className = 'kr-notify-stack';
    document.body.appendChild(el);
    return el;
  }
  function escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function notify(opt) {
    opt = opt || {};
    var type = String(opt.type || 'info').toLowerCase();
    if (['success','error','warn','warning','info'].indexOf(type) === -1) type = 'info';
    if (type === 'warning') type = 'warn';
    var stack = ensureStack();
    var item = document.createElement('div');
    item.className = 'kr-notify kr-notify--' + type;
    var iconMap = { success:'bi-check-circle-fill', error:'bi-exclamation-octagon-fill', warn:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' };
    item.innerHTML = ''
      + '<i class="bi ' + iconMap[type] + ' kr-notify__icon"></i>'
      + '<div class="kr-notify__body">'
      +   (opt.title ? '<strong class="kr-notify__title">' + escape(opt.title) + '</strong>' : '')
      +   '<span class="kr-notify__message">' + escape(opt.message || '') + '</span>'
      + '</div>'
      + '<button type="button" class="kr-notify__close" aria-label="Tutup">&times;</button>';
    stack.appendChild(item);
    requestAnimationFrame(function(){ item.classList.add('is-shown'); });
    var timeout = Math.max(1500, Number(opt.timeout) || 3500);
    var timer = setTimeout(dismiss, timeout);
    function dismiss() {
      clearTimeout(timer);
      item.classList.remove('is-shown');
      setTimeout(function(){ if (item.parentNode) item.parentNode.removeChild(item); }, 220);
    }
    item.querySelector('.kr-notify__close').addEventListener('click', dismiss);
    return { dismiss: dismiss };
  }
  notify.success = function(message, title) { return notify({ type: 'success', message: message, title: title }); };
  notify.error   = function(message, title) { return notify({ type: 'error',   message: message, title: title }); };
  notify.warn    = function(message, title) { return notify({ type: 'warn',    message: message, title: title }); };
  notify.info    = function(message, title) { return notify({ type: 'info',    message: message, title: title }); };
  notify.__installed = true;
  window.kNotify = notify;
})();
`;
}

module.exports = { renderNotifyScript };
