// detect-lang.js – WYKRYWANIE + URL + LOCALSTORAGE
(function () {
  const supportedLangs = ['pl', 'en', 'ua', 'uk', 'ru'];
  
  // Mapowanie: ru/uk → ua
  const langMap = { 'ru': 'ua', 'uk': 'ua' };

  // === 1. SPRAWDŹ URL (?lang=ua) ===
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  let lang = null;

  if (urlLang && supportedLangs.includes(urlLang.toLowerCase())) {
    lang = urlLang.toLowerCase();
  }

  // === 2. SPRAWDŹ localStorage ===
  if (!lang) {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang && supportedLangs.includes(savedLang)) {
      lang = savedLang;
    }
  }

  // === 3. SPRAWDŹ PRZEGLĄDARKĘ ===
  if (!lang) {
    const browserLang = (
      navigator.language || 
      navigator.userLanguage || 
      navigator.browserLanguage || 
      navigator.systemLanguage || 
      'en'
    ).toLowerCase().split('-')[0];

    let detected = browserLang;
    if (langMap[detected]) {
      detected = langMap[detected];
    }

    lang = supportedLangs.includes(detected) ? detected : 'en';
  }

  // === 4. ZAPISZ W localStorage (jeśli nie z URL) ===
  if (!urlParams.has('lang')) {
    localStorage.setItem('appLanguage', lang);
  }

  // === 5. PODŚWIETL PRZYCISK ===
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // === 6. USTAW JĘZYK ===
  function trySetLanguage() {
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    } else {
      setTimeout(trySetLanguage, 50);
    }
  }

  trySetLanguage();

  // === 7. OBSŁUGA KLIKNIĘĆ W PRZYCISKI ===
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const selectedLang = this.dataset.lang;

      // Zapisz w localStorage
      localStorage.setItem('appLanguage', selectedLang);

      // Zaktualizuj URL (bez przeładowania)
      const url = new URL(window.location);
      url.searchParams.set('lang', selectedLang);
      window.history.replaceState({}, '', url);

      // Ustaw język
      setLanguage(selectedLang);

      // Podświetl przycisk
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

})();