// assets/app.js
(function () {
  const cfg = window.APP_CONFIG;
  if (!cfg) throw new Error("Missing APP_CONFIG (assets/config.js)");

  // Load Parse
  window.initParse = function initParse() {
    if (!window.Parse) throw new Error("Parse SDK not loaded");
    Parse.initialize(cfg.APP_ID, cfg.JS_KEY);
    Parse.serverURL = cfg.SERVER_URL;
  };

  window.requireAuth = function requireAuth() {
    if (!Parse.User.current()) {
      location.href = "../auth/login.html";
      return false;
    }
    return true;
  };

  window.logout = async function logout() {
    await Parse.User.logOut();
    location.href = "../auth/login.html";
  };

  window.toast = function toast(el, msg) {
    if (el) el.textContent = msg;
  };
})();
