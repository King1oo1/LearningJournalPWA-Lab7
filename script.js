// js/script.js - Main Application Logic for Lab 7: PWA Enhancement

// ===== GLOBAL VARIABLES =====
let deferredPrompt = null;

// ===== IMMEDIATE THEME SETUP =====
// Set theme immediately to prevent flash
(function() {
    console.log('Setting initial theme immediately...');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme') ||
                        sessionStorage.getItem('theme') ||
                        (prefersDarkScheme.matches ? 'dark' : 'light');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    console.log('Initial theme set to:', currentTheme);
})();

// ===== HEADER STRUCTURE MANAGEMENT =====
function ensureHeaderStructure() {
    console.log('Ensuring header structure for all entries...');
    
    document.querySelectorAll('.journal-entry').forEach((entry, index) => {
        const header = entry.querySelector('.collapsible-header');
        if (!header) return;
        
        // Check if header already has proper structure
        const existingTitle = header.querySelector('h2');
        const existingSpacer = header.querySelector('.header-spacer');
        const existingActions = header.querySelector('.entry-actions');
        
        // Get title text
        let titleText = existingTitle ? existingTitle.textContent : header.textContent.trim();
        
        // Clear header and rebuild with proper structure
        header.innerHTML = '';
        
        // Create title element
        const title = document.createElement('h2');
        title.textContent = titleText;
        header.appendChild(title);
        
        // Create spacer element
        const spacer = document.createElement('div');
        spacer.className = 'header-spacer';
        header.appendChild(spacer);
        
        // Create actions container
        const entryActions = document.createElement('div');
        entryActions.className = 'entry-actions';
        
        // Create toggle icon
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.textContent = '▼';
        toggleIcon.setAttribute('aria-label', 'Toggle section');
        entryActions.appendChild(toggleIcon);
        
        // Add edit button only for local entries
        const isLocalEntry = entry.getAttribute('data-is-new') === 'true';
        if (isLocalEntry) {
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '✏️ Edit';
            editBtn.setAttribute('type', 'button');
            entryActions.appendChild(editBtn);
        }
        
        // Add copy button for ALL entries
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.setAttribute('type', 'button');
        entryActions.appendChild(copyBtn);
        
        // Add delete button for Flask entries
        const isFlaskEntry = entry.getAttribute('data-source') === 'flask';
        if (isFlaskEntry) {
            const flaskIndex = entry.getAttribute('data-flask-index');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-flask-btn';
            deleteBtn.innerHTML = '🗑️ Delete';
            deleteBtn.setAttribute('type', 'button');
            deleteBtn.setAttribute('data-index', flaskIndex);
            entryActions.appendChild(deleteBtn);
        }
        
        header.appendChild(entryActions);
        
        console.log(`Header structure ensured for: ${titleText}`);
    });
}

// ===== EDIT JOURNAL ENTRIES FUNCTIONALITY =====
function initEditFunctionality() {
    console.log('Initializing edit functionality...');
    
    // Use event delegation for edit buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const editBtn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            const entry = editBtn.closest('.journal-entry');
            
            if (entry && entry.getAttribute('data-is-new') === 'true') {
                e.stopPropagation();
                toggleEditMode(entry);
            }
        }
    });
}

