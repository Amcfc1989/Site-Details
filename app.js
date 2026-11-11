// G4S Vista Portal - Service Request & CARF Management System Logic

// Customer Configurations
const customerAgreements = {
  "Swarovski": { limit: 10000, baseFee: 100, dayRate: 45 },
  "Tesco plc": { limit: 50000, baseFee: 250, dayRate: 75 },
  "Sainsbury's": { limit: 40000, baseFee: 200, dayRate: 65 },
  "Marks & Spencer": { limit: 30000, baseFee: 150, dayRate: 55 }
};

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarInteractivity();
  setupProfileDropdown();
  setupCustomerSelector();
  setupNavigation();
  
  // Set initial calculation values
  recalculateCARF();
  
  // Show welcome toast on load
  setTimeout(() => {
    showToast("Active Session: Change of Service Day portal loaded", "success");
  }, 500);
});

// View Switching Manager
function switchView(viewName) {
  // Hide all views
  const views = document.querySelectorAll(".portal-view");
  views.forEach(v => v.classList.remove("active-view"));

  // Reset active menu state
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(i => i.classList.remove("active"));

  if (viewName === 'carf') {
    document.getElementById("view-carf").classList.add("active-view");
    document.getElementById("nav-carf").classList.add("active");
    showToast("Switched to CARF Details page", "info");
  } 
  else if (viewName === 'requests') {
    document.getElementById("view-requests").classList.add("active-view");
    document.getElementById("nav-requests").classList.add("active");
    showToast("Switched to Service Requests page", "info");
  } 
  else {
    // Other mock nav targets
    document.getElementById("view-carf").classList.add("active-view");
    document.getElementById("nav-carf").classList.add("active");
    showToast(`Navigated to ${viewName} (Simulated view redirecting to CARF)`, "info");
  }

  // Close mobile sidebar if open
  document.getElementById("sidebar").classList.remove("show-mobile");
}

// Sidebar Desktop Collapse & Mobile Toggle
function setupSidebarInteractivity() {
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const toggleBtn = document.getElementById("menu-toggle-btn");
  const collapseIcon = document.getElementById("collapse-icon");

  // Sidebar Desktop Collapse
  collapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    
    // Rotate/Flip Collapse icon based on state
    if (sidebar.classList.contains("collapsed")) {
      collapseIcon.innerHTML = `<polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>`;
      collapseBtn.setAttribute("title", "Expand Menu");
    } else {
      collapseIcon.innerHTML = `<polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>`;
      collapseBtn.setAttribute("title", "Collapse Menu");
    }
  });

  // Mobile Hamburger Toggle
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("show-mobile");
  });

  // Close mobile sidebar when clicking main content
  document.querySelector(".main-layout").addEventListener("click", () => {
    if (sidebar.classList.contains("show-mobile")) {
      sidebar.classList.remove("show-mobile");
    }
  });
}

