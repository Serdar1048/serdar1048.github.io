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
    let currentReportLang = 'tr'; // 'tr' or 'en'
    let currentBlogPageLang = 'tr'; // Blog page (list) language, separate from blog detail language

    // --- SPA Logic (Single Page Application) ---
    const sections = {
        home: document.getElementById('home'),
        portfolio: document.getElementById('portfolio'),
        about: document.getElementById('about'),
        contact: document.getElementById('contact'),
        detail: document.getElementById('project-detail'),
        report: document.getElementById('project-report'),
        blog: document.getElementById('blog'),
        'blog-report': document.getElementById('blog-report')
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
        let target = sections[sectionName];
        if (!target) target = document.getElementById(sectionName);

        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);
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
            } else if (hash.startsWith('#blog-')) {
                const id = parseInt(hash.replace('#blog-', ''));
                if (!isNaN(id)) {
                    openBlogReport(id, false);
                    return;
                }
            }

            // Default
            if (hash === '#portfolio') {
                showSection('portfolio', false);
            } else if (hash === '#blog' || hash === '#blog-list') {
                showSection('blog', false);
            } else if (hash === '#about') {
                showSection('about', false);
            } else if (hash === '#contact') {
                showSection('contact', false);
            } else if (hash === '' || hash === '#' || hash === '#home') {
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
    let allBlogs = [];
    let currentBlogId = null;
    let currentBlogLang = 'tr';

    // --- Specific Section Logic ---
    // --- Specific Section Logic ---

    // --- Markdown Renderer Setup (Copy Button) ---
    const renderer = new marked.Renderer();
    renderer.code = function (arg1, arg2) {
        let code = arg1;
        let language = arg2;

        // Handle newer marked.js versions where the first argument is an object
        if (typeof arg1 === 'object' && arg1 !== null) {
            code = arg1.text || '';
            language = arg1.lang || '';
        }

        // Safety check for Highlight.js (hljs)
        const validLang = !!(language && typeof hljs !== 'undefined' && hljs.getLanguage(language));
        const highlighted = validLang ? hljs.highlight(code, { language }).value : code;

        // Safely escape for the data-code attribute
        const escapedCode = String(code).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '&quot;');

        return `
            <div class="relative group my-4 code-wrapper">
                <button 
                    onclick="copyCode(this)" 
                    data-code="${escapedCode}"
                    class="absolute top-3 right-3 p-2 rounded-lg bg-slate-700/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-sm z-10"
                    title="Kodu Kopyala">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 0 002 2z"></path></svg>
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
    // --- Interactive Neural Network (v6) ---
    window.initGraph = () => {
        const container = document.getElementById('skills-graph');
        if (!container) return;

        container.innerHTML = '';
        // Cursor visible now (removed cursor:none)
        container.style.cursor = 'default';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        container.appendChild(canvas);

        let width, height;
        let particles = [];
        // Mouse removed from physics

        const skills = [
            'Machine Learning', 'Deep Learning', 'NumPy', 'Python', 'Pandas',
            'TensorFlow', 'Kaggle', 'Colab', 'Data Science', 'Flutter',
            'Scikit-Learn', 'PyTorch', 'Image Processing', 'Git', 'GitHub',
            'Keras', 'NLP'
        ];

        class Particle {
            constructor(text) {
                this.text = text;
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4; // Slower gentle speed
                this.vy = (Math.random() - 0.5) * 0.4;
                this.size = 3 + Math.random() * 2;
                this.color = '#3b82f6'; // Blue-500

                // Measure text width for bouncing logic
                ctx.font = 'bold 14px Inter, sans-serif';
                this.textWidth = ctx.measureText(text).width;
                // Collision radius approx (half text width + padding)
                this.radius = this.textWidth / 2 + 10;
            }

            update(particles) {
                // Bounds Check & Bounce (Considering Text Width)
                const padding = 20;

                if (this.x - this.textWidth / 2 < padding) {
                    this.x = padding + this.textWidth / 2;
                    this.vx *= -1;
                }
                if (this.x + this.textWidth / 2 > width - padding) {
                    this.x = width - padding - this.textWidth / 2;
                    this.vx *= -1;
                }

                if (this.y < padding) {
                    this.y = padding;
                    this.vy *= -1;
                }
                if (this.y > height - padding) {
                    this.y = height - padding;
                    this.vy *= -1;
                }

                // Ambient Floating only
                this.x += this.vx;
                this.y += this.vy;

                // Collision Detection with other particles
                for (let other of particles) {
                    if (other === this) continue;

                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = this.radius + other.radius;

                    if (dist < minDist) {
                        // Collision detected!
                        // Resolve Overlap (push apart)
                        const overlap = minDist - dist;
                        const nx = dx / dist; // Normalized collision vector x
                        const ny = dy / dist; // Normalized collision vector y

                        // Move apart proportional to overlap
                        const moveX = nx * overlap * 0.5;
                        const moveY = ny * overlap * 0.5;

                        this.x -= moveX;
                        this.y -= moveY;
                        other.x += moveX;
                        other.y += moveY;

                        // Bounce (Exchange velocity component along normal)
                        // Simplified: just swap velocities or reflect
                        // Ideally: 1D elastic collision along normal

                        // Relative velocity
                        const dvx = other.vx - this.vx;
                        const dvy = other.vy - this.vy;

                        // Velocity along normal
                        const velAlongNormal = dvx * nx + dvy * ny;

                        // Do not resolve if velocities are separating
                        if (velAlongNormal > 0) return;

                        // Restitution (bounciness)
                        const restitution = 1;

                        // Impulse scalar
                        let j = -(1 + restitution) * velAlongNormal;
                        j /= 2; // Assuming equal mass

                        // Apply impulse
                        const impulseX = j * nx;
                        const impulseY = j * ny;

                        this.vx -= impulseX;
                        this.vy -= impulseY;
                        other.vx += impulseX;
                        other.vy += impulseY;
                    }
                }
            }

            draw() {
                // Particle (Node)
                // Glow Effect
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#60a5fa';
                ctx.fill();

                // Text (High Legibility)
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillStyle = '#ffffff'; // Pure White
                ctx.textAlign = 'center';

                // Text Shadow
                ctx.shadowColor = 'rgba(15, 23, 42, 0.8)';
                ctx.shadowBlur = 4;
                ctx.strokeText(this.text, this.x, this.y + this.size + 18);
                ctx.shadowBlur = 0;

                ctx.shadowColor = '#000';
                ctx.shadowBlur = 6;
                ctx.fillText(this.text, this.x, this.y + this.size + 18);
                ctx.shadowBlur = 0;
            }
        }

        const init = () => {
            const rect = container.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width;
            canvas.height = height;

            particles = [];
            skills.forEach(skill => {
                particles.push(new Particle(skill));
            });
            // NO DUMMY NODES
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Connections: FULL CONNECTIVITY
            // Draw lines between ALL pairs
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // We draw ALL lines, but opacity depends on distance to avoid whiteout
                    // Max diagonal distance is approx sqrt(w^2 + h^2)
                    // Let's fade them out very gradually.

                    const maxDist = Math.max(width, height) * 0.8; // Visible across most screen

                    if (dist < maxDist) {
                        ctx.beginPath();
                        // Opacity function: Stronger when close, faint when far
                        // Start: 0.2, End: 0.0
                        let opacity = (1 - (dist / maxDist)) * 0.15;
                        if (opacity < 0.01) opacity = 0.01; // Minimum faint line

                        ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`; // Slate-400
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Update and Draw Particles
            particles.forEach(p => {
                p.update(particles);
                p.draw();
            });

            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', init);

        init();
        animate();
    };

    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    // Pre-Fetch Routing: Handle static pages immediately to prevent flash
    // handleStaticRouting(); // Removed legacy function call

    // Cache busting: Add timestamp to force fresh fetch
    // --- Initial Load Logic ---
    // Handle Refresh/Direct Link (Check Hash)
    const handleInitialRouting = () => {
        const hash = window.location.hash;
        console.log("Routing: Initial hash is", hash);

        // If it's a deep link (Project/Report/Blog Report), wait for data loading (don't redirect to home)
        if (hash.startsWith('#project-') || hash.startsWith('#report-') || hash.startsWith('#blog-')) {
            console.log("Routing: Deep link detected, waiting for data...");
            return;
        }

        const sectionName = hash.slice(1); // Remove '#'

        if (sectionName && sections[sectionName]) {
            console.log("Routing: Showing section", sectionName);
            showSection(sectionName, false);
        } else if (!hash || hash === '#' || hash === '#home') {
            console.log("Routing: No hash, showing home");
            showSection('home', false);
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

    // Load Blog Data
    fetch(`blog.json?v=${new Date().getTime()}`)
        .then(response => response.json())
        .then(blogs => {
            allBlogs = blogs;
            renderBlogs(blogs);
            handleDataDependentRouting(); // Re-run to handle blog links
        })
        .catch(error => {
            console.error('Blog Loading Error:', error);
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

    // --- Blog Rendering ---
    function renderBlogs(blogs) {
        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid) return;

        if (blogs.length === 0) {
            blogGrid.innerHTML = '<p class="col-span-3 text-center text-slate-500">Henüz blog yazısı eklenmemiş.</p>';
            return;
        }

        const readMoreTR = 'Okumaya Devam Et';
        const readMoreEN = 'Read More';
        const readMore = currentBlogPageLang === 'en' ? readMoreEN : readMoreTR;

        blogGrid.innerHTML = blogs.map((blog, index) => {
            const title = currentBlogPageLang === 'en' ? (blog.title_en || blog.title) : blog.title;
            const description = currentBlogPageLang === 'en' ? (blog.description_en || blog.description) : blog.description;

            return `
            <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 overflow-hidden group cursor-pointer animate-fade-in-up" 
                 style="animation-delay: ${index * 100}ms"
                 onclick="openBlogReport(${blog.id})">
                <div class="h-48 overflow-hidden bg-slate-200 relative">
                    <img src="${blog.image}" alt="${title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-6">
                    <div class="text-xs font-bold text-primary uppercase tracking-wider mb-2">${blog.date}</div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">${title}</h3>
                    <p class="text-slate-600 line-clamp-2">${description}</p>
                    <div class="mt-4 flex items-center text-sm font-medium text-primary">
                        ${readMore}
                        <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    // --- Blog Report View ---
    window.openBlogReport = (id, shouldPushState = true) => {
        console.log("Attempting to open blog report for ID:", id);
        console.log("Current allBlogs state:", allBlogs);

        // Find the blog, being robust with ID types
        const blog = allBlogs.find(b => b.id == id);

        if (!blog) {
            console.error("Blog not found for ID:", id, "Available blogs:", allBlogs);
            // Fallback: If not found, at least show the blog list
            showSection('blog');
            return;
        }

        try {
            currentBlogId = id;
            currentBlogLang = 'tr';

            // Populate UI Elements
            const titleTop = document.getElementById('blog-report-title-top');
            const title = document.getElementById('blog-report-title');
            const date = document.getElementById('blog-report-date');
            const image = document.getElementById('blog-report-image');

            if (titleTop) titleTop.textContent = blog.title;
            if (title) title.textContent = blog.title;
            if (date) date.textContent = blog.date;
            if (image) image.src = blog.image;

            // Setup Toggle Button
            const btnToggle = document.getElementById('blog-btn-lang-toggle');
            if (btnToggle) {
                if (blog.content_en && blog.content_en.trim() !== "") {
                    btnToggle.classList.remove('hidden');
                    const flag = document.getElementById('blog-lang-flag');
                    const text = document.getElementById('blog-lang-text');
                    if (flag) flag.textContent = '🇺🇸';
                    if (text) text.textContent = 'English';
                } else {
                    btnToggle.classList.add('hidden');
                }
            }

            console.log("Rendering blog content...");
            renderBlogContent(blog);

            console.log("Generating TOC...");
            generateTOC('blog-toc-container', 'blog-report-content');

            // --- Next Blog Logic ---
            const nextBlogContainer = document.getElementById('next-blog-container');
            if (nextBlogContainer) {
                if (allBlogs.length > 1) {
                    const currentIndex = allBlogs.findIndex(b => b.id == id);
                    if (currentIndex !== -1) {
                        const nextIndex = (currentIndex + 1) % allBlogs.length;
                        const nextBlog = allBlogs[nextIndex];

                        nextBlogContainer.innerHTML = `
                            <div class="cursor-pointer group" onclick="openBlogReport(${nextBlog.id})">
                                <div class="text-sm text-slate-500 mb-1 font-medium">Sıradaki Yazı</div>
                                <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all duration-300">
                                    <div class="flex items-center gap-4">
                                        <img src="${nextBlog.image}" class="w-16 h-16 object-cover rounded-lg bg-slate-200" alt="${nextBlog.title}">
                                        <div>
                                            <h4 class="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">${nextBlog.title}</h4>
                                            <p class="text-sm text-slate-500 line-clamp-1">${nextBlog.excerpt || nextBlog.title}</p>
                                        </div>
                                    </div>
                                    <svg class="w-6 h-6 text-slate-400 group-hover:text-primary group-hover:translate-x-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    nextBlogContainer.innerHTML = '';
                }
            }

            console.log("Showing section blog-report...");
            showSection('blog-report', false);

            if (shouldPushState) {
                history.pushState({ section: 'blog-report', id: id }, '', '#blog-' + id);
            }
        } catch (err) {
            console.error("Critical error in openBlogReport:", err);
            showSection('blog-report', false);
        }
    };

    function renderBlogContent(blog) {
        const container = document.getElementById('blog-report-content');
        const content = currentBlogLang === 'en' ? blog.content_en : blog.content;
        const finalContent = content || blog.content;

        container.innerHTML = marked.parse(finalContent, { breaks: true });

        // Update titles if English
        if (currentBlogLang === 'en') {
            document.getElementById('blog-report-title').textContent = blog.title_en || blog.title;
        } else {
            document.getElementById('blog-report-title').textContent = blog.title;
        }

        window.scrollTo(0, 0);
    }

    window.toggleBlogLanguage = () => {
        const blog = allBlogs.find(b => b.id === currentBlogId);
        if (!blog) return;

        if (currentBlogLang === 'tr') {
            currentBlogLang = 'en';
            document.getElementById('blog-lang-flag').textContent = '🇹🇷';
            document.getElementById('blog-lang-text').textContent = 'Türkçe';
        } else {
            currentBlogLang = 'tr';
            document.getElementById('blog-lang-flag').textContent = '🇺🇸';
            document.getElementById('blog-lang-text').textContent = 'English';
        }

        renderBlogContent(blog);
        generateTOC('blog-toc-container', 'blog-report-content');
        generateTOC('mobile-toc-container', 'blog-report-content');
    };

    // --- Blog Page Language Switcher ---
    window.setBlogPageLanguage = (lang) => {
        currentBlogPageLang = lang;

        // Update button styles
        const btnTr = document.getElementById('blog-lang-btn-tr');
        const btnEn = document.getElementById('blog-lang-btn-en');

        if (lang === 'tr') {
            if (btnTr) {
                btnTr.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');
                btnTr.classList.add('bg-primary', 'text-white', 'border-primary');
            }
            if (btnEn) {
                btnEn.classList.remove('bg-primary', 'text-white', 'border-primary');
                btnEn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
            }
        } else {
            if (btnTr) {
                btnTr.classList.remove('bg-primary', 'text-white', 'border-primary');
                btnTr.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
            }
            if (btnEn) {
                btnEn.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');
                btnEn.classList.add('bg-primary', 'text-white', 'border-primary');
            }
        }

        // Re-render blogs with new language
        renderBlogs(allBlogs);
    };

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
        } else if (hash.startsWith('#blog-')) {
            const id = parseInt(hash.replace('#blog-', ''));
            if (!isNaN(id)) {
                openBlogReport(id, false);
                history.replaceState({ section: 'blog-report', id: id }, '', hash);
            }
        } else if (hash === '#blog') {
            showSection('blog');
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

        // Reset Language to TR by default
        currentReportLang = 'tr';

        // Setup Toggle Button
        const btnLangToggle = document.getElementById('btn-lang-toggle');
        if (project.details_en && project.details_en.trim() !== "") {
            btnLangToggle.classList.remove('hidden');
            btnLangToggle.innerHTML = '<span class="text-xs">🇺🇸</span> English';
        } else {
            btnLangToggle.classList.add('hidden');
        }

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

        // Render Markdown based on Language
        renderReportContent(project);

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

    // --- Helper: Render Report Content ---
    function renderReportContent(project) {
        const reportContent = document.getElementById('report-content');
        const content = currentReportLang === 'en' ? project.details_en : project.details;

        // Fallback if EN selected but empty (shouldn't happen with button logic but safe to check)
        const finalContent = content || project.details;

        const htmlContent = marked.parse(finalContent, { breaks: true });
        reportContent.innerHTML = htmlContent;

        // Update Title if needed (Optional: add title_en to JSON later if wanted)
        // document.getElementById('report-title').textContent = project.title; 
    }

    // --- Toggle Language Action ---
    window.toggleReportLanguage = () => {
        const project = allProjects.find(p => p.id === currentProjectId); // Use implicit currentID from openReport scope if possible, or store it
        // Actually openReport doesn't store currentProjectId globally for report view specifically, but it does for Sim. 
        // Let's use the ID from the URL hash or rely on the fact that openReport was called.
        // Better: store currentReportId

        // Let's find project again from URL hash to be safe/stateless-ish
        const hash = window.location.hash;
        if (!hash.startsWith('#report-')) return;
        const id = parseInt(hash.replace('#report-', ''));
        const p = allProjects.find(pr => pr.id === id);

        if (!p) return;

        if (currentReportLang === 'tr') {
            currentReportLang = 'en';
            document.getElementById('btn-lang-toggle').innerHTML = '<span class="text-xs">🇹🇷</span> Türkçe';
        } else {
            currentReportLang = 'tr';
            document.getElementById('btn-lang-toggle').innerHTML = '<span class="text-xs">🇺🇸</span> English';
        }

        renderReportContent(p);
        generateTOC();
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
        } else if (section === 'blog-report' && id) {
            openBlogReport(id, false);
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

    function generateTOC(containerId = 'toc-container', contentId = 'report-content') {
        const desktopContainer = document.getElementById(containerId);
        const mobileContainer = document.getElementById('mobile-toc-container');
        const sourceContent = document.getElementById(contentId);

        if (!desktopContainer || !sourceContent) return;

        desktopContainer.innerHTML = '';

        // Always clear mobile container if it exists
        if (mobileContainer) mobileContainer.innerHTML = '';

        const headers = sourceContent.querySelectorAll('h1, h2, h3');

        if (headers.length === 0) {
            desktopContainer.innerHTML = '<p class="text-xs text-slate-400">Bu bölümde başlık bulunamadı.</p>';
            return;
        }

        const createLink = (header, isMobile) => {
            if (!header.id) {
                header.id = 'heading-' + Math.random().toString(36).substr(2, 9);
            }

            const link = document.createElement('a');
            link.href = '#' + header.id;
            link.textContent = header.textContent;

            const level = parseInt(header.tagName.substring(1));

            if (isMobile) {
                link.className = 'block text-sm text-slate-600 hover:text-primary transition-colors py-2 border-b border-slate-100 last:border-0 pl-2 truncate';
                if (level === 3) link.classList.add('ml-4', 'text-xs');
            } else {
                link.className = 'block text-sm text-slate-600 hover:text-primary transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3 truncate';
                if (level === 2) link.classList.add('ml-0', 'font-medium', 'text-slate-800');
                if (level === 3) link.classList.add('ml-4');
            }

            link.onclick = (e) => {
                e.preventDefault();
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (isMobile) window.toggleMobileTOC();
            };
            return link;
        };

        headers.forEach((header) => {
            desktopContainer.appendChild(createLink(header, false));
            if (mobileContainer) {
                mobileContainer.appendChild(createLink(header, true));
            }
        });
    }

    // --- Reading Progress Bar Logic ---
    const projectProgressBar = document.getElementById('reading-progress-bar');
    const blogProgressBar = document.getElementById('blog-reading-progress');

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        // Project Progress
        if (sections.report && !sections.report.classList.contains('hidden') && projectProgressBar) {
            projectProgressBar.style.width = `${scrollPercentage}%`;
        }

        // Blog Progress
        if (sections['blog-report'] && !sections['blog-report'].classList.contains('hidden') && blogProgressBar) {
            blogProgressBar.style.width = `${scrollPercentage}%`;
        }

        // Active TOC Highlighting (Generic)
        updateActiveTOC();
    });

    function updateActiveTOC() {
        let activeSection = null;
        let contentId = '';
        let containerId = '';

        if (!sections.report.classList.contains('hidden')) {
            activeSection = 'report';
            contentId = 'report-content';
            containerId = 'toc-container';
        } else if (!sections['blog-report'].classList.contains('hidden')) {
            activeSection = 'blog-report';
            contentId = 'blog-report-content';
            containerId = 'blog-toc-container';
        }

        if (!activeSection) return;

        const content = document.getElementById(contentId);
        if (!content) return;
        const headers = content.querySelectorAll('h1, h2, h3');
        const tocLinks = document.querySelectorAll(`#${containerId} a`);

        let currentId = '';
        headers.forEach(header => {
            const top = header.getBoundingClientRect().top;
            if (top < 150) currentId = header.id;
        });

        tocLinks.forEach(link => {
            link.classList.remove('text-primary', 'border-primary', 'font-bold', 'bg-slate-50');
            link.classList.add('border-transparent');
            if (link.getAttribute('href') === '#' + currentId) {
                link.classList.add('text-primary', 'border-primary', 'font-bold', 'bg-slate-50');
                link.classList.remove('border-transparent');
            }
        });
    }

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

// --- Modern Popup System Implementation ---
const modal = {
    el: document.getElementById('custom-modal'),
    title: document.getElementById('modal-title'),
    message: document.getElementById('modal-message'),
    icon: document.getElementById('modal-icon-container'),
    footer: document.getElementById('modal-footer'),

    show: function (options) {
        const { title, message, type, confirmText, cancelText, onConfirm } = options;
        this.title.innerText = title;
        this.message.innerText = message;

        // Icon and Color based on type
        let iconHtml = '';
        let iconBg = '';
        if (type === 'success') {
            iconHtml = '<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
            iconBg = 'bg-green-100';
        } else if (type === 'error') {
            iconHtml = '<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
            iconBg = 'bg-red-100';
        } else {
            iconHtml = '<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
            iconBg = 'bg-blue-100';
        }

        this.icon.innerHTML = iconHtml;
        this.icon.className = `w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${iconBg}`;

        // Footer Buttons
        this.footer.innerHTML = '';
        if (cancelText) {
            const btnCancel = document.createElement('button');
            btnCancel.innerText = cancelText;
            btnCancel.className = "flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-600";
            btnCancel.onclick = () => this.hide();
            this.footer.appendChild(btnCancel);
        }

        const btnConfirm = document.createElement('button');
        btnConfirm.innerText = confirmText || 'Tamam';
        btnConfirm.className = `flex-1 px-4 py-2 text-white rounded-lg transition font-bold ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`;
        btnConfirm.onclick = () => {
            if (onConfirm) onConfirm();
            this.hide();
        };
        this.footer.appendChild(btnConfirm);

        this.el.classList.remove('hidden');
        this.el.classList.add('flex');
        setTimeout(() => {
            this.el.classList.remove('opacity-0');
            this.el.querySelector('div').classList.remove('scale-95');
        }, 10);
    },

    hide: function () {
        this.el.classList.add('opacity-0');
        this.el.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            this.el.classList.add('hidden');
            this.el.classList.remove('flex');
        }, 300);
    }
};

window.showAlert = (title, message, type = 'info') => {
    modal.show({ title, message, type });
};

window.showConfirm = (title, message, onConfirm) => {
    modal.show({
        title,
        message,
        type: 'info',
        confirmText: 'Evet, Eminim',
        cancelText: 'İptal',
        onConfirm
    });
};

window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg border border-slate-200 bg-white flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300 max-w-xs`;

    const colors = {
        success: 'text-green-500',
        error: 'text-red-500',
        info: 'text-blue-500'
    };

    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        <div class="${colors[type]} p-2 rounded-lg bg-slate-50">
            ${icons[type]}
        </div>
        <div class="text-sm font-semibold text-slate-700">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