function toggleEditMode(entry) {
    const isEditing = entry.classList.contains('edit-mode');
    
    if (isEditing) {
        // Save changes
        const titleInput = entry.querySelector('.edit-title');
        const contentTextarea = entry.querySelector('.edit-content');
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        
        if (!title) {
            alert('Title cannot be empty!');
            titleInput.focus();
            return;
        }
        
        if (!content) {
            alert('Content cannot be empty!');
            contentTextarea.focus();
            return;
        }
        
        // Update display
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        entry.querySelector('.collapsible-header').replaceChild(titleElement, titleInput);
        
        const contentElement = document.createElement('div');
        contentElement.className = 'entry-content';
        contentElement.innerHTML = content.replace(/\n/g, '<br>');
        entry.querySelector('.collapsible-content').replaceChild(contentElement, contentTextarea);
        
        entry.classList.remove('edit-mode');
        entry.querySelector('.edit-btn').innerHTML = '✏️ Edit';
        
        // Save to localStorage
        saveJournalEntries();
        
        // Show success message
        showSuccessMessage('Journal entry updated successfully!');
    } else {
        // Enter edit mode
        const title = entry.querySelector('h2').textContent;
        const content = entry.querySelector('.entry-content').textContent;
        
        // Create edit inputs
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'edit-title';
        titleInput.value = title;
        titleInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: 2px solid #3498db;
            border-radius: 4px;
            font-size: 1.3rem;
            font-weight: 600;
            background: var(--card-bg);
            color: var(--text-color);
            margin-bottom: 1rem;
        `;
        
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'edit-content';
        contentTextarea.value = content;
        contentTextarea.style.cssText = `
            width: 100%;
            height: 200px;
            padding: 1rem;
            border: 2px solid #27ae60;
            border-radius: 4px;
            font-family: inherit;
            font-size: 1rem;
            line-height: 1.6;
            background: var(--card-bg);
            color: var(--text-color);
            resize: vertical;
        `;
        
        // Replace content with inputs
        const header = entry.querySelector('.collapsible-header');
        header.replaceChild(titleInput, entry.querySelector('h2'));
        
        const contentContainer = entry.querySelector('.collapsible-content');
        contentContainer.replaceChild(contentTextarea, entry.querySelector('.entry-content'));
        
        entry.classList.add('edit-mode');
        entry.querySelector('.edit-btn').innerHTML = '💾 Save';
        
        // Focus on title input
        titleInput.focus();
    }
}

// ===== ENHANCED DELETE FUNCTIONALITY - FIXED =====
function initDeleteFunctionality() {
    console.log('Initializing delete functionality...');
    
    // Use event delegation for delete buttons
    document.addEventListener('click', function(e) {
        // Check if click is on delete button or its children
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const entry = deleteBtn.closest('.journal-entry');
            
            if (entry && entry.getAttribute('data-is-new') === 'true') {
                e.preventDefault();
                e.stopPropagation();
                
                const entryId = deleteBtn.getAttribute('data-entry-id') || entry.getAttribute('data-entry-id');
                console.log('Delete button clicked for entry:', entryId);
                showDeleteConfirmation(entryId);
            }
        }
    });
}

function showDeleteConfirmation(entryId) {
    console.log('Showing delete confirmation for:', entryId);
    
    // Create confirmation dialog
    const confirmationHTML = `
        <div class="delete-confirmation">
            <div class="confirmation-dialog">
                <h3>🗑️ Delete Journal Entry</h3>
                <p>Are you sure you want to delete this journal entry? This action cannot be undone and the entry will be permanently removed from local storage.</p>
                <div class="confirmation-actions">
                    <button class="cancel-delete-btn" onclick="closeDeleteConfirmation()">
                        ↩️ Keep Entry
                    </button>
                    <button class="confirm-delete-btn" onclick="confirmDeleteEntry('${entryId}')">
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

function closeDeleteConfirmation() {
    const confirmation = document.querySelector('.delete-confirmation');
    if (confirmation) {
        confirmation.remove();
    }
    
    // Clean up escape key listener
    if (document.currentDeleteEscapeHandler) {
        document.removeEventListener('keydown', document.currentDeleteEscapeHandler);
        document.currentDeleteEscapeHandler = null;
    }
}

function confirmDeleteEntry(entryId) {
    console.log('Confirming deletion for:', entryId);
    
    const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
    const deleteBtn = entry ? entry.querySelector('.delete-btn') : null;
    
    if (entry) {
        // Show processing state
        if (deleteBtn) {
            deleteBtn.classList.add('processing');
            deleteBtn.innerHTML = '⏳ Deleting...';
        }
        
        setTimeout(() => {
            // Add fade out animation
            entry.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            entry.style.opacity = '0';
            entry.style.transform = 'translateX(-100px)';
            entry.style.maxHeight = '0';
            entry.style.overflow = 'hidden';
            entry.style.marginBottom = '0';
            
            setTimeout(() => {
                entry.remove();
                saveJournalEntries();
                updateReflectionCounter();
                
                // Show success message
                showSuccessMessage('Journal entry deleted successfully!');
                
                // Close confirmation dialog
                closeDeleteConfirmation();
            }, 500);
        }, 1000);
    } else {
        console.error('Entry not found for deletion:', entryId);
        showErrorMessage('Error: Entry not found for deletion');
        closeDeleteConfirmation();
    }
}

// ===== ENHANCED FORM VALIDATION =====
function initFormValidation() {
    const journalForm = document.getElementById('journal-form');
    
    if (journalForm) {
        // Add input event for character count
        const entryInput = document.getElementById('journal-entry');
        if (entryInput) {
            entryInput.addEventListener('input', function() {
                updateWordCount(this.value);
            });
        }
        
        journalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const titleInput = document.getElementById('journal-title');
            const entryInput = document.getElementById('journal-entry');
            const title = titleInput.value.trim();
            const content = entryInput.value.trim();
            
            // Validation
            if (!title) {
                alert('Please enter a title for your journal entry.');
                titleInput.focus();
                return false;
            }
            
            if (content.length < 50) {
                alert(`Please write at least 50 characters. You currently have ${content.length} characters.`);
                entryInput.focus();
                return false;
            }
            
            // Create and save new entry
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const newEntryHTML = createLocalJournalEntry(title, content, dateString);
            const journalFormSection = document.querySelector('.journal-form-section');
            if (journalFormSection) {
                journalFormSection.insertAdjacentHTML('afterend', newEntryHTML);
            }
            
            // Re-initialize features for new entry
            ensureHeaderStructure();
            initCollapsibleSections();
            initEditFunctionality();
            initDeleteFunctionality();
            initClipboardAPI();
            saveJournalEntries();
            updateReflectionCounter();
            
            showSuccessMessage('Journal entry added successfully!');
            journalForm.reset();
            updateWordCount('');
            
            return true;
        });
    }
}

