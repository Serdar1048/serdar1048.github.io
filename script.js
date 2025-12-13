document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const grid = document.getElementById('projects-grid');

    // Simulation Elements
    const simTitle = document.getElementById('sim-title');
    const simGithub = document.getElementById('sim-github');
    const detailFrame = document.getElementById('detail-frame');
    const detailNoDemo = document.getElementById('detail-no-demo');
    const btnViewReport = document.getElementById('btn-view-report');
    const btnViewReport2 = document.getElementById('btn-view-report-2');

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

    // Initial Load
    if (window.location.hash === '#portfolio') {
        showSection('portfolio');
    } else {
        showSection('home');
    }

    // --- Data Loading ---
    let allProjects = [];
    // Cache busting: Add timestamp to force fresh fetch
    fetch('projects.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(projects => {
            allProjects = projects;
            renderProjects(projects);
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
                    <div class="mt-4 flex items-center text-sm font-medium text-primary">
                        İncele
                        <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                </div>
            </div>
        `).join('');
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
            detailFrame.src = project.demo_url;
            detailFrame.classList.remove('hidden');
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

    // Generic Go Back Function for UI Buttons
    window.goBack = () => {
        if (history.state && (history.state.section === 'detail' || history.state.section === 'report')) {
            history.back();
        } else {
            showSection('portfolio');
            // Ensure URL is clean if we fell back
            if (window.location.hash.includes('project') || window.location.hash.includes('report')) {
                history.replaceState(null, '', 'index.html#portfolio');
            }
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
