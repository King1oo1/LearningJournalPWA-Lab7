// js/storage.js - Storage API Functions for Lab 6: Flask Backend + Local Storage

// ===== LOCAL STORAGE FUNCTIONS (Lab 4) =====
function saveJournalEntries() {
    const entries = [];
    document.querySelectorAll('.journal-entry[data-is-new="true"]').forEach(entry => {
        const contentElement = entry.querySelector('.collapsible-content');
        if (contentElement) {
            entries.push({
                title: entry.querySelector('h2').textContent,
                content: contentElement.innerHTML,
                date: entry.querySelector('.entry-meta')?.textContent || new Date().toLocaleDateString(),
                isNew: true,
                id: entry.getAttribute('data-entry-id')
            });
        }
    });
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    console.log('Saved local entries:', entries.length);
}

function loadJournalEntries() {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
        try {
            const entries = JSON.parse(savedEntries);
            console.log('Loaded local entries:', entries.length);
            return entries;
        } catch (error) {
            console.error('Error parsing saved entries:', error);
            return [];
        }
    }
    return [];
}

function displayLocalEntries(entries) {
    const container = document.getElementById('journal-entries-container');
    if (!container || entries.length === 0) return;

    console.log('Displaying local entries:', entries.length);

    // Display local entries (newest first)
    entries.reverse().forEach(entry => {
        const entryHTML = createLocalJournalEntry(entry.title, entry.content, entry.date, entry.id);

        // Insert after Flask entries but before static weeks
        const flaskEntries = document.querySelectorAll('.journal-entry[data-source="flask"]');
        const firstStaticEntry = document.querySelector('.journal-entry:not([data-source="flask"]):not([data-is-new="true"])');

        if (flaskEntries.length > 0) {
            // Insert after the last Flask entry
            flaskEntries[flaskEntries.length - 1].insertAdjacentHTML('afterend', entryHTML);
        } else if (firstStaticEntry) {
            // Insert before the first static entry if no Flask entries
            firstStaticEntry.insertAdjacentHTML('beforebegin', entryHTML);
        } else {
            // Insert at the beginning if no other entries
            container.insertAdjacentHTML('afterbegin', entryHTML);
        }
    });
}

// ===== THEME STORAGE =====
function initThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Check theme preference
    const currentTheme = localStorage.getItem('theme') ||
                        sessionStorage.getItem('theme') ||
                        (prefersDarkScheme.matches ? 'dark' : 'light');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');

            let theme = 'light';
            if (document.body.classList.contains('dark-theme')) {
                theme = 'dark';
                this.textContent = '☀️ Light Mode';
            } else {
                this.textContent = '🌙 Dark Mode';
            }

            // Save theme preference
            localStorage.setItem('theme', theme);
            sessionStorage.setItem('theme', theme);
        });
    }
}

// ===== STORAGE DEMO FUNCTION =====
function showStorageInfo() {
    const infoDiv = document.getElementById('storage-info');
    const theme = localStorage.getItem('theme') || 'light';
    const localEntries = localStorage.getItem('journalEntries');
    const localCount = localEntries ? JSON.parse(localEntries).length : 0;

    // Fetch Flask data to show current entries
    fetchFlaskReflections().then(reflections => {
        infoDiv.innerHTML = `
            <p><strong>Current Theme:</strong> ${theme}</p>
            <p><strong>Local Storage Entries:</strong> ${localCount}</p>
            <p><strong>Flask Backend Entries:</strong> ${reflections.length}</p>
            <p><strong>Storage Used:</strong> ${calculateStorageUsage()} KB</p>
            <p><strong>Data Sources:</strong> Flask Backend + Browser Local Storage</p>
        `;
    });
}

function calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    return (total / 1024).toFixed(2);
}

// ===== FLASK BACKEND INTEGRATION (Lab 6) =====
const FLASK_API_BASE = '/api/reflections';

