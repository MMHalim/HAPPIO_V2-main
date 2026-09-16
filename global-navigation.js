// Global Navigation System
class GlobalNavigation {
    constructor() {
        this.navigationItems = [];
        this.currentPage = this.getCurrentPage();
 }

    // Initialize the navigation system
    async init() {
        await this.loadNavigationItems();
        this.createNavigationComponent();
        const hasNav = document.getElementById('global-navigation');
        if (hasNav) {
            this.setupEventListeners();
 } else {
 }
 }

    // Get current page from URL
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'dashboard';
 }

    // Load navigation items from Supabase
    async loadNavigationItems() {
        
        try {
            const url = 'https://kupaxfvjfobfdgtbfnnt.supabase.co/rest/v1/navigation_items?is_active=eq.true&order=order_index.asc';
            
            const response = await fetch(url, {
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw'
 }
 });
            

            if (response.ok) {
                this.navigationItems = await response.json();
                
                // Log each item for debugging
                this.navigationItems.forEach((item, index) => {
 });
 } else {
                const errorText = await response.text();
                console.error('Failed to load navigation items:', response.status, errorText);
                this.loadFallbackNavigation();
 }

            // Ensure Admin Settings is present (Manual Injection)
            if (!this.navigationItems.some(i => i.page_name === 'admin-settings')) {
                this.navigationItems.push({
                    title: 'Admin Settings',
                    icon: '🔧',
                    route: '/admin-settings.html',
                    page_name: 'admin-settings',
                    order_index: 100,
                    level: 'Admin,Super Admin,Manager' 
 });
 }

            // Ensure Calibration Results is present (Manual Injection)
            if (!this.navigationItems.some(i => i.page_name === 'calibration-meeting')) {
                this.navigationItems.push({
                    title: 'Calibration Results',
                    icon: '📊',
                    route: '/calibration-meeting.html',
                    page_name: 'calibration-meeting',
                    order_index: 101,
                    level: 'Admin,Super Admin,Manager' 
 });
 }

            // Ensure User Activities is present (Manual Injection)
            if (!this.navigationItems.some(i => i.page_name === 'users-activities')) {
                this.navigationItems.push({
                    title: 'User Activities',
                    icon: '🕒',
                    route: '/users-activities.html',
                    page_name: 'users-activities',
                    order_index: 102,
                    level: 'Admin,Super Admin,Manager' 
 });
 }

 } catch (error) {
            console.error('Error loading navigation items:', error);
            this.loadFallbackNavigation();
 }
 }

    // Fallback navigation if API fails
    loadFallbackNavigation() {
        this.navigationItems = [
            { title: 'Dashboard', icon: '📊', route: '/dashboard/', page_name: 'dashboard', order_index: 1 },
            { title: 'Scorecard', icon: '📝', route: '/scorecard.html', page_name: 'scorecard', order_index: 2 },
            { title: 'Manage Users', icon: '👥', route: '/manage-users.html', page_name: 'manage-users', order_index: 3 },
            { title: 'Analytics', icon: '📈', route: '/analytics.html', page_name: 'analytics', order_index: 4 },
            { title: 'Settings', icon: '⚙️', route: '/settings.html', page_name: 'settings', order_index: 5 },
            { title: 'Calibration Results', icon: '📊', route: '/calibration-meeting.html', page_name: 'calibration-meeting', order_index: 6 }
        ];
 }

    // Create the navigation component
    createNavigationComponent() {
// Do not render global navigation on login page unless authenticated
        const currentUrl = new URL(window.location.href);
        const pageParam = currentUrl.searchParams.get('page');
        const isLoginPage = window.location.pathname.endsWith('/login.html');
        const loginToken = localStorage.getItem('login_token');
        const userId = localStorage.getItem('user_id');
        const roleHints = (
            localStorage.getItem('user_role') ||
            localStorage.getItem('role') ||
            localStorage.getItem('UserRole') ||
            localStorage.getItem('userRole') ||
            localStorage.getItem('loggedInUserRole') ||
            ''
        ).toString();
        // Consider user logged in if we have either a token, a user id, or a role hint
        const isLoggedIn = Boolean(loginToken || userId || roleHints);
        const isDashboardView = window.location.pathname.includes('/dashboard');
        // Never render navigation on login page regardless of auth state
        if (isLoginPage) {
            GlobalNavigation.clearNavigation();
            return;
 }
        
        // Check if user is logged in - only show navigation if logged in
        if (!isLoggedIn) {
            // Make sure to remove any existing navigation
            const existingNav = document.getElementById('global-navigation');
            if (existingNav) {
                existingNav.remove();
 }
            const existingStyles = document.getElementById('global-navigation-styles');
            if (existingStyles) {
                existingStyles.remove();
 }
            return;
 }
        
        const existingNav = document.getElementById('global-navigation');
        if (existingNav) {
            existingNav.remove();
 }

        // Final safety: never insert navigation on login page
        if (isLoginPage) {
            GlobalNavigation.clearNavigation();
            return;
 }

        const userRole = (
            localStorage.getItem('user_role') ||
            localStorage.getItem('role') ||
            localStorage.getItem('UserRole') ||
            localStorage.getItem('userRole') ||
            localStorage.getItem('loggedInUserRole') ||
            ''
        ).toString();
        const filteredItems = this.filterNavigationByRole(this.navigationItems, userRole);

        const navigationHTML = `
            <div id="global-navigation" class="global-navigation">
                <div class="nav-container">
                    <div class="nav-title">Quality Management System</div>
                    <div class="nav-controls">
                        <button class="theme-toggle" id="global-theme-toggle" title="Toggle Dark/Light Mode">
                            <span class="theme-icon">🌙</span>
                        </button>
                        <div class="user-menu" id="global-user-menu">
                            <div class="user-avatar" id="global-user-avatar">
                                <span id="global-user-initials">U</span>
                            </div>
                            <div class="user-dropdown" id="global-user-dropdown">
                                <div class="user-info">
                                    <div class="user-name" id="global-user-name">User</div>
                                    <div class="user-email" id="global-user-email">user@example.com</div>
                                </div>
                                <div class="dropdown-divider"></div>
                                ${filteredItems.map(item => {
                                    return `
                                    <a href="${item.route}" class="dropdown-item" data-page="${item.page_name}">
                                        <span class="dropdown-icon">${item.icon}</span>
                                        <span class="dropdown-label">${item.title}</span>
                                    </a>
                                    `;
 }).join('')}
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item" data-action="logout">
                                    <span class="dropdown-icon">🚪</span>
                                    <span class="dropdown-label">Logout</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navigationHTML);
        
        // Add CSS styles
        this.addNavigationStyles();
        
        // Initialize theme and user info
        this.initializeTheme();
        this.initializeUserInfo();
 }
    
    // Filter navigation items by user role using optional 'level' column
    filterNavigationByRole(items, userRole) {
        try {
            const parseRoleList = (value) => {
                if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
                if (typeof value !== 'string') return [];
                const s = value.trim();
                if (!s) return [];
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
 } catch (_) {}
                return s.replace(/\s*\+\s*/g, ',').split(/[,;|]/).map(v => v.trim()).filter(Boolean);
 };
            const norm = (s) => (s ?? '')
                .toString()
                .toLowerCase()
                .replace(/[\-_]+/g, ' ')
                .trim()
                .replace(/\s+/g, ' ');

            const userRoles = parseRoleList(userRole).map(norm).filter(Boolean);
            const isAdmin = userRoles.includes('administrator');
            if (isAdmin) return items || [];

            const hasAnyRole = (requiredRoles) => {
                if (!userRoles.length) return true;
                const required = (requiredRoles || []).map(norm).filter(Boolean);
                if (!required.length) return true;
                return required.some(r => userRoles.includes(r));
 };

            const inferRequiredRolesForItem = (item) => {
                const title = String(item?.title || '').toLowerCase();
                const page = String(item?.page_name || '').toLowerCase();
                const route = String(item?.route || '').toLowerCase();

                const isMyPerformance = title.includes('my performance') || page.includes('my performance') || route.includes('my performance');
                if (!isMyPerformance) return null;

                const isMx = title.includes('[mx]') || title.includes(' mx') || title.includes('t1') || page.includes('t1') || route.includes('t1');
                const isOs = title.includes('[os]') || title.includes(' os') || title.includes('t2 os') || page.includes('t2 os') || route.includes('t2 os') || page.includes('t2_os') || route.includes('t2_os');
                const isPs = title.includes('[ps]') || title.includes(' ps') || title.includes('t2 ps') || page.includes('t2 ps') || route.includes('t2 ps') || page.includes('t2_ps') || route.includes('t2_ps');
                const isSm = title.includes('[sm]') || title.includes('social') || title.includes('sm') || page.includes('social') || route.includes('social');

                if (isMx) return ['MX-T1 User', 'Administrator'];
                if (isOs) return ['MX-T2 OS User', 'MX T2 OS User', 'MX-T2 User', 'MX T2 User', 'Administrator'];
                if (isPs) return ['MX-T2 PS User', 'MX T2 PS User', 'MX-T2 User', 'MX T2 User', 'Administrator'];
                if (isSm) return ['MX-SM User', 'Administrator'];

                return null;
 };

            return (items || []).filter(item => {
                const forced = inferRequiredRolesForItem(item);
                if (forced) return hasAnyRole(forced);
                const level = item && item.level;
                // If no level is specified, item is visible to all
                if (level === undefined || level === null || (typeof level === 'string' && level.trim() === '')) {
                    return true;
 }
                if (Array.isArray(level)) {
                    return hasAnyRole(level);
 }
                if (typeof level === 'string') {
                    return hasAnyRole(parseRoleList(level));
 }
                // Unknown format: do not restrict
                return true;
 });
 } catch (err) {
            return items || [];
 }
 }

    // Add navigation styles
    addNavigationStyles() {
        const existingStyles = document.getElementById('global-navigation-styles');
        if (existingStyles) {
            existingStyles.remove();
 }

        const styles = `
            <style id="global-navigation-styles">
                .global-navigation {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 10000 !important;
                    background: var(--bg-header) !important;
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--border-color);
                    box-shadow: var(--shadow);
                    transition: all 0.6s ease;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
 }

                .nav-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 60px;
 }

                .nav-title {
                    font-size: 20px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    user-select: none;
 }

                .nav-items {
                    display: flex;
                    gap: 8px;
 }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: var(--text-nav);
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: var(--bg-nav-item);
                    border: 1px solid transparent;
 }

                .nav-item:hover {
                    background: var(--bg-nav-item-hover);
                    transform: translateY(-1px);
 }

                .nav-item.active {
                    background: var(--bg-nav-item-active);
                    border-color: var(--border-hover);
                    color: var(--text-primary);
 }

                .nav-icon {
                    font-size: 16px;
 }

                .nav-label {
                    white-space: nowrap;
 }

                .nav-controls {
                    display: flex;
                    align-items: center;
                    gap: 16px;
 }

                .theme-toggle {
                    background: var(--bg-theme-toggle);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.6s ease;
                    color: var(--text-primary);
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
 }

                .theme-toggle:hover {
                    background: var(--bg-nav-item-hover);
                    transform: scale(1.05);
 }

                .user-menu {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: fit-content;
                    height: fit-content;
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    border: none;
                    outline: none;
 }

                .user-avatar {
                    width: 44px;
                    height: 44px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid var(--border-color);
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
 }

                .user-avatar:hover {
                    transform: scale(1.05);
 }

                .user-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    box-shadow: var(--shadow);
                    min-width: 280px;
                    max-height: 400px;
                    z-index: 9999;
                    margin-top: 8px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    display: none;
                    animation: dropdownFadeIn 0.2s ease-out;
                    padding: 8px 0;
 }

                .user-dropdown.show {
                    display: block;
 }

                /* Light theme: ensure dropdown is nearly opaque */
                [data-theme="light"] .user-dropdown {
                    background: rgba(255, 255, 255, 0.98);
 }

                /* Custom scrollbar for dropdown */
                .user-dropdown::-webkit-scrollbar {
                    width: 6px;
 }

                .user-dropdown::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                    border-radius: 3px;
 }

                .user-dropdown::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 3px;
 }

                .user-dropdown::-webkit-scrollbar-thumb:hover {
                    background: var(--text-secondary);
 }

                @keyframes dropdownFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
 }
                    to {
                        opacity: 1;
                        transform: translateY(0);
 }
 }

                .user-info {
                    padding: 16px;
                    border-bottom: 1px solid var(--border-color);
 }

                .user-name {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 16px;
 }

                .user-email {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin-top: 4px;
 }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: var(--text-primary);
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border-bottom: 1px solid var(--border-color);
 }

                .dropdown-item:last-child {
                    border-bottom: none;
 }

                .dropdown-item:hover {
                    background: var(--bg-nav-item-hover);
 }

                .dropdown-icon {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
 }

                .dropdown-label {
                    font-size: 14px;
                    font-weight: 500;
 }

                .dropdown-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 4px 0;
 }

                /* Responsive design */
                @media (max-width: 768px) {
                    .nav-container {
                        padding: 0 16px;
                        height: 60px;
 }

                    .nav-label {
                        display: none;
 }

                    .nav-item {
                        padding: 10px 12px;
 }

                    .nav-controls {
                        gap: 12px;
 }

                    .theme-toggle {
                        width: 40px;
                        height: 40px;
                        padding: 10px;
 }

                    .user-menu {
                        width: fit-content;
                        height: fit-content;
                        margin: 0;
                        padding: 0;
 }

                    .user-avatar {
                        width: 40px;
                        height: 40px;
                        font-size: 14px;
                        margin: 0;
                        padding: 0;
 }
 }

                /* Add top margin to body content to account for fixed navigation */
                body {
                    padding-top: 60px;
 }

                @media (max-width: 768px) {
                    body {
                        padding-top: 50px;
 }
 }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
 }

    // Initialize theme system
    initializeTheme() {
        const themeToggle = document.getElementById('global-theme-toggle');
        if (!themeToggle) {
            return;
 }
        const themeIcon = themeToggle.querySelector('.theme-icon');
        
        // Get current theme
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
 }

        // Theme toggle functionality
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
 }
            
 });
 }

    // Initialize user info
    initializeUserInfo() {
        const userEmail = localStorage.getItem('loggedInUserEmail') || 'user@example.com';
        const userName = localStorage.getItem('userName') || 'User';
        const userProfilePhoto = localStorage.getItem('userProfilePhoto') || '';
        
        
        document.getElementById('global-user-name').textContent = userName;
        document.getElementById('global-user-email').textContent = userEmail;
        
        // Set user avatar with profile photo or initials
        const avatarElement = document.getElementById('global-user-avatar');
        const initialsElement = document.getElementById('global-user-initials');
        
        if (userProfilePhoto && userProfilePhoto.trim() !== '' && 
            (userProfilePhoto.startsWith('http') || userProfilePhoto.startsWith('data:'))) {
            // Show profile photo
            avatarElement.innerHTML = `
                <img src="${userProfilePhoto}" alt="${userName}" 
                     onerror=" this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload=" this.nextElementSibling.style.display='none';"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                <span id="global-user-initials" style="display: none;">${userName.charAt(0).toUpperCase()}</span>
            `;
 } else {
            // Show initials
            initialsElement.textContent = userName.charAt(0).toUpperCase();
 }
 }

    // Setup event listeners
    setupEventListeners() {
        // User menu toggle
        const userAvatar = document.getElementById('global-user-avatar');
        const userDropdown = document.getElementById('global-user-dropdown');
        if (userAvatar && userDropdown) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
 });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
 }
 });

            // Dropdown item actions
            userDropdown.addEventListener('click', (e) => {
                const dropdownItem = e.target.closest('.dropdown-item');
                if (!dropdownItem) return;
                
                const action = dropdownItem.dataset.action;
                const page = dropdownItem.dataset.page;
                const href = dropdownItem.getAttribute('href');
                
                // Handle navigation items (from Supabase table)
                if (page && href && href !== '#') {
                    e.preventDefault();
                    window.location.href = href;
                    userDropdown.classList.remove('show');
                    return;
 }
                
                // Handle action items
                switch (action) {
                    case 'add-user':
                        if (typeof addNewUser === 'function') {
                            addNewUser();
 } else {
 }
                        break;
                    case 'add-bulk-users':
                        if (typeof addBulkUsers === 'function') {
                            addBulkUsers();
 } else {
 }
                        break;
                    case 'profile':
                        // You can add profile page navigation here
                        break;
                    case 'settings':
                        // You can add settings page navigation here
                        break;
                    case 'logout':
                        this.handleLogout();
                        break;
 }
                
                userDropdown.classList.remove('show');
 });
 } else {
 }

        // Navigation item clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.dataset.page;
                this.setActivePage(page);
 }
 });
 }

    // Set active page
    setActivePage(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
 });
        
        const activeItem = document.querySelector(`[data-page="${pageName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
 }
 }

    // Record logout
    async recordLogout() {
        try {
            const SUPABASE_URL = 'https://kupaxfvjfobfdgtbfnnt.supabase.co';
            const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw';
            
            const userName = localStorage.getItem('userName');
            const email = localStorage.getItem('loggedInUserEmail');
            const token = localStorage.getItem('login_token');
            
            if (!token) {
                return;
 }

            await fetch(`${SUPABASE_URL}/rest/v1/LoginData`, {
                method: 'POST',
                keepalive: true,
                headers: {
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
 },
                body: JSON.stringify({
                    agent_name: userName,
                    agent_email: email,
                    status: 'Logout',
                    created_at: new Date().toISOString()
 })
 });
 } catch (error) {
            const msg = (error && error.message) ? error.message : String(error || '');
            const abortLike = (error && error.name === 'AbortError') || /aborted|cancelled|canceled|failed to fetch/i.test(msg);
            if (!abortLike) {
 }
 }
 }

    // Handle logout
    async handleLogout() {
        // Record logout first while we still have the token
        this.recordLogout();

        try {
            const token = localStorage.getItem('login_token');
            if (token) {
                await fetch('https://kupaxfvjfobfdgtbfnnt.supabase.co/auth/v1/logout', {
                    method: 'POST',
                    keepalive: true,
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
 }
 });
 }
 } catch (error) {
            const msg = (error && error.message) ? error.message : String(error || '');
            const abortLike = (error && error.name === 'AbortError') || /aborted|cancelled|canceled|failed to fetch/i.test(msg);
            if (!abortLike) {
 }
 }
        
        // Clear localStorage
        localStorage.removeItem('login_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('loggedInUserEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('user_int_id');

        // Hide navigation if present
        this.hideNavigation();
        
        // Redirect to login
        window.location.href = '/login.html';
 }

    // Refresh navigation (useful for dynamic updates)
    async refresh() {
        await this.loadNavigationItems();
        this.createNavigationComponent();
 }

    // Show navigation after login
    showNavigation() {
        const isLoginPage = window.location.pathname.endsWith('/login.html');
        const token = localStorage.getItem('login_token');
        const userId = localStorage.getItem('user_id');
        const roleHints = (
            localStorage.getItem('user_role') ||
            localStorage.getItem('role') ||
            localStorage.getItem('UserRole') ||
            localStorage.getItem('userRole') ||
            localStorage.getItem('loggedInUserRole') ||
            ''
        ).toString();
        const isLoggedIn = Boolean(token || userId || roleHints);
        // Never show navigation on login page regardless of auth state
        if (isLoginPage) {
            GlobalNavigation.clearNavigation();
            return;
 }
        
        // Only create navigation if it doesn't already exist
        const existingNav = document.getElementById('global-navigation');
        if (!existingNav) {
            this.createNavigationComponent();
 } else {
 }
        
        const hasNav = document.getElementById('global-navigation');
        if (hasNav) {
            this.setupEventListeners();
 }
 }

    // Hide navigation after logout
    hideNavigation() {
        const existingNav = document.getElementById('global-navigation');
        if (existingNav) {
            existingNav.remove();
 }
 }

    // Force clear navigation (for login page)
    static clearNavigation() {
        const existingNav = document.getElementById('global-navigation');
        if (existingNav) {
            existingNav.remove();
 }
        // Also remove any navigation styles
        const existingStyles = document.getElementById('global-navigation-styles');
        if (existingStyles) {
            existingStyles.remove();
 }
 }

    // Update user profile photo
    updateUserProfilePhoto(profilePhotoUrl) {
        if (profilePhotoUrl) {
            localStorage.setItem('userProfilePhoto', profilePhotoUrl);
 } else {
            localStorage.removeItem('userProfilePhoto');
 }
        
        // Re-initialize user info to update avatar
        this.initializeUserInfo();
 }

    // Update user name
    updateUserName(userName) {
        if (userName) {
            localStorage.setItem('userName', userName);
 } else {
            localStorage.removeItem('userName');
 }
        
        // Re-initialize user info to update display
        this.initializeUserInfo();
 }
}

// Initialize global navigation when DOM is loaded
async function bootstrapGlobalNavigation() {
    try {
        const path = window.location.pathname;
        const token = localStorage.getItem('login_token');
        const userId = localStorage.getItem('user_id');
        const isLoggedIn = Boolean(token && userId);
        if (path.endsWith('/login.html')) {
            GlobalNavigation.clearNavigation();
            return;
 }

        window.globalNav = new GlobalNavigation();

        await window.globalNav.init();
 } catch (error) {
        console.error('Error initializing global navigation:', error);
 }
}

// Initialize immediately if DOM is already ready; otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapGlobalNavigation);
} else {
    bootstrapGlobalNavigation();
}

// Export for use in other scripts
window.GlobalNavigation = GlobalNavigation;
