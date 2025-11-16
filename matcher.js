// === matcher.js – POPRAWIONY WYGLĄD KOŃCOWY + RESET ===
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof updateLanguage !== "function") {
    await new Promise(r => setTimeout(r, 100));
  }

  const cardContainer = document.getElementById("cardContainer");
  const resultsSection = document.getElementById("resultsSection");
  const matchesGrid = document.getElementById("matchesGrid");
  const bestMatchText = document.getElementById("bestMatchText");
  const restartBtn = document.getElementById("restartBtn");
  const dislikeBtn = document.getElementById("dislikeBtn");
  const likeBtn = document.getElementById("likeBtn");
  const actionButtons = document.querySelector(".action-buttons");

  let hairstyles = [];
  let currentIndex = 0;
  let liked = JSON.parse(localStorage.getItem("matcher_liked") || "[]");
  let disliked = JSON.parse(localStorage.getItem("matcher_disliked") || "[]");

  const DEFAULT_IMAGE = "./images/haircut.jpg";

  try {
    const res = await fetch("hairstyles.json");
    hairstyles = await res.json();
  } catch (err) {
    cardContainer.innerHTML = `<p class="empty-state">Błąd ładowania fryzur.</p>`;
    return;
  }

  // Dodaj ID do fryzur (jeśli brak)
  hairstyles.forEach((h, i) => {
    if (!h.id) h.id = `hairstyle_${i}`;
  });

  // Usuń już ocenione
  const available = hairstyles.filter(h => 
    !liked.some(l => l.id === h.id) && 
    !disliked.some(d => d.id === h.id)
  );

  if (available.length === 0) {
    showResults();
    return;
  }

  function createCard(item) {
    const validImages = getValidImages(item.images);
    const imgSrc = validImages[0]?.src || DEFAULT_IMAGE;
    const name = item.name[currentLang] || item.name.pl || item.name;
    const desc = item.description[currentLang] || item.description.pl || "";

    const card = document.createElement("div");
    card.className = "matcher-card";
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="choice dislike">✗</div>
      <div class="choice like">✓</div>
      <div class="gallery">
        <img src="${imgSrc}" alt="${name}" loading="lazy">
      </div>
      <div class="card-info">
        <h3>${name}</h3>
        <p>${desc}</p>
        <p><strong>${t("details_length")}:</strong> ${translateArray(item.length, "filter")}</p>
        <p><strong>${t("details_style")}:</strong> ${translateArray(item.style, "filter")}</p>
      </div>
    `;

    setupSwipe(card, item);
    return card;
  }

  function getValidImages(imagesObj) {
    const images = [];
    for (const key in imagesObj) {
      const img = imagesObj[key];
      const src = typeof img === "string" ? img : (img.src || "");
      if (src) images.push({ src, key });
    }
    return images.length > 0 ? images : [{ src: DEFAULT_IMAGE }];
  }

  function setupSwipe(card, item) {
    let startX = 0, moveX = 0;
    const threshold = 100;

    const onStart = (e) => {
      card.classList.add("dragging");
      startX = (e.type.includes("touch") ? e.touches[0] : e).clientX;
    };

    const onMove = (e) => {
      if (!card.classList.contains("dragging")) return;
      moveX = (e.type.includes("touch") ? e.touches[0] : e).clientX - startX;

      card.style.transform = `translate(${moveX}px, 0) rotate(${moveX / 15}deg)`;

      const like = card.querySelector(".choice.like");
      const dislike = card.querySelector(".choice.dislike");
      like.style.opacity = moveX > 50 ? Math.min(moveX / 150, 1) : 0;
      dislike.style.opacity = moveX < -50 ? Math.min(-moveX / 150, 1) : 0;
    };

    const onEnd = () => {
      card.classList.remove("dragging");
      if (Math.abs(moveX) > threshold) {
        const direction = moveX > 0 ? "like" : "dislike";
        finishSwipe(card, item, direction);
      } else {
        card.style.transform = "";
        card.querySelectorAll(".choice").forEach(c => c.style.opacity = 0);
      }
      moveX = 0;
    };

    card.addEventListener("mousedown", onStart);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseup", onEnd);
    card.addEventListener("mouseleave", onEnd);

    card.addEventListener("touchstart", onStart, { passive: true });
    card.addEventListener("touchmove", onMove, { passive: true });
    card.addEventListener("touchend", onEnd);
  }

  function finishSwipe(card, item, direction) {
    const isLike = direction === "like";
    const targetX = isLike ? 600 : -600;

    card.style.transition = "transform .6s cubic-bezier(.2,.8,.4,1)";
    card.style.transform = `translateX(${targetX}px) rotate(${isLike ? 30 : -30}deg)`;

    setTimeout(() => {
      if (isLike) liked.push(item);
      else disliked.push(item);
      localStorage.setItem("matcher_liked", JSON.stringify(liked));
      localStorage.setItem("matcher_disliked", JSON.stringify(disliked));

      card.remove();
      currentIndex++;
      if (currentIndex < available.length) {
        showNextCard();
      } else {
        showResults();
      }
    }, 600);
  }

  function showNextCard() {
    const item = available[currentIndex];
    const card = createCard(item);
    cardContainer.appendChild(card);
  }

  // === POPRAWIONY WYŚWIETL WYNIKÓW ===
  function showResults() {
    // Ukryj karty i przyciski
    cardContainer.innerHTML = "";
    actionButtons.style.display = "none"; // ← UKRYJ PRZYCISKI

    resultsSection.style.display = "block";

    if (liked.length === 0) {
      matchesGrid.innerHTML = `<p class="empty-state">Nie polubiłeś żadnej fryzury.</p>`;
      bestMatchText.textContent = "";
      return;
    }

    const best = findBestMatch(liked);
    bestMatchText.innerHTML = `
      <strong>${t("matcher_best") || "Najlepszy wybór dla Ciebie"}:</strong><br>
      ${best.name[currentLang] || best.name.pl}
    `;

    liked.forEach(item => {
      const img = (item.images?.default?.src) || Object.values(item.images || {})[0]?.src || DEFAULT_IMAGE;
      const name = item.name[currentLang] || item.name.pl;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${img}" alt="${name}" loading="lazy" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
        <h3>${name}</h3>
        <p style="font-size:0.9rem; color:#ccc;">${item.description[currentLang] || item.description.pl}</p>
      `;
      card.addEventListener("click", () => {
        localStorage.setItem("selectedHairstyle", JSON.stringify(item));
        window.location.href = "details.html";
      });
      matchesGrid.appendChild(card);
    });
  }

  function findBestMatch(likedItems) {
    const scores = {};
    likedItems.forEach(item => {
      (item.style || []).forEach(s => scores[s] = (scores[s] || 0) + 1);
      (item.length || []).forEach(l => scores[l] = (scores[l] || 0) + 1);
    });
    return likedItems.reduce((best, curr) => {
      const score = (curr.style?.length || 0) + (curr.length?.length || 0);
      return score > (best.style?.length + best.length?.length) ? curr : best;
    }, likedItems[0]);
  }

  // === PRZYCISKI ===
  dislikeBtn.onclick = () => {
    const card = cardContainer.querySelector(".matcher-card");
    if (card) finishSwipe(card, available[currentIndex], "dislike");
  };

  likeBtn.onclick = () => {
    const card = cardContainer.querySelector(".matcher-card");
    if (card) finishSwipe(card, available[currentIndex], "like");
  };

  // === RESET – PRZYCISK "ZACZNIJ OD NOWA" ===
  restartBtn.onclick = () => {
    localStorage.removeItem("matcher_liked");
    localStorage.removeItem("matcher_disliked");
    location.reload();
  };

  // === ZMIANA JĘZYKA ===
  let currentLang = "pl";
  window.addEventListener("languageChanged", () => {
    currentLang = window.currentLang();
    if (resultsSection.style.display === "block") showResults();
  });

  // === START ===
  showNextCard();
  updateLanguage();
});