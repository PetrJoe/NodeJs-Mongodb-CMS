// Main JavaScript file for public-facing site

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    initializeSearch();

    // Initialize smooth scrolling
    initializeSmoothScrolling();

    // Initialize toast notifications
    initializeToasts();
});

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('#search-input');
    const searchResults = document.querySelector('#search-results');

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                hideSearchResults();
                return;
            }

            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });

        // Hide search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults?.contains(e.target)) {
                hideSearchResults();
            }
        });
    }
}

async function performSearch(query) {
    try {
        const response = await fetch(`/api/posts?search=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();

        displaySearchResults(data.posts);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(posts) {
    const searchResults = document.querySelector('#search-results');
    if (!searchResults) return;

    if (posts.length === 0) {
        searchResults.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No posts found
            </div>
        `;
    } else {
        searchResults.innerHTML = posts.map(post => `
            <a href="/blog/${post.slug}" class="block p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                <h4 class="font-medium text-gray-900">${post.title}</h4>
                <p class="text-sm text-gray-600 mt-1">${post.excerpt}</p>
                <div class="text-xs text-gray-400 mt-2">
                    ${new Date(post.publishedAt).toLocaleDateString()}
                </div>
            </a>
        `).join('');
    }

    searchResults.classList.remove('hidden');
}

function hideSearchResults() {
    const searchResults = document.querySelector('#search-results');
    if (searchResults) {
        searchResults.classList.add('hidden');
    }
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Toast notifications
function initializeToasts() {
    // Auto-hide toast notifications after 5 seconds
    document.querySelectorAll('[data-toast]').forEach(toast => {
        setTimeout(() => {
            fadeOut(toast);
        }, 5000);
    });
}

function fadeOut(element) {
    element.style.opacity = '0';
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 300);
}

// Utility functions
function showLoading(button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
    `;

    return () => {
        button.disabled = false;
        button.textContent = originalText;
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-sm ${
        type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
        type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
        type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
        'bg-blue-50 text-blue-800 border border-blue-200'
    }`;

    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle'
                }"></i>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="inline-flex text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for use in other scripts
window.CMSUtils = {
    showLoading,
    showNotification,
    performSearch,
    hideSearchResults
};