// ==================== GLOBAL APP STATE ====================
const state = {
  currentStep: 0,
  selectedStartDate: null,
  servicePlannerDates: [],
  tempSelectedDates: [],
  plannerCurrentMonthOffset: 0,
  plannerBaseDate: null,
  postcodeDb: {
    'SW1A 1AA': {
      address1: 'Buckingham Palace',
      address2: 'London',
      address3: 'Westminster',
      town: 'London'
    },
    'EC1A 1BB': {
      address1: '100 Newgate Street',
      address2: 'London',
      address3: 'City of London',
      town: 'London'
    },
    'M1 1AE': {
      address1: '111 Piccadilly',
      address2: 'Manchester',
      address3: 'Greater Manchester',
      town: 'Manchester'
    },
    'B1 1BB': {
      address1: '1 Victoria Square',
      address2: 'Birmingham',
      address3: 'West Midlands',
      town: 'Birmingham'
    },
    'EH1 1YT': {
      address1: 'Edinburgh Castle',
      address2: 'Edinburgh',
      address3: 'Midlothian',
      town: 'Edinburgh'
    }
  }
};

// ==================== APPLICATION INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  initCalendar();
});

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
  // Step 0: "New CARF" button triggers navigation to Step 1
  document.getElementById('btn-new-carf').addEventListener('click', () => {
    goToStep(1);
  });

  // Step 1: "Add Site" button
  document.getElementById('btn-add-site').addEventListener('click', () => {
    validateAndGoToStep2();
  });

  // Step 2: "Save Changes" button
  document.getElementById('btn-save-site-details').addEventListener('click', () => {
    validateAndGoToStep3();
  });

  // Step 3: "Submit" button
  document.getElementById('btn-submit-schedule').addEventListener('click', () => {
    validateAndGoToStep4();
  });

  // Step 4: "Finalize & Submit CARF" button
  document.getElementById('btn-finalize-carf').addEventListener('click', () => {
    finalizeCARF();
  });

  // Step 4 Success Close
  document.getElementById('btn-success-close').addEventListener('click', () => {
    resetAllForms();
    goToStep(0);
  });

  // Postcode Address Lookup
  document.getElementById('btn-postcode-lookup').addEventListener('click', performPostcodeLookup);

  // G4S Service Details conditional visibility triggers
  document.getElementById('s2-col-service-type').addEventListener('change', checkBankingDetailsVisibility);
  document.getElementById('s2-del-service-options').addEventListener('change', () => {
    checkBankingDetailsVisibility();
    checkDeliveryLimitVisibility();
  });
  
  // Service Planner Dropdown trigger
  document.getElementById('s2-col-frequency').addEventListener('change', (e) => {
    if (e.target.value === 'Service planner') {
      openPlannerModal();
    } else {
      state.servicePlannerDates = [];
    }
  });

  // Service Planner Navigation and Actions
  document.getElementById('planner-prev-month').addEventListener('click', () => {
    if (state.plannerCurrentMonthOffset > 0) {
      state.plannerCurrentMonthOffset--;
      renderPlannerCalendar();
    }
  });
  document.getElementById('planner-next-month').addEventListener('click', () => {
    if (state.plannerCurrentMonthOffset < 11) {
      state.plannerCurrentMonthOffset++;
      renderPlannerCalendar();
    }
  });
  document.getElementById('btn-clear-planner-dates').addEventListener('click', () => {
    state.tempSelectedDates = [];
    renderPlannerCalendar();
  });
  document.getElementById('btn-close-planner').addEventListener('click', cancelPlannerSelection);
  document.getElementById('btn-cancel-planner').addEventListener('click', cancelPlannerSelection);
  document.getElementById('btn-confirm-planner').addEventListener('click', confirmPlannerSelection);
  
  // Back button on summary page (Step 4)
  document.getElementById('btn-back-from-summary').addEventListener('click', () => {
    const colFreq = document.getElementById('s2-col-frequency').value;
    if (colFreq === 'Service planner') {
      goToStep(2);
    } else {
      goToStep(3);
    }
  });

  // Delivery Frequency button selectors (Step 3)
  const freqButtons = document.querySelectorAll('#del-frequency-group .freq-option-btn');
  freqButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      freqButtons.forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      const val = e.target.getAttribute('data-value');
      document.getElementById('selected-delivery-frequency').value = val;
      e.target.classList.remove('input-error');
    });
  });

  // Validation Error Modal OK Button
  document.getElementById('btn-validation-ok').addEventListener('click', () => {
    closeModal('validation-error-modal');
  });

  // Calendar Dialog Close
  document.getElementById('btn-close-calendar').addEventListener('click', () => {
    closeModal('calendar-modal');
  });

  // Input listeners to clear error styles dynamically on user input
  const allInputs = document.querySelectorAll('.form-control-input, .form-control-select, #agree-tc');
  allInputs.forEach(input => {
    const clearError = () => {
      input.classList.remove('input-error');
      if (input.type === 'checkbox') {
        input.parentElement.classList.remove('input-error');
      }
    };
    input.addEventListener('input', clearError);
    input.addEventListener('change', clearError);
  });

  // Review & Approve panel controls
  document.getElementById('btn-close-review-panel').addEventListener('click', closeReviewPanel);
  document.getElementById('review-panel-overlay-bg').addEventListener('click', closeReviewPanel);
  document.getElementById('btn-review-show-more').addEventListener('click', showMoreReviewDetails);
  document.getElementById('btn-back-to-review-panel').addEventListener('click', returnToReviewPanel);
  document.getElementById('btn-approve-review').addEventListener('click', () => submitReviewDecision('Completed'));
  document.getElementById('btn-reject-review').addEventListener('click', () => submitReviewDecision('Rejected'));

  attachReviewButtonListeners();
}