function updateWordCount(text) {
    let wordCountEl = document.getElementById('word-count');
    if (!wordCountEl) {
        wordCountEl = document.createElement('div');
        wordCountEl.id = 'word-count';
        wordCountEl.className = 'word-count';
        const entryInput = document.getElementById('journal-entry');
        if (entryInput) {
            entryInput.parentNode.appendChild(wordCountEl);
        }
    }
    
    const charCount = text.length;
    wordCountEl.textContent = `Character count: ${charCount}/50`;
    wordCountEl.className = `word-count ${charCount >= 50 ? 'valid' : 'invalid'}`;
}

// Enhanced journal entry creation with edit functionality
function createLocalJournalEntry(title, content, date, entryId = null) {
    const id = entryId || 'local-' + Date.now();
    
    return `
        <article class="journal-entry collapsible" data-entry-id="${id}" data-is-new="true">
            <div class="collapsible-header">
                <h2>${title}</h2>
                <div class="header-spacer"></div>
                <div class="entry-actions">
                    <span class="toggle-icon">▼</span>
                    <button class="edit-btn" type="button">✏️ Edit</button>
                    <button class="copy-btn" type="button">📋 Copy</button>
                </div>
            </div>
            <div class="collapsible-content">
                <div class="entry-meta">${date} • Local Storage</div>
                <div class="entry-content">
                    ${content.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button class="delete-btn" type="button" data-entry-id="${id}">
                        🗑️ Delete Entry
                    </button>
                </div>
            </div>
        </article>
    `;
}

// ===== COLLAPSIBLE SECTIONS - FIXED =====
function initCollapsibleSections() {
    console.log('Initializing collapsible sections...');
    
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach((header, index) => {
        // Remove any existing event listeners by cloning and replacing
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        // Get the fresh header and its content
        const freshHeader = document.querySelectorAll('.collapsible-header')[index];
        const content = freshHeader.nextElementSibling;
        
        if (content && content.classList.contains('collapsible-content')) {
            // Set initial state - all collapsed
            content.style.display = 'none';
            freshHeader.classList.remove('active');
            
            // Add click event to header
            freshHeader.addEventListener('click', function(e) {
                // Don't trigger if click was on buttons
                if (e.target.closest('.copy-btn') || 
                    e.target.closest('.edit-btn') || 
                    e.target.closest('.delete-btn') ||
                    e.target.closest('.delete-flask-btn')) {
                    return;
                }
                
                console.log('Collapsible header clicked');
                
                // Toggle the content visibility
                const isVisible = content.style.display === 'block';
                
                if (isVisible) {
                    content.style.display = 'none';
                    this.classList.remove('active');
                } else {
                    content.style.display = 'block';
                    this.classList.add('active');
                }
            });
        }
    });
    
    console.log(`Initialized ${collapsibleHeaders.length} collapsible sections`);
}

