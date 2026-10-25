const data = window.portfolioData;

function bindText() {
  document.querySelectorAll("[data-bind]").forEach((node) => {
    const key = node.dataset.bind;
    if (data[key]) node.textContent = data[key];
  });

  document.querySelectorAll("[data-bind-attr]").forEach((node) => {
    node.dataset.bindAttr.split(",").forEach((binding) => {
      const [attr, key] = binding.split(":").map((part) => part.trim());
      if (key === "emailHref") node.setAttribute(attr, `mailto:${data.email}`);
      if (key === "githubHref") node.setAttribute(attr, data.github || "#");
    });
    if (node.dataset.bindAttr.includes("emailHref")) node.textContent = data.email;
  });
}

function renderTags() {
  const cloud = document.querySelector("#about-tags");
  if (!cloud) return;
  cloud.innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join("");
}

function renderHighlights() {
  const list = document.querySelector("#about-highlights-list");
  if (!list) return;
  list.innerHTML = data.highlights.map((item) => `<li>${item}</li>`).join("");
}

function setupContactCopy() {
  document.querySelectorAll(".contact-copy[data-copy]").forEach((button) => {
    const label = button.getAttribute("aria-label");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = "已复制";
        button.setAttribute("aria-label", `${label}，已复制`);
      } catch {
        button.textContent = "复制失败";
        button.setAttribute("aria-label", `${label}失败`);
      }
      window.setTimeout(() => {
        button.textContent = "复制";
        button.setAttribute("aria-label", label);
      }, 1800);
    });
  });
}

