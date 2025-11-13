// (function() {
//   'use strict';
//
//   // Initialize on page load
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initAlerts);
//   } else {
//     initAlerts();
//   }
//
//   function initAlerts() {
//     const alertsTable = document.querySelector('[data-qa="alertsTable"]');
//     if (!alertsTable) return;
//
//     const selectAllCheckbox = document.getElementById('select-all');
//     const selectAllButton = document.getElementById('select-all-alerts');
//     const clearSelectedButton = document.getElementById('clear-selected-alerts');
//     const alertCheckboxes = document.querySelectorAll('.alert-checkbox');
//     const sortButtons = document.querySelectorAll('.sort-button');
//
//     // Handle select all checkbox in header
//     if (selectAllCheckbox) {
//       selectAllCheckbox.addEventListener('change', function() {
//         const isChecked = this.checked;
//         alertCheckboxes.forEach(function(checkbox) {
//           checkbox.checked = isChecked;
//         });
//         updateClearButtonState();
//       });
//     }
//
//     // Handle select all button
//     if (selectAllButton) {
//       selectAllButton.addEventListener('click', function() {
//         alertCheckboxes.forEach(function(checkbox) {
//           checkbox.checked = true;
//         });
//         if (selectAllCheckbox) {
//           selectAllCheckbox.checked = true;
//         }
//         updateClearButtonState();
//       });
//     }
//
//     // Handle individual checkbox changes
//     alertCheckboxes.forEach(function(checkbox) {
//       checkbox.addEventListener('change', function() {
//         updateSelectAllCheckbox();
//         updateClearButtonState();
//       });
//     });
//
//     // Handle clear selected alerts button
//     if (clearSelectedButton) {
//       clearSelectedButton.addEventListener('click', function() {
//         const selectedAlerts = [];
//         alertCheckboxes.forEach(function(checkbox) {
//           if (checkbox.checked) {
//             selectedAlerts.push(checkbox.value);
//           }
//         });
//
//         if (selectedAlerts.length === 0) {
//           return;
//         }
//
//         const confirmMessage = 'Are you sure you want to clear ' + selectedAlerts.length + ' alert(s)?';
//         if (confirm(confirmMessage)) {
//           clearAlerts(selectedAlerts);
//         }
//       });
//     }
//
//     // Handle sorting
//     sortButtons.forEach(function(button) {
//       button.addEventListener('click', function() {
//         const sortColumn = this.getAttribute('data-sort');
//         const currentUrl = new URL(window.location.href);
//         const currentSort = currentUrl.searchParams.get('sortBy');
//         const currentOrder = currentUrl.searchParams.get('sortOrder');
//
//         let newOrder = 'asc';
//         if (currentSort === sortColumn && currentOrder === 'asc') {
//           newOrder = 'desc';
//         }
//
//         currentUrl.searchParams.set('sortBy', sortColumn);
//         currentUrl.searchParams.set('sortOrder', newOrder);
//         currentUrl.searchParams.set('page', '0');
//
//         window.location.href = currentUrl.toString();
//       });
//     });
//
//     function updateSelectAllCheckbox() {
//       if (!selectAllCheckbox) return;
//
//       let allChecked = true;
//       let someChecked = false;
//
//       alertCheckboxes.forEach(function(checkbox) {
//         if (checkbox.checked) {
//           someChecked = true;
//         } else {
//           allChecked = false;
//         }
//       });
//
//       selectAllCheckbox.checked = allChecked;
//       selectAllCheckbox.indeterminate = someChecked && !allChecked;
//     }
//
//     function updateClearButtonState() {
//       if (!clearSelectedButton) return;
//
//       let anyChecked = false;
//       alertCheckboxes.forEach(function(checkbox) {
//         if (checkbox.checked) {
//           anyChecked = true;
//         }
//       });
//
//       clearSelectedButton.disabled = !anyChecked;
//     }
//
//     function clearAlerts(alertIds) {
//       fetch('/alerts/clear', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ selectedAlerts: alertIds }),
//       })
//       .then(function(response) {
//         if (response.ok) {
//           return response.json();
//         }
//         throw new Error('Failed to clear alerts');
//       })
//       .then(function(data) {
//         window.location.reload();
//       })
//       .catch(function(error) {
//         console.error('Error clearing alerts:', error);
//         alert('An error occurred while clearing alerts. Please try again.');
//       });
//     }
//
//     // Initialize button state
//     updateClearButtonState();
//
//     // Update sort indicators based on current URL
//     updateSortIndicators();
//   }
//
//   function updateSortIndicators() {
//     const currentUrl = new URL(window.location.href);
//     const sortBy = currentUrl.searchParams.get('sortBy');
//     const sortOrder = currentUrl.searchParams.get('sortOrder');
//
//     if (sortBy && sortOrder) {
//       const sortButton = document.querySelector('[data-sort="' + sortBy + '"]');
//       if (sortButton) {
//         const indicator = sortButton.querySelector('.sort-indicator');
//         if (indicator) {
//           indicator.textContent = sortOrder === 'asc' ? ' ↑' : ' ↓';
//         }
//         const header = sortButton.closest('th');
//         if (header) {
//           header.setAttribute('aria-sort', sortOrder === 'asc' ? 'ascending' : 'descending');
//         }
//       }
//     }
//   }
// })();