// ===== REUSABLE NAVIGATION =====
function loadNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const navHTML = `
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-logo">Chandandeep Singh</a>
            
            <input type="checkbox" id="nav-toggle" class="nav-toggle">
            <label for="nav-toggle" class="nav-toggle-label">
                <span></span>
                <span></span>
                <span></span>
            </label>
            
            <ul class="nav-menu">
                <li><a href="/" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a></li>
                <li><a href="/journal" class="${currentPage === 'journal.html' ? 'active' : ''}">Journal</a></li>
                <li><a href="/about" class="${currentPage === 'about.html' ? 'active' : ''}">About</a></li>
                <li><a href="/projects" class="${currentPage === 'projects.html' ? 'active' : ''}">Projects</a></li>
            </ul>
        </div>
    </nav>`;
    
    // Insert navigation at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
}

// ===== LIVE DATE DISPLAY =====
function displayLiveDate() {
    const dateElement = document.getElementById('live-date');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ===== SUCCESS MESSAGE FUNCTION =====
function showSuccessMessage(message) {
    // Create success notification
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
        z-index: 2000;
        animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 300px;
    `;
    
    successMsg.innerHTML = `✅ ${message}`;
    document.body.appendChild(successMsg);
    
    // Auto remove after animation
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.parentNode.removeChild(successMsg);
        }
    }, 3000);
}

// ===== ERROR MESSAGE FUNCTION =====
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
        z-index: 2000;
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

// ===== FLASK FEATURES INITIALIZATION =====
async function initFlaskFeatures() {
    console.log('Initializing Flask features...');
    
    try {
        // Initialize Flask form
        if (typeof initFlaskForm === 'function') {
            initFlaskForm();
        }
        
        // Fetch and display Flask reflections
        const flaskReflections = await fetchFlaskReflections();
        displayFlaskReflections(flaskReflections);
        
        // Update counter
        updateReflectionCounter();
        
    } catch (error) {
        console.error('Error initializing Flask features:', error);
    }
}

// ===== IMPROVED NETWORK DETECTION =====
function initNetworkDetection() {
    console.log('Initializing network detection...');
    
    // Add network status indicator to the page
    addNetworkStatusIndicator();
    
    // Set up event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Initial update
    updateNetworkStatus();
}

function addNetworkStatusIndicator() {
    // Check if status indicator already exists
    if (document.getElementById('network-status')) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'network-status';
    statusDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        color: white;
        font-weight: bold;
        z-index: 990;
        font-size: 0.8rem;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        animation: pulse 2s infinite;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: 2px solid rgba(255,255,255,0.2);
        display: none;
    `;
    
    document.body.appendChild(statusDiv);
}

function updateNetworkStatus() {
    const statusElement = document.getElementById('network-status');
    if (!statusElement) return;
    
    const isOnline = navigator.onLine;
    
    if (isOnline) {
        statusElement.innerHTML = '🟢 Online';
        statusElement.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        
        // Auto-hide online status after 3 seconds
        setTimeout(() => {
            if (statusElement.innerHTML === '🟢 Online') {
                statusElement.style.display = 'none';
            }
        }, 3000);
        
    } else {
        statusElement.innerHTML = '🔴 Offline';
        statusElement.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        statusElement.style.display = 'block';
        
        // Show offline message (but only once to avoid spam)
        if (!statusElement.dataset.offlineShown) {
            showSuccessMessage('You are offline. Using cached content.');
            statusElement.dataset.offlineShown = 'true';
        }
    }
    
    // Add a small delay before showing online status to avoid flickering
    if (isOnline) {
        setTimeout(() => {
            statusElement.style.display = 'block';
        }, 100);
    }
}

// ===== IMPROVED PWA INSTALL PROMPT =====
function showPWAInstallPrompt() {
    // Check if install prompt already exists
    if (document.querySelector('.pwa-install-section')) return;
    
    const installSection = document.createElement('div');
    installSection.className = 'pwa-install-section';
    installSection.innerHTML = `
        <div class="pwa-install-banner">
            <div class="pwa-install-content">
                <h3>📱 Install Learning Journal</h3>
                <p>Install this app on your device for faster access and offline usage</p>
                <div class="pwa-install-actions">
                    <button id="install-pwa-btn" class="pwa-install-btn">
                        Install App
                    </button>
                    <button id="dismiss-pwa-btn" class="pwa-dismiss-btn">
                        Not Now
                    </button>
                </div>
            </div>
            <button class="pwa-close-btn" onclick="dismissPWAInstall()">×</button>
        </div>
    `;
    
    // Insert at the top of main content (but below navigation)
    const main = document.querySelector('main.container');
    if (main) {
        main.insertBefore(installSection, main.firstChild);
        
        // Add event listeners
        document.getElementById('install-pwa-btn').addEventListener('click', installPWA);
        document.getElementById('dismiss-pwa-btn').addEventListener('click', dismissPWAInstall);
        
        console.log('📱 PWA install prompt displayed');
    }
}

function dismissPWAInstall() {
    const installSection = document.querySelector('.pwa-install-section');
    if (installSection) {
        // Add fade out animation
        installSection.style.opacity = '0';
        installSection.style.transform = 'translateY(-20px)';
        installSection.style.maxHeight = '0';
        installSection.style.marginBottom = '0';
        installSection.style.overflow = 'hidden';
        
        setTimeout(() => {
            installSection.remove();
        }, 300);
        
        // Store dismissal in localStorage with 5-minute cooldown
        const cooldownTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        localStorage.setItem('pwaInstallDismissed', (Date.now() + cooldownTime).toString());
        
        console.log('📱 PWA install prompt dismissed - 5 minute cooldown started');
    }
}

// Enhanced installPWA function
async function installPWA() {
    if (!deferredPrompt) {
        showErrorMessage('Installation not available in this browser');
        dismissPWAInstall();
        return;
    }
    
    try {
        const installBtn = document.getElementById('install-pwa-btn');
        const originalText = installBtn.innerHTML;
        
        installBtn.innerHTML = '⏳ Installing...';
        installBtn.disabled = true;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            showSuccessMessage('App installed successfully! 🎉');
            
            // Remove the install prompt
            dismissPWAInstall();
            
            // Track installation permanently
            localStorage.setItem('pwaInstalled', 'true');
            
            // Clear the dismissal cooldown since app is installed
            localStorage.removeItem('pwaInstallDismissed');
        } else {
            console.log('❌ User dismissed the install prompt');
            showErrorMessage('Installation cancelled');
            
            // Reset button
            installBtn.innerHTML = originalText;
            installBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Installation error:', error);
        showErrorMessage('Installation failed. Please try again.');
        
        // Reset button on error
        const installBtn = document.getElementById('install-pwa-btn');
        if (installBtn) {
            installBtn.innerHTML = 'Install App';
            installBtn.disabled = false;
        }
    }
    
    deferredPrompt = null;
}

// Check if we should show the install prompt - UPDATED WITH 5-MINUTE COOLDOWN
function shouldShowInstallPrompt() {
    // Don't show if already installed
    if (isRunningStandalone() || localStorage.getItem('pwaInstalled') === 'true') {
        console.log('📱 PWA already installed, not showing prompt');
        return false;
    }
    
    // Check if within 5-minute cooldown period
    const dismissalTime = localStorage.getItem('pwaInstallDismissed');
    if (dismissalTime) {
        const currentTime = Date.now();
        const dismissalTimestamp = parseInt(dismissalTime);
        
        if (currentTime < dismissalTimestamp) {
            // Still within cooldown period
            const remainingMinutes = Math.ceil((dismissalTimestamp - currentTime) / (60 * 1000));
            console.log(`📱 PWA install prompt in cooldown - ${remainingMinutes} minutes remaining`);
            return false;
        } else {
            // Cooldown period has passed, remove the dismissal flag
            localStorage.removeItem('pwaInstallDismissed');
            console.log('📱 PWA install cooldown period ended');
        }
    }
    
    // Show if installable and not dismissed recently
    return true;
}

// Force show install prompt (for testing)
function forceShowInstallPrompt() {
    // Clear any dismissal flags
    localStorage.removeItem('pwaInstallDismissed');
    localStorage.removeItem('pwaInstalled');
    
    // Show the prompt
    if (isPWAInstallable()) {
        showPWAInstallPrompt();
        console.log('📱 PWA install prompt forced to show');
    } else {
        console.log('📱 PWA not installable at the moment');
    }
}

// ===== PWA FEATURES =====
function initPWAFeatures() {
    console.log('Initializing PWA features...');
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then(function(registration) {
                console.log('✅ ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ ServiceWorker registration failed: ', error);
            });
    }
    
    // Add network status indicator
    addNetworkStatusIndicator();
    
    // Initialize online/offline detection
    initNetworkDetection();
    
    // Check if app is installable and should show prompt
    if (isPWAInstallable() && shouldShowInstallPrompt()) {
        // Show install prompt after a short delay
        setTimeout(showPWAInstallPrompt, 2000);
    } else if (isPWAInstallable()) {
        console.log('📱 PWA installable but prompt not shown due to cooldown or installation');
    }
    
    // Fix z-index issues
    initNavigationZIndexFix();
}