async function fetchFlaskReflections() {
    try {
        const response = await fetch(FLASK_API_BASE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reflections = await response.json();
        console.log('Fetched Flask reflections:', reflections.length);
        return reflections;
    } catch (error) {
        console.error('Error fetching Flask reflections:', error);
        showErrorMessage('Error connecting to Flask backend');
        return [];
    }
}

async function addFlaskReflection(reflectionData) {
    try {
        const response = await fetch(FLASK_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reflectionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newReflection = await response.json();
        console.log('Added reflection via Flask:', newReflection);
        return newReflection;
    } catch (error) {
        console.error('Error adding reflection via Flask:', error);
        throw error;
    }
}

// Extra Feature: Delete reflection by index
async function deleteFlaskReflection(index) {
    try {
        const response = await fetch(`${FLASK_API_BASE}/${index}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Deleted reflection via Flask:', result);
        return result;
    } catch (error) {
        console.error('Error deleting reflection via Flask:', error);
        throw error;
    }
}

// Extra Feature: Clear all reflections
async function clearAllReflections() {
    if (!confirm('Are you sure you want to delete ALL reflections from Flask backend? This cannot be undone!')) {
        return;
    }

    try {
        const reflections = await fetchFlaskReflections();
        // Delete each reflection one by one
        for (let i = reflections.length - 1; i >= 0; i--) {
            await deleteFlaskReflection(i);
        }

        showSuccessMessage('All Flask reflections cleared successfully!');
        await refreshFlaskData();
    } catch (error) {
        console.error('Error clearing reflections:', error);
        showErrorMessage('Error clearing reflections from Flask backend');
    }
}

function displayFlaskReflections(reflections) {
    const container = document.getElementById('journal-entries-container');
    if (!container) return;

    // Clear existing Flask entries
    document.querySelectorAll('.journal-entry[data-source="flask"]').forEach(entry => {
        entry.remove();
    });

    if (reflections.length === 0) {
        console.log('No Flask reflections to display');
        return;
    }

    console.log('Displaying Flask reflections:', reflections.length);

    // Reverse to show newest first
    const reversedReflections = [...reflections].reverse();

    reversedReflections.forEach((reflection, index) => {
        const originalIndex = reflections.length - 1 - index;
        const entryHTML = `
            <article class="journal-entry collapsible" data-source="flask" data-flask-index="${originalIndex}">
                <div class="collapsible-header">
                    <h2>${reflection.name} - ${reflection.date}</h2>
                    <div class="header-spacer"></div>
                    <div class="entry-actions">
                        <span class="toggle-icon">▼</span>
                        <button class="copy-btn" type="button">📋 Copy</button>
                        <button class="delete-flask-btn" type="button" data-index="${originalIndex}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="collapsible-content">
                    <div class="entry-meta">Added via Flask Backend • ${reflection.date}</div>
                    <div class="entry-content">
                        ${reflection.reflection.replace(/\n/g, '<br>')}
                    </div>
                    <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(155, 89, 182, 0.1); border-radius: 4px;">
                        <small>🚀 This entry was created using Flask backend and stored on PythonAnywhere</small>
                    </div>
                </div>
            </article>
        `;

        // Insert at the VERY beginning of the container
        container.insertAdjacentHTML('afterbegin', entryHTML);
    });

    // Initialize Flask delete buttons
    initFlaskDeleteButtons();
}

function initFlaskDeleteButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-flask-btn') || e.target.closest('.delete-flask-btn')) {
            const deleteBtn = e.target.classList.contains('delete-flask-btn') ? e.target : e.target.closest('.delete-flask-btn');
            const index = deleteBtn.getAttribute('data-index');

            if (index !== null) {
                e.preventDefault();
                e.stopPropagation();
                showFlaskDeleteConfirmation(parseInt(index));
            }
        }
    });
}

function showFlaskDeleteConfirmation(index) {
    const confirmationHTML = `
        <div class="delete-confirmation">
            <div class="confirmation-dialog">
                <h3>🗑️ Delete Flask Reflection</h3>
                <p>Are you sure you want to delete this reflection from the Flask backend? This action cannot be undone and the entry will be permanently removed from the server.</p>
                <div class="confirmation-actions">
                    <button class="cancel-delete-btn" onclick="closeDeleteConfirmation()">
                        ↩️ Keep Reflection
                    </button>
                    <button class="confirm-delete-btn" onclick="confirmFlaskDelete(${index})">
                        🗑️ Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', confirmationHTML);

    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeDeleteConfirmation();
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Store the handler for cleanup
    document.currentDeleteEscapeHandler = escapeHandler;
}

async function confirmFlaskDelete(index) {
    console.log('Confirming Flask deletion for index:', index);

    try {
        await deleteFlaskReflection(index);
        await refreshFlaskData();
        showSuccessMessage('Reflection deleted from Flask backend successfully!');
    } catch (error) {
        console.error('Error deleting Flask reflection:', error);
        showErrorMessage('Error deleting reflection from Flask backend');
    } finally {
        closeDeleteConfirmation();
    }
}

// ===== REFLECTION COUNTER =====
function updateReflectionCounter() {
    const totalEntries = document.querySelectorAll('.journal-entry').length;
    const flaskEntries = document.querySelectorAll('.journal-entry[data-source="flask"]').length;
    const localEntries = document.querySelectorAll('.journal-entry[data-is-new="true"]').length;
    const staticEntries = totalEntries - flaskEntries - localEntries;

    const counterHTML = `
        <div class="reflection-counter">
            <h3>📊 Reflection Statistics - Flask Backend</h3>
            <div class="counter-grid">
                <div class="counter-item">
                    <span class="counter-number">${totalEntries}</span>
                    <span class="counter-label">Total Entries</span>
                </div>
                <div class="counter-item">
                    <span class="counter-number">${staticEntries}</span>
                    <span class="counter-label">Course Weeks</span>
                </div>
                <div class="counter-item">
                    <span class="counter-number">${localEntries}</span>
                    <span class="counter-label">Local Storage</span>
                </div>
                <div class="counter-item">
                    <span class="counter-number">${flaskEntries}</span>
                    <span class="counter-label">Flask Backend</span>
                </div>
            </div>
            <div style="text-align: center; margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                🚀 Lab 6: Flask backend deployed on PythonAnywhere
            </div>
        </div>
    `;

    // Update or create counter
    const counterContainer = document.getElementById('reflection-counter-container');
    if (counterContainer) {
        counterContainer.innerHTML = counterHTML;
    }
}

// ===== FLASK FORM HANDLING =====
function initFlaskForm() {
    const flaskForm = document.getElementById('flask-journal-form');
    if (flaskForm) {
        flaskForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('flask-name').value.trim();
            const reflection = document.getElementById('flask-reflection').value.trim();

            if (!name || !reflection) {
                alert('Please fill in both name and reflection fields.');
                return;
            }

            const submitBtn = flaskForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.innerHTML = '⏳ Adding...';
                submitBtn.disabled = true;

                await addFlaskReflection({ name, reflection });
                await refreshFlaskData();
                flaskForm.reset();
                showSuccessMessage('Reflection added to Flask backend successfully!');

            } catch (error) {
                showErrorMessage('Failed to add reflection to Flask backend');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

async function refreshFlaskData() {
    try {
        console.log('Refreshing data from Flask backend...');
        const flaskReflections = await fetchFlaskReflections();

        document.querySelectorAll('.journal-entry[data-source="flask"]').forEach(entry => {
            entry.remove();
        });

        displayFlaskReflections(flaskReflections);
        updateReflectionCounter();

        if (window.initCollapsibleSections) initCollapsibleSections();
        if (window.initClipboardAPI) initClipboardAPI();
// ✅  update
        showSuccessMessage(`Loaded ${flaskReflections.length} entries from Flask backend`);
    } catch (error) {
        console.error('Error refreshing Flask data:', error);
        showErrorMessage('Error refreshing Flask data. Make sure Flask backend is running.');
    }
}

function showFlaskInfo() {
    const infoDiv = document.getElementById('flask-info');
    const totalEntries = document.querySelectorAll('.journal-entry').length;
    const flaskEntries = document.querySelectorAll('.journal-entry[data-source="flask"]').length;
    const localEntries = document.querySelectorAll('.journal-entry[data-is-new="true"]').length;

    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
        <h4>🚀 Flask Backend System - Lab 6</h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
            <div>
                <strong>Total Entries:</strong> ${totalEntries}
            </div>
            <div>
                <strong>Flask Entries:</strong> ${flaskEntries}
            </div>
            <div>
                <strong>Local Entries:</strong> ${localEntries}
            </div>
            <div>
                <strong>Static Entries:</strong> ${totalEntries - flaskEntries - localEntries}
            </div>
        </div>

        <p><strong>Flask Backend Features:</strong></p>
        <ul style="margin: 0.5rem 0 1rem 1rem;">
            <li>Deployed on PythonAnywhere</li>
            <li>RESTful API endpoints</li>
            <li>JSON data storage on server</li>
            <li>GET/POST/DELETE HTTP methods</li>
            <li>Real-time data persistence</li>
            <li>Cross-platform accessibility</li>
        </ul>

        <p><strong>API Endpoints:</strong></p>
        <ul style="margin: 0.5rem 0 1rem 1rem;">
            <li><code>GET /api/reflections</code> - Fetch all reflections</li>
            <li><code>POST /api/reflections</code> - Add new reflection</li>
            <li><code>DELETE /api/reflections/{index}</code> - Delete reflection (Extra Feature)</li>
        </ul>

        <p><strong>HTTP Methods Used:</strong></p>
        <ul style="margin: 0.5rem 0 1rem 1rem;">
            <li>GET: Retrieve data from server</li>
            <li>POST: Send new data to server</li>
            <li>DELETE: Remove data from server</li>
        </ul>
    `;
}

function exportFlaskData() {
    fetchFlaskReflections().then(reflections => {
        const dataStr = JSON.stringify(reflections, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flask_reflections_export.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccessMessage('Flask data exported successfully!');
    });
}

// ===== MESSAGE FUNCTIONS =====
function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(39, 174, 96, 0.4);
        z-index: 1001;
        animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 300px;
    `;

    successMsg.innerHTML = `✅ ${message}`;
    document.body.appendChild(successMsg);

    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.parentNode.removeChild(successMsg);
        }
    }, 3000);
}

function showErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
        z-index: 1001;
        animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 300px;
    `;

    errorMsg.innerHTML = `❌ ${message}`;
    document.body.appendChild(errorMsg);

    setTimeout(() => {
        if (errorMsg.parentNode) {
            errorMsg.parentNode.removeChild(errorMsg);
        }
    }, 3000);
}

// Make functions globally available
window.refreshFlaskData = refreshFlaskData;
window.showFlaskInfo = showFlaskInfo;
window.exportFlaskData = exportFlaskData;
window.clearAllReflections = clearAllReflections;
window.showStorageInfo = showStorageInfo;
window.saveJournalEntries = saveJournalEntries;
window.updateReflectionCounter = updateReflectionCounter;
window.confirmFlaskDelete = confirmFlaskDelete;
window.closeDeleteConfirmation = closeDeleteConfirmation;