// ==================== WIZARD STEP NAVIGATION ====================
function goToStep(stepIndex) {
  state.currentStep = stepIndex;
  
  // Hide all steps
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(step => step.classList.remove('active'));

  // Show selected step
  const activeStep = document.getElementById(`step-${stepIndex}`);
  if (activeStep) {
    activeStep.classList.add('active');
  }

  // Auto scroll content area to top on transition
  document.querySelector('.content-area').scrollTop = 0;

  // Show Toast indicating navigation
  if (stepIndex > 0) {
    showToast(`Navigated to Step ${stepIndex}`, 'info');
  }
}

// ==================== HELP DIALOG ====================
function showHelpInfo() {
  showToast('G4S CARF Assistance Portal. Complete each mandatory field highlighted with *.', 'info');
}

// ==================== CUSTOM CALENDAR WIDGET (STEP 1) ====================
function initCalendar() {
  const dateInput = document.getElementById('step1-start-date');
  const triggerBtn = document.getElementById('btn-calendar-trigger');

  const openCalendar = () => {
    generateCalendarGrid();
    openModal('calendar-modal');
  };

  dateInput.addEventListener('click', openCalendar);
  triggerBtn.addEventListener('click', openCalendar);
}

function calculateMinSelectableDate(today) {
  let count = 0;
  let resultDate = new Date(today);
  
  while (count < 10) {
    resultDate.setDate(resultDate.getDate() + 1);
    const dayOfWeek = resultDate.getDay();
    // Exclude weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return resultDate;
}

function generateCalendarGrid() {
  const container = document.getElementById('calendar-days-container');
  container.innerHTML = '';

  // Base date of mock context: July 9, 2026
  const currentYear = 2026;
  const currentMonth = 6; // July (0-indexed)
  
  // Calculate first selectable day (10 working days from July 9, 2026)
  const todayMock = new Date(2026, 6, 9);
  const minSelectableDate = calculateMinSelectableDate(todayMock);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const totalDays = lastDay.getDate();

  // Generate blank calendar slots for preceding month offsets
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('cal-day', 'empty');
    container.appendChild(emptyCell);
  }

  // Generate days of July 2026
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('cal-day');
    dayCell.innerText = dayNum;

    const cellDate = new Date(currentYear, currentMonth, dayNum);

    // Disable if date is prior to 10 working days (minSelectableDate)
    if (cellDate < minSelectableDate) {
      dayCell.classList.add('disabled');
    } else {
      dayCell.addEventListener('click', () => {
        selectDate(cellDate, dayNum);
      });
      
      if (state.selectedStartDate && 
          state.selectedStartDate.getDate() === dayNum && 
          state.selectedStartDate.getMonth() === currentMonth) {
        dayCell.classList.add('selected');
      }
    }

    container.appendChild(dayCell);
  }
}

function selectDate(date, dayNum) {
  state.selectedStartDate = date;
  
  // Format date as DD/MM/YYYY
  const dayStr = String(dayNum).padStart(2, '0');
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const formatted = `${dayStr}/${monthStr}/${date.getFullYear()}`;
  
  const dateInput = document.getElementById('step1-start-date');
  dateInput.value = formatted;
  dateInput.classList.remove('input-error');

  closeModal('calendar-modal');
  showToast(`Selected Start Date: ${formatted}`, 'success');
}

// ==================== ACCORDION CONTROLS (STEP 2) ====================
function toggleAccordion(id) {
  const card = document.getElementById(id);
  const isCollapsed = card.classList.contains('collapsed');
  const indicator = card.querySelector('.accordion-indicator');

  if (isCollapsed) {
    card.classList.remove('collapsed');
    indicator.innerText = '−';
  } else {
    card.classList.add('collapsed');
    indicator.innerText = '+';
  }
}

// ==================== POSTCODE LOOKUP (STEP 2) ====================
function performPostcodeLookup() {
  const postcodeField = document.getElementById('s2-postcode');
  const postcode = postcodeField.value.trim().toUpperCase();

  if (!postcode) {
    postcodeField.classList.add('input-error');
    showToast('Please enter a postcode before searching.', 'danger');
    return;
  }

  // Show loading indicator
  const loading = document.getElementById('address-lookup-loading');
  loading.classList.add('active');

  setTimeout(() => {
    loading.classList.remove('active');
    postcodeField.classList.remove('input-error');

    const address = state.postcodeDb[postcode];
    if (address) {
      document.getElementById('s2-address1').value = address.address1;
      document.getElementById('s2-address2').value = address.address2;
      document.getElementById('s2-address3').value = address.address3;
      document.getElementById('s2-town').value = address.town;

      // Clear any validation errors on populated fields
      ['s2-address1', 's2-town'].forEach(id => {
        document.getElementById(id).classList.remove('input-error');
      });

      showToast('Address lookup successful!', 'success');
    } else {
      // Default fallback address
      document.getElementById('s2-address1').value = '45 Servicing Road';
      document.getElementById('s2-address2').value = 'Industrial Estate';
      document.getElementById('s2-address3').value = 'Central District';
      document.getElementById('s2-town').value = 'London';

      ['s2-address1', 's2-town'].forEach(id => {
        document.getElementById(id).classList.remove('input-error');
      });

      showToast('Postcode not found in mock DB. Autofilled generic address.', 'info');
    }
  }, 800);
}

