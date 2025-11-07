// js/browser.js - Browser API Functions

// js/browser.js - Browser API Functions

// ===== BROWSER API: CLIPBOARD API =====
function initClipboardAPI() {
    console.log('Initializing Clipboard API...');
    
    // Use event delegation for better performance and dynamic elements
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
            const copyBtn = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
            const entry = copyBtn.closest('.journal-entry');
            
            if (!entry) {
                console.error('Could not find journal entry for copy button');
                return;
            }
            
            e.stopPropagation(); // Prevent triggering collapsible toggle
            
            const title = entry.querySelector('h2')?.textContent || 'Untitled';
            const contentElement = entry.querySelector('.collapsible-content');
            let content = '';
            
            if (contentElement) {
                // Get text content from the collapsible content excluding buttons
                const contentClone = contentElement.cloneNode(true);
                const buttons = contentClone.querySelectorAll('button, .entry-footer, .delete-btn, .edit-btn');
                buttons.forEach(btn => btn.remove());
                content = contentClone.textContent || '';
            }
            
            const textToCopy = `${title}\n\n${content}`.trim();
            
            console.log('Copying text:', textToCopy);
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Show success feedback
                    const originalHTML = copyBtn.innerHTML;
                    const originalBackground = copyBtn.style.background;
                    
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
                    copyBtn.disabled = true;
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.background = originalBackground;
                        copyBtn.disabled = false;
                    }, 2000);
                    
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    fallbackCopyText(textToCopy, copyBtn);
                });
            } else {
                // Fallback for browsers that don't support clipboard API
                fallbackCopyText(textToCopy, copyBtn);
            }
        }
    });
}

// Fallback method for copying text
function fallbackCopyText(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const originalHTML = button.innerHTML;
            const originalBackground = button.style.background;
            
            button.innerHTML = '✅ Copied!';
            button.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
            button.disabled = true;
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = originalBackground;
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error('Copy command failed');
        }
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        const originalHTML = button.innerHTML;
        button.innerHTML = '❌ Failed';
        button.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
        }, 2000);
    } finally {
        document.body.removeChild(textArea);
    }
}


// ===== BROWSER API: VALIDATION API ENHANCEMENT =====
function initEnhancedValidation() {
    const journalForm = document.getElementById('journal-form');
    const entryInput = document.getElementById('journal-entry');
    
    if (entryInput) {
        entryInput.addEventListener('input', function() {
            // Use Constraint Validation API
            if (this.validity.tooShort) {
                this.setCustomValidity(`Please enter at least ${this.minLength} characters. You have ${this.value.length}.`);
            } else if (this.validity.valueMissing) {
                this.setCustomValidity('Please write your journal entry.');
            } else {
                this.setCustomValidity('');
            }
            
            // Update word count display
            updateWordCount(this.value);
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
    
    const words = text.trim() ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    wordCountEl.textContent = `Word count: ${words}`;
    wordCountEl.className = `word-count ${words >= 10 ? 'valid' : 'invalid'}`;
}