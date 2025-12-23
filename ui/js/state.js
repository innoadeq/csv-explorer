export const state = {
  rawData: [],
  columns: [],
  schema: {},
  selectedColumns: [],  // Track which columns user wants to display
  
  // Phase 2: Pagination and Filters
  currentPage: 1,
  rowsPerPage: 25,
  filters: {},  // { columnName: filterValue }
  filteredData: [],  // Cached filtered results
  
  // UI Enhancement: Column list toggle
  columnsExpanded: true  // Track if column list is expanded
};
