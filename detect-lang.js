(function () {
  const supportedLangs = ['pl', 'en', 'ua', 'uk']; // DODAJ 'uk'
  const browserLang = (
    navigator.language || 
    navigator.userLanguage || 
    navigator.browserLanguage || 
    navigator.systemLanguage || 
    'en'
  ).toLowerCase().split('-')[0];

  // Mapowanie: uk → ua
  const langMap = { 'uk': 'ua' };
  let detected = browserLang;
  if (langMap[detected]) detected = langMap[detected];

  const lang = supportedLangs.includes(detected) ? detected : 'en';

  // Ustaw aktywny przycisk
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  function trySetLanguage() {
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    } else {
      setTimeout(trySetLanguage, 50);
    }
  }

  trySetLanguage();
})();