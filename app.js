document.addEventListener('DOMContentLoaded', () => {
    // 0. REJESTRACJA WTYCZEK GSAP
    gsap.registerPlugin(ScrollTrigger, Flip);

    // 1. DYNAMICZNA DATA W STOPCE
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // 2. INICJALIZACJA LENIS (SMOOTH SCROLL)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Odświeżanie pozycji po zmianie rozdzielczości
    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });

    // --- FUNKCJA POMOCNICZA DO PODZIAŁU TEKSTU NA LITERY ---
    const splitTextIntoChars = (selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.textContent;
            el.innerHTML = '';
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.classList.add('char');
                span.textContent = char === ' ' ? '\u00A0' : char;
                el.appendChild(span);
            });
        });
    };

    // --- 3. HERO: ANIMACJA WEJŚCIOWA I ZNIKANIE ---
    const initHeroAnimation = () => {
        splitTextIntoChars('.split-text');

        const scrollBtn = document.querySelector('.scroll-down-btn');
        let idleTimer = null;
        let isHeroAnimFinished = false;

        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        heroTl
            .to('.line-1', { scaleX: 1, duration: 1.1, ease: 'power4.inOut' })
            .to('.line-2', { scaleX: 1, duration: 1.1, ease: 'power4.inOut' }, '-=0.95')
            .to('.line', { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' })
            .from('.hero-title .char', {
                opacity: 0,
                y: 70,
                rotateX: -80,
                duration: 1.1,
                stagger: 0.05,
                ease: 'back.out(1.7)'
            }, '-=0.2')
            .to('.hero-subtitle', { opacity: 1, y: 0, duration: 1 }, '-=0.3')
            .to('.hero-cta-btn', { opacity: 1, y: 0, duration: 1.5 }, '-=0.5')
            .fromTo(scrollBtn, 
                { y: 30, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.6,
                    ease: 'back.out(1.7)',
                    onComplete: () => {
                        isHeroAnimFinished = true;
                        idleTimer = setTimeout(() => {
                            gsap.to(scrollBtn, { autoAlpha: 0, duration: 0.5, overwrite: 'auto' });
                        }, 1600);
                        initScrollDisappear();
                    }
                },
                '-=0.2'
            );

        const handleMouseMove = () => {
            if (!isHeroAnimFinished) return;
            gsap.to(scrollBtn, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
            clearTimeout(idleTimer);

            idleTimer = setTimeout(() => {
                gsap.to(scrollBtn, { autoAlpha: 0, duration: 0.5, overwrite: 'auto' });
            }, 1200);
        };

        window.addEventListener('mousemove', handleMouseMove);

        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                const projectsSection = document.querySelector('#projects');
                if (projectsSection) lenis.scrollTo(projectsSection, { duration: 1.2 });
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        lenis.scrollTo(targetEl, { duration: 1.2 });
                    }
                }
            });
        });
    };

    const initScrollDisappear = () => {
        gsap.to('.hero-title .char', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: '70% top',
                scrub: 0.6,
            },
            opacity: 0,
            y: -60,
            rotateX: 70,
            stagger: 0.01,
            ease: 'power1.in'
        });

        gsap.to(['.hero-subtitle', '.hero-cta-btn'], {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: '50% top',
                scrub: 0.5,
            },
            opacity: 0,
            y: -30,
            ease: 'power1.in'
        });
    };

    // --- 4. SEKCJA PROJEKTY: DESKTOP vs MOBILE ---
    const initProjectsPin = () => {
        const projectsTrack = document.querySelector('.projects-track');
        const projectsSection = document.querySelector('.projects-section');
        const projectsHeader = document.querySelector('.projects-header');
        const cards = document.querySelectorAll('.project-card');

        if (!projectsTrack || !projectsSection) return;

        const mm = gsap.matchMedia();

        // DESKTOP: PINOWANIE I SKROL POZIOMY
        mm.add("(min-width: 768px)", () => {
            const getScrollAmount = () => -(projectsTrack.scrollWidth - window.innerWidth + 80);

            const projectsTl = gsap.timeline({
                scrollTrigger: {
                    trigger: projectsSection,
                    start: "top top",
                    end: () => `+=${projectsTrack.scrollWidth + window.innerHeight * 1.5}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });

            projectsTl.fromTo(projectsHeader, 
                { scale: 0.5, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
            );

            projectsTl.fromTo(cards, 
                { scale: 0.7, opacity: 0, y: 40 },
                { scale: 1, opacity: 1, y: 0, duration: 1, stagger: 0.25, ease: 'power2.out' },
                '+=0.2'
            );

            projectsTl.to(projectsTrack, {
                x: getScrollAmount,
                ease: "none",
                duration: 3
            });
        });

        // MOBILE: PŁYNNE PRZEJŚCIE OPACITY DLA KART
        mm.add("(max-width: 767px)", () => {
            cards.forEach((card) => {
                gsap.fromTo(card, 
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            });
        });

        // MODAL PROJEKTÓW (FLIP)
        cards.forEach((card) => {
            const closeBtn = card.querySelector('.card-close-btn');
            let placeholder = null;

            card.addEventListener('click', (e) => {
                if (card.classList.contains('is-expanded') || e.target.closest('.card-close-btn')) return;

                placeholder = document.createElement('div');
                placeholder.classList.add('card-placeholder');
                card.parentNode.insertBefore(placeholder, card);

                const state = Flip.getState(card, { props: "borderRadius" });

                document.body.appendChild(card);
                card.classList.add('is-expanded');
                document.body.classList.add('modal-open');

                lenis.stop();

                Flip.from(state, {
                    duration: 0.6,
                    ease: 'power3.inOut',
                    scale: true
                });
            });

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    if (!card.classList.contains('is-expanded')) return;

                    const state = Flip.getState(card, { props: "borderRadius" });

                    if (placeholder && placeholder.parentNode) {
                        placeholder.parentNode.insertBefore(card, placeholder);
                    }

                    card.classList.remove('is-expanded');
                    document.body.classList.remove('modal-open');

                    lenis.start();

                    Flip.from(state, {
                        duration: 0.6,
                        ease: 'power2.inOut',
                        absolute: true,
                        scale: true,
                        onComplete: () => {
                            if (placeholder && placeholder.parentNode) {
                                placeholder.remove();
                                placeholder = null;
                            }
                            gsap.set(card, { clearProps: "all" });
                        }
                    });
                });
            }
        });
    };

    // --- 5. SEKCJA OFERTA: DESKTOP vs MOBILE ---
    const initOfertaAnimation = () => {
        const ofertaSection = document.querySelector('.oferta-section');
        const ofertaHeader = document.querySelector('.oferta-header');
        const wrapper = document.querySelector('.oferta-cards-wrapper');
        const cards = gsap.utils.toArray('.offer-card');

        if (!ofertaSection || cards.length === 0) return;

        const mm = gsap.matchMedia();

        // DESKTOP: PIN STACKING
        mm.add("(min-width: 768px)", () => {
            const ofertaTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ofertaSection,
                    start: 'top top',
                    end: `+=${(cards.length + 1) * 100}%`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });

            cards.forEach((card, index) => {
                gsap.set(card, { zIndex: index + 1 });
                if (index > 0) {
                    gsap.set(card, { yPercent: 100, opacity: 0 });
                }
            });

            ofertaTl.fromTo([ofertaHeader, wrapper], 
                { scale: 0.6, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1, ease: 'power2.out' }
            );

            cards.forEach((card, index) => {
                if (index === 0) return;

                const prevCard = cards[index - 1];

                ofertaTl.to(card, {
                    yPercent: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'none'
                });

                ofertaTl.to(prevCard, {
                    scale: 0.9,
                    opacity: 0.4,
                    filter: 'blur(4px)',
                    duration: 1,
                    ease: 'none'
                }, '<');
            });
        });

        // MOBILE: PŁYNNE PRZEJŚCIE OPACITY Z DOŁU DLA KAŻDEJ KARTY
        mm.add("(max-width: 767px)", () => {
            cards.forEach((card) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            });
        });
    };

    // --- 6. SEKCJA ABOUT: DESKTOP vs MOBILE ---
    const initAboutAnimation = () => {
        const aboutSection = document.querySelector('.about-section');
        const wordMotion = document.querySelector('.word-motion');
        const aboutContent = document.querySelector('.about-content');

        if (!aboutSection || !wordMotion) return;

        const mm = gsap.matchMedia();

        // DESKTOP: PIN SCALE
        mm.add("(min-width: 768px)", () => {
            const aboutTl = gsap.timeline({
                scrollTrigger: {
                    trigger: aboutSection,
                    start: 'top top',
                    end: '+=150%',
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });

            aboutTl.fromTo(wordMotion, 
                { scale: 0, opacity: 0 },
                { scale: 3, opacity: 1, duration: 1.5, ease: 'power2.out' }
            );

            aboutTl.to(wordMotion, {
                scale: 1,
                y: -20,
                duration: 1,
                ease: 'power2.inOut'
            });

            aboutTl.to(aboutContent, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power2.out'
            }, '-=0.5');
        });

        // MOBILE: ANIMACJA WEJŚCIA DLA TYTUŁU ORAZ TREŚCI ABOUT
        mm.add("(max-width: 767px)", () => {
            gsap.fromTo(wordMotion,
                { opacity: 0, scale: 0.8 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: wordMotion,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );

            gsap.fromTo(aboutContent,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: aboutContent,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    };

    // --- 7. FOOTER CONTACT BLOCK ANIMACJA MOBILE ---
    const initFooterAnimation = () => {
        const contactBlock = document.querySelector('.footer-contact-block');
        if (!contactBlock) return;

        const mm = gsap.matchMedia();
        mm.add("(max-width: 767px)", () => {
            gsap.fromTo(contactBlock,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: contactBlock,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    };

    // --- 8. OBSŁUGA DROPDOWN KONTAKTU I NAWIGACJI MOBILNEJ ---
    const initMobileNav = () => {
        const navButton = document.querySelector('.nav-button');
        const navContainer = document.querySelector('.nav-container');
        const navItems = document.querySelectorAll('.nav-menu li');
        const dropdownItem = document.querySelector('.nav-dropdown');

        if (dropdownItem) {
            const trigger = dropdownItem.querySelector('.dropdown-trigger');
            trigger.addEventListener('click', (e) => {
                if (window.innerWidth <= 767) {
                    dropdownItem.classList.toggle('is-open');
                }
            });
        }

        if (!navButton || !navContainer) return;

        const iconSpan = navButton.querySelector('.hamburger-icon');
        let isOpen = false;

        const mm = gsap.matchMedia();

        mm.add("(max-width: 767px)", () => {
            gsap.set(navContainer, { y: -20, autoAlpha: 0 });

            const menuTimeline = gsap.timeline({ paused: true });

            menuTimeline
                .to(navContainer, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'power3.out'
                })
                .from(navItems, {
                    y: -15,
                    opacity: 0,
                    duration: 0.25,
                    stagger: 0.08,
                    ease: 'power2.out'
                }, "-=0.2");

            const toggleMenu = () => {
                if (!isOpen) {
                    menuTimeline.play();
                    if (iconSpan) iconSpan.textContent = '✕';
                    navButton.setAttribute('aria-expanded', 'true');
                    navButton.setAttribute('aria-label', 'Zamknij menu');
                } else {
                    menuTimeline.reverse();
                    if (iconSpan) iconSpan.textContent = '☰';
                    navButton.setAttribute('aria-expanded', 'false');
                    navButton.setAttribute('aria-label', 'Otwórz menu');
                }
                isOpen = !isOpen;
            };

            navButton.addEventListener('click', toggleMenu);

            return () => {
                navButton.removeEventListener('click', toggleMenu);
                isOpen = false;
                if (iconSpan) iconSpan.textContent = '☰';
                navButton.setAttribute('aria-expanded', 'false');
                gsap.set([navContainer, navItems], { clearProps: "all" });
            };
        });
    };

    // Uruchomienie wszystkich sekcji
    initHeroAnimation();
    initProjectsPin();
    initOfertaAnimation();
    initAboutAnimation();
    initFooterAnimation();
    initMobileNav();

    ScrollTrigger.refresh();
});