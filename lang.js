// lang.js
const translations = {
  pl: {
    nav_catalog: "Katalog fryzur",
    nav_builder: "Wybierz swoją fryzurę",
    page_title: "Katalog fryzur męskich",
    filter_length: "Długość włosów",
    filter_style: "Styl",
    filter_face: "Kształt twarzy",
    filter_any: "Dowolne",
    filter_short: "Krótkie",
    filter_medium: "Średnie",
    filter_long: "Długie",
    filter_classic: "Klasyczny",
    filter_modern: "Nowoczesny",
    filter_sport: "Sportowy",
    filter_alternative: "Alternatywny",
    filter_retro: "Retro",
    filter_natural: "Naturalny",
    filter_military: "Wojskowy",
    filter_oval: "Owalna",
    filter_round: "Okrągła",
    filter_square: "Kwadratowa",
    filter_triangle: "Trójkątna",
    filter_diamond: "Diamentowa",
    details_length: "Długość:",
    details_style: "Styl:",
    details_face: "Kształt twarzy:",
    details_hair: "Typ włosów:",
    back_button: "Powrót do katalogu",
    builder_sides: "Boki",
    builder_top: "Góra",
    builder_bangs: "Grzywka",
    builder_style: "Styl",
    builder_match: "Najlepsze dopasowanie:",
    builder_no_match: "Brak idealnego dopasowania. Spróbuj zmienić opcje.",
    builder_view_details: "Zobacz szczegóły",
    loading: "Ładowanie...",
    footer: "© 2025 Katalog Fryzur Męskich"
  },
  en: {
    nav_catalog: "Hairstyle Catalog",
    nav_builder: "Build Your Hairstyle",
    page_title: "Men's Hairstyle Catalog",
    filter_length: "Hair Length",
    filter_style: "Style",
    filter_face: "Face Shape",
    filter_any: "Any",
    filter_short: "Short",
    filter_medium: "Medium",
    filter_long: "Long",
    filter_classic: "Classic",
    filter_modern: "Modern",
    filter_sport: "Sporty",
    filter_alternative: "Alternative",
    filter_retro: "Retro",
    filter_natural: "Natural",
    filter_military: "Military",
    filter_oval: "Oval",
    filter_round: "Round",
    filter_square: "Square",
    filter_triangle: "Triangle",
    filter_diamond: "Diamond",
    details_length: "Length:",
    details_style: "Style:",
    details_face: "Face Shape:",
    details_hair: "Hair Type:",
    back_button: "Back to Catalog",
    builder_sides: "Sides",
    builder_top: "Top",
    builder_bangs: "Bangs",
    builder_style: "Style",
    builder_match: "Best Match:",
    builder_no_match: "No perfect match. Try different options.",
    builder_view_details: "View Details",
    loading: "Loading...",
    footer: "© 2025 Men's Hairstyle Catalog"
  },
  ua: {
    nav_catalog: "Каталог зачісок",
    nav_builder: "Склади свою зачіску",
    page_title: "Каталог чоловічих зачісок",
    filter_length: "Довжина волосся",
    filter_style: "Стиль",
    filter_face: "Форма обличчя",
    filter_any: "Будь-яка",
    filter_short: "Коротке",
    filter_medium: "Середнє",
    filter_long: "Довге",
    filter_classic: "Класичний",
    filter_modern: "Сучасний",
    filter_sport: "Спортивний",
    filter_alternative: "Альтернативний",
    filter_retro: "Ретро",
    filter_natural: "Натуральний",
    filter_military: "Військовий",
    filter_oval: "Овальна",
    filter_round: "Кругла",
    filter_square: "Квадратна",
    filter_triangle: "Трикутна",
    filter_diamond: "Ромбовидна",
    details_length: "Довжина:",
    details_style: "Стиль:",
    details_face: "Форма обличчя:",
    details_hair: "Тип волосся:",
    back_button: "Повернутися до каталогу",
    builder_sides: "Боки",
    builder_top: "Верх",
    builder_bangs: "Чубчик",
    builder_style: "Стиль",
    builder_match: "Найкращий збіг:",
    builder_no_match: "Немає ідеального збігу. Спробуйте інші опції.",
    builder_view_details: "Переглянути деталі",
    loading: "Завантаження...",
    footer: "© 2025 Каталог чоловічих зачісок"
  }
};