// ==================== CONDITIONAL VISIBILITY CONTROLS (STEP 2) ====================
function checkBankingDetailsVisibility() {
  const collectionType = document.getElementById('s2-col-service-type').value;
  const deliveryType = document.getElementById('s2-del-service-options').value;
  const bankingSection = document.getElementById('acc-banking-details');

  const shouldBeVisible = (collectionType === 'G4S Cash Processing' || deliveryType === 'G4S Bulk Cash');

  if (shouldBeVisible) {
    bankingSection.style.display = 'block';
  } else {
    bankingSection.style.display = 'none';
    clearAllBankingInputs();
  }
}

function clearAllBankingInputs() {
  clearBankingFields('collection');
  clearBankingFields('delivery');
  clearBankingFields('payment');
}

function clearBankingFields(prefix) {
  const fields = ['institution', 'account', 'sortcode', 'name', 'address'];
  fields.forEach(f => {
    const el = document.getElementById(`bank-${prefix}-${f}`);
    if (el) {
      el.value = '';
      el.classList.remove('input-error');
    }
  });
  showToast(`Cleared ${prefix} banking fields.`, 'info');
}

// ==================== SYNC STEP 1 TO STEP 2 READ-ONLY ====================
// (Removed as Service Type is now chosen in Step 2)

// ==================== VALIDATIONS & ERROR POPUPS ====================

// --- STEP 1 VALIDATION ---
function validateAndGoToStep2() {
  const missingFields = [];
  const invalidFields = [];

  const customer = document.getElementById('step1-customer');
  const contract = document.getElementById('step1-contract');
  const startDate = document.getElementById('step1-start-date');

  if (!customer.value) {
    missingFields.push('Customer Selection');
    invalidFields.push(customer);
  }
  if (!contract.value.trim()) {
    missingFields.push('Contract Reference');
    invalidFields.push(contract);
  }
  if (!startDate.value) {
    missingFields.push('Services Start Date');
    invalidFields.push(startDate);
  }

  if (missingFields.length > 0) {
    triggerValidationErrorPopup(missingFields, invalidFields);
  } else {
    goToStep(2);
  }
}

// --- STEP 2 VALIDATION ---
function validateAndGoToStep3() {
  const missingFields = [];
  const invalidFields = [];

  // Core Site Details
  const siteName = document.getElementById('s2-site-name');
  const siteRef = document.getElementById('s2-site-ref');
  const tradingName = document.getElementById('s2-trading-name');
  
  if (!siteName.value.trim()) { missingFields.push('Site Name'); invalidFields.push(siteName); }
  if (!siteRef.value.trim()) { missingFields.push('Site Reference'); invalidFields.push(siteRef); }
  if (!tradingName.value.trim()) { missingFields.push('Trading Name Above The Door'); invalidFields.push(tradingName); }

  // Location Details
  const postcode = document.getElementById('s2-postcode');
  const address1 = document.getElementById('s2-address1');
  const town = document.getElementById('s2-town');

  if (!postcode.value.trim()) { missingFields.push('Postcode'); invalidFields.push(postcode); }
  if (!address1.value.trim()) { missingFields.push('Address Line 1'); invalidFields.push(address1); }
  if (!town.value.trim()) { missingFields.push('Town'); invalidFields.push(town); }

  // Contacts
  const contactName = document.getElementById('s2-contact-name');
  const contactEmail = document.getElementById('s2-contact-email');
  const contactPhone = document.getElementById('s2-contact-phone');

  if (!contactName.value.trim()) { missingFields.push('Site Contact Name'); invalidFields.push(contactName); }
  
  const emailVal = contactEmail.value.trim();
  if (!emailVal) {
    missingFields.push('Site Contact Email');
    invalidFields.push(contactEmail);
  } else if (!emailVal.includes('@')) {
    missingFields.push('Valid Site Contact Email (must contain @)');
    invalidFields.push(contactEmail);
  }

  if (!contactPhone.value.trim()) { missingFields.push('Site Telephone'); invalidFields.push(contactPhone); }

  // Operational
  const timeWindow = document.getElementById('s2-time-window');
  if (!timeWindow.value) { missingFields.push('Logistics Time Window'); invalidFields.push(timeWindow); }

  // Services
  const serviceType = document.getElementById('s2-service-type');
  const deliveryLimit = document.getElementById('s2-delivery-limit');
  const colFrequency = document.getElementById('s2-col-frequency');
  const colServiceType = document.getElementById('s2-col-service-type');
  const delFrequency = document.getElementById('s2-del-frequency');
  const delServiceOptions = document.getElementById('s2-del-service-options');

  if (!serviceType.value) { missingFields.push('Service Type'); invalidFields.push(serviceType); }
  
  // Conditional validation of Delivery Limit (Only if G4S Bulk Cash is selected)
  if (delServiceOptions.value === 'G4S Bulk Cash') {
    if (!deliveryLimit.value.trim()) { 
      missingFields.push('Bulk Cash Delivery Limit'); 
      invalidFields.push(deliveryLimit); 
    }
  }
  
  if (!colFrequency.value) { missingFields.push('Collection Frequency'); invalidFields.push(colFrequency); }
  if (!colServiceType.value) { missingFields.push('Collection Service Type'); invalidFields.push(colServiceType); }
  if (!delFrequency.value) { missingFields.push('Delivery Frequency'); invalidFields.push(delFrequency); }
  if (!delServiceOptions.value) { missingFields.push('Delivery Service Options'); invalidFields.push(delServiceOptions); }

  // Service Planner Multi-Select Date validation
  if (colFrequency.value === 'Service planner') {
    if (state.servicePlannerDates.length === 0) {
      missingFields.push('At least one selected date in Service Planner');
      invalidFields.push(colFrequency);
    }
  }

  // Banking Details (Only validate if panel is visible!)
  const bankingSection = document.getElementById('acc-banking-details');
  if (bankingSection.style.display === 'block') {
    const bankingPrefixes = ['col', 'del', 'pay'];
    const bankingGroupNames = ['Collection', 'Delivery', 'Payment'];

    bankingPrefixes.forEach((prefix, i) => {
      const gName = bankingGroupNames[i];
      const inst = document.getElementById(`bank-${prefix}-institution`);
      const acc = document.getElementById(`bank-${prefix}-account`);
      const sort = document.getElementById(`bank-${prefix}-sortcode`);
      const name = document.getElementById(`bank-${prefix}-name`);
      const addr = document.getElementById(`bank-${prefix}-address`);

      if (!inst.value) { missingFields.push(`${gName} Financial Institution`); invalidFields.push(inst); }
      
      const accVal = acc.value.trim();
      if (!accVal) {
        missingFields.push(`${gName} Bank Account Number`);
        invalidFields.push(acc);
      } else if (accVal.length !== 8 || isNaN(accVal)) {
        missingFields.push(`${gName} Bank Account Number (must be exactly 8 digits)`);
        invalidFields.push(acc);
      }

      if (!sort.value.trim()) { missingFields.push(`${gName} Bank Sort Code`); invalidFields.push(sort); }
      if (!name.value.trim()) { missingFields.push(`${gName} Bank Account Name`); invalidFields.push(name); }
      if (!addr.value.trim()) { missingFields.push(`${gName} Bank Holding Address`); invalidFields.push(addr); }
    });
  }

  if (missingFields.length > 0) {
    // Open any accordions that have error fields
    openAccordionsWithErrors(invalidFields);
    triggerValidationErrorPopup(missingFields, invalidFields);
  } else {
    // Skip Step 3 (weekly collection schedule) if Service planner is selected
    if (colFrequency.value === 'Service planner') {
      populateStep4Summary();
      goToStep(4);
    } else {
      goToStep(3);
    }
  }
}