// Profile Dropdown Panel
function setupProfileDropdown() {
  const trigger = document.getElementById("user-profile-trigger");
  const dropdown = document.getElementById("profile-dropdown");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

// Active Customer Selection Syncer
function setupCustomerSelector() {
  const selector = document.getElementById("active-customer");
  const carfBannerText = document.getElementById("carf-banner-customer");
  const summaryCustName = document.getElementById("analytics-customer");

  selector.addEventListener("change", (e) => {
    const customer = e.target.value;
    carfBannerText.textContent = customer;
    summaryCustName.textContent = customer;
    
    showToast(`Switched client context to: ${customer}`, "info");
    
    // Binds limits and rates dynamically
    recalculateCARF();
    
    // Highlight banner briefly to indicate active update
    const banner = document.getElementById("carf-notice-banner");
    banner.style.transition = "background-color 0.3s ease";
    banner.style.backgroundColor = "#fde68a";
    setTimeout(() => {
      banner.style.backgroundColor = "#fef3c7";
    }, 1000);
  });
}

// Navigation links setup
function setupNavigation() {
  // Empty wrapper to avoid redundancy. Click events are directly handled via inline onclick.
}

// Accordion Expand/Collapse handler
function toggleAccordion(cardId) {
  const card = document.getElementById(cardId);
  const toggleIcon = card.querySelector(".accordion-toggle-icon");
  
  card.classList.toggle("collapsed");
  if (card.classList.contains("collapsed")) {
    toggleIcon.textContent = "+";
  } else {
    toggleIcon.textContent = "−";
  }
}

// Toggle Redirection submenu links
function toggleRedirectSubmenu() {
  showToast("Opening Redirection targets: Dashboard | Order Book | SLA Audit", "info");
}

// Weekend Waiver Toggle Control
function toggleWeekendWaiver() {
  const waiverCheckbox = document.getElementById("weekend-waiver-toggle");
  const isEnabled = waiverCheckbox.checked;

  const satCard = document.getElementById("card-saturday");
  const sunCard = document.getElementById("card-sunday");
  const satSelect = document.getElementById("select-saturday");
  const sunSelect = document.getElementById("select-sunday");
  const satWarning = document.getElementById("warning-saturday");
  const sunWarning = document.getElementById("warning-sunday");

  if (isEnabled) {
    // Enable fields
    satCard.classList.remove("disabled");
    sunCard.classList.remove("disabled");
    satSelect.removeAttribute("disabled");
    sunSelect.removeAttribute("disabled");
    
    // Hide warning label or style it neutral
    satWarning.style.color = "var(--g4s-success)";
    satWarning.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 5 12"/></svg> Weekend Service Enabled`;
    
    sunWarning.style.color = "var(--g4s-success)";
    sunWarning.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 5 12"/></svg> Weekend Service Enabled`;
    
    showToast("Weekend service unlocked. Waiver fee applied.", "warning");
  } else {
    // Disable fields & Reset value
    satCard.classList.add("disabled");
    sunCard.classList.add("disabled");
    
    satSelect.value = "0";
    sunSelect.value = "0";
    satSelect.setAttribute("disabled", "true");
    sunSelect.setAttribute("disabled", "true");
    
    // Show warning label in red
    satWarning.style.color = "var(--g4s-red)";
    satWarning.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Service not available`;
    
    sunWarning.style.color = "var(--g4s-red)";
    sunWarning.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Service not available`;
    
    showToast("Weekend service disabled.", "info");
  }

  recalculateCARF();
}

// Recalculates all values, gauge progress, timeline markers, and fees
function recalculateCARF() {
  const customer = document.getElementById("active-customer").value;
  const agreement = customerAgreements[customer] || { limit: 10000, baseFee: 100, dayRate: 45 };

  // Sum weekday collections
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  let totalCash = 0;
  let activeDayCount = 0;

  days.forEach(day => {
    const val = parseInt(document.getElementById(`select-${day}`).value);
    const timelineCol = document.getElementById(`timeline-${day.substring(0, 3)}`);
    
    if (val > 0) {
      totalCash += val;
      activeDayCount++;
      timelineCol.classList.add("active");
    } else {
      timelineCol.classList.remove("active");
    }
  });

  // Calculate Capacity progress percentage
  const percent = Math.min(Math.round((totalCash / agreement.limit) * 100), 200);

  // Update DOM Values
  document.getElementById("analytics-scheduled-val").textContent = `£${totalCash.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("analytics-limit-val").textContent = `£${agreement.limit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("gauge-capacity-percent").textContent = `${percent}%`;

  const gaugeFill = document.getElementById("gauge-fill");
  gaugeFill.style.width = `${Math.min(percent, 100)}%`;

  // Color warning trigger for gauge
  gaugeFill.className = "gauge-fill";
  if (percent > 100) {
    gaugeFill.classList.add("danger");
  } else if (percent > 80) {
    gaugeFill.classList.add("warning");
  }

  // Fee calculation: base + (activeDays * rate) + weekend surcharge (£75)
  const isWeekendEnabled = document.getElementById("weekend-waiver-toggle").checked;
  const weekendSurcharge = isWeekendEnabled ? 75 : 0;
  const totalFee = agreement.baseFee + (activeDayCount * agreement.dayRate) + weekendSurcharge;
  
  document.getElementById("analytics-fee").textContent = `£${totalFee.toFixed(2)}`;
}

// Reset CARF form to baseline (Defaults to Tuesday Cash 45 per screenshot)
function resetCARFForm() {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  days.forEach(day => {
    document.getElementById(`select-${day}`).value = (day === "tuesday") ? "4500" : "0";
  });

  document.getElementById("weekend-waiver-toggle").checked = false;
  toggleWeekendWaiver(); // Run disabling script

  showToast("CARF service days schedule reset to Tuesday default", "info");
}

// Save Changes (CARF Submission)
function submitCARFSchedule() {
  const customer = document.getElementById("active-customer").value;
  const scheduledValText = document.getElementById("analytics-scheduled-val").textContent;
  const feeText = document.getElementById("analytics-fee").textContent;
  
  // Verify constraints
  const agreement = customerAgreements[customer];
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  let totalCash = 0;
  let activeDays = [];

  days.forEach(day => {
    const val = parseInt(document.getElementById(`select-${day}`).value);
    if (val > 0) {
      totalCash += val;
      activeDays.push(day.charAt(0).toUpperCase() + day.slice(1, 3));
    }
  });

  if (totalCash === 0) {
    showToast("You must select at least one collection service day", "danger");
    return;
  }

  if (totalCash > agreement.limit) {
    showToast(`Weekly Cash collection limit exceeded! (Max: £${agreement.limit.toLocaleString()})`, "danger");
    return;
  }

  // Populate Summary Details
  document.getElementById("carf-summary-customer").textContent = customer;
  document.getElementById("carf-summary-val").textContent = scheduledValText;
  document.getElementById("carf-summary-days").textContent = activeDays.join(", ") || "None";
  document.getElementById("carf-summary-fee").textContent = feeText;

  // Open Save confirmation modal
  const overlay = document.getElementById("carf-modal-overlay");
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);

  showToast("Collection schedule saved to local repository", "success");
}

// Close CARF summary modal
function closeCARFModal() {
  const overlay = document.getElementById("carf-modal-overlay");
  overlay.classList.remove("show");
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}


// ================== SERVICE REQUEST FORM LOGIC ==================

function handleFormSubmit(event) {
  event.preventDefault();
  
  const firstName = document.getElementById("first-name");
  const lastName = document.getElementById("last-name");
  const department = document.getElementById("department");
  const reason = document.getElementById("reason");
  const customer = document.getElementById("active-customer").value;
  
  let hasError = false;

  clearValidationErrors();

  if (!firstName.value.trim()) {
    showValidationError("group-first-name");
    hasError = true;
  }
  if (!lastName.value.trim()) {
    showValidationError("group-last-name");
    hasError = true;
  }
  if (!department.value) {
    showValidationError("group-department");
    hasError = true;
  }
  if (!reason.value.trim()) {
    showValidationError("group-reason");
    hasError = true;
  }

  if (hasError) {
    showToast("Please fill in all required fields", "danger");
    return;
  }

  // Populate Success Modal Summary
  document.getElementById("summary-customer").textContent = customer;
  document.getElementById("summary-requester").textContent = `${firstName.value.trim()} ${lastName.value.trim()}`;
  document.getElementById("summary-department").textContent = department.value;
  document.getElementById("summary-reason").textContent = reason.value.trim();

  // Open Success Modal Overlay
  const overlay = document.getElementById("success-modal-overlay");
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);

  showToast("Service request submitted successfully", "success");
}

