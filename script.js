/* ============================================================
   SASCHA BOAMPONG – script.js
   - Sticky nav shadow on scroll
   - Mobile burger menu
   - Scroll reveal (jonaskeil.com style)
   - Smooth anchor close for mobile menu
   ============================================================ */

(function () {
  'use strict';

  /* ---- Sticky nav ---- */
  const nav = document.querySelector('.nav');
  function updateNav() {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ---- Burger menu ---- */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close on link click
    mobileMenu.querySelectorAll('.nav__mobile-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ---- Scroll Reveal (jonaskeil.com style) ---- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });

    // Trigger immediately for elements already in viewport on load
    setTimeout(function () {
      revealEls.forEach(function (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in-view');
          observer.unobserve(el);
        }
      });
    }, 50);
  } else {
    // Fallback: show all immediately
    revealEls.forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  /* ---- FAQ: close others when one opens ---- */
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  /* ---- Smooth scroll offset for sticky nav ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 64;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---- Kontaktformular AJAX Submit ---- */
  const kontaktForm = document.getElementById('kontakt-form');
  if (kontaktForm) {
    kontaktForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById('submit-btn');
      const successMsg = document.getElementById('form-success');
      const errorMsg = document.getElementById('form-error');

      // UI: Loading-Zustand
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';

      const formData = new FormData(kontaktForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        nachricht: formData.get('nachricht'),
      };

      try {
        const response = await fetch('/kontakt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          successMsg.style.display = 'block';
          kontaktForm.reset();
          submitBtn.textContent = 'Nachricht senden →';
          submitBtn.disabled = false;
        } else {
          errorMsg.textContent = result.error || 'Ein Fehler ist aufgetreten. Bitte schreib direkt an hallo@saschaboampong.de.';
          errorMsg.style.display = 'block';
          submitBtn.textContent = 'Nachricht senden →';
          submitBtn.disabled = false;
        }
      } catch (err) {
        errorMsg.textContent = 'Verbindungsfehler. Bitte schreib direkt an hallo@saschaboampong.de.';
        errorMsg.style.display = 'block';
        submitBtn.textContent = 'Nachricht senden →';
        submitBtn.disabled = false;
      }
    });
  }

})();