function openAccordionsWithErrors(invalidFields) {
  invalidFields.forEach(field => {
    let parent = field.parentElement;
    while (parent) {
      if (parent.classList.contains('accordion-card')) {
        parent.classList.remove('collapsed');
        const indicator = parent.querySelector('.accordion-indicator');
        if (indicator) indicator.innerText = '−';
        break;
      }
      parent = parent.parentElement;
    }
  });
}

// --- STEP 3 VALIDATION ---
// (Duplicate function removed so the real validator navigates to Step 3)

function validateAndGoToStep4() {
  const missingFields = [];
  const invalidFields = [];

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  days.forEach((day, idx) => {
    const el = document.getElementById(`schedule-${day}`);
    if (!el.value) {
      missingFields.push(`${dayNames[idx]} service selection`);
      invalidFields.push(el);
    }
  });

  const selectedFreq = document.getElementById('selected-delivery-frequency').value;
  if (!selectedFreq) {
    missingFields.push('Delivery Frequency Option');
    const groupContainer = document.getElementById('del-frequency-group');
    invalidFields.push(groupContainer);
    // Add input error style to all option buttons
    document.querySelectorAll('#del-frequency-group .freq-option-btn').forEach(btn => {
      btn.classList.add('input-error');
    });
  }

  if (missingFields.length > 0) {
    triggerValidationErrorPopup(missingFields, invalidFields);
  } else {
    populateStep4Summary();
    goToStep(4);
  }
}