function isPWAInstallable() {
    return ('BeforeInstallPromptEvent' in window) && 
           (window.matchMedia('(display-mode: standalone)').matches === false);
}

// Check if app is running in standalone mode
function isRunningStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// ===== Z-INDEX MANAGEMENT =====
function initNavigationZIndexFix() {
    // Ensure navigation has proper z-index
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.zIndex = '1000';
    }
    
    // Ensure nav-menu has proper z-index
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.style.zIndex = '1001';
    }
    
    // Ensure nav-toggle (hamburger) has proper z-index
    const navToggle = document.querySelector('.nav-toggle-label');
    if (navToggle) {
        navToggle.style.zIndex = '1002';
    }
    
    // Ensure PWA install prompt has proper z-index (below navigation)
    const installPrompt = document.querySelector('.pwa-install-section');
    if (installPrompt) {
        installPrompt.style.zIndex = '500';
    }
    
    // Ensure network status has proper z-index
    const networkStatus = document.getElementById('network-status');
    if (networkStatus) {
        networkStatus.style.zIndex = '990';
    }
}

// ===== THEME SWITCHER - IMPROVED =====
function initThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Set initial button text based on current theme
        if (document.body.classList.contains('dark-theme')) {
            themeToggle.textContent = '☀️ Light Mode';
        } else {
            themeToggle.textContent = '🌙 Dark Mode';
        }

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

