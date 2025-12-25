import { state } from './state.js';
import { detectSchema } from './schema.js';

window.state = state; // for console inspection

const input = document.getElementById('csvInput');
const status = document.getElementById('status');
const columnSelector = document.getElementById('columnSelector');
const columnList = document.getElementById('columnList');
const showDashboardBtn = document.getElementById('showDashboard');
const dashboard = document.getElementById('dashboard');
const dataTable = document.getElementById('dataTable');

// Modern file upload elements
const fileUploadArea = document.getElementById('fileUploadArea');
const uploadLink = document.getElementById('uploadLink');

// Phase 4: Charts elements
const showChartsBtn = document.getElementById('showCharts');
const chartsSection = document.getElementById('charts');
const backToDashboardBtn = document.getElementById('backToDashboard');
const chartType = document.getElementById('chartType');
const chartConfiguration = document.getElementById('chartConfiguration');
const chartTypeHint = document.getElementById('chartTypeHint');
const generateChartBtn = document.getElementById('generateChart');
const chartContainer = document.getElementById('chartContainer');

// Phase 2: Filter and Pagination elements
const filtersList = document.getElementById('filtersList');
const clearFiltersBtn = document.getElementById('clearFilters');
const recordsInfo = document.getElementById('recordsInfo');
const rowsPerPageSelect = document.getElementById('rowsPerPageSelect');

// UI Enhancement: Column toggle elements
const toggleColumnsBtn = document.getElementById('toggleColumns');
const toggleText = document.getElementById('toggleText');
const columnCount = document.getElementById('columnCount');
const columnSearch = document.getElementById('columnSearch');
const selectAllBtn = document.getElementById('selectAllColumns');
const deselectAllBtn = document.getElementById('deselectAllColumns');

// Initialize modern file upload
initializeFileUpload();

function initializeFileUpload() {
  // Click to browse
  uploadLink.addEventListener('click', () => {
    input.click();
  });
  
  fileUploadArea.addEventListener('click', () => {
    input.click();
  });
  
  // Drag and drop functionality
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  
  fileUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        input.files = files;
        handleFileUpload(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  });
}

function handleFileUpload(file) {
  status.textContent = 'Parsing CSV...';
  columnSelector.style.display = 'none';
  dashboard.style.display = 'none';
  chartsSection.style.display = 'none';

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: (results) => {
      state.rawData = results.data;
      state.columns = Object.keys(results.data[0] || {});

      // Reset phase 2 state
      state.currentPage = 1;
      state.filters = {};
      state.filteredData = [...state.rawData];
      
      // Reset UI state - auto-collapse on mobile
      state.columnsExpanded = window.innerWidth > 768;

      // Detect schema using unique values
      detectSchema();

      // Show column selector
      renderColumnSelector();
      initializeColumnToggle();
      columnSelector.style.display = 'block';

      // Expose again after schema detection
      window.state = state;

      status.innerHTML = `
        <strong>File loaded successfully</strong><br>
        Rows: ${state.rawData.length}<br>
        Columns: ${state.columns.length}
      `;

      console.log('Detected Schema:', state.schema);
    },
    error: (err) => {
      status.textContent = 'Failed to parse CSV';
      console.error(err);
    }
  });
}

input.addEventListener('change', () => {
  const file = input.files[0];
  if (!file) return;
  
  handleFileUpload(file);
});

function renderColumnSelector() {
  columnList.innerHTML = '';
  
  state.columns.forEach(column => {
    const columnItem = document.createElement('div');
    columnItem.className = 'column-item';
    columnItem.dataset.columnName = column.toLowerCase(); // For search functionality
    
    columnItem.innerHTML = `
      <input type="checkbox" id="col-${column}" value="${column}">
      <div class="column-info">
        <div class="column-name">${column}</div>
        <span class="column-type">${state.schema[column]}</span>
      </div>
    `;
    
    columnList.appendChild(columnItem);
    
    // Add change listener to update count
    const checkbox = columnItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', updateColumnCount);
  });
  
  // Set initial state
  updateColumnToggleUI();
}

