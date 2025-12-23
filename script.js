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

    window.showSection = (sectionName, updateHash = true) => {
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
        if (updateHash) {
            if (sectionName === 'home') {
                history.pushState(null, null, ' '); // Clear hash for home
            } else {
                window.location.hash = sectionName;
            }
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
            // State yoksa Hash'i kontrol et (Yedek Mekanizma)
            const hash = window.location.hash;
            if (hash.startsWith('#project-')) {
                const id = parseInt(hash.replace('#project-', ''));
                if (!isNaN(id)) {
                    openSimulation(id, false);
                    return;
                }
            } else if (hash.startsWith('#report-')) {
                const id = parseInt(hash.replace('#report-', ''));
                if (!isNaN(id)) {
                    openReport(id, false);
                    return;
                }
            }

            // Default
            if (hash === '#portfolio') {
                showSection('portfolio', false);
            } else if (hash === '#about') {
                showSection('about', false);
            } else if (hash === '#contact') {
                showSection('contact', false);
            } else {
                showSection('home', false);
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
    // --- Binary Snake Game (Skills) ---
    // --- Binary Collector Game (Skills) ---
    window.initGraph = () => {
        const container = document.getElementById('skills-graph');
        if (!container) return;

        container.innerHTML = '';
        container.style.cursor = 'none';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        container.appendChild(canvas);

        // Game State
        let width, height;
        let mouseX = 0, mouseY = 0;

        // Player
        const player = {
            head: { x: 0, y: 0, char: '1', size: 40 },
            body: { x: 0, y: 0, width: 140, height: 80 }, // Horizontal Ellipse dimensions
            angle: 0
        };

        const skillsRaw = [
            'Python', 'Data Science', 'Machine Learning', 'Deep Learning',
            'SQL', 'TensorFlow', 'Pandas', 'NumPy', 'Scikit-Learn',
            'Web Dev', 'HTML/CSS', 'Tailwind', 'Git', 'Streamlit'
        ];

        const colors = [
            '#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#67E8F9',
            '#93C5FD', '#A5B4FC', '#C4B5FD', '#F0ABFC', '#FDA4AF'
        ];

        let orbs = [];

        const init = () => {
            const rect = container.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width;
            canvas.height = height;

            player.head.x = width / 2;
            player.head.y = height / 2;
            player.body.x = width / 2;
            player.body.y = height / 2;

            spawnOrbs();
        };

        const spawnOrbs = () => {
            orbs = skillsRaw.map((skill, index) => ({
                text: skill,
                x: Math.random() * (width - 100) + 50,
                y: Math.random() * (height - 100) + 50,
                vx: (Math.random() - 0.5) * 0.5, // Initial drift
                vy: (Math.random() - 0.5) * 0.5,
                r: 15 + Math.random() * 5,
                color: colors[index % colors.length],
                state: 'floating',
                collectionIndex: -1
            }));
        };

        // Input
        const updateMouse = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = x - rect.left;
            mouseY = y - rect.top;
        };
        container.addEventListener('mousemove', e => updateMouse(e.clientX, e.clientY));
        container.addEventListener('touchmove', e => {
            e.preventDefault();
            updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });


        // Loop
        const loop = () => {
            ctx.clearRect(0, 0, width, height);

            // 1. Head Logic ('1')
            // Head leads, moves towards mouse
            player.head.x += (mouseX - player.head.x) * 0.12;
            player.head.y += (mouseY - player.head.y) * 0.12;

            // 2. Body Logic ('0' Ellipse)
            // Follows Head
            // But '0' is slower/heavier
            player.body.x += (player.head.x - player.body.x) * 0.08;
            player.body.y += (player.head.y - player.body.y) * 0.08;

            // 3. Draw Body (Horizontal '0' Ellipse)
            ctx.beginPath();
            ctx.ellipse(player.body.x, player.body.y, player.body.width / 2, player.body.height / 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; // White Fill
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#0f172a'; // Black Stroke (Slate-900)
            ctx.stroke();

            // 4. Update & Draw Orbs
            const collectedOrbs = orbs.filter(o => o.state === 'collected');

            orbs.forEach(orb => {
                if (orb.state === 'floating') {
                    // Flee Logic
                    const dx = orb.x - player.head.x;
                    const dy = orb.y - player.head.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 200) { // Detection range
                        // Flee velocity
                        const force = (200 - dist) * 0.0005; // Gentle push
                        orb.vx += dx * force;
                        orb.vy += dy * force;
                    }

                    // Friction
                    orb.vx *= 0.95;
                    orb.vy *= 0.95;

                    // Boundaries
                    if (orb.x < 20 || orb.x > width - 20) orb.vx *= -1;
                    if (orb.y < 20 || orb.y > height - 20) orb.vy *= -1;

                    orb.x += orb.vx;
                    orb.y += orb.vy;

                    // Eat Check
                    if (dist < 40) {
                        orb.state = 'collected';
                        orb.collectionIndex = collectedOrbs.length;
                    }
                    drawOrb(orb);

                } else if (orb.state === 'collected') {
                    // Snap to Perimeter
                    const slot = getOrbSlot(orb);
                    const absTargetX = player.body.x + slot.x;
                    const absTargetY = player.body.y + slot.y;

                    orb.x += (absTargetX - orb.x) * 0.1;
                    orb.y += (absTargetY - orb.y) * 0.1;

                    drawOrb(orb);
                }
            });

            // 5. Draw Head ('1')
            // "1" sanki yılanın başıymış gibi... ortasından uzasın
            ctx.font = 'bold 60px Inter, sans-serif';
            ctx.fillStyle = '#3b82f6';
            ctx.textAlign = 'center'; // Center horizontally on coordinate
            ctx.textBaseline = 'middle'; // Center vertically

            // To make it look like it's coming out, the head is the '1' itself.
            // We draw it at head position.
            ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
            ctx.shadowBlur = 15;
            ctx.fillText('1', player.head.x, player.head.y);
            ctx.shadowBlur = 0;

            requestAnimationFrame(loop);
        };

        const getOrbSlot = (orb) => {
            // Position on Ellipse Perimeter
            // Ellipse parametric eq: x = a cos t, y = b sin t
            // a = width/2, b = height/2

            const idx = orb.collectionIndex;
            const perimeterCap = 16;

            if (idx < perimeterCap) {
                // Perimeter
                // Evenly distribute
                const angle = (idx / perimeterCap) * Math.PI * 2;
                return {
                    x: (player.body.width / 2 + orb.r) * Math.cos(angle), // +orb.r to sit ON line
                    y: (player.body.height / 2 + orb.r) * Math.sin(angle)
                };
            } else {
                // Inside (Spiral)
                const innerIdx = idx - perimeterCap;
                const angle = innerIdx * 0.8;
                const radiusScale = 1 - (innerIdx * 0.05);
                return {
                    x: (player.body.width / 4) * radiusScale * Math.cos(angle),
                    y: (player.body.height / 4) * radiusScale * Math.sin(angle)
                };
            }
        };

        const drawOrb = (orb) => {
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();

            // Simple stroke for definition
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            // Text
            if (orb.state === 'floating') {
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.textAlign = 'center';
                ctx.fillText(orb.text, orb.x, orb.y + orb.r + 14);
            }
        };

        window.addEventListener('resize', init);
        init();
        loop();
    };

    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    // handleStaticRouting(); // Removed legacy function call

    // Cache busting: Add timestamp to force fresh fetch
    // --- Initial Load Logic ---
    // Handle Refresh/Direct Link (Check Hash)
    const handleInitialRouting = () => {
        const hash = window.location.hash;

        // If it's a deep link (Project/Report), wait for data loading (don't redirect to home)
        if (hash.startsWith('#project-') || hash.startsWith('#report-')) {
            return;
        }

        const sectionName = hash.slice(1); // Remove '#'

        if (sectionName && sections[sectionName]) {
            showSection(sectionName);
        } else {
            // Default to home only if no hash or invalid hash
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

    /* Legacy handleStaticRouting removed */

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
        if (!project) {
            console.error('Project not found:', id);
            return;
        }

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

        showSection('detail', false); // Don't auto-update hash, we handle it below
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

        showSection('report', false); // Don't auto-update hash, we handle it below

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
    // --- Mobile TOC Toggle (Drawer) ---
    window.toggleMobileTOC = () => {
        const drawer = document.getElementById('mobile-toc-drawer');
        const overlay = document.getElementById('mobile-toc-overlay');

        if (!drawer || !overlay) return;

        const isClosed = drawer.classList.contains('-translate-x-full');

        if (isClosed) {
            // Open
            overlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden'); // Lock body scroll
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                drawer.classList.remove('-translate-x-full');
            }, 10);
        } else {
            // Close
            drawer.classList.add('-translate-x-full');
            overlay.classList.add('opacity-0');
            document.body.classList.remove('overflow-hidden'); // Unlock body scroll
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 300); // Match transition duration
        }
    };

    function generateTOC() {
        const desktopContainer = document.getElementById('toc-container');
        const mobileContainer = document.getElementById('mobile-toc-container');

        desktopContainer.innerHTML = '';
        if (mobileContainer) mobileContainer.innerHTML = '';

        const headers = reportContent.querySelectorAll('h1, h2, h3');

        if (headers.length === 0) {
            desktopContainer.innerHTML = '<p class="text-xs text-slate-400">Bu raporda başlık bulunamadı.</p>';
            if (mobileContainer) mobileContainer.innerHTML = '<p class="text-xs text-slate-400">Başlık bulunamadı.</p>';
            return;
        }

        const createLink = (header, isMobile) => {
            // Assign ID if missing
            if (!header.id) {
                // Use random ID to avoid conflicts if same text
                header.id = 'heading-' + Math.random().toString(36).substr(2, 9);
            }

            const link = document.createElement('a');
            link.href = '#' + header.id;
            link.textContent = header.textContent;

            const level = parseInt(header.tagName.substring(1));

            if (isMobile) {
                // Mobile Styling
                link.className = 'block text-sm text-slate-600 hover:text-primary transition-colors py-2 border-b border-slate-100 last:border-0 pl-2 truncate';
                if (level === 3) link.classList.add('ml-4', 'text-xs');
            } else {
                // Desktop Styling
                link.className = 'block text-sm text-slate-600 hover:text-primary transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3 truncate';
                if (level === 2) link.classList.add('ml-0', 'font-medium');
                if (level === 3) link.classList.add('ml-4');
            }

            link.onclick = (e) => {
                e.preventDefault();
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // If mobile, close menu after click
                if (isMobile) window.toggleMobileTOC();
            };
            return link;
        };

        headers.forEach((header) => {
            // Desktop
            desktopContainer.appendChild(createLink(header, false));
            // Mobile
            if (mobileContainer) mobileContainer.appendChild(createLink(header, true));
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
        progressBar.style.width = `${scrollPercentage}%`;
    });

    // --- Email Validation Logic ---
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Allowed Domains and TLDs
    // Allowed Major Providers (Strict List)
    const allowedProviders = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com',
        'icloud.com', 'yandex.com', 'protonmail.com', 'msn.com', 'me.com', 'mac.com'
    ];

    // Trusted Institutional/Academic TLDs (Allowed for ANY domain)
    // Generic TLDs like .com, .net are EXCLUDED here.
    const institutionalTLDs = [
        'edu', 'gov', 'mil',
        'edu.tr', 'gov.tr', 'av.tr', 'k12.tr', 'pol.tr', 'bel.tr', 'tsk.tr',
        'ac.uk', 'gov.uk', 'ac.jp'
    ];

    const isValidDomain = (email) => {
        if (!email.includes('@')) return false;
        const domain = email.split('@')[1].toLowerCase();

        // 1. Check if it's a known major provider
        if (allowedProviders.includes(domain)) return true;

        // 2. Check TLDs
        // Split domain by dot to get parts (e.g. 'sub.example.co.uk' -> ['sub', 'example', 'co', 'uk'])
        // We check if the ending matches any of our allowed TLDs
        for (const tld of institutionalTLDs) {
            // Check exact TLD match at the end
            if (domain.endsWith('.' + tld)) return true;
        }
        return false;
    };

    if (emailInput && emailError) {
        emailInput.addEventListener('input', function () {
            const val = this.value.trim();
            // Show error if value exists and regex fails OR domain is invalid
            if (val.length > 0 && (!emailRegex.test(val) || !isValidDomain(val))) {
                if (!emailRegex.test(val)) {
                    emailError.textContent = 'Lütfen geçerli bir email adresi giriniz.';
                } else {
                    emailError.textContent = 'Lütfen geçerli bir e-posta sağlayıcısı kullanınız (gmail, hotmail, edu, gov vb).';
                }
                emailError.classList.remove('hidden');
                this.classList.add('border-red-500', 'focus:ring-red-200');
                this.classList.remove('border-slate-200', 'focus:border-primary', 'focus:ring-primary/20');
            } else {
                // Hide error if empty or valid (HTML5 'required' handles empty on submit)
                emailError.classList.add('hidden');
                this.classList.remove('border-red-500', 'focus:ring-red-200');
                this.classList.add('border-slate-200', 'focus:border-primary', 'focus:ring-primary/20');
            }
        });

        // Also block submit if invalid (double check)
        emailInput.addEventListener('blur', function () {
            // Optional: Validate on blur to be sure
            if (this.value.length > 0 && !emailRegex.test(this.value.trim())) {
                // Ensure error is visible
                emailError.classList.remove('hidden');
            }
        });
    }

    // --- Contact Form AJAX Logic ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const form = e.target;
            const data = new FormData(form);
            const submitBtn = document.getElementById('form-submit-btn');
            const statusDiv = document.getElementById('form-status');
            const originalBtnText = submitBtn.innerHTML;

            // Loading State
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Gönderiliyor...</span> ⏳';

            // Rate Limiting (15 Minutes)
            const lastSubmission = localStorage.getItem('last_submission_time');
            if (lastSubmission) {
                const timeDiff = Date.now() - parseInt(lastSubmission);
                const minutesLeft = 15 - Math.floor(timeDiff / (1000 * 60));

                if (minutesLeft > 0) {
                    statusDiv.innerHTML = `Hata: Çok sık mesaj gönderdiniz. Lütfen ${minutesLeft} dakika bekleyiniz.`;
                    statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-orange-50 text-orange-600 animate-shake";
                    statusDiv.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }
            }

            // JS Validation Check
            const nameVal = form.querySelector('input[name="name"]').value.trim();
            const messageVal = form.querySelector('textarea[name="message"]').value.trim();
            const emailVal = form.querySelector('input[name="email"]').value;
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            // Check Empty Fields
            if (!nameVal || !messageVal || !emailVal) {
                statusDiv.innerHTML = "Hata: Lütfen tüm alanları doldurunuz.";
                statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 animate-shake";
                statusDiv.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Check Email Regex
            if (!emailRegex.test(emailVal) || !isValidDomain(emailVal)) {
                if (!emailRegex.test(emailVal)) {
                    statusDiv.innerHTML = "Hata: Lütfen geçerli bir email adresi giriniz.";
                } else {
                    statusDiv.innerHTML = "Hata: Lütfen geçerli bir e-posta sağlayıcısı kullanınız.";
                }
                statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 animate-shake";
                statusDiv.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success
                    statusDiv.innerHTML = "Mesajınız başarıyla gönderildi! 🎉";
                    statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-green-50 text-green-600 animate-fade-in-up";
                    statusDiv.classList.remove('hidden');
                    form.reset(); // Clear inputs

                    // Save Submission Time for Rate Limiting
                    localStorage.setItem('last_submission_time', Date.now());

                    // Remove success message after 5 seconds
                    setTimeout(() => {
                        statusDiv.classList.add('hidden');
                        statusDiv.className = "hidden text-center p-3 rounded-lg text-sm font-medium";
                    }, 5000);
                } else {
                    // Error
                    const errorData = await response.json();
                    let errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
                    if (errorData.errors && errorData.errors.length > 0) {
                        errorMessage = errorData.errors.map(err => err.message).join(", ");
                    }
                    statusDiv.innerHTML = "Hata: " + errorMessage;
                    statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 animate-shake";
                    statusDiv.classList.remove('hidden');
                }
            } catch (error) {
                statusDiv.innerHTML = "Bağlantı hatası oluştu.";
                statusDiv.className = "text-center p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 animate-shake";
                statusDiv.classList.remove('hidden');
            } finally {
                // Restore Button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // --- Responsive Navigation Logic ---

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');

    window.toggleMobileMenu = () => {
        if (!mobileMenu) return;
        const isOpen = mobileMenu.classList.contains('open');
        if (isOpen) {
            mobileMenu.classList.remove('open');
            menuIconOpen.classList.remove('hidden');
            menuIconClose.classList.add('hidden');
        } else {
            mobileMenu.classList.add('open');
            menuIconOpen.classList.add('hidden');
            menuIconClose.classList.remove('hidden');
        }
    };

    // Close mobile menu when a link is clicked
    const originalShowSection = window.showSection;
    window.showSection = (sectionName, updateHash = true) => {
        originalShowSection(sectionName, updateHash);
        // Close menu if open
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            window.toggleMobileMenu();
        }
    };

    // Scroll Handler for Sticky Header & Back to Top
    const backToTopBtn = document.getElementById('back-to-top');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Back to Top Visibility
        if (backToTopBtn) {
            if (scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }

        // Active Link Highlighting (ScrollSpy)
        // Since we are SPA showing/hiding sections, traditional scrollspy doesn't apply to "sections down the page"
        // But if 'home' is long, we might want it.
        // For now, let's rely on click-based active state which is more accurate for this SPA type.
    });

    // Update active state based on visibility (since we hide sections)
    // We hook into showSection instead of scroll for this specific SPA type
    const updateActiveLink = (sectionName) => {
        navLinks.forEach(link => {
            // Simple check: does the onclick attribute contain the section name?
            const onclickVal = link.getAttribute('onclick');
            if (onclickVal && onclickVal.includes(`'${sectionName}'`)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // Hook updateActiveLink into showSection
    // Note: We already hooked showSection above, so we can just modify that one or chain them.
    // To avoid double hooking, let's redefine showSection ONCE with all new logic.

    // Resetting showSection to original + new logic combined
    window.showSection = (sectionName, updateHash = true) => {
        originalShowSection(sectionName, updateHash);

        // Mobile Menu Logic
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            window.toggleMobileMenu();
        }

        // Active Link Logic
        updateActiveLink(sectionName);
    };

    // Initial Active Link Highlight
    const currentHash = window.location.hash.slice(1) || 'home';
    if (!currentHash.startsWith('project-') && !currentHash.startsWith('report-')) {
        updateActiveLink(currentHash);
    }

});
