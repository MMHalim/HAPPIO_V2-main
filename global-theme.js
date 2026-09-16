// Global Theme and Navigation System

class GlobalThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.currentPage = this.getCurrentPage();
        this.init();
 }

    init() {
        this.loadTheme();
        this.setupThemeToggle();
        this.setupNavigation();
        this.setupActiveNavItem();
 }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('scorecard')) return 'scorecard';
        if (path.includes('login')) return 'login';
        if (path.includes('reporting')) return 'reporting';
        return 'dashboard';
 }

    loadTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        
        if (this.currentTheme === 'light') {
            body.setAttribute('data-theme', 'light');
            if (themeIcon) {
                themeIcon.textContent = '☀️';
 }
 } else {
            body.removeAttribute('data-theme');
            if (themeIcon) {
                themeIcon.textContent = '🌙';
 }
 }
 }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        
        if (this.currentTheme === 'light') {
            body.removeAttribute('data-theme');
            this.currentTheme = 'dark';
            if (themeIcon) {
                themeIcon.textContent = '🌙';
 }
 } else {
            body.setAttribute('data-theme', 'light');
            this.currentTheme = 'light';
            if (themeIcon) {
                themeIcon.textContent = '☀️';
 }
 }
        
        localStorage.setItem('theme', this.currentTheme);
 }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Clone the element to remove all event listeners
            const newThemeToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
            
            // Add new event listener to the cloned element
            newThemeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTheme();
 });
 } else {
 }
 }

    setupNavigation() {
        // Setup dropdown toggle
        const userMenu = document.querySelector('.global-user-menu');
        const dropdown = document.querySelector('.global-user-dropdown-content');
        
        if (userMenu && dropdown) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
 });
 }

        // Setup dropdown items
        const dropdownItems = document.querySelectorAll('.global-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page && page !== this.currentPage) {
                    this.navigateToPage(page);
 }
                this.closeDropdown();
 });
 });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-user-menu') && !e.target.closest('.global-user-dropdown-content')) {
                this.closeDropdown();
 }
 });
 }

    toggleDropdown() {
        const dropdown = document.querySelector('.global-user-dropdown-content');
        if (dropdown) {
            dropdown.classList.toggle('show');
 }
 }

    closeDropdown() {
        const dropdown = document.querySelector('.global-user-dropdown-content');
        if (dropdown) {
            dropdown.classList.remove('show');
 }
 }

    setupActiveNavItem() {
        const dropdownItems = document.querySelectorAll('.global-dropdown-item');
        dropdownItems.forEach(item => {
            if (item.dataset.page === this.currentPage) {
                item.classList.add('active');
 } else {
                item.classList.remove('active');
 }
 });
 }

    navigateToPage(page) {
        // Define page routes
        const routes = {
            'dashboard': '/dashboard/',
            'scorecard': '/scorecard.html',
            'login': '/login.html',
            'reporting': '/reporting.html',
            'manage-users': '/manage-users.html'
 };

        const route = routes[page];
        if (route) {
            window.location.href = route;
 }
 }

    // Method to create global header HTML
    createGlobalHeader() {
        return `
            <div class="global-header">
                <div class="app-title">🎯 Quality Management Dashboard</div>
                <div class="global-header-controls">
                    <button id="themeToggle" class="global-theme-toggle">
                        <span id="themeIcon">🌙</span>
                    </button>
                    <div class="global-user-dropdown">
                        <div class="global-user-menu">
                            <div class="global-user-avatar">👤</div>
                            <span id="userEmail">admin@tempo.fit</span>
                            <span style="font-size: 12px;">▼</span>
                        </div>
                        <div class="global-user-dropdown-content">
                            <div class="global-dropdown-item" data-page="dashboard">
                                <div class="global-dropdown-icon">📊</div>
                                <div class="global-dropdown-label">Dashboard</div>
                            </div>
                            <div class="global-dropdown-item" data-page="performance-t1">
                                <div class="global-dropdown-icon">📈</div>
                                <div class="global-dropdown-label">My Performance [T1]</div>
                            </div>
                            <div class="global-dropdown-item" data-page="performance-os">
                                <div class="global-dropdown-icon">📈</div>
                                <div class="global-dropdown-label">My Performance [OS]</div>
                            </div>
                            <div class="global-dropdown-item" data-page="performance-ps">
                                <div class="global-dropdown-icon">📈</div>
                                <div class="global-dropdown-label">My Performance [PS]</div>
                            </div>
                            <div class="global-dropdown-item" data-page="performance-sm">
                                <div class="global-dropdown-icon">📈</div>
                                <div class="global-dropdown-label">My Performance [SM]</div>
                            </div>
                            <div class="global-dropdown-item" data-page="performance-sms">
                                <div class="global-dropdown-icon">📈</div>
                                <div class="global-dropdown-label">My Performance [SMS]</div>
                            </div>
                            <div class="global-dropdown-divider"></div>
                            <div class="global-dropdown-item" data-page="scorecard-t1">
                                <div class="global-dropdown-icon">📝</div>
                                <div class="global-dropdown-label">MX [T1] Scorecard</div>
                            </div>
                            <div class="global-dropdown-item" data-page="scorecard-os">
                                <div class="global-dropdown-icon">📝</div>
                                <div class="global-dropdown-label">MX T2 [OS] Scorecard</div>
                            </div>
                            <div class="global-dropdown-item" data-page="scorecard-ps">
                                <div class="global-dropdown-icon">📝</div>
                                <div class="global-dropdown-label">MX-T2 [PS] Scorecard</div>
                            </div>
                            <div class="global-dropdown-item" data-page="scorecard-sm">
                                <div class="global-dropdown-icon">📝</div>
                                <div class="global-dropdown-label">MX- [SM] Scorecard</div>
                            </div>
                            <div class="global-dropdown-item" data-page="scorecard-sms">
                                <div class="global-dropdown-icon">📝</div>
                                <div class="global-dropdown-label">SMS Scorecard</div>
                            </div>
                            <div class="global-dropdown-divider"></div>
                            <div class="global-dropdown-item" data-page="reporting">
                                <div class="global-dropdown-icon">📊</div>
                                <div class="global-dropdown-label">Reporting & Analytics</div>
                            </div>
                            <div class="global-dropdown-item" data-page="calibration">
                                <div class="global-dropdown-icon">📖</div>
                                <div class="global-dropdown-label">Calibration</div>
                            </div>
                            <div class="global-dropdown-item" data-page="edit-scorecard">
                                <div class="global-dropdown-icon">✏️</div>
                                <div class="global-dropdown-label">Edit Scorecard</div>
                            </div>
                            <div class="global-dropdown-divider"></div>
                            <div class="global-dropdown-item" data-page="manage-users">
                                <div class="global-dropdown-icon">👥</div>
                                <div class="global-dropdown-label">Manage Users</div>
                            </div>
                            <div class="global-dropdown-item" data-page="auditors-target">
                                <div class="global-dropdown-icon">⏱️</div>
                                <div class="global-dropdown-label">Auditors Target</div>
                            </div>
                            <div class="global-dropdown-item" data-page="account-info">
                                <div class="global-dropdown-icon">ℹ️</div>
                                <div class="global-dropdown-label">Account Info</div>
                            </div>
                            <div class="global-dropdown-item" data-page="settings">
                                <div class="global-dropdown-icon">⚙️</div>
                                <div class="global-dropdown-label">Settings</div>
                            </div>
                            <div class="global-dropdown-item" data-page="help">
                                <div class="global-dropdown-icon">❓</div>
                                <div class="global-dropdown-label">Help & Support</div>
                            </div>
                            <div class="global-dropdown-divider"></div>
                            <div class="global-dropdown-item" onclick="logout()">
                                <div class="global-dropdown-icon">🚪</div>
                                <div class="global-dropdown-label">Logout</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
 }

    // Method to create global navigation HTML (now handled by dropdown)
    createGlobalNavigation() {
        return ''; // Navigation is now in the dropdown menu
 }

    // Method to initialize global components on any page
    initGlobalComponents() {
        // Add global header if not exists
        if (!document.querySelector('.global-header')) {
            const headerContainer = document.getElementById('globalHeaderContainer');
            if (headerContainer) {
                headerContainer.innerHTML = this.createGlobalHeader();
                
                // Wait a bit for DOM to update, then setup event listeners
                setTimeout(() => {
                    this.setupThemeToggle();
                    this.setupNavigation();
                    this.setupActiveNavItem();
 }, 100);
 }
 } else {
            // If header already exists, just setup event listeners
            this.setupThemeToggle();
            this.setupNavigation();
            this.setupActiveNavItem();
 }
 }
}

// Global functions for backward compatibility
function toggleTheme() {
    if (window.globalTheme) {
        window.globalTheme.toggleTheme();
 } else {
        // Fallback for when global theme isn't loaded yet
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        const currentTheme = body.getAttribute('data-theme');
        
        if (currentTheme === 'light') {
            body.removeAttribute('data-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
 } else {
            body.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'light');
 }
 }
}

function showLogin() {
    // This function should be implemented per page
}

// Initialize global theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.globalTheme = new GlobalThemeManager();
        window.globalTheme.initGlobalComponents();
 } catch (error) {
        console.error('Error initializing global theme:', error);
 }   
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalThemeManager;
}
