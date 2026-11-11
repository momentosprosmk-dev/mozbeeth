// catalogo.js | Renderizado Dual de Beats (PC Cards + Featured Panel | Móvil Lista) - Mozbeeth

document.addEventListener("DOMContentLoaded", () => {
  const audio = window.mozbeethAudio;
  let allTracks = [];
  let currentFilter = window.CATALOG_INITIAL_FILTER || "all";
  let featuredTrack = null;

  // Alturas predefinidas para simular la onda acústica de cada beat (estilo betz_pc)
  const WAVE_HEIGHTS = [
    28, 45, 72, 54, 88, 65, 40, 92, 76, 50, 35, 62, 84, 96, 68, 48, 30, 55,
    78, 60, 42, 70, 52, 38, 64, 80, 46, 34, 58, 44, 30, 50, 66, 40, 26, 48
  ];

  // Inyectar reproductor inferior persistente
  const repContainer = document.getElementById("reproductor-container");
  if (repContainer) {
    const linkRep = document.createElement("link");
    linkRep.rel = "stylesheet";
    linkRep.href = "/recursos/css/global/reproductor.css";
    document.head.appendChild(linkRep);

    fetch("/recursos/html/global/reproductor.html")
      .then((r) => r.text())
      .then((html) => {
        repContainer.innerHTML = html;
        bindPlayerBarEvents();
      })
      .catch((err) => console.error("Error cargando reproductor:", err));
  }

  // Cargar datos de beats desde JSON
  fetch("/recursos/json/catalogo/beats.json")
    .then((res) => res.json())
    .then((tracks) => {
      allTracks = tracks;
      featuredTrack = tracks.find((t) => t.featured) || tracks[0];
      renderAllViews();
      setupFilters();
    })
    .catch((err) => console.error("Error cargando beats.json:", err));

  function getFilteredTracks() {
    if (currentFilter === "all") return allTracks;
    return allTracks.filter((t) => t.genre === currentFilter);
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = String(s % 60).padStart(2, "0");
    return `${m}:${rem}`;
  }

  function buildWaveformSpans(count, playedRatio = 0) {
    const playedCount = Math.floor(count * playedRatio);
    let html = "";
    for (let i = 0; i < count; i++) {
      const h = WAVE_HEIGHTS[i % WAVE_HEIGHTS.length];
      const isPlayed = i < playedCount ? "played" : "";
      html += `<span class="${isPlayed}" style="height:${h}%"></span>`;
    }
    return html;
  }

  function renderAllViews() {
    renderPcCards();
    renderFeaturedPanel();
    renderMovilList();
  }

  // ==========================================================================
  // 1. RENDER TARJETAS PC (>= 1024px) - Tal cual betz_pc.jpeg
  // ==========================================================================
  function renderPcCards() {
    const pcContainers = document.querySelectorAll(".js-beats-pc-grid");
    const list = getFilteredTracks();

    pcContainers.forEach((container) => {
      const limit = parseInt(container.getAttribute("data-limit") || "0", 10);
      const items = limit > 0 ? list.slice(0, limit) : list;

      container.innerHTML = items
        .map((trk) => {
          const isCurrent = audio && audio.currentTrack && audio.currentTrack.id === trk.id;
          const isPlaying = isCurrent && audio.isPlaying;
          const ratio =
            isCurrent && audio.totalSeconds > 0
              ? audio.elapsedSeconds / audio.totalSeconds
              : 0;
          const elapsedStr = isCurrent ? formatTime(audio.elapsedSeconds) : "0:00";

          return `
            <article class="beat-pc-card ${isCurrent ? "active" : ""}" data-card-id="${trk.id}">
              <div class="beat-card-cover-wrap">
                <img src="${trk.coverImage}" alt="${trk.title}" class="beat-card-cover" />
                <button class="beat-fav-btn" data-fav-id="${trk.id}" aria-label="Guardar en favoritos">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>

              <div class="beat-card-player-row">
                <button class="beat-card-play-btn" data-play-id="${trk.id}" aria-label="Reproducir ${trk.title}">
                  <i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>
                </button>
                <div class="waveform-bars" data-wave-id="${trk.id}">
                  ${buildWaveformSpans(30, ratio)}
                </div>
                <span class="beat-card-time" data-time-id="${trk.id}">${elapsedStr} / ${trk.duration}</span>
              </div>

              <h3 class="beat-card-title">${trk.title}</h3>
              <p class="beat-card-sub">${trk.genreLabel} &bull; ${trk.bpm} BPM</p>

              <div class="beat-card-platforms">
                <a href="${trk.spotifyUrl}" target="_blank" rel="noopener" class="btn-plat btn-plat-spotify">
                  <i class="fa-brands fa-spotify"></i>
                  <span>Escuchar en Spotify</span>
                </a>
                <a href="${trk.youtubeUrl}" target="_blank" rel="noopener" class="btn-plat btn-plat-youtube">
                  <i class="fa-brands fa-youtube"></i>
                  <span>Ver en YouTube</span>
                </a>
              </div>

              <div class="beat-card-footer">
                <a href="/formularios/cotizar/?beat=${encodeURIComponent(trk.title)}" class="btn-card-license">
                  <i class="fa-solid fa-cart-shopping"></i>
                  <span>Comprar licencia</span>
                </a>
                <button class="btn-card-more" data-feature-select="${trk.id}" title="Ver detalle del beat">
                  <i class="fa-solid fa-ellipsis"></i>
                </button>
              </div>
            </article>
          `;
        })
        .join("");

      // Eventos Play en tarjetas PC
      container.querySelectorAll("[data-play-id]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-play-id");
          const trk = allTracks.find((t) => t.id === id);
          if (trk && audio) {
            featuredTrack = trk;
            audio.loadAndPlay(trk);
          }
        });
      });

      // Seleccionar beat para el panel destacado inferior
      container.querySelectorAll("[data-feature-select]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-feature-select");
          const trk = allTracks.find((t) => t.id === id);
          if (trk) {
            featuredTrack = trk;
            renderFeaturedPanel();
          }
        });
      });

      // Corazón de favorito
      container.querySelectorAll("[data-fav-id]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          btn.classList.toggle("liked");
          const icon = btn.querySelector("i");
          if (icon) {
            icon.classList.toggle("fa-regular");
            icon.classList.toggle("fa-solid");
          }
        });
      });
    });
  }

  // ==========================================================================
  // 2. RENDER PANEL INFERIOR "BEAT DESTACADO" EN PC - Tal cual betz_pc.jpeg
  // ==========================================================================
  function renderFeaturedPanel() {
    const panelContainer = document.getElementById("featured-beat-container");
    if (!panelContainer || !featuredTrack) return;

    const trk = featuredTrack;
    const isCurrent = audio && audio.currentTrack && audio.currentTrack.id === trk.id;
    const isPlaying = isCurrent && audio.isPlaying;
    const ratio =
      isCurrent && audio.totalSeconds > 0
        ? audio.elapsedSeconds / audio.totalSeconds
        : 0.32;
    const elapsedStr = isCurrent ? formatTime(audio.elapsedSeconds) : "0:48";

    panelContainer.innerHTML = `
      <div class="featured-beat-panel">
        <div class="featured-poster">
          <img src="${trk.coverImage}" alt="${trk.title}" />
          <div class="featured-poster-overlay">
            <div class="featured-poster-title">${trk.title}</div>
            <div class="featured-poster-brand">MOZBEETH</div>
          </div>
        </div>

        <div class="featured-body">
          <div>
            <div class="featured-top-bar">
              <span class="featured-badge">BEAT DESTACADO</span>
              <div class="featured-top-actions">
                <button type="button" id="btn-feat-fav">
                  <i class="fa-regular fa-heart"></i> Añadir a favoritos
                </button>
                <button type="button" id="btn-feat-share">
                  <i class="fa-solid fa-arrow-up-from-bracket"></i> Compartir
                </button>
              </div>
            </div>

            <h3 class="featured-main-title">${trk.title}</h3>
            <p class="featured-main-meta">${trk.genreLabel} &bull; ${trk.bpm} BPM &bull; ${trk.key}</p>
            <p class="featured-main-desc">${trk.description}</p>
          </div>

          <div>
            <div class="featured-player-row">
              <button class="featured-play-btn" id="btn-featured-play" aria-label="Reproducir Beat Destacado">
                <i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>
              </button>
              <div class="featured-waveform" id="featured-waveform-bars">
                ${buildWaveformSpans(44, ratio)}
              </div>
              <span class="beat-card-time" id="featured-time-label">${elapsedStr} / ${trk.duration}</span>
              <div class="featured-volume-wrap">
                <i class="fa-solid fa-volume-high"></i>
                <input type="range" id="featured-volume" min="0" max="1" step="0.02" value="${audio ? audio.volume : 0.8}" aria-label="Volumen" />
              </div>
            </div>

            <p class="featured-platforms-label">Escucha completa en:</p>
            <div class="featured-platforms-row">
              <a href="${trk.spotifyUrl}" target="_blank" rel="noopener" class="btn-plat btn-plat-spotify">
                <i class="fa-brands fa-spotify"></i>
                <span>Abrir en Spotify</span>
              </a>
              <a href="${trk.youtubeUrl}" target="_blank" rel="noopener" class="btn-plat btn-plat-youtube">
                <i class="fa-brands fa-youtube"></i>
                <span>Ver en YouTube</span>
              </a>
              <a href="${trk.soundcloudUrl}" target="_blank" rel="noopener" class="btn-plat btn-plat-soundcloud">
                <i class="fa-brands fa-soundcloud"></i>
                <span>Escuchar en SoundCloud</span>
              </a>
            </div>

            <div class="featured-cta-row">
              <a href="/formularios/cotizar/?beat=${encodeURIComponent(trk.title)}" class="btn-featured-buy">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Comprar licencia</span>
                <span>&rarr;</span>
              </a>

              <div class="featured-perks">
                <span><i class="fa-regular fa-circle-check"></i> Entrega inmediata</span>
                <span><i class="fa-regular fa-circle-check"></i> Uso comercial</span>
                <span><i class="fa-solid fa-waveform-lines"></i> Audio en alta calidad</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const featPlayBtn = document.getElementById("btn-featured-play");
    if (featPlayBtn) {
      featPlayBtn.addEventListener("click", () => {
        if (audio) audio.loadAndPlay(trk);
      });
    }

    const featVol = document.getElementById("featured-volume");
    if (featVol) {
      featVol.addEventListener("input", (e) => {
        if (audio) audio.setVolume(parseFloat(e.target.value));
      });
    }

    const shareBtn = document.getElementById("btn-feat-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        if (navigator.share) {
          navigator.share({ title: trk.title, url: window.location.href });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          shareBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copiado`;
        }
      });
    }
  }

  // ==========================================================================
  // 3. RENDER LISTA COMPACTA MÓVIL (<= 1024px) - Tal cual betz_movil.jpeg
  // ==========================================================================
  function renderMovilList() {
    const movilContainers = document.querySelectorAll(".js-beats-movil-list");
    const list = getFilteredTracks();

    movilContainers.forEach((container) => {
      const limit = parseInt(container.getAttribute("data-limit") || "0", 10);
      const items = limit > 0 ? list.slice(0, limit) : list;

      container.innerHTML = items
        .map((trk) => {
          const isCurrent = audio && audio.currentTrack && audio.currentTrack.id === trk.id;
          const isPlaying = isCurrent && audio.isPlaying;

          return `
            <div class="beat-movil-row ${isCurrent ? "active" : ""}" data-movil-id="${trk.id}">
              <img src="${trk.coverImage}" alt="${trk.title}" class="beat-movil-thumb" />
              <div class="beat-movil-info">
                <h4 class="beat-movil-title">${trk.title}</h4>
                <p class="beat-movil-meta">${trk.genreLabel} &middot; ${trk.bpm} BPM</p>
              </div>
              <button class="beat-movil-play" aria-label="Reproducir ${trk.title}">
                <i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>
              </button>
            </div>
          `;
        })
        .join("");

      container.querySelectorAll(".beat-movil-row").forEach((row) => {
        row.addEventListener("click", () => {
          const id = row.getAttribute("data-movil-id");
          const trk = allTracks.find((t) => t.id === id);
          if (trk && audio) {
            featuredTrack = trk;
            audio.loadAndPlay(trk);
          }
        });
      });
    });
  }

  function setupFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      if (btn.getAttribute("data-filter") === currentFilter) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        renderAllViews();
      });
    });

    document.querySelectorAll(".js-hero-listen-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!audio.currentTrack && allTracks.length > 0) {
          audio.loadAndPlay(allTracks[0]);
        } else {
          audio.togglePlay();
        }
      });
    });
  }

  function bindPlayerBarEvents() {
    const playerBar = document.getElementById("player-bar");
    const playerCover = document.getElementById("player-cover");
    const playerTitle = document.getElementById("player-title");
    const playerMeta = document.getElementById("player-meta");
    const btnPlayToggle = document.getElementById("btn-play-toggle");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const progressWrap = document.getElementById("player-progress-wrap");
    const progressFill = document.getElementById("player-progress-fill");
    const timeCurrentEl = document.getElementById("player-time-current");
    const timeTotalEl = document.getElementById("player-time-total");
    const volumeSlider = document.getElementById("player-volume");
    const playerBuyBtn = document.getElementById("player-buy-btn");

    audio.onStateChange = ({ isPlaying, track }) => {
      if (track) featuredTrack = track;
      renderAllViews();

      if (track && playerBar) {
        playerBar.classList.add("visible");
        if (playerCover) {
          playerCover.style.backgroundImage = `url('${track.coverImage}')`;
          playerCover.style.backgroundSize = "cover";
        }
        if (playerTitle) playerTitle.textContent = track.title;
        if (playerMeta) playerMeta.textContent = `${track.genreLabel} • ${track.bpm} BPM`;
        if (timeTotalEl) timeTotalEl.textContent = track.duration;
        if (playerBuyBtn) {
          playerBuyBtn.href = `/formularios/cotizar/?beat=${encodeURIComponent(track.title)}`;
        }
      }
      if (btnPlayToggle) {
        btnPlayToggle.innerHTML = `<i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>`;
      }
    };

    audio.onProgress = (elapsed, total) => {
      const ratio = total > 0 ? Math.min(1, elapsed / total) : 0;
      if (progressFill) progressFill.style.width = `${ratio * 100}%`;
      if (timeCurrentEl) timeCurrentEl.textContent = formatTime(elapsed);

      // Actualizar tiempo y barra de onda activa en la tarjeta PC y panel destacado
      if (audio.currentTrack) {
        const id = audio.currentTrack.id;
        const cardTime = document.querySelector(`[data-time-id="${id}"]`);
        if (cardTime) {
          cardTime.textContent = `${formatTime(elapsed)} / ${audio.currentTrack.duration}`;
        }
        const cardWave = document.querySelector(`[data-wave-id="${id}"]`);
        if (cardWave) {
          cardWave.innerHTML = buildWaveformSpans(30, ratio);
        }
        if (featuredTrack && featuredTrack.id === id) {
          const featTime = document.getElementById("featured-time-label");
          if (featTime) {
            featTime.textContent = `${formatTime(elapsed)} / ${featuredTrack.duration}`;
          }
          const featWave = document.getElementById("featured-waveform-bars");
          if (featWave) {
            featWave.innerHTML = buildWaveformSpans(44, ratio);
          }
        }
      }
    };

    const playAdjacent = (dir) => {
      const list = getFilteredTracks();
      if (!list.length) return;
      const idx = audio.currentTrack ? list.findIndex((t) => t.id === audio.currentTrack.id) : -1;
      const next = (idx + dir + list.length) % list.length;
      audio.loadAndPlay(list[next]);
    };

    audio.onTrackEnded = () => playAdjacent(1);

    if (btnPlayToggle) {
      btnPlayToggle.addEventListener("click", () => {
        if (!audio.currentTrack && allTracks.length > 0) {
          audio.loadAndPlay(allTracks[0]);
        } else {
          audio.togglePlay();
        }
      });
    }
    if (btnPrev) btnPrev.addEventListener("click", () => playAdjacent(-1));
    if (btnNext) btnNext.addEventListener("click", () => playAdjacent(1));
    if (progressWrap) {
      progressWrap.addEventListener("click", (e) => {
        const rect = progressWrap.getBoundingClientRect();
        audio.seekToRatio((e.clientX - rect.left) / rect.width);
      });
    }
    if (volumeSlider) {
      volumeSlider.addEventListener("input", (e) => audio.setVolume(parseFloat(e.target.value)));
    }
  }
});
