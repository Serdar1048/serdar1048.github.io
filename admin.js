// Simple Auth (Hashed for basic obfuscation)
// Hash of 'admin123' (SHA-256)
const ADMIN_HASH = "e8971c991b8f51386194c74105effca42086430c885f8db498614359888a4524";

// GitHub Config
let GITHUB_TOKEN = localStorage.getItem('github_token') || ''; // Updated localStorage key
const REPO_OWNER = 'Serdar1048'; // Username
const REPO_NAME = 'Serdar1048.github.io'; // Example, should be dynamic or user input if possible
const FILE_PATH = 'projects.json';

// DOM Elements
const loginScreen = document.getElementById('login-overlay'); // Assuming 'login-overlay' maps to 'login-screen'
const dashboard = document.getElementById('admin-panel'); // Assuming 'admin-panel' maps to 'dashboard'
const tokenModal = document.getElementById('token-modal'); // New Modal
const projectList = document.getElementById('view-list'); // Assuming 'view-list' maps to 'project-list'
const editForm = document.getElementById('view-form'); // Assuming 'view-form' maps to 'edit-form'

// State
let projectsData = [];
let blogData = [];
let isEditing = false; // false = create mode, true = edit mode
let editingId = null;

// Auth Check (Renamed from checkLogin)
// Auth Check
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

function checkSession() {
    const session = localStorage.getItem('admin_session');
    if (session) {
        // Optional: Check expiry (e.g. 24 hours)
        const now = Date.now();
        if (now - parseInt(session) < 24 * 60 * 60 * 1000) {
            loginScreen.classList.add('hidden');

            // Check Token
            const savedToken = localStorage.getItem('github_token');
            if (savedToken) {
                GITHUB_TOKEN = savedToken;
                dashboard.classList.remove('hidden');
                fetchProjects();
            } else {
                tokenModal.classList.remove('hidden');
            }
        } else {
            localStorage.removeItem('admin_session'); // Expired
        }
    }
}

async function checkAuth() {
    const passwordInput = document.getElementById('admin-pass');
    const password = passwordInput.value;
    const errorMsg = document.getElementById('login-error');

    // Hash the input to compare
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === ADMIN_HASH) {
        errorMsg.classList.add('hidden'); // Hide error if success
        loginScreen.classList.add('hidden');

        // Save Session
        localStorage.setItem('admin_session', Date.now());

        // Check for GitHub Token
        const savedToken = localStorage.getItem('github_token');
        if (savedToken) {
            GITHUB_TOKEN = savedToken;
            dashboard.classList.remove('hidden');
            fetchProjects();
        } else {
            // Show Token Modal
            tokenModal.classList.remove('hidden');
        }
    } else {
        errorMsg.classList.remove('hidden'); // Show error
        passwordInput.classList.add('border-red-500', 'ring-2', 'ring-red-200'); // Add error styles

        // Reset styles after interaction
        passwordInput.addEventListener('input', () => {
            errorMsg.classList.add('hidden');
            passwordInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
        }, { once: true });
    }
}

// Toggle Password Visibility
function togglePassword() {
    const input = document.getElementById('admin-pass');
    const iconOff = document.getElementById('eye-icon-off');
    const iconOn = document.getElementById('eye-icon-on');

    if (input.type === 'password') {
        input.type = 'text';
        iconOff.classList.add('hidden');
        iconOn.classList.remove('hidden');
    } else {
        input.type = 'password';
        iconOff.classList.remove('hidden');
        iconOn.classList.add('hidden');
    }
}

// Save Token from Modal
function saveToken() {
    const tokenInput = document.getElementById('token-input');
    const token = tokenInput.value.trim();

    if (token) {
        localStorage.setItem('github_token', token);
        GITHUB_TOKEN = token;
        tokenModal.classList.add('hidden');
        dashboard.classList.remove('hidden');

        // If we were in the middle of an action (like a failed push), maybe we should retry or just let the user click save again.
        // For now, refreshing the list is safe.
        fetchProjects();
        showToast('Token güncellendi! Lütfen işleminizi tekrar deneyin.', 'success');
    } else {
        showAlert('Hata', 'Lütfen geçerli bir token girin.', 'error');
    }
}



