// js/thirdparty.js - Third-Party API Functions

// ===== THIRD-PARTY API: YOUTUBE EMBED =====
let youtubePlayer = null;
let isPlayerReady = false;

function initYouTubeAPI() {
    const playerContainer = document.getElementById('youtube-player');
    if (!playerContainer) {
        console.log('YouTube player container not found');
        return;
    }
    
    console.log('Initializing YouTube API...');
    
    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
        createYouTubePlayer();
    } else {
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onerror = function() {
            console.error('Failed to load YouTube API');
            showYouTubeFallback();
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Set timeout as backup in case onYouTubeIframeAPIReady never fires
        setTimeout(function() {
            if (!youtubePlayer && window.YT) {
                createYouTubePlayer();
            } else if (!youtubePlayer) {
                showYouTubeFallback();
            }
        }, 3000);
    }
}

// Fallback if YouTube API fails to load
function showYouTubeFallback() {
    const playerContainer = document.getElementById('youtube-player');
    const controlsDiv = document.getElementById('youtube-controls');
    
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div style="background: #000; color: white; padding: 2rem; text-align: center; border-radius: 8px; height: 405px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h3 style="color: #ff0000; margin-bottom: 1rem;">🎬 YouTube Video Unavailable</h3>
                <p style="margin-bottom: 1.5rem;">JavaScript APIs Tutorial - WXsD0ZgxjRw</p>
                <a href="https://www.youtube.com/watch?v=WXsD0ZgxjRw" target="_blank" 
                   style="background: #ff0000; color: white; padding: 0.8rem 1.5rem; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block;">
                   Watch on YouTube
                </a>
            </div>
        `;
    }
    
    if (controlsDiv) {
        controlsDiv.innerHTML = `
            <p style="color: #666; font-style: italic; text-align: center;">
                Custom controls unavailable. Use the link above to watch the video.
            </p>
        `;
    }
}

// This function is called by YouTube API when ready
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API ready - creating player');
    createYouTubePlayer();
};

function createYouTubePlayer() {
    const playerContainer = document.getElementById('youtube-player');
    if (!playerContainer) return;
    
    try {
        youtubePlayer = new YT.Player('youtube-player', {
            height: '405',
            width: '720',
            videoId: 'WXsD0ZgxjRw', // JavaScript APIs tutorial video
            playerVars: {
                'playsinline': 1,
                'rel': 0,
                'modestbranding': 1,
                'enablejsapi': 1,
                'controls': 1 // Keep native controls as fallback
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        console.log('YouTube player created successfully');
    } catch (error) {
        console.error('Error creating YouTube player:', error);
        showYouTubeFallback();
    }
}

function onPlayerReady(event) {
    console.log('YouTube player ready and clickable');
    isPlayerReady = true;
    
    // Add custom controls with proper event handlers
    addYouTubeControls();
    
    // Make player focusable and clickable on mobile
    const iframe = document.getElementById('youtube-player');
    if (iframe) {
        iframe.setAttribute('tabindex', '0');
        iframe.style.pointerEvents = 'auto';
    }
}

function onPlayerStateChange(event) {
    // You can add custom behavior on state changes
    const states = ['unstarted', 'ended', 'playing', 'paused', 'buffering', 'video cued'];
    console.log('Player state:', states[event.data]);
}

function onPlayerError(event) {
    console.error('YouTube player error:', event.data);
    showYouTubeFallback();
}

function addYouTubeControls() {
    const controlsDiv = document.getElementById('youtube-controls');
    if (!controlsDiv) return;
    
    controlsDiv.innerHTML = `
        <div class="youtube-controls-grid">
            <button class="yt-control-btn play-btn" onclick="playVideo()">
                <span>▶️</span> Play
            </button>
            <button class="yt-control-btn pause-btn" onclick="pauseVideo()">
                <span>⏸️</span> Pause
            </button>
            <button class="yt-control-btn stop-btn" onclick="stopVideo()">
                <span>⏹️</span> Stop
            </button>
            <button class="yt-control-btn mute-btn" onclick="muteVideo()">
                <span>🔇</span> Mute
            </button>
            <button class="yt-control-btn unmute-btn" onclick="unmuteVideo()">
                <span>🔊</span> Unmute
            </button>
        </div>
        <p class="mobile-note" style="display: none; color: #666; font-size: 0.8rem; margin-top: 0.5rem; text-align: center;">
            💡 Tap the video first, then use controls
        </p>
    `;
    
    // Show mobile note on mobile devices
    if (isMobileDevice()) {
        controlsDiv.querySelector('.mobile-note').style.display = 'block';
    }
}

// Mobile device detection
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// ===== ENHANCED CONTROL FUNCTIONS WITH MOBILE SUPPORT =====

function playVideo() {
    if (!youtubePlayer) {
        console.log('Player not ready');
        return;
    }
    
    try {
        // On mobile, we need to ensure the player has focus
        const iframe = document.getElementById('youtube-player');
        if (iframe && isMobileDevice()) {
            iframe.focus();
        }
        
        youtubePlayer.playVideo();
        console.log('Play command sent');
    } catch (error) {
        console.error('Error playing video:', error);
        // Fallback: let user click the native player controls
        showMobileHelp('Tap the video screen to play, then use controls');
    }
}

function pauseVideo() {
    if (!youtubePlayer) {
        console.log('Player not ready');
        return;
    }
    
    try {
        youtubePlayer.pauseVideo();
        console.log('Pause command sent');
    } catch (error) {
        console.error('Error pausing video:', error);
    }
}

function stopVideo() {
    if (!youtubePlayer) {
        console.log('Player not ready');
        return;
    }
    
    try {
        youtubePlayer.stopVideo();
        console.log('Stop command sent');
    } catch (error) {
        console.error('Error stopping video:', error);
    }
}

function muteVideo() {
    if (!youtubePlayer) {
        console.log('Player not ready');
        return;
    }
    
    try {
        youtubePlayer.mute();
        console.log('Mute command sent');
    } catch (error) {
        console.error('Error muting video:', error);
    }
}

function unmuteVideo() {
    if (!youtubePlayer) {
        console.log('Player not ready');
        return;
    }
    
    try {
        youtubePlayer.unMute();
        console.log('Unmute command sent');
    } catch (error) {
        console.error('Error unmuting video:', error);
    }
}

function showMobileHelp(message) {
    // Create a temporary help message
    const helpMsg = document.createElement('div');
    helpMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        z-index: 1002;
        text-align: center;
        max-width: 300px;
        font-size: 0.9rem;
        border: 2px solid #ff0000;
    `;
    
    helpMsg.innerHTML = `📱 ${message}`;
    document.body.appendChild(helpMsg);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (helpMsg.parentNode) {
            helpMsg.parentNode.removeChild(helpMsg);
        }
    }, 3000);
}

// Make functions globally available
window.playVideo = playVideo;
window.pauseVideo = pauseVideo;
window.stopVideo = stopVideo;
window.muteVideo = muteVideo;
window.unmuteVideo = unmuteVideo;