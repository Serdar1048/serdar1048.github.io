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
        fetchProjects(); // Renamed from loadProjects
    } else {
        alert('Lütfen geçerli bir token girin.');
    }
}

// Token Management (Removed setGithubToken as it's replaced by the modal flow)

// Logout Function
window.logout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('admin_session');
        location.reload();
    }
};

// Load Projects (Renamed from loadProjects)
async function fetchProjects() {
    try {
        const response = await fetch('projects.json?t=' + new Date().getTime());
        projectsData = await response.json();
        renderAdminList();
    } catch (error) {
        console.error('Yükleme hatası:', error);
        alert('Projeler yüklenemedi. Yerel sunucuyu kontrol edin.');
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
function showProjectList() {
    document.getElementById('view-list').classList.remove('hidden');
    document.getElementById('view-form').classList.add('hidden');
}

function showEditForm() {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');

    // Clear form for new entry
    document.getElementById('form-title').textContent = "Yeni Proje Ekle";
    document.getElementById('edit-id').value = "";
    document.getElementById('edit-title').value = "";
    document.getElementById('edit-desc').value = "";
    document.getElementById('edit-image').value = "";
    document.getElementById('edit-github').value = "";
    document.getElementById('edit-demo').value = "";
    document.getElementById('edit-technologies').value = "";
    document.getElementById('edit-details').value = "";
}

// Edit Action
window.editProject = (id) => {
    const project = projectsData.find(p => p.id === id);
    if (!project) return;

    showEditForm();
    document.getElementById('form-title').textContent = "Proje Düzenle";
    document.getElementById('edit-id').value = project.id;
    document.getElementById('edit-title').value = project.title;
    document.getElementById('edit-desc').value = project.description;
    document.getElementById('edit-image').value = project.image;
    document.getElementById('edit-github').value = project.github;
    document.getElementById('edit-demo').value = project.demo_url;
    document.getElementById('edit-technologies').value = (project.technologies || []).join(', ');
    document.getElementById('edit-details').value = project.details;
};

// Delete Action
window.deleteProject = (id) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    projectsData = projectsData.filter(p => p.id !== id);
    pushToGithub();
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
        details: document.getElementById('edit-details').value
    };

    if (id) {
        // Update
        const index = projectsData.findIndex(p => p.id == id);
        if (index !== -1) projectsData[index] = newProject;
    } else {
        // Create
        projectsData.push(newProject);
    }

    pushToGithub();
};

// GitHub API Push
async function pushToGithub() {
    if (!GITHUB_TOKEN) {
        alert("GitHub Token eksik! Lütfen 'Token Gir' butonunu kullanın.\n(Şimdilik sadece yerel bellekte güncellendi, sayfa yenilenince kaybolur.)");
        renderAdminList();
        showProjectList();
        return;
    }

    try {
        // 1. Get current SHA of the file
        const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const getRes = await fetch(fileUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let sha = "";
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }

        // 2. Update file
        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(projectsData, null, 2)))); // Handle UTF-8

        const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Admin panelinden proje güncellemesi',
                content: contentEncoded,
                sha: sha
            })
        });

        if (putRes.ok) {
            alert('Başarıyla GitHub\'a kaydedildi! Değişikliklerin siteye yansıması 1-2 dakika sürebilir.');
            renderAdminList();
            showProjectList();
        } else {
            const err = await putRes.json();
            throw new Error(err.message);
        }

    } catch (error) {
        console.error(error);
        let msg = 'Kaydetme başarısız: ' + error.message;

        if (error.message.includes('404') || error.message.includes('Not Found')) {
            msg += '\n\nOlası Sebep: Repo adı ("' + REPO_NAME + '") bulunamadı veya Token yetkisi yetersiz.';
        } else if (error.message.includes('401') || error.message.includes('Bad credentials')) {
            msg += '\n\nOlası Sebep: GitHub Token geçersiz veya süresi dolmuş.';
        }

        alert(msg);
        renderAdminList(); // Update UI locally anyway
        showProjectList();
    }
}

// Handle Folder/File Upload (MD + Images Auto Link)
async function handleFolderUpload(input) {
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
            alert(`${replacements.length} adet resim başarıyla MD dosyasına gömüldü!`);
        }

        document.getElementById('edit-details').value = mdContent;
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
function insertImage(input) {
    const file = input.files[0];
    if (!file) return;

    // Check size (Max 1MB recommended for Base64 performance)
    if (file.size > 1024 * 1024) {
        if (!confirm("Bu resim büyük (>1MB). Sayfa yavaşlayabilir. Yine de eklensin mi?")) return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        const textarea = document.getElementById('edit-details');
        const cursor = textarea.selectionStart;
        const text = textarea.value;
        const markdownImage = `\n![${file.name}](${base64})\n`;

        // Insert at cursor
        textarea.value = text.slice(0, cursor) + markdownImage + text.slice(cursor);
    };
    reader.readAsDataURL(file);
}
