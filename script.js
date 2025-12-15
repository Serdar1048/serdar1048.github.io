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
        contact: document.getElementById('contact'),
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
            // Init graph if about section is shown
            if (sectionName === 'about') {
                setTimeout(() => initGraph(), 100); // Slight delay for render
            }
        }

        // Update Hash to support refresh/bookmarks
        if (sectionName === 'home') {
            history.pushState(null, null, ' '); // Clear hash for home
        } else {
            window.location.hash = sectionName;
        }

        // Scroll top
        window.scrollTo(0, 0);
    };

    // Global navigateTo function (referenced in HTML)
    window.navigateTo = (sectionName) => {
        showSection(sectionName);
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

    // --- Specific Section Logic ---
    // --- Specific Section Logic ---

    // --- Markdown Renderer Setup (Copy Button) ---
    const renderer = new marked.Renderer();
    renderer.code = function (code, language) {
        const validLang = !!(language && hljs.getLanguage(language));
        const highlighted = validLang ? hljs.highlight(code, { language }).value : code;
        // Escape for attribute
        const escapedCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '&quot;');

        return `
            <div class="relative group my-4 code-wrapper">
                <button 
                    onclick="copyCode(this)" 
                    data-code="${escapedCode}"
                    class="absolute top-3 right-3 p-2 rounded-lg bg-slate-700/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-sm z-10"
                    title="Kodu Kopyala">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
                <pre class="!mt-0 rounded-xl relative"><code class="hljs ${language}">${highlighted}</code></pre>
            </div>
        `;
    };
    marked.setOptions({ renderer: renderer });

    // Global toggle for copy function
    window.copyCode = (btn) => {
        const code = btn.getAttribute('data-code');
        navigator.clipboard.writeText(code).then(() => {
            const originalIcon = btn.innerHTML;
            // Show checkmark
            btn.innerHTML = `<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
        }).catch(err => console.error('Copy failed', err));
    };
    window.initGraph = () => {
        const container = document.getElementById('skills-graph');
        if (!container) return;

        // Check if Vis.js is loaded
        if (typeof vis === 'undefined') {
            console.warn('Vis.js not ready, retrying...');
            setTimeout(window.initGraph, 500);
            return;
        }

        // Clear loading text if present
        const loader = document.getElementById('graph-loading');
        if (loader) loader.style.display = 'none';

        // Check if canvas already exists
        if (container.querySelector('canvas')) return;

        const nodes = new vis.DataSet([
            // Center
            { id: 1, label: 'Serdar', color: '#1e293b', font: { color: 'white', size: 20 }, size: 30 },

            // Level 1 (Core)
            { id: 2, label: 'Data Science', color: '#3b82f6', size: 25 },
            { id: 3, label: 'Development', color: '#3b82f6', size: 25 },

            // Level 2 - Data Science
            { id: 4, label: 'Python', color: '#60a5fa' },
            { id: 5, label: 'Machine Learning', color: '#60a5fa' },
            { id: 6, label: 'Deep Learning', color: '#60a5fa' },

            // Level 2 - Dev
            { id: 7, label: 'Web Dev', color: '#93c5fd' },
            { id: 8, label: 'Tools', color: '#93c5fd' },

            // Level 3 - Tech
            { id: 9, label: 'Pandas', color: '#e2e8f0' },
            { id: 10, label: 'NumPy', color: '#e2e8f0' },
            { id: 11, label: 'Scikit-Learn', color: '#e2e8f0' },
            { id: 12, label: 'TensorFlow', color: '#e2e8f0' },
            { id: 13, label: 'HTML/CSS', color: '#e2e8f0' },
            { id: 14, label: 'Tailwind', color: '#e2e8f0' },
            { id: 15, label: 'Streamlit', color: '#e2e8f0' },
            { id: 16, label: 'Git', color: '#e2e8f0' },
            { id: 17, label: 'SQL', color: '#e2e8f0' }
        ]);

        const edges = new vis.DataSet([
            { from: 1, to: 2 },
            { from: 1, to: 3 },

            { from: 2, to: 4 },
            { from: 2, to: 5 },
            { from: 2, to: 6 },

            { from: 3, to: 7 },
            { from: 3, to: 8 },

            { from: 4, to: 9 },
            { from: 4, to: 10 },
            { from: 4, to: 11 },
            { from: 4, to: 12 },
            { from: 4, to: 15 }, // Streamlit uses Python

            { from: 5, to: 11 },
            { from: 5, to: 12 },

            { from: 7, to: 13 },
            { from: 7, to: 14 },
            { from: 7, to: 15 },

            { from: 8, to: 16 },
            { from: 8, to: 17 },

            { from: 4, to: 17 } // Python <-> SQL
        ]);

        const data = { nodes, edges };
        const options = {
            nodes: {
                shape: 'dot',
                font: { face: 'Inter', color: '#1e293b' },
                borderWidth: 0,
                shadow: true
            },
            edges: {
                width: 1,
                color: { color: '#cbd5e1', highlight: '#3b82f6' },
                smooth: { type: 'continuous' }
            },
            physics: {
                stabilization: false,
                barnesHut: {
                    gravitationalConstant: -2000,
                    springConstant: 0.04,
                    springLength: 95
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: false
            }
        };

        new vis.Network(container, data, options);
    };

    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    handleStaticRouting();

    // Cache busting: Add timestamp to force fresh fetch
    // --- Initial Load Logic ---
    // Handle Refresh/Direct Link (Check Hash)
    const handleInitialRouting = () => {
        const hash = window.location.hash.slice(1); // Remove '#'
        if (hash) {
            // Check if hash matches a known section
            if (sections[hash]) {
                showSection(hash);
            } else {
                // Default to home if hash is invalid
                showSection('home');
            }
        } else {
            // No hash, default to home
            showSection('home');
        }
    };

    // Call initial routing immediately
    handleInitialRouting();

    // Load Project Data
    fetch(`projects.json?v=${new Date().getTime()}`)
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

    // --- Filtering & Recommender Logic ---
    window.filterProjects = (category) => {
        let filtered = [];
        let isRecommendation = false;

        if (category === 'all') {
            filtered = allProjects;
        } else {
            isRecommendation = true;
            const keywords = {
                vision: ["image", "vision", "detection", "yolo", "cnn", "görüntü", "face", "opencv", "segmentation"],
                prediction: ["prediction", "regression", "price", "forecast", "finance", "stock", "tahmin", "xgboost", "time series", "analysis", "classification"],
                nlp: ["nlp", "text", "sentiment", "llm", "language", "bert", "gpt", "doğal", "chat"]
            };

            const targetKeywords = keywords[category] || [];

            filtered = allProjects.filter(p => {
                const content = (p.title + " " + p.description + " " + (p.technologies || []).join(" ")).toLowerCase();
                return targetKeywords.some(k => content.includes(k));
            });

            // Fake "Match Score" for gamification (94% - 99%)
            filtered = filtered.map(p => ({
                ...p,
                matchScore: Math.floor(Math.random() * (99 - 94 + 1)) + 94
            })).sort((a, b) => b.matchScore - a.matchScore);
        }

        renderProjects(filtered, isRecommendation);
    };

    function renderProjects(projects, isRecommendation = false) {
        if (!grid) return;

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <div class="inline-block p-4 rounded-full bg-slate-100 mb-4">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="text-lg font-medium text-slate-900">Bu kategoride henüz proje yok.</h3>
                    <p class="text-slate-500">Çok yakında eklenecek!</p>
                    <button onclick="filterProjects('all')" class="mt-4 text-primary hover:underline">Tüm projeleri göster</button>
                </div>`;
            return;
        }

        grid.innerHTML = projects.map((project, index) => `
            <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 overflow-hidden group cursor-pointer animate-fade-in-up" 
                 style="animation-delay: ${index * 100}ms"
                 onclick="openSimulation(${project.id})">
                <div class="h-48 overflow-hidden bg-slate-200 relative">
                    <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    
                    ${isRecommendation ? `
                    <div class="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        %${project.matchScore} Eşleşme
                    </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">${project.title}</h3>
                    <p class="text-slate-600 line-clamp-2">${project.description}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${project.technologies ? project.technologies.slice(0, 3).map(tech => `
                            <span class="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                                ${tech}
                            </span>
                        `).join('') : ''}
                        ${project.technologies && project.technologies.length > 3 ? `
                            <span class="px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
                                +${project.technologies.length - 3}
                            </span>
                        ` : ''}
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

        // --- Next Project Logic ---
        const nextProjectContainer = document.getElementById('next-project-container');
        if (nextProjectContainer) {
            const currentIndex = allProjects.findIndex(p => p.id === id);
            if (currentIndex !== -1) {
                // Cyclic: (i + 1) % length
                const nextIndex = (currentIndex + 1) % allProjects.length;
                const nextProject = allProjects[nextIndex];

                nextProjectContainer.innerHTML = `
                    <div class="cursor-pointer group" onclick="openSimulation(${nextProject.id})">
                        <div class="text-sm text-slate-500 mb-1 font-medium">Sıradaki Proje</div>
                        <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all duration-300">
                            <div class="flex items-center gap-4">
                                <img src="${nextProject.image}" class="w-16 h-16 object-cover rounded-lg bg-slate-200" alt="${nextProject.title}">
                                <div>
                                    <h4 class="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">${nextProject.title}</h4>
                                    <p class="text-sm text-slate-500 line-clamp-1">${nextProject.description}</p>
                                </div>
                            </div>
                            <svg class="w-6 h-6 text-slate-400 group-hover:text-primary group-hover:translate-x-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </div>
                    </div>
                `;
            }
        }

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

    // --- Reading Progress Bar Logic ---
    const progressBar = document.getElementById('reading-progress-bar');

    window.addEventListener('scroll', () => {
        // Only active if report section is visible
        if (!sections.report || sections.report.classList.contains('hidden')) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (scrollHeight <= 0) {
            progressBar.style.width = '0%';
            return;
        }

        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = `${scrollPercentage}%`;
    });
});