// ===== ENHANCED INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing enhanced features for Lab 7');
    
    // Load reusable navigation first
    loadNavigation();
    
    // Fix z-index issues before initializing other features
    setTimeout(initNavigationZIndexFix, 100);
    
    // Initialize basic features
    displayLiveDate();
    initThemeSwitcher();
    initFormValidation();
    initEnhancedValidation();
    initYouTubeAPI();
    
    // Initialize PWA features
    initPWAFeatures();
    
    // Load saved entries and initialize components with proper timing
    setTimeout(() => {
        console.log('Loading saved entries and initializing components...');
        
        // Load saved local entries first
        const localEntries = loadJournalEntries();
        if (localEntries && localEntries.length > 0) {
            displayLocalEntries(localEntries);
        }
        
        // Then load Flask entries
        initFlaskFeatures();
        
        // Then ensure proper structure
        ensureHeaderStructure();
        
        // Initialize interactive components
        initCollapsibleSections();
        initClipboardAPI();
        initEditFunctionality();
        initDeleteFunctionality();
        
        console.log('All enhanced features initialized successfully!');
        
        // Show PWA status
        if (isRunningStandalone()) {
            console.log('🚀 PWA Running in Standalone Mode');
        } else {
            console.log('🚀 PWA Ready - Lab 7 Features Active');
        }
        
    }, 100);
});

// ===== GLOBAL EVENT LISTENERS =====
// Listen for the beforeinstallprompt event - MOVED TO GLOBAL SCOPE
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA install prompt available on page:', window.location.pathname);
    
    // Show install prompt if conditions are met
    if (shouldShowInstallPrompt()) {
        setTimeout(showPWAInstallPrompt, 2000);
    }
});