// --- POPULATE SUMMARY PAGE (STEP 4) ---
function populateStep4Summary() {
  // Site Overview & Address
  document.getElementById('sum-site-name').innerText = document.getElementById('s2-site-name').value;
  document.getElementById('sum-site-ref').innerText = document.getElementById('s2-site-ref').value;
  document.getElementById('sum-trading-name').innerText = document.getElementById('s2-trading-name').value;

  const addr1 = document.getElementById('s2-address1').value;
  const addr2 = document.getElementById('s2-address2').value.trim();
  const addr3 = document.getElementById('s2-address3').value.trim();
  const town = document.getElementById('s2-town').value;
  const postcode = document.getElementById('s2-postcode').value.toUpperCase();

  let combined = addr1;
  if (addr2) combined += `, ${addr2}`;
  if (addr3) combined += `, ${addr3}`;
  combined += `, ${town} ${postcode}`;
  document.getElementById('sum-full-address').innerText = combined;

  // Logistics & Operations
  document.getElementById('sum-time-window').innerText = document.getElementById('s2-time-window').value;
  document.getElementById('sum-servicing-branch').innerText = document.getElementById('s2-servicing-branch').value;
  document.getElementById('sum-holding-required').innerText = document.getElementById('s2-holding-required').checked ? 'Yes' : 'No';
  document.getElementById('sum-service-type').innerText = document.getElementById('s2-service-type').value;
  document.getElementById('sum-delivery-limit').innerText = '£' + parseFloat(document.getElementById('s2-delivery-limit').value || 0).toLocaleString('en-GB', {minimumFractionDigits: 2});
  // Set start date (handle service planner first date)
  const isPlanner = (document.getElementById('s2-col-frequency').value === 'Service planner');
  if (isPlanner && state.servicePlannerDates.length > 0) {
    const firstDateStr = state.servicePlannerDates[0];
    const parts = firstDateStr.split('-');
    document.getElementById('sum-start-date').innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
  } else {
    document.getElementById('sum-start-date').innerText = document.getElementById('step1-start-date').value;
  }

  // Hide weekly Monday-Sunday collection calendar strip if using Service Planner
  const sumWeeklySection = document.getElementById('sum-weekly-schedule-section');
  if (isPlanner) {
    sumWeeklySection.style.display = 'none';
  } else {
    sumWeeklySection.style.display = 'block';
    
    // Collection Days
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    days.forEach(day => {
      const val = document.getElementById(`schedule-${day}`).value;
      const bubble = document.getElementById(`sum-day-${day}`);
      const valEl = bubble.querySelector('.day-val');
      valEl.innerText = val === 'No Service' ? 'None' : val.replace('Collection up to ', '');
      
      if (val === 'No Service') {
        bubble.style.backgroundColor = '#f1f5f9';
        bubble.style.borderColor = '#cbd5e1';
        bubble.style.opacity = '0.6';
      } else {
        bubble.style.backgroundColor = 'var(--g4s-red-light)';
        bubble.style.borderColor = 'var(--g4s-red)';
        bubble.style.opacity = '1';
      }
    });
  }

  document.getElementById('sum-col-frequency').innerText = document.getElementById('s2-col-frequency').value;
  document.getElementById('sum-col-service-type').innerText = document.getElementById('s2-col-service-type').value;
  document.getElementById('sum-del-frequency').innerText = document.getElementById('selected-delivery-frequency').value;

  // Service Planner Dates Summary
  const isPlanner = (document.getElementById('s2-col-frequency').value === 'Service planner');
  const sumPlannerDivider = document.getElementById('sum-planner-divider');
  const sumPlannerSection = document.getElementById('sum-planner-section');
  const sumPlannerList = document.getElementById('sum-planner-dates-list');

  if (isPlanner) {
    sumPlannerDivider.style.display = 'block';
    sumPlannerSection.style.display = 'block';
    sumPlannerList.innerHTML = '';
    
    state.servicePlannerDates.forEach(dateStr => {
      const badge = document.createElement('span');
      badge.style.cssText = 'background-color: var(--color-success-light); border: 1px solid var(--color-success); color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: inline-block;';
      
      const parts = dateStr.split('-');
      badge.innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
      sumPlannerList.appendChild(badge);
    });
  } else {
    sumPlannerDivider.style.display = 'none';
    sumPlannerSection.style.display = 'none';
  }

  // Banking Details
  const isBankVisible = document.getElementById('acc-banking-details').style.display === 'block';
  const sumBankDivider = document.getElementById('sum-bank-divider');
  const sumBankSection = document.getElementById('sum-bank-section');

  if (isBankVisible) {
    sumBankDivider.style.display = 'block';
    sumBankSection.style.display = 'block';

    document.getElementById('sum-bank-col-inst').innerText = document.getElementById('bank-col-institution').value;
    document.getElementById('sum-bank-col-acc').innerText = document.getElementById('bank-col-account').value;
    document.getElementById('sum-bank-col-sort').innerText = document.getElementById('bank-col-sortcode').value;

    document.getElementById('sum-bank-del-inst').innerText = document.getElementById('bank-del-institution').value;
    document.getElementById('sum-bank-del-acc').innerText = document.getElementById('bank-del-account').value;
    document.getElementById('sum-bank-del-sort').innerText = document.getElementById('bank-del-sortcode').value;

    document.getElementById('sum-bank-pay-inst').innerText = document.getElementById('bank-pay-institution').value;
    document.getElementById('sum-bank-pay-acc').innerText = document.getElementById('bank-pay-account').value;
    document.getElementById('sum-bank-pay-sort').innerText = document.getElementById('bank-pay-sortcode').value;
  } else {
    sumBankDivider.style.display = 'none';
    sumBankSection.style.display = 'none';
  }
}

// --- STEP 4 FINALIZATION ---
function finalizeCARF() {
  const agreeCheck = document.getElementById('agree-tc');
  if (!agreeCheck.checked) {
    agreeCheck.parentElement.classList.add('input-error');
    triggerValidationErrorPopup(['Terms and Conditions Agreement'], [agreeCheck]);
    return;
  }

  // Populate Success Modal Fields
  const contractRef = document.getElementById('step1-contract').value || '40001003';
  document.getElementById('success-contract-ref').innerText = contractRef;
  document.getElementById('success-site-name').innerText = document.getElementById('s2-site-name').value;
  document.getElementById('success-customer').innerText = document.getElementById('step1-customer').value;
  document.getElementById('success-postcode').innerText = document.getElementById('s2-postcode').value.toUpperCase();
  
  // Set success start date (handle service planner custom date if active)
  const isPlanner = (document.getElementById('s2-col-frequency').value === 'Service planner');
  if (isPlanner && state.servicePlannerDates.length > 0) {
    const firstDateStr = state.servicePlannerDates[0];
    const parts = firstDateStr.split('-');
    document.getElementById('success-start-date').innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
  } else {
    document.getElementById('success-start-date').innerText = document.getElementById('step1-start-date').value;
  }

  // Dynamic insertion to Overview table
  addSubmittedCarfToTable();

  openModal('success-submit-modal');
  showToast('CARF Amendment Saved successfully!', 'success');
}

