// Complaints data - will be populated from server
let complaintsData = [];

// Function to convert category codes to full names
function getFullCategoryName(category) {
    const categoryMap = {
        'harassment': 'Harassment',
        'food': 'Food Issue',
        'lost': 'Lost & Found',
        'hostel': 'Hostel Issue'
    };
    return categoryMap[category.toLowerCase()] || category;
}

// Check if data is passed from the server
if (typeof window.dashboardComplaints !== 'undefined') {
    // Map dashboard data to the format expected by the UI
    complaintsData = window.dashboardComplaints.map((c, index) => ({
        id: index + 1,
        type: getFullCategoryName(c.complaintType),
        email: c.raisedBy,
        date: c.raisedDate,
        status: c.status,
        solver: c.solvedBy || '-',
        solvedDate: c.solvedDate || '-'
    }));
}

// Global variables for filtering
let filteredData = [...complaintsData];

// DOM elements
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const tableBody = document.getElementById('complaintsTableBody');
const mobileCards = document.getElementById('mobileCards');
const noResults = document.getElementById('noResults');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Format date function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Create status badge
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = `status-badge ${status.toLowerCase() === 'unsolved' ? 'status-unsolved' : 'status-solved'}`;
    badge.textContent = status;
    return badge;
}

// Render desktop table
function renderTable(data) {
    tableBody.innerHTML = '';
    
    data.forEach(complaint => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.id}</td>
            <td>${complaint.type}</td>
            <td>${complaint.email}</td>
            <td>${formatDate(complaint.date)}</td>
            <td></td>
            <td>${complaint.solver}</td>
            <td>${complaint.solvedDate === '-' ? '-' : formatDate(complaint.solvedDate)}</td>
        `;
        
        // Add status badge to the status cell
        const statusCell = row.children[4];
        statusCell.appendChild(createStatusBadge(complaint.status));
        
        tableBody.appendChild(row);
    });
}

// Render mobile cards
function renderMobileCards(data) {
    mobileCards.innerHTML = '';
    
    data.forEach(complaint => {
        const card = document.createElement('div');
        card.className = 'complaint-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${complaint.type}</div>
                    <div class="card-id">ID: ${complaint.id}</div>
                </div>
                <div class="status-badge ${complaint.status.toLowerCase() === 'unsolved' ? 'status-unsolved' : 'status-solved'}">
                    ${complaint.status}
                </div>
            </div>
            <div class="card-details">
                <div class="card-row">
                    <span class="card-label">Raised By:</span>
                    <span class="card-value">${complaint.email}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Raised Date:</span>
                    <span class="card-value">${formatDate(complaint.date)}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Solved By:</span>
                    <span class="card-value">${complaint.solver}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Solved Date:</span>
                    <span class="card-value">${complaint.solvedDate === '-' ? '-' : formatDate(complaint.solvedDate)}</span>
                </div>
            </div>
        `;
        
        mobileCards.appendChild(card);
    });
}

// Filter complaints based on search and filter criteria
function filterComplaints() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const typeFilterValue = typeFilter.value;
    const statusFilterValue = statusFilter.value;
    
    filteredData = complaintsData.filter(complaint => {
        const matchesSearch = 
            complaint.email.toLowerCase().includes(searchTerm) ||
            complaint.type.toLowerCase().includes(searchTerm);
        
        const matchesType = !typeFilterValue || complaint.type === typeFilterValue;
        const matchesStatus = !statusFilterValue || complaint.status === statusFilterValue;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    // Show/hide no results message
    if (filteredData.length === 0) {
        noResults.style.display = 'block';
        document.querySelector('.desktop-table').style.display = 'none';
        mobileCards.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        
        // Show appropriate view based on screen size
        if (window.innerWidth <= 768) {
            document.querySelector('.desktop-table').style.display = 'none';
            mobileCards.style.display = 'flex';
            renderMobileCards(filteredData);
        } else {
            document.querySelector('.desktop-table').style.display = 'block';
            mobileCards.style.display = 'none';
            renderTable(filteredData);
        }
    }
}

// Handle responsive layout changes
function handleResize() {
    if (filteredData.length > 0) {
        if (window.innerWidth <= 768) {
            document.querySelector('.desktop-table').style.display = 'none';
            mobileCards.style.display = 'flex';
            renderMobileCards(filteredData);
        } else {
            document.querySelector('.desktop-table').style.display = 'block';
            mobileCards.style.display = 'none';
            renderTable(filteredData);
        }
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.getElementById('mobileMenuBtn');
    
    if (navLinks) {
        navLinks.classList.toggle('show');
        if (hamburger) {
            hamburger.classList.toggle('active');
        }
        console.log('Mobile menu toggled, show class:', navLinks.classList.contains('show'));
    }
}

// Event listeners
if (searchInput) searchInput.addEventListener('input', filterComplaints);
if (typeFilter) typeFilter.addEventListener('change', filterComplaints);
if (statusFilter) statusFilter.addEventListener('change', filterComplaints);
window.addEventListener('resize', handleResize);
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);

// Initialize the application
function init() {
    // Initial render
    filterComplaints();
    
    // Handle initial layout
    handleResize();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}