// Open Token Modal Manually
// Open Token Modal Manually
window.openTokenModal = () => {
    const modal = document.getElementById('token-modal');
    const input = document.getElementById('token-input');

    if (input) input.value = '';

    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    } else {
        showAlert('Hata', "Token penceresi bulunamadı. Sayfayı yenilemeyi deneyin.", 'error');
    }
};

// Token Management

// Logout Function
window.logout = () => {
    showConfirm('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', () => {
        localStorage.removeItem('admin_session');
        location.reload();
    });
};

// Load Projects (Renamed from loadProjects)
async function fetchProjects() {
    try {
        const pRes = await fetch('projects.json?t=' + new Date().getTime());
        projectsData = await pRes.json();
        
        const bRes = await fetch('blog.json?t=' + new Date().getTime());
        blogData = await bRes.json();

        renderAdminList();
        renderAdminBlogList();
        handleRouting(); // Initial routing check after data load
    } catch (error) {
        console.error('Yükleme hatası:', error);
        // alert('Veriler yüklenemedi. Yerel sunucuyu kontrol edin.');
    }
}

// Render Admin List
function renderAdminList() {
    const list = document.getElementById('admin-projects-grid');
    list.innerHTML = projectsData.map(p => `
        <div class="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-4">
                <img src="${p.image}" class="w-12 h-12 rounded object-cover bg-slate-100">
                <div>
                    <h3 class="font-bold text-slate-800">${p.title}</h3>
                    <p class="text-xs text-slate-500">ID: ${p.id}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editProject(${p.id})" class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">Düzenle</button>
                <button onclick="deleteProject(${p.id})" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded">Sil</button>
            </div>
        </div>
    `).join('');
}

// Navigation
window.showProjectList = () => {
    window.location.hash = ''; // Clear hash to go to list
};

function renderViewList() {
    document.getElementById('view-list').classList.remove('hidden');
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-blog-list').classList.add('hidden');
    document.getElementById('view-blog-form').classList.add('hidden');
}

window.showBlogList = () => {
    console.log("Navigating to blog list...");
    window.location.hash = '#blog-list';
};

function renderBlogList() {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-blog-list').classList.remove('hidden');
    document.getElementById('view-blog-form').classList.add('hidden');
    renderAdminBlogList();
}

window.showBlogEditForm = () => {
    window.location.hash = '#blog-new';
};