// --- POPUP WINDOW TRIGGERS & HIGHLIGHTS ---
function triggerValidationErrorPopup(missingFieldLabels, invalidElements) {
  const list = document.getElementById('error-missing-fields-list');
  list.innerHTML = '';

  missingFieldLabels.forEach(lbl => {
    const li = document.createElement('li');
    li.innerText = lbl;
    list.appendChild(li);
  });

  openModal('validation-error-modal');
  
  // Highlight elements in red (on modal closed/OK clicked)
  const okBtn = document.getElementById('btn-validation-ok');
  
  const applyHighlights = () => {
    invalidElements.forEach(el => {
      if (el.id === 'del-frequency-group') {
        document.querySelectorAll('#del-frequency-group .freq-option-btn').forEach(btn => {
          btn.classList.add('input-error');
        });
      } else if (el.id === 'agree-tc') {
        el.parentElement.classList.add('input-error');
      } else {
        el.classList.add('input-error');
      }
    });
    okBtn.removeEventListener('click', applyHighlights);
  };

  okBtn.addEventListener('click', applyHighlights);
  showToast(`Form validation failed: ${missingFieldLabels.length} errors found.`, 'danger');
}

// ==================== MODAL UTILITIES ====================
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ==================== MOCK TOAST NOTIFIER ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '❌';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Automatically remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// ==================== RESET ALL FORMS ====================
function resetAllForms() {
  // Clear step 1 input fields
  document.getElementById('step1-customer').value = '';
  document.getElementById('step1-contract').value = '40001003';
  document.getElementById('step1-start-date').value = '';
  state.selectedStartDate = null;

  // Clear step 2 inputs
  document.getElementById('s2-site-name').value = '';
  document.getElementById('s2-site-ref').value = '';
  document.getElementById('s2-trading-name').value = '';
  document.getElementById('s2-postcode').value = '';
  document.getElementById('s2-address1').value = '';
  document.getElementById('s2-address2').value = '';
  document.getElementById('s2-address3').value = '';
  document.getElementById('s2-town').value = '';
  document.getElementById('s2-additional-info').value = '';
  document.getElementById('s2-contact-name').value = '';
  document.getElementById('s2-contact-email').value = '';
  document.getElementById('s2-contact-phone').value = '';
  document.getElementById('s2-time-window').value = '';
  document.getElementById('s2-holding-required').checked = false;
  document.getElementById('s2-delivery-limit').value = '0.00';
  document.getElementById('s2-col-frequency').value = '';
  document.getElementById('s2-col-service-type').value = '';
  document.getElementById('s2-del-frequency').value = '';
  document.getElementById('s2-del-service-options').value = '';
  
  // Clear step 3 inputs
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  days.forEach(day => {
    document.getElementById(`schedule-${day}`).value = '';
  });
  document.getElementById('selected-delivery-frequency').value = '';
  document.querySelectorAll('#del-frequency-group .freq-option-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.classList.remove('input-error');
  });

  // Clear step 4
  document.getElementById('agree-tc').checked = false;

  // Clear all error boundary highlighting classes
  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });

  // Reset Service Planner dates
  state.servicePlannerDates = [];
  state.tempSelectedDates = [];
  
  // Hide Delivery Limit input group by default
  document.getElementById('group-delivery-limit').style.display = 'none';

  // Hide banking accordion section
  const bankingSection = document.getElementById('acc-banking-details');
  bankingSection.style.display = 'none';
  clearAllBankingInputs();
}

// ==================== SERVICE PLANNER & DELIVERY OPTIONS LOGIC ====================
function checkDeliveryLimitVisibility() {
  const delType = document.getElementById('s2-del-service-options').value;
  const limitGroup = document.getElementById('group-delivery-limit');
  if (delType === 'G4S Bulk Cash') {
    limitGroup.style.display = 'block';
  } else {
    limitGroup.style.display = 'none';
    document.getElementById('s2-delivery-limit').value = '0.00';
    document.getElementById('s2-delivery-limit').classList.remove('input-error');
  }
}

