// === WALIDACJA I WCZYTYWANIE OBRAZÓW ===
async function loadValidImages(imagePaths) {
  const DEFAULT_IMAGE = "./images/haircut.jpg"; // obraz domyślny
  const validImages = [];

  for (const src of imagePaths) {
    if (!src || src.trim() === "") continue;

    const img = new Image();
    img.src = src.trim();

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        setTimeout(() => reject(), 5000); // timeout 5s
      });
      validImages.push(img.src);
    } catch (e) {
      // pomijamy nieistniejące
    }
  }

  // jeśli żadne zdjęcie nie jest poprawne → użyj domyślnego
  return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
}

// === GŁÓWNA FUNKCJA STRONY SZCZEGÓŁÓW ===
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("detailsContainer");
  const item = JSON.parse(localStorage.getItem("selectedHairstyle"));

  if (!item) {
    container.innerHTML = "<p>Nie znaleziono danych fryzury.</p>";
    return;
  }

  document.getElementById("hairstyleName").textContent = item.name;

  // Walidacja zdjęć (obsługa brakujących plików)
  const rawImages = (item.images || [])
    .filter(src => src && src.trim() !== "")
    .map(src => src.trim());
  const validImages = await loadValidImages(rawImages);

  // Tworzenie galerii
  const galleryHTML = validImages
    .map(src => `<img src="${src}" alt="${item.name}" loading="lazy">`)
    .join("");

  // Główna zawartość
  container.innerHTML = `
    <section class="details-gallery">
      ${galleryHTML}
    </section>

    <section class="details-info">
      <h2>${item.name}</h2>
      <p><strong>Długość:</strong> ${item.length}</p>
      <p><strong>Styl:</strong> ${item.style}</p>
      <p><strong>Kształt twarzy:</strong> ${item.faceShapes?.join(", ") || "—"}</p>
      <p><strong>Typ włosów:</strong> ${item.hairType?.join(", ") || "—"}</p>
      <p>${item.description}</p>

      <div class="variant-section">
        <h3>Wariant zdjęcia</h3>
        <select id="variantSelect">
          ${validImages.map((_, i) => `<option value="${i}">Wariant ${i + 1}</option>`).join("")}
        </select>
      </div>

      <button id="backBtn" class="back-btn">← Powrót do katalogu</button>
    </section>
  `;

  // === Zmiana wariantu zdjęcia ===
  const galleryImgs = container.querySelectorAll(".details-gallery img");
  const variantSelect = document.getElementById("variantSelect");

  variantSelect.addEventListener("change", e => {
    const index = parseInt(e.target.value);
    galleryImgs.forEach((img, i) => {
      img.style.display = i === index ? "block" : "none";
    });
  });

  // Domyślnie pokazuj pierwsze zdjęcie
  variantSelect.value = 0;
  variantSelect.dispatchEvent(new Event("change"));

  // === Powrót do katalogu ===
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