function renderBlogEditForm() {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-blog-list').classList.add('hidden');
    document.getElementById('view-blog-form').classList.remove('hidden');

    // Clear form
    document.getElementById('blog-form-title').textContent = "Yeni Blog Yazısı";
    document.getElementById('blog-edit-id').value = "";
    document.getElementById('blog-edit-title').value = "";
    document.getElementById('blog-edit-title-en').value = "";
    document.getElementById('blog-edit-desc').value = "";
    document.getElementById('blog-edit-desc-en').value = "";
    document.getElementById('blog-edit-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('blog-edit-image').value = "";
    document.getElementById('blog-edit-content').value = "";
    document.getElementById('blog-edit-content-en').value = "";
}

window.showEditForm = () => {
    window.location.hash = '#new';
};

function renderEditForm() {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
    document.getElementById('view-blog-list').classList.add('hidden');
    document.getElementById('view-blog-form').classList.add('hidden');

    // Clear form for new entry
    document.getElementById('form-title').textContent = "Yeni Proje Ekle";
    document.getElementById('edit-id').value = "";
    document.getElementById('edit-title').value = "";
    document.getElementById('edit-desc').value = "";
    document.getElementById('edit-image').value = "";
    document.getElementById('edit-github').value = "";
    document.getElementById('edit-demo').value = "";
    document.getElementById('edit-technologies').value = "";
    document.getElementById('edit-technologies').value = "";
    document.getElementById('edit-details').value = "";
    document.getElementById('edit-details-en').value = ""; // Clear English details
}

// Edit Action
window.editProject = (id) => {
    const project = projectsData.find(p => p.id === id);
    if (!project) return;

    window.location.hash = '#edit?id=' + id;
    // Rendering handled by hashchange -> handleRouting
};

// Delete Action
window.deleteProject = (id) => {
    showConfirm('Projeyi Sil', 'Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', () => {
        projectsData = projectsData.filter(p => p.id !== id);
        pushToGithub('projects.json', projectsData);
    });
};

// Save Action
window.saveProject = () => {
    const id = document.getElementById('edit-id').value;
    const newProject = {
        id: id ? parseInt(id) : (Math.max(...projectsData.map(p => p.id), 0) + 1),
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-desc').value,
        image: document.getElementById('edit-image').value,
        github: document.getElementById('edit-github').value,
        demo_url: document.getElementById('edit-demo').value,
        technologies: document.getElementById('edit-technologies').value.split(',').map(t => t.trim()).filter(t => t),
        details: document.getElementById('edit-details').value,
        details_en: document.getElementById('edit-details-en').value // Save English details
    };

    if (id) {
        // Update
        const index = projectsData.findIndex(p => p.id == id);
        if (index !== -1) projectsData[index] = newProject;
    } else {
        // Create
        projectsData.push(newProject);
    }

    pushToGithub('projects.json', projectsData);
    window.location.hash = ''; // Go back to list
};

// --- Blog Specific Actions ---
function renderAdminBlogList() {
    const list = document.getElementById('admin-blog-grid');
    if (!list) return;
    list.innerHTML = blogData.map(b => `
        <div class="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-4">
                <img src="${b.image}" class="w-12 h-12 rounded object-cover bg-slate-100">
                <div>
                    <h3 class="font-bold text-slate-800">${b.title}</h3>
                    <p class="text-xs text-slate-500">${b.date} | ID: ${b.id}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editBlog(${b.id})" class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">Düzenle</button>
                <button onclick="deleteBlog(${b.id})" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded">Sil</button>
            </div>
        </div>
    `).join('');
}

window.editBlog = (id) => {
    window.location.hash = '#blog-edit?id=' + id;
};

window.deleteBlog = (id) => {
    showConfirm('Yazıyı Sil', 'Bu blog yazısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', () => {
        blogData = blogData.filter(b => b.id !== id);
        pushToGithub('blog.json', blogData);
    });
};

window.saveBlog = () => {
    const id = document.getElementById('blog-edit-id').value;
    const newBlog = {
        id: id ? parseInt(id) : (Math.max(...blogData.map(b => b.id), 0) + 1),
        title: document.getElementById('blog-edit-title').value,
        title_en: document.getElementById('blog-edit-title-en').value,
        description: document.getElementById('blog-edit-desc').value,
        description_en: document.getElementById('blog-edit-desc-en').value,
        date: document.getElementById('blog-edit-date').value,
        image: document.getElementById('blog-edit-image').value,
        content: document.getElementById('blog-edit-content').value,
        content_en: document.getElementById('blog-edit-content-en').value
    };

    if (id) {
        const index = blogData.findIndex(b => b.id == id);
        if (index !== -1) blogData[index] = newBlog;
    } else {
        blogData.push(newBlog);
    }

    pushToGithub('blog.json', blogData);
    window.location.hash = '#blog-list';
};

// GitHub API Push (Generic)
async function pushToGithub(filePath, data) {
    if (!GITHUB_TOKEN) {
        alert("GitHub Token eksik! Lütfen 'Token Gir' butonunu kullanın.");
        return;
    }

    try {
        const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const getRes = await fetch(fileUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let sha = "";
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }

        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

        const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Update ${filePath} via Admin Panel`,
                content: contentEncoded,
                sha: sha
            })
        });

        if (putRes.ok) {
            showToast('Değişiklikler GitHub\'a başarıyla kaydedildi!', 'success');
            fetchProjects(); // Refresh data
        } else {
            const err = await putRes.json();
            throw new Error(err.message);
        }
    } catch (error) {
        console.error(error);
        showAlert('Hata', 'Kaydetme başarısız: ' + error.message, 'error');
    }
}

// Handle Folder/File Upload (MD + Images Auto Link)
async function handleFolderUpload(input, targetId = 'edit-details') {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    // Find the MD file
    const mdFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.txt'));
    if (!mdFile) {
        alert("Klasörde .md veya .txt uzantılı bir rapor dosyası bulunamadı!");
        return;
    }

    // Map images for quick access: "image.png" -> File Object
    const imageMap = {};
    files.forEach(f => {
        if (f.type.startsWith('image/')) {
            imageMap[f.name] = f;
            // Also map with relative paths if user used subfolders like "images/pic.png" - simplified to match filename only
        }
    });

    const reader = new FileReader();
    reader.onload = async function (e) {
        let mdContent = e.target.result;

        // Regex to find image links: ![alt](path)
        // We look for plain paths, not http:// links
        const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
        let match;
        const replacements = [];

        // Identify all matches first
        while ((match = imgRegex.exec(mdContent)) !== null) {
            const originalTag = match[0]; // ![alt](path)
            const altText = match[1];
            const imagePath = match[2];

            // Skip external links
            if (imagePath.startsWith('http')) continue;

            // Extract filename from path (e.g. "assets/img.png" -> "img.png")
            const filename = imagePath.split('/').pop().split('\\').pop();

            if (imageMap[filename]) {
                replacements.push({
                    originalTag,
                    file: imageMap[filename],
                    altText
                });
            }
        }

        if (replacements.length > 0) {
            const statusLabel = document.querySelector('label[for="folder-upload"] span');
            if (statusLabel) statusLabel.textContent = "⏳ İşleniyor...";

            // Process all images
            for (const item of replacements) {
                try {
                    const base64 = await readFileAsBase64(item.file);
                    // Replace the Original Tag with Base64 version
                    // Careful with global replace if same image used twice, but usually safe
                    mdContent = mdContent.split(item.originalTag).join(`![${item.altText}](${base64})`);
                } catch (err) {
                    console.error("Resim dönüştürme hatası:", item.file.name, err);
                }
            }

            if (statusLabel) statusLabel.textContent = "📁 Klasör Yükle (MD+Resim)";
            showToast(`${replacements.length} adet resim başarıyla MD dosyasına gömüldü!`, 'success');
        }

        document.getElementById(targetId).value = mdContent;
    };
    reader.readAsText(mdFile);
}

// Helper: Promisified FileReader
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Handle Image Insertion (Base64)
function insertImage(input, targetId = 'edit-details') {
    const file = input.files[0];
    if (!file) return;

    // Check size (Max 1MB recommended for Base64 performance)
    if (file.size > 1024 * 1024) {
        if (!confirm("Bu resim büyük (>1MB). Sayfa yavaşlayabilir. Yine de eklensin mi?")) return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        const textarea = document.getElementById(targetId);
        const cursor = textarea.selectionStart;
        const text = textarea.value;
        const markdownImage = `\n![${file.name}](${base64})\n`;

        // Insert at cursor
        textarea.value = text.slice(0, cursor) + markdownImage + text.slice(cursor);
    };
    reader.readAsDataURL(file);
}

// Handle Image Upload (GitHub API)
async function uploadImageToGithub(input, targetId) {
    const file = input.files[0];
    if (!file) return;

    if (!GITHUB_TOKEN) {
        alert("Lütfen önce sağ üstten Token girişi yapınız!");
        input.value = '';
        return;
    }

    // Feedback UI (Simple approach finding sibling span)
    const label = input.parentElement;
    const span = label.querySelector('span');
    const originalText = span ? span.textContent : "Resim Seç";

    if (span) span.textContent = "⏳ Yükleniyor...";

    try {
        const timestamp = Date.now();
        // Clean filename: remove spaces, special chars
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
        const path = `assets/images/${timestamp}-${cleanName}`;

        // GitHub API needs plain Base64 (no data prefix)
        const base64Full = await readFileAsBase64(file);
        const content = base64Full.split(',')[1];

        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

        const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload image via Admin Panel: ${cleanName}`,
                content: content
            })
        });

        if (res.ok) {
            // Success
            // We use the relative path so it works on the site
            document.getElementById(targetId).value = path;

            if (span) span.textContent = "✅ Yüklendi";
            setTimeout(() => {
                if (span) span.textContent = originalText;
                // Clear input so same file can be selected again if needed
                input.value = '';
            }, 2000);
        } else {
            const err = await res.json();
            throw new Error(err.message);
        }

    } catch (error) {
        console.error("Upload Error:", error);
        showAlert("Hata", "Yükleme başarısız: " + error.message, "error");
        if (span) span.textContent = "❌ Hata";
        setTimeout(() => { if (span) span.textContent = originalText; }, 2000);
        input.value = '';
    }
}

