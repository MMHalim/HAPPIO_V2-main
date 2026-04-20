
// User Activities Page Logic

let supabaseConfig = null;
let allData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global navigation
    const nav = new GlobalNavigation();
    await nav.init();

    // Load config and fetch initial data
    await loadConfig();
    
    // Set default date range (Last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    document.getElementById('endDate').valueAsDate = today;

    // Fetch data
    await fetchActivities();

    // Event Listeners
    document.getElementById('refreshBtn').addEventListener('click', fetchActivities);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('searchInput').addEventListener('input', filterData);
    document.getElementById('startDate').addEventListener('change', fetchActivities);
    document.getElementById('endDate').addEventListener('change', fetchActivities);
});

async function loadConfig() {
    try {
        const response = await fetch('database_config.json');
        const config = await response.json();
        supabaseConfig = {
            url: config.supabase.url,
            key: config.supabase.client_api_key
        };
    } catch (error) {
        console.error('Failed to load database config:', error);
        showError('Failed to load configuration. Please try again.');
    }
}

async function fetchActivities() {
    if (!supabaseConfig) return;

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Loading data...</td></tr>';

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        // Build URL with filters
        let url = `${supabaseConfig.url}/rest/v1/LoginData?select=*&order=created_at.desc`;
        
        // Add date range filter if selected
        if (startDate) {
            url += `&created_at=gte.${startDate}T00:00:00`;
        }
        if (endDate) {
            // Add 1 day to include the end date fully
            const endObj = new Date(endDate);
            endObj.setDate(endObj.getDate() + 1);
            url += `&created_at=lt.${endObj.toISOString().split('T')[0]}T00:00:00`;
        }

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseConfig.key,
                'Authorization': `Bearer ${supabaseConfig.key}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
        }

        allData = await response.json();
        filterData(); // This will also render the table

    } catch (error) {
        console.error('Error fetching activities:', error);
        showError(`Error loading data: ${error.message}`);
    }
}

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allData.filter(item => {
        if (!searchTerm) return true;
        
        // Search across all relevant fields
        return (
            (item.agent_name && item.agent_name.toLowerCase().includes(searchTerm)) ||
            (item.agent_email && item.agent_email.toLowerCase().includes(searchTerm)) ||
            (item.status && item.status.toLowerCase().includes(searchTerm)) ||
            (item.id && item.id.toString().includes(searchTerm)) ||
            (item.idx && item.idx.toString().includes(searchTerm))
        );
    });

    renderTable(filtered);
}

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-state">No records found</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id || '-'}</td>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(item.agent_name)}</td>
            <td>${escapeHtml(item.agent_email)}</td>
            <td><span class="status-badge ${getStatusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // The database is currently storing timestamps with a +2 hour offset but labeling them as UTC.
    // E.g., 4:58 AM Egypt Time is stored as 04:58:00+00 (UTC), instead of 02:58:00+00.
    // If we convert 04:58 UTC to Africa/Cairo (UTC+2), we get 06:58, which is wrong.
    // Solution: Display the raw UTC time component, which matches the actual Egypt wall-clock time.
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC', // Treat the stored value as the final display time
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    }).format(date);
}

function getStatusClass(status) {
    if (!status) return '';
    const lower = status.toLowerCase();
    if (lower === 'login') return 'status-login';
    if (lower === 'logout') return 'status-logout';
    return '';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function exportToCSV() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter data same as table
    const filtered = allData.filter(item => {
        if (!searchTerm) return true;
        return (
            (item.agent_name && item.agent_name.toLowerCase().includes(searchTerm)) ||
            (item.agent_email && item.agent_email.toLowerCase().includes(searchTerm)) ||
            (item.status && item.status.toLowerCase().includes(searchTerm)) ||
            (item.id && item.id.toString().includes(searchTerm)) ||
            (item.idx && item.idx.toString().includes(searchTerm))
        );
    });

    if (filtered.length === 0) {
        alert('No data to export');
        return;
    }

    // Define columns
    const headers = ['ID', 'Date & Time', 'Agent Name', 'Agent Email', 'Status'];
    
    // Convert data to CSV rows
    const csvContent = [
        headers.join(','), // Header row
        ...filtered.map(item => {
            const row = [
                item.id || '',
                // Use same format as display
                `"${formatDate(item.created_at)}"`,
                `"${(item.agent_name || '').replace(/"/g, '""')}"`, // Escape quotes
                `"${(item.agent_email || '').replace(/"/g, '""')}"`,
                `"${(item.status || '').replace(/"/g, '""')}"`
            ];
            return row.join(',');
        })
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `user_activities_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function showError(message) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `<tr><td colspan="5" class="loading-state" style="color: var(--danger-color)">${message}</td></tr>`;
}
