// detect-lang.js
(function () {
  const supportedLangs = ['pl', 'en', 'ua', 'uk', 'ru']; // dodajemy 'ru' i 'uk'
  
  // Mapowanie: ru → ua, uk → ua
  const langMap = {
    'ru': 'ua',
    'uk': 'ua'
  };

  // Pobierz język przeglądarki
  const browserLang = (
    navigator.language || 
    navigator.userLanguage || 
    navigator.browserLanguage || 
    navigator.systemLanguage || 
    'en'
  ).toLowerCase().split('-')[0];

  // Zastosuj mapowanie
  let detected = browserLang;
  if (langMap[detected]) {
    detected = langMap[detected];
  }

  // Fallback na 'en', jeśli nie wspierany
  const lang = supportedLangs.includes(detected) ? detected : 'en';

  // Podświetl aktywny przycisk
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Ustaw język w aplikacji
  function trySetLanguage() {
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    } else {
      setTimeout(trySetLanguage, 50);
    }
  }

  trySetLanguage();
})();