// --- NEW routing Logic ---
function handleRouting() {
    const hash = window.location.hash;

    if (hash === '#blog-list' || hash === '#blog-new' || hash.startsWith('#blog-edit')) {
        updateAdminNav('blog');
        if (hash === '#blog-list') renderBlogList();
        else if (hash === '#blog-new') renderBlogEditForm();
        else {
            const id = parseInt(hash.split('=')[1]);
            const blog = blogData.find(b => b.id === id);
            if (blog) {
                renderBlogEditForm();
                document.getElementById('blog-form-title').textContent = "Yazı Düzenle";
                document.getElementById('blog-edit-id').value = blog.id;
                document.getElementById('blog-edit-title').value = blog.title;
                document.getElementById('blog-edit-title-en').value = blog.title_en || "";
                document.getElementById('blog-edit-desc').value = blog.description;
                document.getElementById('blog-edit-desc-en').value = blog.description_en || "";
                document.getElementById('blog-edit-date').value = blog.date;
                document.getElementById('blog-edit-image').value = blog.image;
                document.getElementById('blog-edit-content').value = blog.content;
                document.getElementById('blog-edit-content-en').value = blog.content_en || "";
            } else {
                window.location.hash = '#blog-list';
            }
        }
    } else {
        updateAdminNav('projects');
        if (hash === '#new') {
            renderEditForm();
        } else if (hash.startsWith('#edit?id=')) {
            const id = parseInt(hash.split('=')[1]);
            const project = projectsData.find(p => p.id === id);

            if (project) {
                renderEditForm();
                document.getElementById('form-title').textContent = "Proje Düzenle";
                document.getElementById('edit-id').value = project.id;
                document.getElementById('edit-title').value = project.title;
                document.getElementById('edit-desc').value = project.description;
                document.getElementById('edit-image').value = project.image;
                document.getElementById('edit-github').value = project.github;
                document.getElementById('edit-demo').value = project.demo_url;
                document.getElementById('edit-technologies').value = (project.technologies || []).join(', ');
                document.getElementById('edit-details').value = project.details;
                document.getElementById('edit-details-en').value = project.details_en || "";
            } else {
                window.location.hash = '';
            }
        } else {
            renderViewList();
        }
    }
}

function updateAdminNav(active) {
    const btnProjects = document.getElementById('nav-projects');
    const btnBlog = document.getElementById('nav-blog');

    if (!btnProjects || !btnBlog) return;

    // Reset
    [btnProjects, btnBlog].forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-bold', 'ring-1', 'ring-blue-100');
        btn.classList.add('text-slate-600');
    });

    // Set Active
    const activeBtn = active === 'projects' ? btnProjects : btnBlog;
    activeBtn.classList.remove('text-slate-600');
    activeBtn.classList.add('bg-blue-50', 'text-blue-600', 'font-bold', 'ring-1', 'ring-blue-100');
}


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

window.addEventListener('hashchange', handleRouting);