function setupHotspotProgress() {
  const gallery = document.querySelector(".hotspot-proof-grid");
  const indicator = document.querySelector(".hotspot-scroll-progress");
  if (!gallery || !indicator) return;

  const count = gallery.querySelectorAll(".evidence-photo").length;
  const label = indicator.querySelector(".hotspot-scroll-count");
  let scheduled = false;

  const update = () => {
    scheduled = false;
    const maxScroll = gallery.scrollWidth - gallery.clientWidth;
    indicator.hidden = maxScroll < 2;
    if (indicator.hidden) return;

    const position = Math.min(1, Math.max(0, gallery.scrollLeft / maxScroll));
    const current = Math.min(count, Math.max(1, Math.round(position * (count - 1)) + 1));
    indicator.style.setProperty("--hotspot-progress", (1 + position * (count - 1)) / count);
    indicator.setAttribute("aria-valuenow", String(current));
    label.textContent = `${String(current).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  };

  gallery.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener("resize", update);
  if (window.ResizeObserver) new ResizeObserver(update).observe(gallery);
  update();
}

function renderProjects() {
  const grid = document.querySelector("#project-grid");
  if (!grid) return;
  grid.innerHTML = data.projects
    .map(
      (project, index) => `
        <article class="project-card reveal" data-href="${project.href}" data-archive-index="${String(index + 1).padStart(2, "0")}" style="--tilt:${index % 2 ? "1.3deg" : "-1deg"}">
          <div class="project-cover">
            ${
              project.coverImage
                ? `<img src="${project.coverImage}" alt="${project.title} 项目封面" loading="lazy" decoding="async">`
                : `<span>${project.cover}</span>`
            }
          </div>
          <div class="project-body">
            <div class="project-label">${project.no ? `${project.no} / ` : ""}${project.time}</div>
            <h2>${project.title}</h2>
            <p>${project.intro}</p>
            <dl>
              <div><dt>我的角色</dt><dd>${project.role}</dd></div>
              <div><dt>项目亮点</dt><dd>${project.highlight}</dd></div>
            </dl>
            ${
              project.tags
                ? `<div class="project-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
                : ""
            }
            <a class="detail-link" href="${project.href}">${project.cta || "查看项目"}</a>
          </div>
        </article>
      `
    )
    .join("");
}

function getWorkActionLabel(work) {
  if (work.actionLabel && work.type !== 'Video') return work.actionLabel;
  if (work.type === "Video") return "查看视频";
  return "查看作品";
}

function getWorkPreviewImages(work) {
  if (work.previewImages?.length) return work.previewImages;
  return [work.detailImage, work.coverImage].filter(Boolean);
}
function getWorkPreviewKind(work) {
  if (work.previewKind) return work.previewKind;
  if (work.type === "PPT") return "slides";
  if (work.type === "Plan") return work.previewPdf ? "pdf" : "slides";
  if (work.coverFit === "top-crop") return "long-image";
  return "single-image";
}

function getWorkVideoClips(work) {
  return work.videoGroups?.flatMap((group) => group.clips) || [];
}

function renderWorkPreviewMedia(work, previewImages) {
  const kind = getWorkPreviewKind(work);

  if (kind === "video-collection") {
    const clips = getWorkVideoClips(work);
    const first = clips[0];
    return `
      <div class="work-video-collection">
        <div class="work-video-stage">
          <video controls playsinline preload="none" poster="${first.poster}" src="${first.src}" aria-label="${first.title}">
            您的浏览器暂不支持视频播放。
          </video>
          <p class="work-video-current">${first.title}</p>
        </div>
        <div class="work-video-groups">
          ${work.videoGroups
            .map(
              (group) => `
                <section class="work-video-group">
                  <h3>${group.title}</h3>
                  <div class="work-video-options">
                    ${group.clips
                      .map((clip) => {
                        const index = clips.indexOf(clip);
                        return `
                          <button class="work-video-option${index === 0 ? " is-active" : ""}" type="button" data-video-index="${index}" aria-pressed="${index === 0}">
                            <img src="${clip.poster}" alt="" loading="lazy" decoding="async">
                            <span>${clip.title}<small>${clip.duration}</small></span>
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                </section>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (kind === "pdf" && work.previewPdf) {
    return `
      <div class="work-pdf-frame">
        <iframe src="${work.previewPdf}#toolbar=1&navpanes=0" title="${work.title} PDF preview" loading="lazy"></iframe>
      </div>
    `;
  }

  if (kind === "slides") {
    return `
      <div class="work-slide-stack">
        ${previewImages
          .map(
            (image, imageIndex) => `
              <figure class="work-modal-page">
                <figcaption>${String(imageIndex + 1).padStart(2, "0")} / ${String(previewImages.length).padStart(2, "0")}</figcaption>
                <img src="${image}" alt="${work.title} PPT preview page ${imageIndex + 1}" loading="lazy" decoding="async">
              </figure>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="work-single-preview ${kind === "long-image" ? "is-long-image" : ""}">
      ${previewImages
        .slice(0, 1)
        .map(
          (image) => `
            <img src="${image}" alt="${work.title} preview" loading="lazy" decoding="async">
          `
        )
        .join("")}
    </div>
  `;
}

function renderWorks() {
  const board = document.querySelector("#works-board");
  if (!board) return;
  board.innerHTML = data.works
    .map((work, index) => {
      const isVideo = work.type === "Video";
      const previewImages = getWorkPreviewImages(work);
      const hasPreview = getWorkPreviewKind(work) === "video-collection"
        ? getWorkVideoClips(work).length > 0
        : !isVideo && (previewImages.length || work.previewPdf);
      return `
        <article
          class="work-tile reveal tile-${index + 1}${work.featured ? " featured-work" : ""}${work.coverImage ? " has-cover" : ""}${work.coverFit === "top-crop" ? " top-crop-cover" : ""}${work.previewKind === "video-collection" ? " video-series-work" : ""}"
          data-archive-index="${String(index + 1).padStart(2, "0")}" data-work-type="${work.type || "Work"}"
          ${hasPreview ? `data-preview-index="${index}" role="button" tabindex="0"` : ""}
        >
          <span class="work-thumb">
            ${
              work.coverImage
                ? `<img src="${work.coverImage}" alt="${work.title} 作品封面" loading="lazy" decoding="async">`
                : `<span>${work.type}</span><small>${work.coverNote || "作品待补充"}</small>`
            }
          </span>
          <span class="work-title">${work.title}</span>
          <span class="work-intro">${work.intro}</span>
          ${
            work.tags
              ? `<span class="work-tags">${work.tags.map((tag) => `<i>${tag}</i>`).join("")}</span>`
              : ""
          }
          ${
            isVideo && work.link
              ? `<a class="work-action" href="${work.link}" target="_blank" rel="noopener noreferrer">${getWorkActionLabel(work)}</a>`
              : hasPreview
              ? `<button class="work-action" type="button" data-preview-trigger="${index}">${getWorkActionLabel(work)}</button>`
              : `<span class="work-empty-note">等待补充对应作品素材</span>`
          }
        </article>
      `;
    })
    .join("");
}

function setupLightbox() {
  const lightbox = document.querySelector("#work-lightbox");
  if (!lightbox) {
    setupImagePreview();
    return;
  }
  const preview = lightbox.querySelector(".lightbox-card");
  const close = lightbox.querySelector("button");
  let closeTimer;
  const openWorkPreview = (index, source) => {
    const work = data.works[Number(index)];
    if (!work) return;
    const previewImages = getWorkPreviewImages(work);
    const isVideoCollection = getWorkPreviewKind(work) === "video-collection" && getWorkVideoClips(work).length > 0;
    if (!isVideoCollection && ((!previewImages.length && !work.previewPdf) || work.type === "Video")) return;

    preview.innerHTML = `
      <div class="work-preview-note${isVideoCollection ? " is-video-collection" : ""}">
        <span class="modal-file-label">${work.type || "Work"} archive · 2026</span>
        <h2>${work.title}</h2>
        <p>${work.intro}</p>
        ${renderWorkPreviewMedia(work, previewImages)}
        ${
          work.detail?.thinking
            ? `<section class="work-detail-section">
                <h3>${work.type === "PPT" || work.type === "Plan" ? "创作记录" : "创作思路"}</h3>
                <p>${work.detail.thinking}</p>
              </section>`
            : ""
        }
        ${
          work.detail?.record
            ? `<section class="work-detail-section">
                <h3>${work.type === "Plan" ? "项目总结" : "内容复盘"}</h3>
                ${
                  work.detail.recordItems
                    ? `<div class="work-record-tags">${work.detail.recordItems.map((item) => `<span>${item}</span>`).join("")}</div>`
                    : ""
                }
                <p>${work.detail.record}</p>
              </section>`
            : ""
        }
        ${
          work.tags
            ? `<div class="work-tags preview-tags">${work.tags.map((tag) => `<i>${tag}</i>`).join("")}</div>`
            : ""
        }
      </div>
    `;
    lightbox.querySelector(".lightbox-card").scrollTop = 0;

    if (isVideoCollection) {
      const clips = getWorkVideoClips(work);
      const player = preview.querySelector(".work-video-stage video");
      const current = preview.querySelector(".work-video-current");
      const options = preview.querySelectorAll(".work-video-option");
      options.forEach((option) => {
        option.addEventListener("click", () => {
          const clip = clips[Number(option.dataset.videoIndex)];
          if (!clip || option.classList.contains("is-active")) return;
          player.pause();
          player.src = clip.src;
          player.poster = clip.poster;
          player.setAttribute("aria-label", clip.title);
          player.load();
          current.textContent = clip.title;
          options.forEach((item) => {
            const active = item === option;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
        });
      });
    }

    window.clearTimeout(closeTimer);
    lightbox.classList.remove("is-closing");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.portfolioLenis?.stop();
    document.dispatchEvent(new CustomEvent("portfolio:modal-open", { detail: { preview, source } }));
  };
  const closeWorkPreview = () => {
    if (lightbox.getAttribute("aria-hidden") === "true") return;
    preview.querySelector("video")?.pause();
    lightbox.classList.add("is-closing");
    closeTimer = window.setTimeout(() => {
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.classList.remove("is-closing");
      document.body.classList.remove("modal-open");
      window.portfolioLenis?.start();
    }, 240);
  };

  document.querySelectorAll(".work-tile[data-preview-index]").forEach((tile) => {
    tile.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openWorkPreview(tile.dataset.previewIndex, tile);
    });
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openWorkPreview(tile.dataset.previewIndex, tile);
      }
    });
  });

  document.querySelectorAll(".work-action[data-preview-trigger]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWorkPreview(button.dataset.previewTrigger, button.closest(".work-tile"));
    });
  });

  close.addEventListener("click", closeWorkPreview);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeWorkPreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") closeWorkPreview();
  });

  setupImagePreview();
}