let currentLang = localStorage.getItem("lang") || "pl";

function t(key) {
  return translations[currentLang][key] || key;
}

function setLanguage(lang) {
  if (lang !== currentLang && translations[lang]) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    updateLanguage();
    if (typeof reloadContent === "function") reloadContent();
  }
}

function updateLanguage() {
  // Aktualizacja wszystkich elementów z data-key
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Opcje w <select>
  document.querySelectorAll("select option").forEach(opt => {
    const value = opt.value;
    const langMap = {
      "": "filter_any",
      "krótkie": "filter_short",
      "średnie": "filter_medium",
      "długie": "filter_long",
      "klasyczny": "filter_classic",
      "nowoczesny": "filter_modern",
      "sportowy": "filter_sport",
      "alternatywny": "filter_alternative",
      "retro": "filter_retro",
      "naturalny": "filter_natural",
      "wojskowy": "filter_military",
      "owalna": "filter_oval",
      "okrągła": "filter_round",
      "kwadratowa": "filter_square",
      "trójkątna": "filter_triangle",
      "diamentowa": "filter_diamond",
      "taper": currentLang === "pl" ? "Taper" : currentLang === "en" ? "Taper" : "Тейпер",
      "low fade": currentLang === "pl" ? "Low Fade" : currentLang === "en" ? "Low Fade" : "Лоу Фейд",
      "mid fade": currentLang === "pl" ? "Mid Fade" : currentLang === "en" ? "Mid Fade" : "Мід Фейд",
      "high fade": currentLang === "pl" ? "High Fade" : currentLang === "en" ? "High Fade" : "Хай Фейд",
      "burst fade": currentLang === "pl" ? "Burst Fade" : currentLang === "en" ? "Burst Fade" : "Бьорст Фейд",
      "undercut": currentLang === "pl" ? "Undercut" : currentLang === "en" ? "Undercut" : "Андеркат",
      "luźna": currentLang === "pl" ? "Luźna" : currentLang === "en" ? "Loose" : "Розпущена",
      "tekstura": currentLang === "pl" ? "Z teksturą" : currentLang === "en" ? "Textured" : "З текстурою",
      "quiff": currentLang === "pl" ? "Quiff" : currentLang === "en" ? "Quiff" : "Квіфф",
      "pompadour": currentLang === "pl" ? "Pompadour" : currentLang === "en" ? "Pompadour" : "Помпадур",
      "prosta": currentLang === "pl" ? "Prosta" : currentLang === "en" ? "Straight" : "Пряма",
      "curtain": currentLang === "pl" ? "Curtain" : currentLang === "en" ? "Curtain" : "Куртейн",
      "side": currentLang === "pl" ? "Z boku" : currentLang === "en" ? "Side" : "На бік",
      "brak": currentLang === "pl" ? "Bez grzywki" : currentLang === "en" ? "No Bangs" : "Без чубчика"
    };

    if (langMap[value]) {
      if (typeof langMap[value] === "string") {
        opt.textContent = t(langMap[value]);
      } else {
        opt.textContent = langMap[value];
      }
    }
  });

  // Przełącznik
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  // Tytuł strony
  const titleEl = document.querySelector(".page-title");
  if (titleEl) titleEl.textContent = t("page_title");

  // Footer
  const footer = document.querySelector("footer p");
  if (footer) footer.textContent = t("footer");
}

// Inicjalizacja języka
document.addEventListener("DOMContentLoaded", () => {
  updateLanguage();
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
});