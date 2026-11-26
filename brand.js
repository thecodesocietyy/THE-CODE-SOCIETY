(() => {
  const LOGO_PATH = '/assets/aistudio/TCS_LOGO_a1053890.jpg';

  // Ensure favicon points to the official unmodified logo
  const existingIcon = document.querySelector('link[rel="icon"]');
  if (!existingIcon) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/jpeg';
    icon.href = LOGO_PATH;
    document.head.appendChild(icon);
  }

  // Mobile navigation drawer
  const navToggle = document.getElementById('nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  if (navToggle && mobileDrawer) {
    const setDrawerOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      mobileDrawer.classList.toggle('is-open', open);
      mobileDrawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setDrawerOpen(!isOpen);
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setDrawerOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        setDrawerOpen(false);
        navToggle.focus();
      }
    });
  }

  // Interactive Open-Source Focus Tracks on index.html
  const trackTabs = document.querySelectorAll('[data-track-tab]');
  const trackData = {
    engineering: {
      title: 'Engineering & Open Source',
      meta: 'Repositories · Code Reviews · Shipping',
      desc: 'Contribute directly to active community repositories, learn production Git workflows, triage real issues, and ship tested features alongside student maintainers.',
      items: [
        'Frontend & Web Architecture',
        'Backend APIs & Automation Tooling',
        'Pull Request Reviews & Testing',
        'Documentation & Issue Triage'
      ],
      volunteerHref: 'volunteer.html?role=Software',
      volunteerLabel: 'Volunteer in Software',
      coreHref: 'careers.html?role=Software+Intern',
      coreLabel: 'Apply as Software Intern'
    },
    design: {
      title: 'Design & Creative Direction',
      meta: 'Product UI/UX · Visual Systems · Brand',
      desc: 'Shape the visual and interactive quality of community products. Conduct usability critiques, craft accessible interfaces, and build cohesive design systems.',
      items: [
        'UI/UX Systems & Wireframing',
        'Editorial & Brand Typography',
        'Accessibility & Usability Audits',
        'Visual Assets & Campaign Craft'
      ],
      volunteerHref: 'volunteer.html?role=Creative+Department',
      volunteerLabel: 'Volunteer in Creative',
      coreHref: 'careers.html?role=UI%2FUX+Designer',
      coreLabel: 'Apply as UI/UX Designer'
    },
    operations: {
      title: 'Operations, Community & Growth',
      meta: 'Program Delivery · Outreach · Recruiting',
      desc: 'Keep initiatives moving smoothly from concept to launch. Coordinate contributors, manage project milestones, grow partnerships, and welcome new builders.',
      items: [
        'Project & Sprint Coordination',
        'Contributor Onboarding & Recruiting',
        'Community Outreach & Marketing',
        'Operations & Program Planning'
      ],
      volunteerHref: 'volunteer.html?role=Project+Management',
      volunteerLabel: 'Volunteer in Operations',
      coreHref: 'careers.html?role=Recruiting+Intern',
      coreLabel: 'Explore Core Operations'
    }
  };

  if (trackTabs.length > 0) {
    const titleEl = document.getElementById('track-title');
    const metaEl = document.getElementById('track-meta');
    const descEl = document.getElementById('track-desc');
    const listEl = document.getElementById('track-list');
    const volLink = document.getElementById('track-volunteer-link');
    const coreLink = document.getElementById('track-core-link');

    trackTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-track-tab');
        const info = trackData[key];
        if (!info) return;

        trackTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });

        if (titleEl) titleEl.textContent = info.title;
        if (metaEl) metaEl.textContent = info.meta;
        if (descEl) descEl.textContent = info.desc;
        if (listEl) {
          listEl.replaceChildren(
            ...info.items.map((text) => {
              const li = document.createElement('li');
              li.textContent = text;
              return li;
            })
          );
        }
        if (volLink) {
          volLink.setAttribute('href', info.volunteerHref);
          volLink.firstChild.textContent = `${info.volunteerLabel} `;
        }
        if (coreLink) {
          coreLink.setAttribute('href', info.coreHref);
          coreLink.firstChild.textContent = `${info.coreLabel} `;
        }
      });
    });
  }

  // Pre-select role dropdown from ?role= query param on form pages
  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get('role');
    if (requestedRole) {
      const match = Array.from(roleSelect.options).find(
        (opt) => opt.value.toLowerCase() === requestedRole.toLowerCase() || opt.text.toLowerCase() === requestedRole.toLowerCase()
      );
      if (match) {
        roleSelect.value = match.value;
      }
    }
  }

  // Ensure FormSubmit _next points cleanly to this origin's thank-you.html
  const nextInput = document.querySelector('form input[name="_next"]');
  if (nextInput) {
    try {
      nextInput.value = new URL('thank-you.html', window.location.href).href;
    } catch {
      // Retain existing value if URL construction fails
    }
  }

  // Accessible inline PDF validation & drag-and-drop feedback (replaces window.alert)
  const resumeInput = document.getElementById('resume');
  const dropzone = document.getElementById('resume-dropzone');
  const feedbackEl = document.getElementById('resume-feedback');
  const dropTitleEl = document.getElementById('resume-drop-title');

  if (resumeInput && feedbackEl) {
    const MAX_BYTES = 10 * 1024 * 1024;

    const showFeedback = (type, message) => {
      feedbackEl.className = `file-feedback ${type === 'valid' ? 'is-valid' : 'is-error'}`;
      feedbackEl.textContent = message;
    };

    const validateFile = (file) => {
      if (!file) {
        feedbackEl.className = 'file-feedback';
        feedbackEl.textContent = '';
        if (dropTitleEl) dropTitleEl.textContent = 'Select or drop your PDF resume';
        return;
      }

      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        resumeInput.value = '';
        if (dropTitleEl) dropTitleEl.textContent = 'Select or drop your PDF resume';
        showFeedback('error', 'Unsupported file format. Please upload a PDF document (.pdf).');
        return;
      }

      if (file.size > MAX_BYTES) {
        resumeInput.value = '';
        if (dropTitleEl) dropTitleEl.textContent = 'Select or drop your PDF resume';
        showFeedback('error', 'File exceeds the 10 MB limit. Please upload a smaller PDF.');
        return;
      }

      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (dropTitleEl) dropTitleEl.textContent = file.name;
      showFeedback('valid', `Attached: ${file.name} (${sizeMb} MB)`);
    };

    resumeInput.addEventListener('change', () => {
      validateFile(resumeInput.files && resumeInput.files[0]);
    });

    if (dropzone) {
      ['dragenter', 'dragover'].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add('is-dragover');
        });
      });
      ['dragleave', 'drop'].forEach((evt) => {
        dropzone.addEventListener(evt, () => {
          dropzone.classList.remove('is-dragover');
        });
      });
    }
  }

  // Accessible FAQ Accordion
  const faqTriggers = document.querySelectorAll('.faq-trigger');
  if (faqTriggers.length > 0) {
    faqTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const panelId = trigger.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;
        trigger.setAttribute('aria-expanded', String(!expanded));
        if (panel) {
          panel.hidden = expanded;
        }
      });
    });
  }
})();