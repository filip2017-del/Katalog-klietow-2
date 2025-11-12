// === lang.js (pełna wersja z przeładowaniem na details.html + wszystkie tłumaczenia) ===

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
    builder_no_match: "Brak fryzur spełniających kryteria.",
    builder_view_details: "Zobacz szczegóły",
    loading: "Ładowanie...",
    footer: "© 2025 Katalog Fryzur Męskich",
    // --- typy włosów i warianty
    hair_straight: "Proste",
    hair_wavy: "Falowane",
    hair_curly: "Kręcone",
    variant_none: "Brak",
    variant_side: "Z boku",
    variant_curtain: "Curtain",
    variant_textured: "Z teksturą",
    variant_loose: "Luźna",
    variant_high_fade: "High Fade",
    variant_undercut: "Undercut"
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
    builder_no_match: "No hairstyles found for selected filters.",
    builder_view_details: "View Details",
    loading: "Loading...",
    footer: "© 2025 Men's Hairstyle Catalog",
    // --- poprawione tłumaczenia wariantów
    hair_straight: "Straight",
    hair_wavy: "Wavy",
    hair_curly: "Curly",
    variant_none: "No bangs",
    variant_side: "Side-swept",
    variant_curtain: "Curtain",
    variant_textured: "Textured",
    variant_loose: "Loose",
    variant_high_fade: "High Fade",
    variant_undercut: "Undercut"
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
    builder_no_match: "Не знайдено зачісок за обраними фільтрами.",
    builder_view_details: "Переглянути деталі",
    loading: "Завантаження...",
    footer: "© 2025 Каталог чоловічих зачісок",
    // --- warianty
    hair_straight: "Пряме",
    hair_wavy: "Хвилясте",
    hair_curly: "Кучеряве",
    variant_none: "Без чубчика",
    variant_side: "На бік",
    variant_curtain: "Curtain",
    variant_textured: "З текстурою",
    variant_loose: "Розпущена",
    variant_high_fade: "High Fade",
    variant_undercut: "Undercut"
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

    // Aktualizuj UI
    updateLanguage();

    // Powiadom inne skrypty
    if (typeof reloadContent === "function") reloadContent(lang);
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: lang }));

    // Przeładuj tylko stronę z detalami (aby odświeżyć tłumaczenia wariantów)
    if (window.location.pathname.includes("details.html")) {
      setTimeout(() => {
        window.location.reload();
      }, 100); // małe opóźnienie dla płynności
    }
  }
}

function updateLanguage() {
  // Tłumaczenie elementów z data-key
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Tłumaczenie opcji w selectach (filtry)
  document.querySelectorAll("select").forEach(select => {
    for (const opt of select.options) {
      const val = opt.value.toLowerCase().trim();
      const map = {
        "": "filter_any",
        "krótkie": "filter_short", "short": "filter_short",
        "średnie": "filter_medium", "medium": "filter_medium",
        "długie": "filter_long", "long": "filter_long",
        "klasyczny": "filter_classic", "classic": "filter_classic",
        "nowoczesny": "filter_modern", "modern": "filter_modern",
        "sportowy": "filter_sport", "sporty": "filter_sport",
        "alternatywny": "filter_alternative",
        "retro": "filter_retro",
        "naturalny": "filter_natural", "natural": "filter_natural",
        "wojskowy": "filter_military", "military": "filter_military",
        "owalna": "filter_oval", "oval": "filter_oval",
        "okrągła": "filter_round", "round": "filter_round",
        "kwadratowa": "filter_square", "square": "filter_square",
        "trójkątna": "filter_triangle", "triangle": "filter_triangle",
        "diamentowa": "filter_diamond", "diamond": "filter_diamond"
      };
      if (map[val]) {
        opt.textContent = t(map[val]);
      }
    }
  });

  // Aktualizacja przycisków języka
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  // Tytuł strony i footer
  const titleEl = document.querySelector("title");
  if (titleEl) titleEl.textContent = t("page_title");

  const footer = document.querySelector("footer p");
  if (footer) footer.textContent = t("footer");
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener("DOMContentLoaded", () => {
  updateLanguage();

  // Obsługa kliknięć w przyciski języka
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
});

// Eksport dla innych skryptów (opcjonalnie)
window.t = t;
window.currentLang = () => currentLang;