function openPlannerModal() {
  const startDateInput = document.getElementById('step1-start-date').value;
  let baseDate = new Date(2026, 6, 9); // Fallback mock current time July 9, 2026
  
  if (startDateInput) {
    const parts = startDateInput.split('/');
    baseDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  
  state.plannerBaseDate = baseDate;
  state.plannerCurrentMonthOffset = 0;
  state.tempSelectedDates = [...state.servicePlannerDates];
  
  renderPlannerCalendar();
  openModal('service-planner-modal');
}

function renderPlannerCalendar() {
  const container = document.getElementById('planner-days-container');
  container.innerHTML = '';
  
  // Calculate displayed month and year
  const displayDate = new Date(state.plannerBaseDate.getFullYear(), state.plannerBaseDate.getMonth() + state.plannerCurrentMonthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  
  // Month Label
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('planner-current-month-label').innerText = `${monthNames[displayMonth]} ${displayYear}`;
  
  // Prev/Next month button states
  document.getElementById('planner-prev-month').disabled = (state.plannerCurrentMonthOffset === 0);
  document.getElementById('planner-next-month').disabled = (state.plannerCurrentMonthOffset === 11);
  
  // First day of month and total days in month
  const firstDay = new Date(displayYear, displayMonth, 1);
  const lastDay = new Date(displayYear, displayMonth + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const totalDays = lastDay.getDate();
  
  // Empty offset cells
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('cal-day', 'empty');
    container.appendChild(emptyCell);
  }
  
  // Render days
  const minDate = new Date(state.plannerBaseDate);
  const maxDate = new Date(state.plannerBaseDate.getFullYear() + 1, state.plannerBaseDate.getMonth(), state.plannerBaseDate.getDate());
  
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const cellDate = new Date(displayYear, displayMonth, dayNum);
    const dayCell = document.createElement('div');
    dayCell.classList.add('cal-day');
    dayCell.innerText = dayNum;
    
    // Format cell date string: YYYY-MM-DD
    const yyyy = cellDate.getFullYear();
    const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
    const dd = String(cellDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const dayOfWeek = cellDate.getDay();
    
    // Exclude weekends (Sat = 6, Sun = 0) and outside 1 year range
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isOutOfRange = (cellDate < minDate || cellDate > maxDate);
    
    if (isWeekend || isOutOfRange) {
      dayCell.classList.add('disabled');
      if (isWeekend) {
        dayCell.style.color = '#ef4444';
      }
    } else {
      if (state.tempSelectedDates.includes(dateStr)) {
        dayCell.classList.add('selected');
        dayCell.style.backgroundColor = 'var(--color-success)';
        dayCell.style.color = 'white';
      }
      
      dayCell.addEventListener('click', () => {
        plannerToggleDate(dateStr);
        renderPlannerCalendar();
      });
    }
    container.appendChild(dayCell);
  }
  
  plannerUpdateSelectedUI();
}

function plannerToggleDate(dateStr) {
  const index = state.tempSelectedDates.indexOf(dateStr);
  if (index === -1) {
    state.tempSelectedDates.push(dateStr);
  } else {
    state.tempSelectedDates.splice(index, 1);
  }
}

function plannerUpdateSelectedUI() {
  const countEl = document.getElementById('planner-selected-count');
  const listEl = document.getElementById('planner-selected-list');
  
  countEl.innerText = state.tempSelectedDates.length;
  listEl.innerHTML = '';
  
  if (state.tempSelectedDates.length === 0) {
    listEl.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">No dates selected yet. Click weekdays to select.</span>';
    return;
  }
  
  const sorted = [...state.tempSelectedDates].sort((a, b) => new Date(a) - new Date(b));
  
  sorted.forEach(dateStr => {
    const badge = document.createElement('span');
    badge.style.cssText = 'background-color: #f1f5f9; border: 1px solid #cbd5e1; color: var(--text-main); padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px;';
    
    const parts = dateStr.split('-');
    badge.innerText = `${parts[2]}/${parts[1]}`;
    
    const removeBtn = document.createElement('span');
    removeBtn.innerText = '×';
    removeBtn.style.cssText = 'cursor: pointer; color: var(--color-danger); font-weight: 700; font-size: 0.8rem;';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      plannerToggleDate(dateStr);
      renderPlannerCalendar();
    });
    
    badge.appendChild(removeBtn);
    listEl.appendChild(badge);
  });
}

function confirmPlannerSelection() {
  if (state.tempSelectedDates.length === 0) {
    showToast('Please select at least one service date or cancel.', 'danger');
    return;
  }
  
  state.servicePlannerDates = [...state.tempSelectedDates];
  state.servicePlannerDates.sort((a, b) => new Date(a) - new Date(b));
  
  document.getElementById('s2-col-frequency').classList.remove('input-error');
  closeModal('service-planner-modal');
  showToast(`Planner confirmed with ${state.servicePlannerDates.length} service dates.`, 'success');
}

function cancelPlannerSelection() {
  closeModal('service-planner-modal');
  
  if (state.servicePlannerDates.length === 0) {
    document.getElementById('s2-col-frequency').value = '';
    showToast('Service planner cancelled. Collection Frequency reset.', 'info');
  } else {
    showToast('Planner cancelled. Restored previous date selections.', 'info');
  }
}

// ==================== REVIEW & APPROVE LOGIC ====================
function attachReviewButtonListeners() {
  document.querySelectorAll('.btn-review-approve').forEach(btn => {
    btn.removeEventListener('click', openReviewPanelHandler);
    btn.addEventListener('click', openReviewPanelHandler);
  });
}

function openReviewPanelHandler(e) {
  const btn = e.currentTarget;
  const carfId = btn.getAttribute('data-id');
  const client = btn.getAttribute('data-client');
  const site = btn.getAttribute('data-site');
  const ticket = btn.getAttribute('data-ticket');
  const reason = btn.getAttribute('data-reason');
  const currentCol = btn.getAttribute('data-current-col');
  const currentDel = btn.getAttribute('data-current-del');
  const newCol = btn.getAttribute('data-new-col');
  const newDel = btn.getAttribute('data-new-del');
  
  state.reviewingCarfId = carfId;
  state.reviewingBtn = btn;
  
  document.getElementById('review-panel-title').innerText = `Review CARF Request: CARF-${carfId}`;
  document.getElementById('review-account-name').innerText = client;
  document.getElementById('review-site-name').innerText = site;
  document.getElementById('review-ticket-number').innerText = ticket;
  document.getElementById('review-request-reason').innerText = reason;
  
  document.getElementById('review-current-services').innerHTML = `• Collection: ${currentCol}<br>• Delivery: ${currentDel}`;
  document.getElementById('review-new-services').innerHTML = `• Collection: ${newCol}<br>• Delivery: ${newDel}`;
  
  document.getElementById('review-price-input').value = '';
  document.getElementById('review-price-input').classList.remove('input-error');
  
  document.getElementById('review-approve-panel').classList.add('active');
}

function closeReviewPanel() {
  document.getElementById('review-approve-panel').classList.remove('active');
  state.isReviewingMode = false;
  toggleReviewerModeOnStep4(false);
}

