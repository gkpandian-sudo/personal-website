document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     GLOBAL VARIABLES & SETUP
     ========================================================================== */
  
  // Navigation scrolling effect
  const navbar = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* ==========================================================================
     SCROLL FADE-IN ANIMATION (INTERSECTION OBSERVER)
     ========================================================================== */
  const animatedElements = document.querySelectorAll('.scroll-animate');
  
  const fadeObserverOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target); // Animates once
      }
    });
  }, fadeObserverOptions);

  animatedElements.forEach(el => fadeObserver.observe(el));

  /* ==========================================================================
     STATS COUNTER ANIMATION
     ========================================================================== */
  const statsSection = document.querySelector('.credentials-bar');
  const statNumbers = document.querySelectorAll('.stat-number, .mastery-stat-number');
  let statsAnimated = false;

  const countUp = (element) => {
    const target = parseInt(element.getAttribute('data-target'), 10);
    const suffix = element.getAttribute('data-suffix') || '';
    const duration = 1500; // 1.5 seconds
    const frameRate = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameRate);
    let currentFrame = 0;

    const counterInterval = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      // Ease out quad formula for smooth decelerating animation
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(easeProgress * target);
      
      element.textContent = currentValue + suffix;

      if (currentFrame >= totalFrames) {
        element.textContent = target + suffix;
        clearInterval(counterInterval);
      }
    }, frameRate);
  };

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        statNumbers.forEach(num => countUp(num));
        statsAnimated = true;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  /* ==========================================================================
     CUSTOM VIDEO PLAYER WITH HIGHLIGHTED SUBTITLES
     ========================================================================== */
  const video = document.getElementById('intro-video');
  const videoWrapper = document.querySelector('.video-wrapper');
  const videoOverlay = document.getElementById('video-overlay');
  const playTriggerBtn = document.getElementById('play-trigger-btn');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const muteBtn = document.getElementById('mute-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressBarContainer = document.querySelector('.progress-bar-container');
  const timeDisplay = document.getElementById('time-display');
  const transcriptToggle = document.getElementById('transcript-toggle');
  const transcriptText = document.getElementById('transcript-text');
  
  const sentences = document.querySelectorAll('.transcript-sentence');

  // Subtitle timestamps mapping to transcript sentences
  const cues = [
    { id: 'sent-1', start: 0.0, end: 1.2 },
    { id: 'sent-2', start: 1.2, end: 4.8 },
    { id: 'sent-3', start: 4.8, end: 7.8 },
    { id: 'sent-4', start: 7.8, end: 10.0 } // Covers the remainder of the 9-second clip
  ];

  // Try autoplay muted
  if (video) {
    video.muted = true;
    
    // Play promise check for browsers blocking autoplay
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Autoplay started successfully
        videoOverlay.style.display = 'flex';
        playTriggerBtn.innerHTML = '🔊'; // Show sound indicator
      }).catch(error => {
        // Autoplay was blocked
        console.log("Autoplay blocked, waiting for user click.", error);
        videoOverlay.style.display = 'flex';
        playTriggerBtn.innerHTML = '▶'; // Show play button
      });
    }
  }

  // Play/Pause toggler
  const togglePlay = () => {
    if (video.paused) {
      // If was muted for autoplay, unmute when user explicitly plays
      if (video.muted && playTriggerBtn.innerHTML === '🔊') {
        video.muted = false;
        muteBtn.textContent = '🔊 Muted';
      }
      video.play();
      videoWrapper.classList.remove('paused');
      videoOverlay.style.opacity = '0';
      setTimeout(() => {
        if (!video.paused) videoOverlay.style.display = 'none';
      }, 300);
      playPauseBtn.textContent = '⏸';
    } else {
      video.pause();
      videoWrapper.classList.add('paused');
      videoOverlay.style.display = 'flex';
      videoOverlay.style.opacity = '1';
      playTriggerBtn.innerHTML = '▶';
      playPauseBtn.textContent = '▶';
    }
  };

  if (videoOverlay) videoOverlay.addEventListener('click', togglePlay);
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
  if (video) video.addEventListener('click', togglePlay);

  // Mute/Unmute toggler
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (video.muted) {
        muteBtn.textContent = '🔇 Mute';
      } else {
        muteBtn.textContent = '🔊 Unmute';
      }
    });
  }

  // Update progress bar & subtitle highlights
  if (video) {
    video.addEventListener('timeupdate', () => {
      // Progress Bar
      const percentage = (video.currentTime / video.duration) * 100;
      if (progressBarFill) {
        progressBarFill.style.width = percentage + '%';
      }

      // Time stamp display
      const currentMin = Math.floor(video.currentTime / 60);
      const currentSec = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      const durationMin = Math.floor(video.duration / 60) || 0;
      const durationSec = Math.floor(video.duration % 60 || 0).toString().padStart(2, '0');
      if (timeDisplay) {
        timeDisplay.textContent = `${currentMin}:${currentSec} / ${durationMin}:${durationSec}`;
      }

      // Dynamic subtitle highlights
      const currentTime = video.currentTime;
      let activeId = null;

      cues.forEach(cue => {
        if (currentTime >= cue.start && currentTime < cue.end) {
          activeId = cue.id;
        }
      });

      sentences.forEach(span => {
        if (span.getAttribute('data-id') === activeId) {
          span.classList.add('active');
        } else {
          span.classList.remove('active');
        }
      });
    });

    // Reset overlay when video ends
    video.addEventListener('ended', () => {
      videoWrapper.classList.add('paused');
      videoOverlay.style.display = 'flex';
      videoOverlay.style.opacity = '1';
      playTriggerBtn.innerHTML = '🔄';
      playPauseBtn.textContent = '▶';
    });
  }

  // Manual Seek
  if (progressBarContainer) {
    progressBarContainer.addEventListener('click', (e) => {
      const rect = progressBarContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * video.duration;
      video.currentTime = seekTime;
    });
  }

  // Subtitle Click-to-Scrub: Click transcript sentences to seek video
  sentences.forEach(span => {
    span.addEventListener('click', () => {
      const targetId = span.getAttribute('data-id');
      const cue = cues.find(c => c.id === targetId);
      if (cue) {
        video.currentTime = cue.start;
        // Make sure it plays and sound is turned on
        video.muted = false;
        if (muteBtn) muteBtn.textContent = '🔊 Unmute';
        if (video.paused) {
          video.play();
          videoWrapper.classList.remove('paused');
          videoOverlay.style.opacity = '0';
          setTimeout(() => {
            if (!video.paused) videoOverlay.style.display = 'none';
          }, 300);
          playPauseBtn.textContent = '⏸';
        }
      }
    });
  });

  // Expand/Collapse Transcript Panel
  if (transcriptToggle && transcriptText) {
    transcriptToggle.addEventListener('click', () => {
      const isCollapsed = transcriptText.classList.contains('collapsed');
      if (isCollapsed) {
        transcriptText.classList.remove('collapsed');
        transcriptToggle.textContent = 'Collapse';
      } else {
        transcriptText.classList.add('collapsed');
        transcriptToggle.textContent = 'Expand';
      }
    });
  }

  /* ==========================================================================
     TESTIMONIALS SLIDER / CAROUSEL
     ========================================================================== */
  const track = document.getElementById('carousel-track');
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');
  
  let currentSlide = 0;
  const slideCount = slides.length;
  let autoplayInterval;

  if (track && slideCount > 0) {
    // Generate dots
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }

    const dots = document.querySelectorAll('.carousel-dot');

    const updateSliderUI = () => {
      // Slide movement
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // Update dots
      dots.forEach((dot, index) => {
        if (index === currentSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    };

    const goToSlide = (index) => {
      if (index < 0) {
        currentSlide = slideCount - 1;
      } else if (index >= slideCount) {
        currentSlide = 0;
      } else {
        currentSlide = index;
      }
      updateSliderUI();
    };

    const nextSlide = () => {
      goToSlide(currentSlide + 1);
    };

    const prevSlide = () => {
      goToSlide(currentSlide - 1);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

    // Autoplay logic
    const startAutoplay = () => {
      autoplayInterval = setInterval(nextSlide, 6000); // Shift every 6 seconds
    };

    const resetAutoplay = () => {
      clearInterval(autoplayInterval);
      startAutoplay();
    };

    startAutoplay();

    // Pause on hover
    const carouselArea = document.querySelector('.carousel-container');
    if (carouselArea) {
      carouselArea.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
      carouselArea.addEventListener('mouseleave', startAutoplay);
    }
  }

  /* ==========================================================================
     CERTIFICATIONS / CREDENTIALS FILTER
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const credCards = document.querySelectorAll('.creds-category-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active button class
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      // Filter cards
      credCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
          card.classList.remove('hidden');
          // Simple fade-in transition trigger
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          // Wait for animation, then hide
          setTimeout(() => {
            card.classList.add('hidden');
          }, 300);
        }
      });
    });
  });

  /* ==========================================================================
     CALENDLY BOOKING MODAL
     ========================================================================== */
  const modalOverlay = document.getElementById('booking-modal');
  const modalClose = document.getElementById('modal-close');
  const bookingTriggers = document.querySelectorAll('.trigger-booking');
  const iframeContainer = document.getElementById('modal-iframe-container');

  const openBookingModal = (e) => {
    e.preventDefault();
    if (modalOverlay) {
      // Ensure iframe is loaded only when opening to save initial page bandwidth
      const calendlyUrl = "https://calendly.com/gkpandian1/30min";
      if (!iframeContainer.querySelector('iframe')) {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', calendlyUrl);
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('frameborder', '0');
        iframeContainer.appendChild(iframe);
      }
      
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Disable page background scroll
    }
  };

  const closeBookingModal = () => {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Enable page background scroll
    }
  };

  bookingTriggers.forEach(trigger => {
    trigger.addEventListener('click', openBookingModal);
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeBookingModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      // Close only if clicked outside the container
      if (e.target === modalOverlay) {
        closeBookingModal();
      }
    });
  }

  // Keyboard close check
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeBookingModal();
    }
  });

});
