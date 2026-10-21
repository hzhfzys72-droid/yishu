(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  let navigating = false;
  const routeName = (() => {
    const file = window.location.pathname.split("/").pop() || "index.html";
    if (file === "index.html" || file === "") return "home";
    return file.replace(".html", "").replace(/[^a-z0-9-]/gi, "-");
  })();

  document.body.classList.add(`archive-route-${routeName}`, "archive-entering");
  window.setTimeout(() => document.body.classList.remove("archive-entering"), 1100);

  function createMotionChrome() {
    const progress = document.createElement("span");
    progress.className = "page-progress";
    progress.setAttribute("aria-hidden", "true");

    const veil = document.createElement("div");
    veil.className = "motion-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.innerHTML = "<span></span><span></span>";

    const frame = document.createElement("div");
    frame.className = "archive-frame";
    frame.setAttribute("aria-hidden", "true");

    const cursor = document.createElement("span");
    cursor.className = "archive-cursor";
    cursor.setAttribute("aria-hidden", "true");

    document.body.append(progress, veil, frame, cursor);
  }

  function updateProgress() {
    const progress = document.querySelector(".page-progress");
    if (!progress) return;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const value = range > 0 ? window.scrollY / range : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
  }

  function navigate(href, source) {
    if (navigating) return;
    if (reducedMotion.matches) {
      window.location.href = href;
      return;
    }

    navigating = true;
    const destinationFile = new URL(href, window.location.href).pathname.split("/").pop() || "index.html";
    const destinationRoute = destinationFile === "index.html" ? "home" : destinationFile.replace(".html", "");
    document.body.dataset.routeTo = destinationRoute;
    document.body.classList.add("is-leaving");
    if (source) source.classList.add("is-route-source");
    try {
      window.sessionStorage.setItem("portfolio-route", JSON.stringify({ from: routeName, to: destinationRoute }));
    } catch (_) {
      // Navigation remains functional when storage is unavailable.
    }
    window.portfolioLenis?.stop();
    const finish = () => {
      window.location.href = href;
    };

    if (window.gsap && document.querySelector(".open-book")) {
      document.body.classList.add("is-leaving-home");
      window.gsap.timeline({ onComplete: finish })
        .to(".book-left", { rotationY: -14, x: 20, autoAlpha: 0.55, duration: 0.38, ease: "power2.inOut" }, 0)
        .to(".book-right", { rotationY: 14, x: -20, autoAlpha: 0.55, duration: 0.38, ease: "power2.inOut" }, 0)
        .to(".open-book", { scale: 0.965, duration: 0.38, ease: "power2.inOut" }, 0);
      return;
    }

    window.setTimeout(finish, 380);
  }

  function setupPageLinks() {
    window.portfolioNavigate = navigate;
    document.addEventListener(
      "click",
      (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest("a[href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        const rawHref = link.getAttribute("href");
        if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;
        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
        if (!destination.pathname.endsWith(".html") && destination.pathname !== "/") return;
        event.preventDefault();
        navigate(destination.href, link);
      },
      true
    );
  }

  function setupSmoothScroll() {
    if (!window.Lenis || reducedMotion.matches || coarsePointer.matches) return;
    const lenis = new window.Lenis({
      duration: 1.08,
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1,
      anchors: true,
    });
    window.portfolioLenis = lenis;
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  function setupIntro() {
    const { gsap } = window;
    const compactMotion = window.matchMedia("(max-width: 760px)").matches || coarsePointer.matches;
    const header = document.querySelector(".site-header");
    const title = document.querySelector("main h1");
    const note = document.querySelector(".page-note, .contact-intro, .archive-cover-copy p");
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline.from(header, { autoAlpha: 0, y: -14, duration: 0.58 });

    if (document.querySelector(".home-page")) {
      timeline
        .from(".book-left", { autoAlpha: 0, x: -42, rotationY: -8, transformOrigin: "right center", duration: 0.95 }, 0.12)
        .from(".book-right", { autoAlpha: 0, x: 42, rotationY: 8, transformOrigin: "left center", duration: 0.95 }, 0.12)
        .from(".home-copy > *", { autoAlpha: 0, y: 18, stagger: 0.09, duration: 0.66 }, 0.44)
        .from(".home-polaroid", { autoAlpha: 0, y: 24, rotation: 2.2, scale: 0.96, duration: 0.8 }, 0.52)
        .from(".home-mini-tags span", { autoAlpha: 0, y: 10, stagger: 0.06, duration: 0.48 }, 0.7);
      return;
    }

    if (title) {
      timeline.from(title, {
        autoAlpha: 0,
        y: compactMotion ? 16 : 28,
        clipPath: "inset(0 0 100% 0)",
        duration: compactMotion ? 0.58 : 0.86,
        clearProps: "clipPath",
      }, 0.12);
    }
    if (note) timeline.from(note, { autoAlpha: 0, y: 14, duration: 0.62 }, 0.3);
    timeline.from(".archive-cover, .about-left-page, .about-right-page, .contact-sheet", {
      autoAlpha: 0,
      y: 22,
      scale: 0.99,
      duration: 0.78,
    }, 0.2);
  }

  function setupReveals() {
    const { gsap, ScrollTrigger } = window;
    const compactMotion = window.matchMedia("(max-width: 760px)").matches || coarsePointer.matches;
    const targets = gsap.utils.toArray([
      ".project-card",
      ".work-tile",
      ".contact-main-card",
      ".social-card",
      ".qr-card",
      ".currently-card",
      ".student-info > div",
      ".little-universe",
      ".archive-project > section:not(.archive-cover)",
      ".project-detail-page > .detail-sections > section",
      ".proof-gallery",
      ".archive-gallery",
    ].join(", "));

    targets.forEach((node, index) => {
      const fromState = { autoAlpha: 0, y: compactMotion ? 16 : 28 };
      const toState = {
        autoAlpha: 1,
        y: 0,
        duration: compactMotion ? 0.58 : 0.82,
        delay: (index % 4) * (compactMotion ? 0.035 : 0.055),
        ease: "power3.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      };
      if (!compactMotion) {
        fromState.filter = "blur(10px)";
        toState.filter = "blur(0px)";
        toState.clearProps = "filter";
      }
      gsap.fromTo(node, fromState, toState);
    });
    ScrollTrigger.refresh();
  }

  function setupParallax() {
    if (window.matchMedia("(max-width: 760px)").matches || coarsePointer.matches) return;
    const { gsap } = window;

    gsap.utils.toArray(".home-polaroid, .about-photo-frame, .hero-photo").forEach((node, index) => {
      gsap.to(node, {
        y: index % 2 ? -14 : 14,
        ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: 1.8 },
      });
    });
  }

  function setupModalMotion() {
    document.addEventListener("portfolio:modal-open", (event) => {
      if (reducedMotion.matches || !window.gsap) return;
      const { preview, source } = event.detail || {};
      if (!preview || !source) return;

      window.requestAnimationFrame(() => {
        const sourceRect = source.getBoundingClientRect();
        const targetRect = preview.getBoundingClientRect();
        const scale = Math.max(0.22, Math.min(0.9, sourceRect.width / targetRect.width));
        const x = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
        const y = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
        window.gsap.fromTo(preview, { x, y, scale, autoAlpha: 0.25, transformOrigin: "center center" }, {
          x: 0,
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.56,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        });
      });
    });
  }

  function setupMotionLifecycle() {
    document.addEventListener("visibilitychange", () => {
      document.documentElement.classList.toggle("page-paused", document.hidden);
      if (document.hidden) {
        window.portfolioLenis?.stop();
      } else if (!document.body.classList.contains("modal-open")) {
        window.portfolioLenis?.start();
      }
    });
  }


  function setupArchiveCursor() {
    const cursor = document.querySelector(".archive-cursor");
    if (!cursor || reducedMotion.matches || coarsePointer.matches || !window.gsap) return;
    const { gsap } = window;
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.28, ease: "power3.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.28, ease: "power3.out" });

    window.addEventListener("pointermove", (event) => {
      cursor.classList.add("is-visible");
      moveX(event.clientX);
      moveY(event.clientY);
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      cursor.classList.toggle("is-active", Boolean(event.target.closest("a, button, .project-card, .work-tile")));
    });
    document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  }

  function setupArchiveCardMotion() {
    if (reducedMotion.matches || coarsePointer.matches || window.matchMedia("(max-width: 760px)").matches) return;
    const { gsap } = window;
    gsap.utils.toArray(".project-card, .work-tile").forEach((card) => {
      const image = card.querySelector(".project-cover, .work-thumb");
      card.addEventListener("pointerenter", () => {
        if (image) gsap.to(image, { y: -4, scale: 1.008, duration: 0.42, ease: "power3.out" });
      });
      card.addEventListener("pointerleave", () => {
        if (image) gsap.to(image, { y: 0, scale: 1, duration: 0.52, ease: "power3.out", clearProps: "transform" });
      });
    });
  }

  function setupHomeDepth() {
    const book = document.querySelector(".open-book");
    if (!book || reducedMotion.matches || coarsePointer.matches) return;
    const { gsap } = window;
    const rotateX = gsap.quickTo(book, "rotationX", { duration: 0.8, ease: "power3.out" });
    const rotateY = gsap.quickTo(book, "rotationY", { duration: 0.8, ease: "power3.out" });

    book.addEventListener("pointermove", (event) => {
      const bounds = book.getBoundingClientRect();
      rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 2.4);
      rotateX(((event.clientY - bounds.top) / bounds.height - 0.5) * -1.8);
    });
    book.addEventListener("pointerleave", () => {
      rotateX(0);
      rotateY(0);
    });
  }

  createMotionChrome();
  setupPageLinks();
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  if (!window.gsap || !window.ScrollTrigger || reducedMotion.matches) return;
  window.gsap.registerPlugin(window.ScrollTrigger);
  document.body.classList.add("motion-ready");
  setupSmoothScroll();
  setupIntro();
  setupReveals();
  setupParallax();
  setupModalMotion();
  setupMotionLifecycle();
  setupArchiveCursor();
  setupArchiveCardMotion();
  setupHomeDepth();
})();