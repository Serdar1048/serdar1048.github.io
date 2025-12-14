document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const grid = document.getElementById('projects-grid');

    // Simulation Elements
    const simTitle = document.getElementById('sim-title');
    const simGithub = document.getElementById('sim-github');
    const detailFrame = document.getElementById('detail-frame');
    const detailNoDemo = document.getElementById('detail-no-demo');
    const detailLoader = document.getElementById('detail-loader');
    const btnViewReport = document.getElementById('btn-view-report');
    const btnViewReport2 = document.getElementById('btn-view-report-2');
    const searchInput = document.getElementById('project-search'); // Search Input

    // Report Elements
    const reportTitleTop = document.getElementById('report-title-top');
    const reportTitle = document.getElementById('report-title');
    const reportImage = document.getElementById('report-image');
    const reportContent = document.getElementById('report-content');
    const tocContainer = document.getElementById('toc-container');
    const btnBackToSim = document.getElementById('btn-back-to-sim');

    // Global Project Data State
    let currentProjectId = null;

    // --- SPA Logic (Single Page Application) ---
    const sections = {
        home: document.getElementById('home'),
        portfolio: document.getElementById('portfolio'),
        about: document.getElementById('about'),
        detail: document.getElementById('project-detail'),
        report: document.getElementById('project-report')
    };

    window.showSection = (sectionName) => {
        // Hide all
        Object.values(sections).forEach(sec => {
            if (sec) sec.classList.add('hidden');
            // If leaving detail or report, clear iframe source (preserve resources)
            if ((sectionName !== 'detail' && sectionName !== 'report') && sec === sections.detail) {
                detailFrame.src = '';
            }
        });

        // Show target
        if (sections[sectionName]) {
            sections[sectionName].classList.remove('hidden');
        }

        // Scroll top
        window.scrollTo(0, 0);
    };

    // Handle Browser Back Button
    window.onpopstate = (event) => {
        if (event.state && event.state.section) {
            if (event.state.section === 'detail') {
                // Re-open simulation if ID is present
                if (event.state.id) {
                    openSimulation(event.state.id, false);
                    return; // Stop here, openSimulation handles showSection
                }
            } else if (event.state.section === 'report') {
                if (event.state.id) {
                    openReport(event.state.id, false);
                    return;
                }
            }
            // Simple fallback for now
            showSection(event.state.section);
        } else {
            // Default based on hash
            if (window.location.hash === '#portfolio') {
                showSection('portfolio');
            } else {
                showSection('home');
            }
        }
    };

    // Override showSection to NOT manage history, history is managed by specific open* functions or links
    // But we need a generic way for 'Home' and 'Portfolio' clicks

    // Initial Load Logic is moved to after data fetch to ensure we have projects

    // --- Search Logic ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProjects.filter(p =>
                p.title.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term)
            );
            renderProjects(filtered);
        });
    }

    // --- Data Loading ---
    let allProjects = [];

    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    handleStaticRouting();

    // Cache busting: Add timestamp to force fresh fetch
    fetch('projects.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(projects => {
            allProjects = projects;
            renderProjects(projects);
            handleDataDependentRouting();
        })
        .catch(error => {
            console.error('Error:', error);
            if (grid) grid.innerHTML = '<p class="col-span-3 text-center text-red-500">Hata: Projeler yüklenemedi.</p>';
        });

    function renderProjects(projects) {
        if (!grid) return;
        grid.innerHTML = projects.map(project => `
            <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group cursor-pointer" onclick="openSimulation(${project.id})">
                <div class="h-48 overflow-hidden bg-slate-200 relative">
                    <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">${project.title}</h3>
                    <p class="text-slate-600 line-clamp-2">${project.description}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${project.technologies ? project.technologies.map(tech => `
                            <span class="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                ${tech}
                            </span>
                        `).join('') : ''}
                    </div>
                    <div class="mt-4 flex items-center text-sm font-medium text-primary">
                        İncele
                        <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- Routing Handlers ---

    function handleStaticRouting() {
        const hash = window.location.hash;
        // If it's a data route, do nothing (wait for data), otherwise show static section
        if (!hash.startsWith('#project-') && !hash.startsWith('#report-')) {
            if (hash === '#portfolio') {
                showSection('portfolio');
            } else if (hash === '#about') {
                showSection('about');
            } else {
                showSection('home');
            }
        }
    }

    function handleDataDependentRouting() {
        const hash = window.location.hash;

        if (hash.startsWith('#project-')) {
            const id = parseInt(hash.replace('#project-', ''));
            if (!isNaN(id)) {
                openSimulation(id, false);
                history.replaceState({ section: 'detail', id: id }, '', hash);
            }
        } else if (hash.startsWith('#report-')) {
            const id = parseInt(hash.replace('#report-', ''));
            if (!isNaN(id)) {
                openReport(id, false);
                history.replaceState({ section: 'report', id: id }, '', hash);
            }
        } else if (hash === '#about') {
            showSection('about');
        }
    }

    // --- STEP 1: Open Simulation View ---
    // --- STEP 1: Open Simulation View ---
    // --- STEP 1: Open Simulation View ---
    window.openSimulation = (id, shouldPushState = true) => {
        const project = allProjects.find(p => p.id === id);
        if (!project) return;

        currentProjectId = id;

        // Populate Sim Data
        if (simTitle) simTitle.textContent = project.title;

        // Setup "View Report" button
        if (btnViewReport) btnViewReport.onclick = () => openReport(id);
        if (btnViewReport2) btnViewReport2.onclick = () => openReport(id);

        // Setup "View Code" button (GitHub)
        const btnViewCode = document.getElementById('btn-view-code');
        if (btnViewCode) {
            let ghLink = project.github || '#';
            // Ensure http/s protocol if missing and not just '#'
            if (ghLink !== '#' && !/^https?:\/\//i.test(ghLink)) {
                ghLink = 'https://' + ghLink;
            }
            btnViewCode.href = ghLink;
        }

        // Frame
        if (project.demo_url && (project.demo_url.startsWith('http://') || project.demo_url.startsWith('https://'))) {
            let finalUrl = project.demo_url;
            // Fix for Streamlit apps: Append ?embed=true to prevent redirect loops in iframes
            if ((finalUrl.includes('streamlit.app') || finalUrl.includes('share.streamlit.io'))) {
                // Ensure embed=true
                if (!finalUrl.includes('embed=true')) {
                    finalUrl += finalUrl.includes('?') ? '&embed=true' : '?embed=true';
                }
                // Ensure theme=light
                if (!finalUrl.includes('theme=')) {
                    finalUrl += '&theme=light';
                }
            }

            // Loader Logic
            if (detailLoader) detailLoader.classList.remove('hidden');
            detailFrame.classList.add('hidden');

            detailFrame.src = finalUrl;

            detailFrame.onload = () => {
                if (detailLoader) detailLoader.classList.add('hidden');
                detailFrame.classList.remove('hidden');
            };

            detailNoDemo.classList.add('hidden');
        } else {
            detailFrame.src = '';
            detailFrame.classList.add('hidden');
            detailNoDemo.classList.remove('hidden');
        }

        showSection('detail');
        // Add to history only if requested (default true)
        if (shouldPushState) {
            history.pushState({ section: 'detail', id: id }, '', '#project-' + id);
        }
    };

    // --- STEP 2: Open Report View ---
    // --- STEP 2: Open Report View ---
    window.openReport = (id, shouldPushState = true) => {
        const project = allProjects.find(p => p.id === id);
        if (!project) return;

        // Setup Back Button for Report View
        // If we came here via pushState, Back should pop. 
        // If we want a dedicated button to go back to simulation:
        btnBackToSim.onclick = () => {
            // If history has report state, back() pops it and returns to detail
            if (history.state && history.state.section === 'report') {
                history.back();
            } else {
                openSimulation(id, true);
            }
        };

        // Populate Report Data
        const reportTitleTop = document.getElementById('report-title-top');
        if (reportTitleTop) reportTitleTop.textContent = project.title;

        // Setup Report View Code Button
        const btnReportViewCode = document.getElementById('btn-report-view-code');
        if (btnReportViewCode) {
            let ghLink = project.github || '#';
            if (ghLink !== '#' && !/^https?:\/\//i.test(ghLink)) {
                ghLink = 'https://' + ghLink;
            }
            btnReportViewCode.href = ghLink;
        }

        reportTitle.textContent = project.title;
        reportImage.src = project.image;

        // Add GitHub Markdown Style Class
        reportContent.classList.add('markdown-body');

        // Render Markdown
        const htmlContent = marked.parse(project.details, { breaks: true });
        reportContent.innerHTML = htmlContent;

        // Generate TOC
        generateTOC();

        showSection('report');

        if (shouldPushState) {
            history.pushState({ section: 'report', id: id }, '', '#report-' + id);
        }
    };

    // --- Navigation Helper ---
    window.navigateTo = (section, id = null) => {
        // Determine URL hash
        let hash = '#' + section;
        if (id) hash += '-' + id;

        // Push state
        history.pushState({ section, id }, '', hash);

        // Show proper view
        if (section === 'detail' && id) {
            openSimulation(id, false); // false = don't push state again
        } else if (section === 'report' && id) {
            openReport(id, false);
        } else {
            showSection(section);
        }
    };

    // Generic Go Back Function
    window.goBack = () => {
        // If we have history to go back to, use it.
        // history.length is usually > 1 if we navigated at least once.
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback if user landed directly on a page and has no history
            // We default to 'projects' as a safe 'up' level, or home.
            navigateTo('portfolio');
        }
    };

    // --- TOC Generator ---
    function generateTOC() {
        tocContainer.innerHTML = '';
        const headers = reportContent.querySelectorAll('h1, h2, h3');

        if (headers.length === 0) {
            tocContainer.innerHTML = '<p class="text-xs text-slate-400">Bu raporda başlık bulunamadı.</p>';
            return;
        }

        headers.forEach((header, index) => {
            // Assign ID if missing
            if (!header.id) {
                header.id = 'heading-' + index;
            }

            const link = document.createElement('a');
            link.href = '#' + header.id;
            link.textContent = header.textContent;

            // Styling based on level
            const level = parseInt(header.tagName.substring(1));
            link.className = 'block text-sm text-slate-600 hover:text-primary transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3 truncate';

            if (level === 2) link.classList.add('ml-0', 'font-medium');
            if (level === 3) link.classList.add('ml-4');

            // Smooth scroll
            link.onclick = (e) => {
                e.preventDefault();
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            tocContainer.appendChild(link);
        });
    }
});
