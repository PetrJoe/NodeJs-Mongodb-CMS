// Admin JavaScript functionality

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up CSRF token for all requests
    setupCSRF();

    // Initialize admin-specific features
    initializeAdminFeatures();

    // Initialize data tables
    initializeDataTables();

    // Initialize form validation
    initializeFormValidation();
});

function setupCSRF() {
    // Add CSRF token to all AJAX requests
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        window.csrfToken = token;
    }
}

function initializeAdminFeatures() {
    // Initialize delete confirmations
    document.querySelectorAll('[data-confirm-delete]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showDeleteConfirmation(this);
        });
    });

    // Initialize bulk actions
    initializeBulkActions();

    // Initialize auto-save for forms
    initializeAutoSave();
}

function showDeleteConfirmation(button) {
    const itemName = button.getAttribute('data-item-name') || 'this item';
    const deleteUrl = button.getAttribute('href') || button.getAttribute('data-url');

    if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
        if (button.tagName === 'FORM' || button.closest('form')) {
            const form = button.tagName === 'FORM' ? button : button.closest('form');
            form.submit();
        } else {
            // Create and submit a form for DELETE request
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = deleteUrl;

            const methodInput = document.createElement('input');
            methodInput.type = 'hidden';
            methodInput.name = '_method';
            methodInput.value = 'DELETE';

            if (window.csrfToken) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = '_token';
                csrfInput.value = window.csrfToken;
                form.appendChild(csrfInput);
            }

            form.appendChild(methodInput);
            document.body.appendChild(form);
            form.submit();
        }
    }
}

function initializeBulkActions() {
    const selectAllCheckbox = document.querySelector('#select-all');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    const bulkActionForm = document.querySelector('#bulk-action-form');

    if (selectAllCheckbox && itemCheckboxes.length > 0) {
        selectAllCheckbox.addEventListener('change', function() {
            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionsVisibility();
        });

        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checkedItems = document.querySelectorAll('.item-checkbox:checked');
                selectAllCheckbox.checked = checkedItems.length === itemCheckboxes.length;
                selectAllCheckbox.indeterminate = checkedItems.length > 0 && checkedItems.length < itemCheckboxes.length;
                updateBulkActionsVisibility();
            });
        });
    }

    function updateBulkActionsVisibility() {
        const checkedItems = document.querySelectorAll('.item-checkbox:checked');
        const bulkActions = document.querySelector('#bulk-actions');

        if (bulkActions) {
            bulkActions.style.display = checkedItems.length > 0 ? 'block' : 'none';
        }
    }
}

function initializeAutoSave() {
    const autoSaveForms = document.querySelectorAll('[data-auto-save]');

    autoSaveForms.forEach(form => {
        let autoSaveTimeout;
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    autoSaveForm(form);
                }, 2000); // Auto-save after 2 seconds of inactivity
            });
        });
    });
}

async function autoSaveForm(form) {
    try {
        const formData = new FormData(form);
        const autoSaveUrl = form.getAttribute('data-auto-save-url');

        if (!autoSaveUrl) return;

        const response = await fetch(autoSaveUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Auto-Save': 'true'
            }
        });

        if (response.ok) {
            showAutoSaveIndicator('saved');
        } else {
            showAutoSaveIndicator('error');
        }
    } catch (error) {
        console.error('Auto-save error:', error);
        showAutoSaveIndicator('error');
    }
}

function showAutoSaveIndicator(status) {
    let indicator = document.querySelector('#auto-save-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'fixed bottom-4 right-4 px-3 py-2 rounded-md text-sm font-medium z-50';
        document.body.appendChild(indicator);
    }

    if (status === 'saved') {
        indicator.className = 'fixed bottom-4 right-4 px-3 py-2 rounded-md text-sm font-medium z-50 bg-green-100 text-green-800 border border-green-200';
        indicator.innerHTML = '<i class="fas fa-check mr-1"></i> Auto-saved';
    } else if (status === 'saving') {
        indicator.className = 'fixed bottom-4 right-4 px-3 py-2 rounded-md text-sm font-medium z-50 bg-blue-100 text-blue-800 border border-blue-200';
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
    } else {
        indicator.className = 'fixed bottom-4 right-4 px-3 py-2 rounded-md text-sm font-medium z-50 bg-red-100 text-red-800 border border-red-200';
        indicator.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> Save failed';
    }

    // Hide after 3 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 300);
    }, 3000);
}

function initializeDataTables() {
    // Simple data table functionality
    const tables = document.querySelectorAll('[data-sortable]');

    tables.forEach(table => {
        const headers = table.querySelectorAll('th[data-sort]');

        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(table, this.getAttribute('data-sort'));
            });
        });
    });
}

function sortTable(table, column) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aVal = a.querySelector(`[data-${column}]`)?.textContent || '';
        const bVal = b.querySelector(`[data-${column}]`)?.textContent || '';

        return aVal.localeCompare(bVal);
    });

    rows.forEach(row => tbody.appendChild(row));
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');

    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }

    // URL validation
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid URL';
    }

    // Custom validation rules
    const minLength = field.getAttribute('data-min-length');
    if (minLength && value.length < parseInt(minLength)) {
        isValid = false;
        errorMessage = `Must be at least ${minLength} characters`;
    }

    const maxLength = field.getAttribute('data-max-length');
    if (maxLength && value.length > parseInt(maxLength)) {
        isValid = false;
        errorMessage = `Must not exceed ${maxLength} characters`;
    }

    showFieldValidation(field, isValid, errorMessage);
    return isValid;
}

function showFieldValidation(field, isValid, errorMessage) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Update field styling
    if (isValid) {
        field.classList.remove('border-red-300', 'focus:ring-red-500', 'focus:border-red-500');
        field.classList.add('border-gray-300', 'focus:ring-primary-500', 'focus:border-primary-500');
    } else {
        field.classList.remove('border-gray-300', 'focus:ring-primary-500', 'focus:border-primary-500');
        field.classList.add('border-red-300', 'focus:ring-red-500', 'focus:border-red-500');

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error mt-1 text-sm text-red-600';
        errorDiv.textContent = errorMessage;
        field.parentNode.appendChild(errorDiv);
    }
}

// API helper functions
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
    };

    if (window.csrfToken) {
        defaultOptions.headers['X-CSRF-Token'] = window.csrfToken;
    }

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// Export functions for use in templates
window.AdminUtils = {
    apiRequest,
    showDeleteConfirmation,
    validateForm,
    showAutoSaveIndicator,
    sortTable
};