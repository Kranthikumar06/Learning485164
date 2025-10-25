// Dashboard filter and search functionality
(function() {
  // Get dashboard table rows
  function getDashboardRows() {
    return Array.from(document.querySelectorAll('.desktop-table table.complaints-table tbody tr'));
  }

  // Get filter/search values
  function getFilterValues() {
    return {
      type: document.getElementById('typeFilter')?.value?.toLowerCase() || '',
      status: document.getElementById('statusFilter')?.value?.toLowerCase() || '',
      search: document.getElementById('searchInput')?.value?.toLowerCase() || ''
    };
  }

  // Filter and search dashboard table
  function filterDashboardTable() {
    const { type, status, search } = getFilterValues();
    let anyVisible = false;
    getDashboardRows().forEach(row => {
      const cells = row.querySelectorAll('td');
      const complaintType = (cells[1]?.textContent || '').toLowerCase();
      const raisedBy = (cells[2]?.textContent || '').toLowerCase();
      const statusCell = (cells[4]?.textContent || '').toLowerCase();
      // Search matches type or raisedBy
      const matchesSearch = !search || complaintType.includes(search) || raisedBy.includes(search);
      const matchesType = !type || complaintType === type;
      const matchesStatus = !status || statusCell === status;
      const show = matchesSearch && matchesType && matchesStatus;
      row.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    // Show/hide no results message
    const noResults = document.getElementById('noResults');
    if (noResults) noResults.style.display = anyVisible ? 'none' : 'block';
  }

  // Attach event listeners
  document.getElementById('typeFilter')?.addEventListener('change', filterDashboardTable);
  document.getElementById('statusFilter')?.addEventListener('change', filterDashboardTable);
  document.getElementById('searchInput')?.addEventListener('input', filterDashboardTable);

  // Initial filter
  window.addEventListener('DOMContentLoaded', filterDashboardTable);
})();
