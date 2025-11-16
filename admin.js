// admin.js – PEŁNA WERSJA Z PRIORYTETEM DEFAULT I ZAWSZE W OPCJACH
document.addEventListener("DOMContentLoaded", async () => {
  await waitForLang();
  let hairstyles = [];
  let originalHairstyles = [];
  let editingId = null;
  let hasUnsavedChanges = false;

  const listEl = document.getElementById("hairstylesList");
  const formEl = document.getElementById("editorForm");
  const formTitle = document.getElementById("formTitle");
  const form = document.getElementById("hairstyleForm");
  const addBtn = document.getElementById("addNewBtn");
  const cancelBtn = document.getElementById("cancelEdit");
  const imagesContainer = document.getElementById("imagesContainer");
  const saveBtn = document.getElementById("saveChangesBtn");
  const saveContainer = document.getElementById("saveChangesContainer");
  const changesStatus = document.getElementById("changesStatus");

  const options = {
    style: ["classic", "modern", "sport", "alternative", "retro", "natural", "military"],
    boki: [
            "high_fade",
            "mid_fade",
            "low_fade",
            "burst_fade",
            "taper",
            "undercut",
            "tapered_3mm",
            "classic_scissors",
            "creative"
          ],
    gora: ["short", "medium", "long", "textured", "voluminous", "spiky"],
    grzywka: ["none", "straight", "curtain", "side", "textured"],
    faceShapes: ["oval", "round", "square", "triangle", "diamond"],
    hairType: ["straight", "wavy", "curly"]
  };

  // --------------------------------------------------------------------
  // 1. GENEROWANIE KLUCZY: default TYLKO GDY BRAK INNYCH OPCJI
  // --------------------------------------------------------------------
  function generateAvailableKeys() {
    const keys = new Set();

    const selectedBoki = getChecked("bokiCheckboxes");
    const selectedGora = getChecked("goraCheckboxes");
    const selectedGrzywka = getChecked("grzywkaCheckboxes");

    if (selectedBoki.length && selectedGora.length && selectedGrzywka.length) {
      selectedBoki.forEach(b => {
        selectedGora.forEach(g => {
          selectedGrzywka.forEach(gr => {
            keys.add(`${b}_${g}_${gr}`);
          });
        });
      });
    }

    if (keys.size === 0) {
      keys.add("default");
    }

    return Array.from(keys).sort();
  }

  // --------------------------------------------------------------------
  // 2. ODŚWIEŻANIE SELECTÓW
  // --------------------------------------------------------------------
  function refreshImageKeySelects() {
    const available = generateAvailableKeys();
    document.querySelectorAll(".image-row .image-key").forEach(select => {
      const current = select.value;
      const wasAvailable = available.includes(current);

      // Zawsze dodaj "default" jeśli jest w danych
      const currentRow = select.closest(".image-row");
      const isDefaultRow = currentRow && currentRow.querySelector(".image-src").value.includes("default");

      const finalAvailable = [...available];
      if (isDefaultRow || (editingId !== null && hairstyles[editingId]?.images?.default)) {
        if (!finalAvailable.includes("default")) finalAvailable.unshift("default");
      }

      select.innerHTML = finalAvailable.map(k =>
        `<option value="${k}" ${k === current ? "selected" : ""}>${k}</option>`
      ).join("");

      if (!wasAvailable && finalAvailable.length > 0) {
        select.value = finalAvailable[0];
      }
    });
  }

  // --------------------------------------------------------------------
  // 3. DODAWANIE WIERSZA ZDJĘCIA – default ZAWSZE W OPCJACH, GDY ISTNIEJE
  // --------------------------------------------------------------------
  function addImageRow(selectedKey = "default", src = "", descPl = "") {
    const row = document.createElement("div");
    row.className = "image-row";

    // Pobieramy dostępne klucze z kombinacji
    const availableFromOptions = generateAvailableKeys();

    // ZAWSZE DODAJEMY "default" DO OPCJI, JEŚLI JEST WYBRANY LUB ISTNIEJE W JSON
    const shouldIncludeDefault = selectedKey === "default" || 
      (editingId !== null && hairstyles[editingId]?.images?.default);

    const available = [...new Set([
      ...availableFromOptions,
      ...(shouldIncludeDefault ? ["default"] : [])
    ])].sort();

    const optionsHtml = available.map(k =>
      `<option value="${k}" ${k === selectedKey ? "selected" : ""}>${k}</option>`
    ).join("");

    const defaultSrc = src || "./images/haircut.jpg";
    const defaultDesc = descPl || "Opis domyślny";

    row.innerHTML = `
      <select class="image-key">${optionsHtml}</select>
      
      <div class="src-with-preview">
        <input type="text" value="${defaultSrc}" placeholder="Ścieżka do obrazu" class="image-src" />
        <button type="button" class="preview-btn" title="Podgląd zdjęcia">Podgląd</button>
      </div>

      <input type="text" value="${defaultDesc}" placeholder="Opis obrazu (PL)" class="image-desc-pl" />
      <button type="button" class="remove-image">Usuń</button>
    `;

    imagesContainer.appendChild(row);

    row.querySelector(".remove-image").addEventListener("click", () => {
      row.remove();
      markChanged();
    });

    row.querySelector(".image-key").addEventListener("change", markChanged);

    const srcInput = row.querySelector(".image-src");
    const previewBtn = row.querySelector(".preview-btn");

    previewBtn.addEventListener("click", () => {
      const currentSrc = srcInput.value.trim();
      if (!currentSrc) return;

      const popup = document.createElement("div");
      popup.className = "image-preview-popup";
      popup.innerHTML = `
        <div class="popup-content">
          <span class="popup-close">×</span>
          <img src="${currentSrc}" alt="Podgląd" onerror="this.src='./images/haircut.jpg'" />
        </div>
      `;
      document.body.appendChild(popup);

      popup.querySelector(".popup-close").onclick = () => popup.remove();
      popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.remove();
      });

      const escHandler = (e) => {
        if (e.key === "Escape") {
          popup.remove();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
    });

    srcInput.addEventListener("input", markChanged);
  }

  // --------------------------------------------------------------------
  // 4. NASŁUCHIWANIE CHECKBOXÓW
  // --------------------------------------------------------------------
  function attachCheckboxListeners() {
    ["boki", "gora", "grzywka"].forEach(prefix => {
      const container = document.getElementById(prefix + "Checkboxes");
      if (container) {
        container.addEventListener("change", () => {
          refreshImageKeySelects();
          markChanged();
        });
      }
    });
  }

  // --------------------------------------------------------------------
  // 5. ŁADOWANIE FRYZUR
  // --------------------------------------------------------------------
  async function loadHairstyles() {
    try {
      const res = await fetch("hairstyles.json");
      hairstyles = await res.json();
      originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
      renderList();
      resetChanges();
    } catch (err) {
      listEl.innerHTML = `<p style="color:#f66;">Błąd ładowania: ${err.message}</p>`;
    }
  }

  // --------------------------------------------------------------------
  // 6. RENDEROWANIE LISTY
  // --------------------------------------------------------------------
  function renderList() {
    listEl.innerHTML = hairstyles.length === 0
      ? `<p style="color:#aaa;text-align:center;">Brak fryzur. Dodaj pierwszą!</p>`
      : hairstyles.map((h, i) => `
        <div class="hairstyle-card" draggable="true" data-index="${i}">
          <div style="display:flex;align-items:center;gap:1rem;">
            <img src="${getDefaultImage(h)}" alt="${h.name?.pl||'Brak'}" onerror="this.src='./images/haircut.jpg'" />
            <div>
              <strong>${h.name?.pl||"Brak nazwy"}</strong><br>
              <small>${h.length||"?"} • ${translateArray(h.style,'filter')||"brak stylu"}</small>
            </div>
          </div>
          <div class="hairstyle-actions">
            <button onclick="editHairstyle(${i})" class="save-btn">Edytuj</button>
            <button onclick="deleteHairstyle(${i})" style="background:#c33;">Usuń</button>
          </div>
        </div>
      `).join("");

    const cards = listEl.querySelectorAll(".hairstyle-card");
    let dragged = null;
    cards.forEach(c => {
      c.addEventListener("dragstart", e => { dragged = c; setTimeout(() => c.classList.add("dragging"), 0); });
      c.addEventListener("dragend", () => { c.classList.remove("dragging"); dragged = null; markChanged(); });
      c.addEventListener("dragover", e => { e.preventDefault(); c.classList.add("drag-over"); });
      c.addEventListener("dragleave", () => c.classList.remove("drag-over"));
      c.addEventListener("drop", e => {
        e.preventDefault(); c.classList.remove("drag-over");
        if (dragged && dragged !== c) {
          const from = +dragged.dataset.index;
          const to = +c.dataset.index;
          const [m] = hairstyles.splice(from, 1);
          hairstyles.splice(to, 0, m);
          renderList();
        }
      });
    });
  }

  // --------------------------------------------------------------------
  // 7. ŚLEDZENIE ZMIAN
  // --------------------------------------------------------------------
  function markChanged() {
    if (!hasUnsavedChanges) {
      hasUnsavedChanges = true;
      saveContainer.style.display = "block";
      saveBtn.classList.add("enabled");
      saveBtn.disabled = false;
      changesStatus.textContent = "Masz niezapisane zmiany";
    }
  }
  function resetChanges() {
    hasUnsavedChanges = false;
    saveContainer.style.display = "none";
    saveBtn.classList.remove("enabled");
    saveBtn.disabled = true;
    changesStatus.textContent = "";
  }

  // --------------------------------------------------------------------
  // 8. ZAPIS DO PLIKU
  // --------------------------------------------------------------------
  async function saveToFile() {
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hairstyles, null, 2));
    const a = document.createElement("a");
    a.href = data;
    a.download = "hairstyles.json";
    a.click();

    const notif = document.createElement("div");
    notif.className = "save-notification";
    notif.textContent = "Zapisano hairstyles.json";
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);

    originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
    resetChanges();
  }
  saveBtn.addEventListener("click", () => hasUnsavedChanges && saveToFile());

  // --------------------------------------------------------------------
  // 9. PRIORYTET: default Z JSON W MINIATURCE
  // --------------------------------------------------------------------
  function getDefaultImage(h) {
    if (!h?.images) return "./images/haircut.jpg";
    if (h.images.default?.src) return h.images.default.src;
    return Object.values(h.images)[0]?.src || "./images/haircut.jpg";
  }

  // --------------------------------------------------------------------
  // 10. CHECKBOXY
  // --------------------------------------------------------------------
  function createCheckboxes(containerId, values, selected = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = values.map(v => `
      <label><input type="checkbox" value="${v}" ${selected.includes(v)?"checked":""}> ${translateValue(v,'filter')}</label>
    `).join("");
    refreshImageKeySelects();
  }

  // --------------------------------------------------------------------
  // 11. DODAJ WIERSZ ZDJĘCIA
  // --------------------------------------------------------------------
  document.getElementById("addImage").addEventListener("click", () => {
    const available = generateAvailableKeys();
    const firstKey = available[0] || "default";
    addImageRow(firstKey, "./images/haircut.jpg", "Opis domyślny");
    markChanged();
  });

  // --------------------------------------------------------------------
  // 12. ZAPIS FORMULARZA – BEZ DEFAULT, JEŚLI SĄ INNE ZDJĘCIA
  // --------------------------------------------------------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const data = {
      name: { pl: get("namePl"), en: get("nameEn"), ua: get("nameUa") },
      length: get("length"),
      style: getChecked("styleCheckboxes"),
      boki: getChecked("bokiCheckboxes"),
      gora: getChecked("goraCheckboxes"),
      grzywka: getChecked("grzywkaCheckboxes"),
      faceShapes: getChecked("faceCheckboxes"),
      hairType: getChecked("hairCheckboxes"),
      description: { pl: get("descPl"), en: get("descEn"), ua: get("descUa") },
      images: {}
    };

    document.querySelectorAll(".image-row").forEach(row => {
      const key = row.querySelector(".image-key").value;
      const src = row.querySelector(".image-src").value.trim();
      const descPl = row.querySelector(".image-desc-pl").value.trim();
      if (key && src) {
        data.images[key] = { src };
        if (descPl) data.images[key].desc = { pl: descPl };
      }
    });

    // USUŃ DEFAULT Z JSON, JEŚLI SĄ INNE ZDJĘCIA
    if (data.images.default && Object.keys(data.images).length > 1) {
      delete data.images.default;
    }

    // OPCJONALNIE: brak zdjęć → dodaj default
    if (Object.keys(data.images).length === 0) {
      data.images.default = { src: "./images/haircut.jpg" };
    }

    if (editingId === null) hairstyles.push(data);
    else hairstyles[editingId] = data;

    await saveToFile();
    closeForm();
    loadHairstyles();
  });

  function get(id) { return document.getElementById(id)?.value.trim() || ""; }
  function getChecked(id) {
    const container = document.getElementById(id);
    if (!container) return [];
    return Array.from(container.querySelectorAll("input:checked")).map(cb => cb.value);
  }

  // --------------------------------------------------------------------
  // 13. EDYCJA FRYZURY – PRIORYTET: default Z JSON
  // --------------------------------------------------------------------
  window.editHairstyle = function (idx) {
    const h = hairstyles[idx];
    editingId = idx;
    formTitle.textContent = "Edytuj fryzurę";
    formEl.style.display = "block";
    addBtn.style.display = "none";

    set("namePl", h.name?.pl);
    set("nameEn", h.name?.en);
    set("nameUa", h.name?.ua);
    set("length", h.length);
    set("descPl", h.description?.pl);
    set("descEn", h.description?.en);
    set("descUa", h.description?.ua);

    createCheckboxes("styleCheckboxes", options.style, h.style || []);
    createCheckboxes("bokiCheckboxes", options.boki, h.boki || []);
    createCheckboxes("goraCheckboxes", options.gora, h.gora || []);
    createCheckboxes("grzywkaCheckboxes", options.grzywka, h.grzywka || []);
    createCheckboxes("faceCheckboxes", options.faceShapes, h.faceShapes || []);
    createCheckboxes("hairCheckboxes", options.hairType, h.hairType || []);

    imagesContainer.innerHTML = "";

    // PRIORYTET: default Z JSON → pierwszy wiersz
    if (h.images?.default) {
      addImageRow("default", h.images.default.src || "", h.images.default.desc?.pl || "");
    }

    // Pozostałe zdjęcia
    Object.entries(h.images || {}).forEach(([k, img]) => {
      if (k !== "default") {
        addImageRow(k, img.src || "", img.desc?.pl || "");
      }
    });

    // Brak zdjęć → domyślny wiersz
    if (Object.keys(h.images || {}).length === 0) {
      addImageRow("default", "./images/haircut.jpg", "Opis domyślny");
    }

    attachCheckboxListeners();
    refreshImageKeySelects();
  };

  function set(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v || "";
  }

  // --------------------------------------------------------------------
  // 14. USUWANIE FRYZURY
  // --------------------------------------------------------------------
  window.deleteHairstyle = async function (idx) {
    if (confirm("Na pewno usunąć?")) {
      hairstyles.splice(idx, 1);
      await saveToFile();
      loadHairstyles();
    }
  };

  // --------------------------------------------------------------------
  // 15. ZAMKNIJ FORMULARZ
  // --------------------------------------------------------------------
  cancelBtn.addEventListener("click", closeForm);
  function closeForm() {
    formEl.style.display = "none";
    addBtn.style.display = "block";
    form.reset();
    editingId = null;

    imagesContainer.innerHTML = "";
    const available = generateAvailableKeys();
    const firstKey = available[0] || "default";
    addImageRow(firstKey, "./images/haircut.jpg", "Opis domyślny");

    attachCheckboxListeners();
    refreshImageKeySelects();
  }

  // --------------------------------------------------------------------
  // 16. DODAJ NOWĄ FRYZURĘ
  // --------------------------------------------------------------------
  addBtn.addEventListener("click", () => {
    editingId = null;
    formTitle.textContent = "Dodaj nową fryzurę";
    formEl.style.display = "block";
    addBtn.style.display = "none";
    form.reset();

    Object.keys(options).forEach(k => createCheckboxes(k + "Checkboxes", options[k], []));

    imagesContainer.innerHTML = "";
    const available = generateAvailableKeys();
    const firstKey = available[0] || "default";
    addImageRow(firstKey, "./images/haircut.jpg", "Opis domyślny");

    attachCheckboxListeners();
    refreshImageKeySelects();
  });

  // --------------------------------------------------------------------
  // 17. INICJALIZACJA
  // --------------------------------------------------------------------
  loadHairstyles();
  updateLanguage();
  attachCheckboxListeners();
});

async function waitForLang() {
  return new Promise(r => {
    const check = () => (window.t && window.translateArray ? r() : setTimeout(check, 50));
    check();
  });
}