// UI Enhancement: Column toggle functions
function initializeColumnToggle() {
  toggleColumnsBtn.addEventListener('click', () => {
    state.columnsExpanded = !state.columnsExpanded;
    updateColumnToggleUI();
  });
  
  // Column search functionality
  columnSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterColumnList(searchTerm);
  });
  
  // Select/Deselect all buttons
  selectAllBtn.addEventListener('click', () => {
    const visibleCheckboxes = columnList.querySelectorAll('.column-item:not(.hidden) input[type="checkbox"]');
    visibleCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    updateColumnCount();
  });
  
  deselectAllBtn.addEventListener('click', () => {
    const visibleCheckboxes = columnList.querySelectorAll('.column-item:not(.hidden) input[type="checkbox"]');
    visibleCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    updateColumnCount();
  });
  
  updateColumnCount();
}

function filterColumnList(searchTerm) {
  const columnItems = columnList.querySelectorAll('.column-item');
  
  columnItems.forEach(item => {
    const columnName = item.dataset.columnName;
    const isVisible = columnName.includes(searchTerm);
    
    if (isVisible) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

function updateColumnToggleUI() {
  if (state.columnsExpanded) {
    columnList.classList.remove('collapsed');
    columnList.classList.add('expanded');
    toggleText.textContent = 'Hide Columns';
  } else {
    columnList.classList.remove('expanded');
    columnList.classList.add('collapsed');
    toggleText.textContent = 'Show Columns';
  }
}

function updateColumnCount() {
  const totalColumns = state.columns.length;
  const selectedColumns = columnList.querySelectorAll('input[type="checkbox"]:checked').length;
  const visibleColumns = columnList.querySelectorAll('.column-item:not(.hidden)').length;
  
  // Show visible count if search is active
  const searchTerm = columnSearch.value.trim();
  if (searchTerm) {
    columnCount.textContent = `${selectedColumns} of ${visibleColumns} visible (${totalColumns} total)`;
  } else {
    columnCount.textContent = `${selectedColumns} of ${totalColumns} selected`;
  }
}

showDashboardBtn.addEventListener('click', () => {
  // Get selected columns
  const checkboxes = columnList.querySelectorAll('input[type="checkbox"]:checked');
  state.selectedColumns = Array.from(checkboxes).map(cb => cb.value);
  
  if (state.selectedColumns.length === 0) {
    alert('Please select at least one column');
    return;
  }
  
  // Auto-collapse the column list after selection
  state.columnsExpanded = false;
  updateColumnToggleUI();
  
  // Phase 2: Initialize filters and pagination
  initializeFilters();
  initializePagination();
  applyFiltersAndRender();
  
  dashboard.style.display = 'block';
});
  document.getElementById('downloadCSV').addEventListener('click', downloadCSV);

// Phase 4: Charts functionality
showChartsBtn.addEventListener('click', () => {
  // Get selected columns
  const checkboxes = columnList.querySelectorAll('input[type="checkbox"]:checked');
  state.selectedColumns = Array.from(checkboxes).map(cb => cb.value);
  
  if (state.selectedColumns.length === 0) {
    alert('Please select at least one column');
    return;
  }
  
  // Auto-collapse the column list
  state.columnsExpanded = false;
  updateColumnToggleUI();
  
  // Initialize charts page
  initializeChartsPage();
  
  // Hide dashboard and show charts
  dashboard.style.display = 'none';
  chartsSection.style.display = 'block';
});

backToDashboardBtn.addEventListener('click', () => {
  chartsSection.style.display = 'none';
  dashboard.style.display = 'block';
});

// Phase 2: Filter Functions
function initializeFilters() {
  filtersList.innerHTML = '';
  
  state.selectedColumns.forEach(column => {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';
    
    const columnType = state.schema[column];
    let inputHTML = '';
    
    if (columnType === 'string') {
      inputHTML = `<input type="text" id="filter-${column}" placeholder="Filter ${column}...">`;
    } else if (columnType === 'number') {
      // Use text input for flexible number filtering (supports floats, ranges, comparisons)
      inputHTML = `<input type="text" id="filter-${column}" placeholder="e.g. 3.14, >10, 5-20">`;
    } else if (columnType === 'date') {
      inputHTML = `
        <div class="date-range-filter">
          <input type="date" id="filter-${column}-from" placeholder="From date">
          <span class="date-separator">to</span>
          <input type="date" id="filter-${column}-to" placeholder="To date">
        </div>
      `;
    } else if (columnType === 'boolean') {
      const uniqueValues = [...new Set(state.rawData.map(row => row[column]).filter(v => v != null))];
      inputHTML = `
        <select id="filter-${column}">
          <option value="">All</option>
          ${uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('')}
        </select>
      `;
    }
    
    filterItem.innerHTML = `
      <label>${column} (${columnType})</label>
      ${inputHTML}
    `;
    
    filtersList.appendChild(filterItem);
    
    // Add event listener for filter changes
    if (columnType === 'date') {
      // Handle date range filters
      const fromInput = filterItem.querySelector(`#filter-${column}-from`);
      const toInput = filterItem.querySelector(`#filter-${column}-to`);
      
      const updateDateFilter = () => {
        state.filters[column] = {
          from: fromInput.value,
          to: toInput.value
        };
        state.currentPage = 1;
        applyFiltersAndRender();
      };
      
      fromInput.addEventListener('change', updateDateFilter);
      toInput.addEventListener('change', updateDateFilter);
    } else {
      // Handle other filter types
      const filterInput = filterItem.querySelector(`#filter-${column}`);
      filterInput.addEventListener('input', () => {
        state.filters[column] = filterInput.value;
        state.currentPage = 1; // Reset to first page
        applyFiltersAndRender();
      });
    }
  });
}

function matchesNumberFilter(cellValue, filterValue) {
  const numValue = parseFloat(cellValue);
  if (isNaN(numValue)) return false;
  
  filterValue = filterValue.trim();
  
  // Range filter: "5-20" or "5 - 20"
  if (filterValue.includes('-') && !filterValue.startsWith('-')) {
    const [min, max] = filterValue.split('-').map(v => parseFloat(v.trim()));
    if (!isNaN(min) && !isNaN(max)) {
      return numValue >= min && numValue <= max;
    }
  }
  
  // Greater than: ">10" or "> 10"
  if (filterValue.startsWith('>')) {
    const compareValue = parseFloat(filterValue.substring(1).trim());
    if (!isNaN(compareValue)) {
      return numValue > compareValue;
    }
  }
  
  // Less than: "<10" or "< 10"
  if (filterValue.startsWith('<')) {
    const compareValue = parseFloat(filterValue.substring(1).trim());
    if (!isNaN(compareValue)) {
      return numValue < compareValue;
    }
  }
  
  // Greater than or equal: ">=10"
  if (filterValue.startsWith('>=')) {
    const compareValue = parseFloat(filterValue.substring(2).trim());
    if (!isNaN(compareValue)) {
      return numValue >= compareValue;
    }
  }
  
  // Less than or equal: "<=10"
  if (filterValue.startsWith('<=')) {
    const compareValue = parseFloat(filterValue.substring(2).trim());
    if (!isNaN(compareValue)) {
      return numValue <= compareValue;
    }
  }
  
  // Exact match or partial match for floats
  const filterNum = parseFloat(filterValue);
  if (!isNaN(filterNum)) {
    // For exact match
    if (numValue === filterNum) return true;
    
    // For partial match (useful for floats like 3.14 matching "3.1")
    return numValue.toString().includes(filterValue);
  }
  
  return false;
}

function applyFilters() {
  state.filteredData = state.rawData.filter(row => {
    return Object.entries(state.filters).every(([column, filterValue]) => {
      if (!filterValue) return true; // No filter applied
      
      const cellValue = row[column];
      const columnType = state.schema[column];
      
      if (columnType === 'string') {
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      } else if (columnType === 'number') {
        return matchesNumberFilter(cellValue, filterValue);
      } else if (columnType === 'date') {
        // Handle date range filtering
        if (typeof filterValue === 'object' && filterValue !== null) {
          const { from, to } = filterValue;
          if (!from && !to) return true; // No date filter applied
          
          const cellDate = new Date(cellValue);
          if (isNaN(cellDate.getTime())) return false; // Invalid date in cell
          
          const cellDateStr = cellDate.toISOString().split('T')[0];
          
          // Check from date
          if (from && cellDateStr < from) return false;
          
          // Check to date
          if (to && cellDateStr > to) return false;
          
          return true;
        }
        // Fallback for old single date format (shouldn't happen with new code)
        const cellDate = new Date(cellValue).toISOString().split('T')[0];
        return cellDate === filterValue;
      } else if (columnType === 'boolean') {
        return String(cellValue) === filterValue;
      }
      
      return true;
    });
  });
}

function applyFiltersAndRender() {
  applyFilters();
  updatePaginationInfo();
  renderDashboard();
  updatePaginationButtons();
}

// Phase 2: Pagination Functions
function initializePagination() {
  // Rows per page selector
  rowsPerPageSelect.addEventListener('change', () => {
    state.rowsPerPage = parseInt(rowsPerPageSelect.value);
    state.currentPage = 1;
    applyFiltersAndRender();
  });
  
  // Clear filters button
  clearFiltersBtn.addEventListener('click', () => {
    state.filters = {};
    state.currentPage = 1;
    
    // Clear all filter inputs
    state.selectedColumns.forEach(column => {
      const columnType = state.schema[column];
      
      if (columnType === 'date') {
        // Clear date range inputs
        const fromInput = document.getElementById(`filter-${column}-from`);
        const toInput = document.getElementById(`filter-${column}-to`);
        if (fromInput) fromInput.value = '';
        if (toInput) toInput.value = '';
      } else {
        // Clear other input types
        const filterInput = document.getElementById(`filter-${column}`);
        if (filterInput) filterInput.value = '';
      }
    });
    
    applyFiltersAndRender();
  });
  
  // Pagination buttons
  setupPaginationButtons();
}

function setupPaginationButtons() {
  const buttons = [
    { id: 'firstPageBottom', action: () => { state.currentPage = 1; applyFiltersAndRender(); }},
    { id: 'prevPageBottom', action: () => { if (state.currentPage > 1) { state.currentPage--; applyFiltersAndRender(); }}},
    { id: 'nextPageBottom', action: () => { if (state.currentPage < getTotalPages()) { state.currentPage++; applyFiltersAndRender(); }}},
    { id: 'lastPageBottom', action: () => { state.currentPage = getTotalPages(); applyFiltersAndRender(); }}
  ];
  
  buttons.forEach(({ id, action }) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', action);
  });
}

function getTotalPages() {
  return Math.ceil(state.filteredData.length / state.rowsPerPage);
}

function updatePaginationInfo() {
  const totalRecords = state.filteredData.length;
  const startRecord = (state.currentPage - 1) * state.rowsPerPage + 1;
  const endRecord = Math.min(state.currentPage * state.rowsPerPage, totalRecords);
  
  recordsInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;
  
  const pageInfo = `Page ${state.currentPage} of ${getTotalPages()}`;
  document.getElementById('pageInfoBottom').textContent = pageInfo;
}

function updatePaginationButtons() {
  const totalPages = getTotalPages();
  const isFirstPage = state.currentPage === 1;
  const isLastPage = state.currentPage === totalPages;
  
  document.getElementById('firstPageBottom').disabled = isFirstPage;
  document.getElementById('prevPageBottom').disabled = isFirstPage;
  document.getElementById('nextPageBottom').disabled = isLastPage;
  document.getElementById('lastPageBottom').disabled = isLastPage;
}

function renderDashboard() {
  const startIndex = (state.currentPage - 1) * state.rowsPerPage;
  const endIndex = startIndex + state.rowsPerPage;
  const pageData = state.filteredData.slice(startIndex, endIndex);
  
  let tableHTML = '<table><thead><tr>';
  
  // Table headers
  state.selectedColumns.forEach(col => {
    tableHTML += `<th>${col} <span style="font-size: 10px; color: #666;">(${state.schema[col]})</span></th>`;
  });
  tableHTML += '</tr></thead><tbody>';
  
  // Table rows
  pageData.forEach(row => {
    tableHTML += '<tr>';
    state.selectedColumns.forEach(col => {
      const value = row[col] ?? '';
      tableHTML += `<td>${value}</td>`;
    });
    tableHTML += '</tr>';
  });
  
  tableHTML += '</tbody></table>';
  dataTable.innerHTML = tableHTML;
}

// Phase 4: Charts Functions
let currentChart = null;

function initializeChartsPage() {
  // Set up chart type change listener
  chartType.addEventListener('change', updateChartConfiguration);
  
  // Initialize with default chart type
  updateChartConfiguration();
  
  // Add event listener for chart generation
  generateChartBtn.addEventListener('click', generateChart);
}

function updateChartConfiguration() {
  const selectedType = chartType.value;
  
  // Update hint text
  const hints = {
    bar: 'Best for: Comparing values across categories',
    pie: 'Best for: Showing proportions of a whole'
  };
  chartTypeHint.textContent = hints[selectedType];
  
  // Show ALL columns in chart dropdowns - not just selected ones
  const allColumns = state.columns;
  const columnOptions = allColumns.map(col => 
    `<option value="${col}">${col} (${state.schema[col]})</option>`
  ).join('');
  
  // Generate configuration UI based on chart type
  let configHTML = '';
  
  if (selectedType === 'bar') {
    configHTML = `
      <div class="config-group">
        <label>Group By:</label>
        <select id="groupByColumn">
          <option value="">Choose column to group by...</option>
          ${columnOptions}
        </select>
        <div class="chart-example">Example: category, region, department</div>
      </div>
      
      <div class="config-group">
        <label>Measure:</label>
        <select id="measureColumn">
          <option value="">Choose column to measure...</option>
          ${columnOptions}
        </select>
        <div class="chart-example">Example: sales, installs, revenue</div>
      </div>
      
      <div class="config-group">
        <label>Aggregation:</label>
        <select id="aggregationType">
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="count">Count</option>
          <option value="max">Maximum</option>
          <option value="min">Minimum</option>
        </select>
      </div>
    `;
  } else if (selectedType === 'pie') {
    configHTML = `
      <div class="config-group">
        <label>Group By:</label>
        <select id="groupByColumn">
          <option value="">Choose column to group by...</option>
          ${columnOptions}
        </select>
        <div class="chart-example">Example: category, status, type</div>
      </div>
      
      <div class="config-group">
        <label>Value:</label>
        <select id="valueType">
          <option value="count">Count of Records</option>
          ${allColumns.map(col => `<option value="${col}">Sum of ${col}</option>`).join('')}
        </select>
        <div class="chart-example">Show: record count or sum of values</div>
      </div>
      
      <div class="config-group">
        <label>Limit:</label>
        <select id="limitResults">
          <option value="10">Top 10</option>
          <option value="5">Top 5</option>
          <option value="15">Top 15</option>
          <option value="all">Show All</option>
        </select>
      </div>
    `;
  }
  
  chartConfiguration.innerHTML = configHTML;
}

function generateChart() {
  const selectedChartType = chartType.value;
  
  // Validate inputs based on chart type
  if (!validateChartInputs(selectedChartType)) {
    return;
  }
  
  // Clear previous chart
  if (currentChart) {
    currentChart.destroy();
  }
  
  // Clear container and add canvas
  chartContainer.innerHTML = '<canvas id="chartCanvas" class="chart-canvas"></canvas>';
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  
  // Prepare data based on chart type
  const chartData = prepareChartData(selectedChartType);
  
  if (!chartData) {
    chartContainer.innerHTML = '<div class="chart-placeholder"><p>No data available for the selected configuration</p></div>';
    return;
  }
  
  // Create chart
  currentChart = new Chart(ctx, {
    type: selectedChartType === 'line' ? 'line' : selectedChartType === 'pie' ? 'pie' : 'bar',
    data: chartData,
    options: getChartOptions(selectedChartType)
  });
}

function validateChartInputs(chartType) {
  if (chartType === 'bar') {
    const groupBy = document.getElementById('groupByColumn')?.value;
    const measure = document.getElementById('measureColumn')?.value;
    
    if (!groupBy) {
      alert('Please select a column to group by');
      return false;
    }
    if (!measure) {
      alert('Please select a column to measure');
      return false;
    }
  } else if (chartType === 'pie') {
    const groupBy = document.getElementById('groupByColumn')?.value;
    
    if (!groupBy) {
      alert('Please select a column to group by');
      return false;
    }
  }
  
  return true;
}

function prepareChartData(chartType) {
  if (chartType === 'bar') {
    return prepareBarChartData();
  } else if (chartType === 'pie') {
    return preparePieChartData();
  }
}

function prepareBarChartData() {
  const groupByColumn = document.getElementById('groupByColumn').value;
  const measureColumn = document.getElementById('measureColumn').value;
  const aggregationType = document.getElementById('aggregationType').value;
  
  // Group data by the selected column
  const grouped = {};
  
  state.filteredData.forEach(row => {
    const groupKey = row[groupByColumn] || 'Unknown';
    const measureValue = parseFloat(row[measureColumn]) || 0;
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = { values: [], count: 0 };
    }
    
    grouped[groupKey].values.push(measureValue);
    grouped[groupKey].count++;
  });
  
  // Calculate aggregated values
  const labels = [];
  const data = [];
  
  Object.entries(grouped).forEach(([key, group]) => {
    labels.push(key);
    
    let value;
    switch (aggregationType) {
      case 'sum':
        value = group.values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        value = group.values.reduce((a, b) => a + b, 0) / group.values.length;
        break;
      case 'count':
        value = group.count;
        break;
      case 'max':
        value = Math.max(...group.values);
        break;
      case 'min':
        value = Math.min(...group.values);
        break;
      default:
        value = group.values.reduce((a, b) => a + b, 0);
    }
    
    data.push(value);
  });
  
  return {
    labels,
    datasets: [{
      label: `${aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)} of ${measureColumn}`,
      data,
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
}

function preparePieChartData() {
  const groupByColumn = document.getElementById('groupByColumn').value;
  const valueType = document.getElementById('valueType').value;
  const limit = document.getElementById('limitResults').value;
  
  // Group data
  const grouped = {};
  
  state.filteredData.forEach(row => {
    const groupKey = row[groupByColumn] || 'Unknown';
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = { count: 0, sum: 0 };
    }
    
    grouped[groupKey].count++;
    
    if (valueType !== 'count') {
      const value = parseFloat(row[valueType]) || 0;
      grouped[groupKey].sum += value;
    }
  });
  
  // Convert to arrays and sort
  let dataArray = Object.entries(grouped).map(([key, group]) => ({
    label: key,
    value: valueType === 'count' ? group.count : group.sum
  }));
  
  // Sort by value descending
  dataArray.sort((a, b) => b.value - a.value);
  
  // Apply limit
  if (limit !== 'all') {
    dataArray = dataArray.slice(0, parseInt(limit));
  }
  
  return {
    labels: dataArray.map(item => item.label),
    datasets: [{
      data: dataArray.map(item => item.value),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#9966FF', '#FF9F40', '#36A2EB',
        '#FFCE56', '#FF6384', '#C9CBCF'
      ]
    }]
  };
}

function getChartOptions(chartType) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: getChartTitle(chartType)
      }
    }
  };
  
  if (chartType !== 'pie') {
    baseOptions.scales = {
      y: {
        beginAtZero: true
      }
    };
  }
  
  return baseOptions;
}

function getChartTitle(chartType) {
  if (chartType === 'bar') {
    const groupBy = document.getElementById('groupByColumn')?.value;
    const measure = document.getElementById('measureColumn')?.value;
    const aggregation = document.getElementById('aggregationType')?.value;
    return `${aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} of ${measure} by ${groupBy}`;
  } else if (chartType === 'pie') {
    const groupBy = document.getElementById('groupByColumn')?.value;
    const valueType = document.getElementById('valueType')?.value;
    return `Distribution by ${groupBy} ${valueType === 'count' ? '(count)' : `(sum of ${valueType})`}`;
  }
  
  return 'Chart';
}
function downloadCSV() {
  // Create data with only selected columns
  const exportData = state.filteredData.map(row => {
    const filteredRow = {};
    state.selectedColumns.forEach(column => {
      filteredRow[column] = row[column];
    });
    return filteredRow;
  });
  
  const csvString = Papa.unparse(exportData);
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-data.csv';
  a.click();
  URL.revokeObjectURL(url);
}