// ===== ANIMATION STYLES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideDownInstall {
        from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .youtube-controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.8rem;
        max-width: 500px;
        margin: 0 auto;
    }
    
    .yt-control-btn {
        background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
        color: white;
        border: none;
        padding: 0.8rem 0.5rem;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 3px 10px rgba(255, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        min-width: 100px;
    }
    
    .yt-control-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(255, 0, 0, 0.4);
    }
    
    .pause-btn {
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%) !important;
        box-shadow: 0 3px 10px rgba(52, 152, 219, 0.3) !important;
    }
    
    .stop-btn {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
        box-shadow: 0 3px 10px rgba(231, 76, 60, 0.3) !important;
    }
    
    .mute-btn, .unmute-btn {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%) !important;
        box-shadow: 0 3px 10px rgba(149, 165, 166, 0.3) !important;
    }
    
    .word-count {
        font-size: 0.8rem;
        font-style: italic;
        margin-top: 0.25rem;
    }
    
    .word-count.valid {
        color: #27ae60;
    }
    
    .word-count.invalid {
        color: #e74c3c;
    }
    
    /* Flask entry styling */
    .journal-entry[data-source="flask"] {
        border-left: 4px solid #9b59b6;
    }
    
    .journal-entry[data-source="flask"] .collapsible-header {
        background: linear-gradient(135deg, #f8f9fa 0%, #f4ecf7 100%);
    }
    
    .dark-theme .journal-entry[data-source="flask"] {
        border-left-color: #8e44ad;
    }
    
    .dark-theme .journal-entry[data-source="flask"] .collapsible-header {
        background: linear-gradient(135deg, #2d2d2d 0%, #2c1e2e 100%);
    }
    
    .delete-flask-btn {
        background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-shrink: 0;
        white-space: nowrap;
    }
    
    .delete-flask-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(155, 89, 182, 0.4);
        background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
    }
    
    /* PWA Install Section */
    .pwa-install-section {
        position: relative;
        z-index: 500;
        margin-bottom: 2rem;
        animation: slideDownInstall 0.5s ease;
        transition: all 0.3s ease;
    }
    
    .pwa-install-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.2);
        position: relative;
        backdrop-filter: blur(10px);
    }
    
    .pwa-install-content h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.3rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .pwa-install-content p {
        margin: 0 0 1.5rem 0;
        opacity: 0.9;
        line-height: 1.5;
    }
    
    .pwa-install-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .pwa-install-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.5);
        padding: 0.8rem 1.5rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        flex: 1;
    }
    
    .pwa-install-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }
    
    .pwa-dismiss-btn {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.8rem 1.5rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        flex: 1;
    }
    
    .pwa-dismiss-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    .pwa-close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .pwa-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
    
    /* Dark theme support */
    .dark-theme .pwa-install-banner {
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        border-color: rgba(255, 255, 255, 0.1);
    }
    
    /* Mobile responsive design */
    @media screen and (max-width: 768px) {
        .pwa-install-banner {
            padding: 1.2rem;
            margin: 0 -0.5rem;
            border-radius: 12px;
        }
        
        .pwa-install-content h3 {
            font-size: 1.1rem;
        }
        
        .pwa-install-actions {
            flex-direction: column;
            gap: 0.8rem;
        }
        
        .pwa-install-btn,
        .pwa-dismiss-btn {
            width: 100%;
            padding: 0.7rem 1rem;
        }
        
        .pwa-close-btn {
            top: 0.3rem;
            right: 0.3rem;
            width: 25px;
            height: 25px;
            font-size: 1rem;
        }
        
        #network-status {
            top: 90px;
            right: 10px;
            font-size: 0.7rem;
            padding: 0.4rem 0.8rem;
        }
    }
    
    /* Small mobile screens */
    @media screen and (max-width: 480px) {
        .pwa-install-banner {
            padding: 1rem;
        }
        
        .pwa-install-content h3 {
            font-size: 1rem;
            margin-bottom: 0.3rem;
        }
        
        .pwa-install-content p {
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        #network-status {
            top: 85px;
            right: 5px;
            font-size: 0.65rem;
            padding: 0.3rem 0.6rem;
        }
    }
`;
document.head.appendChild(style);

// ===== GLOBAL FUNCTION EXPORTS =====
window.confirmDeleteEntry = confirmDeleteEntry;
window.closeDeleteConfirmation = closeDeleteConfirmation;
window.showSuccessMessage = showSuccessMessage;
window.showErrorMessage = showErrorMessage;
window.installPWA = installPWA;
window.dismissPWAInstall = dismissPWAInstall;
window.showPWAInstallPrompt = showPWAInstallPrompt;
window.updateNetworkStatus = updateNetworkStatus;
window.shouldShowInstallPrompt = shouldShowInstallPrompt;
window.forceShowInstallPrompt = forceShowInstallPrompt;