function setupImagePreview() {
  const images = document.querySelectorAll(".project-photo img, .universe-photo img");
  if (!images.length) return;

  let lightbox = document.querySelector("#image-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";
    lightbox.id = "image-lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML = `
      <button type="button" aria-label="Close image preview">Close</button>
      <img alt="">
    `;
    document.body.appendChild(lightbox);
  }

  const preview = lightbox.querySelector("img");
  const close = lightbox.querySelector("button");
  let closeTimer;

  const closeImagePreview = () => {
    if (lightbox.getAttribute("aria-hidden") === "true") return;
    lightbox.classList.add("is-closing");
    closeTimer = window.setTimeout(() => {
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.classList.remove("is-closing");
      document.body.classList.remove("modal-open");
      window.portfolioLenis?.start();
    }, 220);
  };

  images.forEach((image) => {
    image.addEventListener("click", () => {
      window.clearTimeout(closeTimer);
      preview.src = image.currentSrc || image.src;
      preview.alt = image.alt || "项目图片预览";
      lightbox.classList.toggle("universe-lightbox", image.closest(".universe-photo") !== null);
      lightbox.classList.remove("is-closing");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      window.portfolioLenis?.stop();
    });
  });

  close.addEventListener("click", closeImagePreview);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeImagePreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") closeImagePreview();
  });
}

function setupProjectCardLinks() {
  document.querySelectorAll(".project-card[data-href]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.portfolioNavigate ? window.portfolioNavigate(card.dataset.href, card) : (window.location.href = card.dataset.href);
    });
  });
}

function createDeepSeaParticles() {
  const layer = document.createElement("div");
  const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
  const particleCount = isSmallScreen ? 5 : 11;

  layer.className = "deep-sea-particles dream-overlay";
  layer.setAttribute("aria-hidden", "true");

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    particle.className = "dream-particle";
    const size = Math.round(2 + Math.random() * 4);
    const duration = Math.round(10 + Math.random() * 15);
    const delay = Math.round(Math.random() * -25);
    const drift = Math.round(18 + Math.random() * 54);
    const opacity = (0.3 + Math.random() * 0.3).toFixed(2);

    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--left", `${Math.random() * 100}%`);
    particle.style.setProperty("--duration", `${duration}s`);
    particle.style.setProperty("--delay", `${delay}s`);
    particle.style.setProperty("--drift", `${index % 2 ? "-" : ""}${drift}px`);
    particle.style.setProperty("--opacity", opacity);

    layer.appendChild(particle);
  }

  document.body.prepend(layer);
}

function createDreamAtmosphere() {
  const layer = document.createElement("div");
  layer.className = "dream-atmosphere dream-overlay";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <span class="dream-glow dream-glow-one"></span>
    <span class="dream-glow dream-glow-two"></span>
    <span class="dream-glow dream-glow-three"></span>
  `;
  document.body.prepend(layer);
}

function setupScrollReveal() {
  document.querySelectorAll(".reveal").forEach((node) => {
    node.classList.remove("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  const revealTargets = document.querySelectorAll(
    [
      "main > *",
      ".paper-sheet",
      ".polaroid",
      ".project-card",
      ".work-tile",
      ".contact-sheet",
      ".detail-sections section",
      ".page-note",
      ".student-info div",
      ".currently-card",
      ".book-page",
      ".project-photo",
      ".proof-gallery",
      ".archive-gallery",
    ].join(", ")
  );

  revealTargets.forEach((node, index) => {
    node.classList.add("deep-reveal");
    node.style.setProperty("--reveal-delay", `${(index % 6) * 0.12}s`);
    observer.observe(node);
  });

  window.setTimeout(() => {
    document.querySelectorAll(".deep-reveal:not(.is-visible)").forEach((node) => {
      node.classList.add("is-visible");
    });
  }, 1400);
}

bindText();
renderTags();
renderHighlights();
setupContactCopy();
setupHotspotProgress();
renderProjects();
renderWorks();
setupProjectCardLinks();
setupLightbox();
createDreamAtmosphere();
createDeepSeaParticles();
if (!window.gsap || !window.ScrollTrigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) setupScrollReveal();