function resetForm() {
  document.getElementById("service-request-form").reset();
  clearValidationErrors();
  showToast("Form fields reset", "info");
}

function closeSuccessModal() {
  const overlay = document.getElementById("success-modal-overlay");
  overlay.classList.remove("show");
  setTimeout(() => {
    overlay.style.display = "none";
    resetForm();
    switchView('carf'); // Go back to CARF overview after submit
  }, 300);
}

function showValidationError(groupId) {
  const group = document.getElementById(groupId);
  if (group) {
    group.classList.add("has-error");
    const errorMsg = group.querySelector(".error-message");
    if (errorMsg) {
      errorMsg.style.display = "flex";
    }
  }
}

function clearValidationErrors() {
  const errorGroups = document.querySelectorAll(".field-group");
  errorGroups.forEach(group => {
    group.classList.remove("has-error");
    const errorMsg = group.querySelector(".error-message");
    if (errorMsg) {
      errorMsg.style.display = "none";
    }
  });
}


// ================== HELPER FUNCTIONS ==================

// Toast Helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "";
  if (type === "success") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 5 12"/></svg>`;
  } else if (type === "danger") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`;
  } else if (type === "warning") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
  }

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function showHelpInfo() {
  showToast("Help Info: Weekend collection service requires a Weekend Waiver toggle activation.", "info");
}