function showMoreReviewDetails() {
  const carfId = state.reviewingCarfId;
  
  if (carfId === '03883411') {
    // Mock details matching Site Closure
    document.getElementById('sum-site-name').innerText = 'TechCorp Headquarters';
    document.getElementById('sum-site-ref').innerText = 'REF-990812';
    document.getElementById('sum-trading-name').innerText = 'TechCorp UK HQ';
    document.getElementById('sum-full-address').innerText = '100 Newgate Street, London, City of London, EC1A 1BB';
    document.getElementById('sum-time-window').innerText = '08:00 - 17:00';
    document.getElementById('sum-servicing-branch').innerText = 'London Central Branch';
    document.getElementById('sum-holding-required').innerText = 'Yes';
    document.getElementById('sum-service-type').innerText = 'Site Closure';
    document.getElementById('sum-col-frequency').innerText = 'None';
    document.getElementById('sum-col-service-type').innerText = 'None';
    document.getElementById('sum-del-frequency').innerText = 'None';
    document.getElementById('sum-start-date').innerText = '12/13/2024';
    
    document.getElementById('sum-weekly-schedule-section').style.display = 'none';
    document.getElementById('sum-planner-section').style.display = 'none';
    document.getElementById('sum-planner-divider').style.display = 'none';
    document.getElementById('sum-bank-divider').style.display = 'none';
    document.getElementById('sum-bank-section').style.display = 'none';
  } else {
    // Normal dynamic submitted data view
    populateStep4Summary();
  }
  
  document.getElementById('review-approve-panel').classList.remove('active');
  
  state.isReviewingMode = true;
  toggleReviewerModeOnStep4(true);
  
  goToStep(4);
}

function returnToReviewPanel() {
  state.isReviewingMode = false;
  toggleReviewerModeOnStep4(false);
  goToStep(0);
  document.getElementById('review-approve-panel').classList.add('active');
}

function toggleReviewerModeOnStep4(isReviewing) {
  const notifyBar = document.getElementById('review-notify-bar');
  const approvalCard = document.querySelector('.summary-approval-card');
  const detailsCard = document.querySelector('.summary-details-card');
  
  if (isReviewing) {
    notifyBar.style.display = 'flex';
    approvalCard.style.display = 'none';
    detailsCard.style.gridColumn = 'span 2 / -1';
  } else {
    notifyBar.style.display = 'none';
    approvalCard.style.display = 'block';
    detailsCard.style.gridColumn = '';
  }
}

function submitReviewDecision(decision) {
  const priceInput = document.getElementById('review-price-input');
  const priceVal = priceInput.value.trim();
  
  if (!priceVal) {
    priceInput.classList.add('input-error');
    showToast('Please enter the contract price (weekly fee) before submitting.', 'danger');
    return;
  }
  
  const row = state.reviewingBtn.closest('tr');
  const statusCell = row.querySelector('td:nth-child(4)');
  const actionCell = row.querySelector('td:nth-child(5)');
  
  if (decision === 'Completed') {
    statusCell.innerHTML = `<span class="status-pill status-completed">Completed</span>`;
    actionCell.innerHTML = `<span style="color: var(--color-success); font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">✔️ Approved <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">(${priceVal})</span></span>`;
    showToast(`CARF request ${state.reviewingCarfId} successfully APPROVED at ${priceVal}`, 'success');
  } else {
    statusCell.innerHTML = `<span class="status-pill" style="background-color: var(--color-danger); color: white;">Rejected</span>`;
    actionCell.innerHTML = `<span style="color: var(--color-danger); font-size: 0.8rem; font-weight: 700;">❌ Rejected</span>`;
    showToast(`CARF request ${state.reviewingCarfId} was REJECTED.`, 'warning');
  }
  
  closeReviewPanel();
}

function addSubmittedCarfToTable() {
  const tableBody = document.getElementById('overview-table-body');
  const carfId = '0388' + Math.floor(1000 + Math.random() * 9000);
  
  // Format current date
  const now = new Date();
  const dateFormatted = `${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).substring(2)}, ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  
  const clientName = document.getElementById('step1-customer').value || 'Test Customer';
  const siteName = document.getElementById('s2-site-name').value || 'New Site Location';
  const contractRef = document.getElementById('step1-contract').value || '40001003';
  const ticketNo = 'STK-' + contractRef;
  const requestReason = 'New Site provisioning and logistics setup';
  
  const collectionServiceType = document.getElementById('s2-col-service-type').value || 'None';
  const deliveryServiceOptions = document.getElementById('s2-del-service-options').value || 'None';
  
  const colFreq = document.getElementById('s2-col-frequency').value || 'None';
  const delFreq = document.getElementById('s2-del-frequency').value || 'None';
  
  const currentCol = "None (New Provisioning)";
  const currentDel = "None (New Provisioning)";
  const newCol = `${colFreq} ${collectionServiceType}`;
  const newDel = `${delFreq} ${deliveryServiceOptions}`;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${carfId}</td>
    <td>${dateFormatted}</td>
    <td>New Site Provisioning</td>
    <td><span class="status-pill status-review">Under Review</span></td>
    <td><button type="button" class="btn btn-secondary btn-xs btn-review-approve" data-id="${carfId}" data-client="${clientName}" data-site="${siteName}" data-ticket="${ticketNo}" data-reason="${requestReason}" data-current-col="${currentCol}" data-current-del="${currentDel}" data-new-col="${newCol}" data-new-del="${newDel}">Review & Approve ↗️</button></td>
  `;
  
  tableBody.insertBefore(tr, tableBody.firstChild);
  
  attachReviewButtonListeners();
}
