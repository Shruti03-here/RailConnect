/**
 * RailConnect — Frontend Application Controller
 * Modern Indian Railway Passenger Reservation System
 * Inspired by RailOne & Modern Digital Indian Railways Interfaces
 */

// ============================================================================
// Global State
// ============================================================================
let allTrains = [];
let allBookings = [];
let networkStats = {};
let currentSearchCriteria = { source: '', destination: '', date: '', travelClass: 'ALL' };
let activeLedgerFilter = 'all'; // 'all' | 'confirmed' | 'cancelled'
let activeQuickFilter = 'all';  // 'all' | 'available' | 'express'
let pendingCancelPnr = null;

// Known Station Code Map (Indian Railways Convention)
const STATION_CODES = {
  'pune': 'PUNE',
  'mumbai': 'CSMT',
  'hyderabad': 'HYB',
  'solapur': 'SUR',
  'lonavala': 'LNL',
  'delhi': 'NDLS',
  'kolkata': 'HWH',
  'chennai': 'MAS',
  'bengaluru': 'SBC',
  'ahmedabad': 'ADI',
  'nagpur': 'NGP'
};

function getStationCode(stationName) {
  if (!stationName) return 'STN';
  const clean = stationName.trim().toLowerCase();
  if (STATION_CODES[clean]) return STATION_CODES[clean];
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1].substring(0, 3)).toUpperCase();
  }
  return clean.substring(0, 4).toUpperCase();
}

// ============================================================================
// Utilities
// ============================================================================
function formatRupee(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// API Client Helper
async function apiCall(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.message || data.error || 'Request failed on server');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// SPA Router & Navigation
// ============================================================================
function navigateTo(viewId) {
  // Update view visibility
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });

  const targetSection = document.getElementById(`view-${viewId}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update navigation buttons active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  // Close mobile navigation drawer if open
  const mainNav = document.getElementById('main-nav');
  if (mainNav) mainNav.classList.remove('mobile-open');

  // View-specific initializations
  if (viewId === 'booking') {
    populateBookingTrainDropdown();
  } else if (viewId === 'search') {
    renderTrainSearchResults();
  } else if (viewId === 'bookings') {
    renderBookingsTable();
  } else if (viewId === 'admin') {
    renderAdminConsole();
  } else if (viewId === 'pnr') {
    renderQuickPnrHints();
  } else if (viewId === 'route') {
    populateRouteTrainDropdown();
  } else if (viewId === 'catering') {
    initCateringView();
  } else if (viewId === 'running-status') {
    initLiveStatusView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileNav() {
  const mainNav = document.getElementById('main-nav');
  if (mainNav) mainNav.classList.toggle('mobile-open');
}

// ============================================================================
// Data Synchronization with Backend C++ Engine
// ============================================================================
async function refreshData() {
  try {
    const [trainsRes, bookingsRes, statsRes] = await Promise.all([
      apiCall('/api/trains'),
      apiCall('/api/bookings'),
      apiCall('/api/stats')
    ]);

    allTrains = Array.isArray(trainsRes) ? trainsRes : (trainsRes.data || []);
    allBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.data || []);
    networkStats = statsRes || {};

    // Update UI components
    updateStationAutocomplete();
    populateBookingTrainDropdown();
    renderTrainSearchResults();
    renderBookingsTable();
    renderAdminConsole();
    renderQuickPnrHints();
    populateRouteTrainDropdown();
    fetchFoodOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateStationAutocomplete() {
  const stations = new Set();
  allTrains.forEach(t => {
    if (t.source) stations.add(t.source.trim());
    if (t.destination) stations.add(t.destination.trim());
  });

  const datalist = document.getElementById('stations-list');
  if (datalist) {
    datalist.innerHTML = Array.from(stations)
      .map(s => `<option value="${escapeHtml(s)}">`)
      .join('');
  }
}

// ============================================================================
// Hero Train Search Widget
// ============================================================================
function updateStationChip(inputId, chipId) {
  const input = document.getElementById(inputId);
  const chip = document.getElementById(chipId);
  if (input && chip) {
    chip.textContent = getStationCode(input.value);
  }
}

function swapStations(srcInputId, dstInputId) {
  const srcEl = document.getElementById(srcInputId);
  const dstEl = document.getElementById(dstInputId);
  if (!srcEl || !dstEl) return;

  const temp = srcEl.value;
  srcEl.value = dstEl.value;
  dstEl.value = temp;

  updateStationChip(srcInputId, 'src-code-preview');
  updateStationChip(dstInputId, 'dst-code-preview');

  srcEl.focus();
}

function setQuickDate(offsetDays) {
  const dateInput = document.getElementById('home-date');
  if (!dateInput) return;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);

  const formatted = targetDate.toISOString().split('T')[0];
  dateInput.value = formatted;

  // Update pills active state
  document.querySelectorAll('.day-pill').forEach((pill, idx) => {
    pill.classList.toggle('active', idx === offsetDays);
  });

  updateDayTag(formatted);
}

function updateDayTag(dateStr) {
  const tag = document.getElementById('quick-day-tag');
  if (!tag) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    tag.textContent = 'Today';
  } else if (dateStr === tomorrowStr) {
    tag.textContent = 'Tomorrow';
  } else {
    const d = new Date(dateStr);
    tag.textContent = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }
}

function handleHeroSearch(event) {
  event.preventDefault();
  const form = event.target;
  const source = form.source.value.trim();
  const destination = form.destination.value.trim();
  const date = form.journey_date.value;
  const travelClass = form.travel_class.value;

  if (source.toLowerCase() === destination.toLowerCase()) {
    showToast('Source and destination stations cannot be the same', 'error');
    return;
  }

  currentSearchCriteria = { source, destination, date, travelClass };
  navigateTo('search');
}

function quickSearchRoute(source, destination) {
  currentSearchCriteria = {
    source,
    destination,
    date: new Date().toISOString().split('T')[0],
    travelClass: 'ALL'
  };

  const srcEl = document.getElementById('home-src');
  const dstEl = document.getElementById('home-dst');
  if (srcEl && dstEl) {
    srcEl.value = source;
    dstEl.value = destination;
    updateStationChip('home-src', 'src-code-preview');
    updateStationChip('home-dst', 'dst-code-preview');
  }

  navigateTo('search');
}

// ============================================================================
// Train Search Results Rendering & Filtering
// ============================================================================
function setQuickFilter(type) {
  activeQuickFilter = type;

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.id === `pill-${type}`);
  });

  renderTrainSearchResults();
}

function getFilteredTrains() {
  let list = allTrains.slice();

  // Route matching from hero search criteria
  if (currentSearchCriteria.source) {
    const qSrc = currentSearchCriteria.source.toLowerCase();
    list = list.filter(t => t.source.toLowerCase().includes(qSrc));
  }
  if (currentSearchCriteria.destination) {
    const qDst = currentSearchCriteria.destination.toLowerCase();
    list = list.filter(t => t.destination.toLowerCase().includes(qDst));
  }

  // Filter input on results page
  const textQuery = (document.getElementById('train-filter-input')?.value || '').toLowerCase().trim();
  if (textQuery) {
    list = list.filter(t =>
      t.number.toLowerCase().includes(textQuery) ||
      t.name.toLowerCase().includes(textQuery) ||
      t.source.toLowerCase().includes(textQuery) ||
      t.destination.toLowerCase().includes(textQuery)
    );
  }

  // Checkbox: Available trains only
  const checkAvail = document.getElementById('check-confirmed-only');
  if (checkAvail && checkAvail.checked) {
    list = list.filter(t => Number(t.seats) > 0);
  }

  // Quick filter pills
  if (activeQuickFilter === 'available') {
    list = list.filter(t => Number(t.seats) > 0);
  } else if (activeQuickFilter === 'express') {
    list = list.filter(t => t.name.toLowerCase().includes('express') || t.name.toLowerCase().includes('queen') || t.name.toLowerCase().includes('shatabdi'));
  }

  // Sort
  const sortMode = document.getElementById('train-sort-select')?.value || 'number';
  if (sortMode === 'fare-asc') {
    list.sort((a, b) => Number(a.fare) - Number(b.fare));
  } else if (sortMode === 'fare-desc') {
    list.sort((a, b) => Number(b.fare) - Number(a.fare));
  } else if (sortMode === 'seats-desc') {
    list.sort((a, b) => Number(b.seats) - Number(a.seats));
  } else if (sortMode === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => a.number.localeCompare(b.number));
  }

  return list;
}

function renderTrainSearchResults() {
  const container = document.getElementById('train-cards-container');
  if (!container) return;

  const headingEl = document.getElementById('search-results-heading');
  const subEl = document.getElementById('search-results-sub');

  if (currentSearchCriteria.source && currentSearchCriteria.destination) {
    headingEl.textContent = `${currentSearchCriteria.source} → ${currentSearchCriteria.destination}`;
    subEl.textContent = `Showing available trains for selected route • Date: ${currentSearchCriteria.date || 'Today'}`;
  } else {
    headingEl.textContent = 'All Registered Trains';
    subEl.textContent = 'Browse network schedules, journey times, and verified live seat inventory.';
  }

  const trainsToRender = getFilteredTrains();

  if (trainsToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:#94a3b8">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3>No trains match your search criteria</h3>
        <p>Try modifying your origin/destination stations or clear active search filters.</p>
        <button class="btn-outline-sm" style="margin-top:16px" onclick="clearSearchFilter()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = trainsToRender.map(t => {
    const seats = Number(t.seats);
    let seatClass = 'available';
    let seatText = `${seats} Seats Available`;

    if (seats === 0) {
      seatClass = 'full';
      seatText = 'Fully Booked (Waitlist)';
    } else if (seats < 15) {
      seatClass = 'low';
      seatText = `Only ${seats} Seats Remaining`;
    }

    // Departure and arrival simulation based on train number
    const depTime = getSimulatedDepTime(t.number);
    const arrTime = getSimulatedArrTime(t.number);
    const duration = '03h 25m';

    const srcCode = getStationCode(t.source);
    const dstCode = getStationCode(t.destination);

    return `
      <article class="train-card">
        <!-- 1. Train Number & Name -->
        <div class="train-ident-block">
          <div class="train-num-row">
            <span class="train-badge-num">#${escapeHtml(t.number)}</span>
            <span class="train-service-type">SUPERFAST / SF</span>
          </div>
          <h3 class="train-card-name">${escapeHtml(t.name)}</h3>
          <div class="running-days-strip" title="Runs all 7 days">
            <span class="day-dot active">M</span>
            <span class="day-dot active">T</span>
            <span class="day-dot active">W</span>
            <span class="day-dot active">T</span>
            <span class="day-dot active">F</span>
            <span class="day-dot active">S</span>
            <span class="day-dot active">S</span>
          </div>
        </div>

        <!-- 2. Route Timeline Flow -->
        <div class="train-timeline-flow">
          <div class="timeline-station">
            <span class="time-val">${depTime}</span>
            <span class="station-city">${escapeHtml(t.source)} (${srcCode})</span>
          </div>

          <div class="timeline-connector">
            <span class="duration-pill">${duration} &bull; DIRECT</span>
            <div class="line-track"></div>
          </div>

          <div class="timeline-station right">
            <span class="time-val">${arrTime}</span>
            <span class="station-city">${escapeHtml(t.destination)} (${dstCode})</span>
          </div>
        </div>

        <!-- 3. Real-Time Seat Capacity -->
        <div class="train-capacity-block">
          <div class="seat-status-pill ${seatClass}">
            <span class="status-dot"></span>
            <span>${seatText}</span>
          </div>
          <div class="classes-preview-row">
            <span class="class-tag">SL</span>
            <span class="class-tag">3A</span>
            <span class="class-tag">2A</span>
            <span class="class-tag">CC</span>
          </div>
        </div>

        <!-- 4. Fare & Action CTA -->
        <div class="train-cta-block">
          <div class="card-fare-amount">${formatRupee(t.fare)}</div>
          <span class="fare-sub-text">Total base fare</span>
          <button class="btn-primary-sm" ${seats <= 0 ? 'disabled' : ''} onclick="startBookingForTrain('${escapeHtml(t.number)}')">
            <span>${seats <= 0 ? 'Waitlist Only' : 'Book Ticket &rarr;'}</span>
          </button>
          <button class="btn-outline-sm route-view-btn-card" onclick="viewRouteForTrain('${escapeHtml(t.number)}')">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8v6a2 2 0 0 0 2 2h10"/><path d="M17 16V10a2 2 0 0 0-2-2H5"/></svg>
            <span>View Route</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function getSimulatedDepTime(trainNo) {
  const hash = (parseInt(trainNo, 10) || 12101) % 12;
  const hours = 6 + (hash % 8);
  const mins = (hash * 5) % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function getSimulatedArrTime(trainNo) {
  const hash = (parseInt(trainNo, 10) || 12101) % 12;
  const hours = 9 + (hash % 8);
  const mins = ((hash * 5) + 35) % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function filterTrainResults() {
  renderTrainSearchResults();
}

function sortTrainResults() {
  renderTrainSearchResults();
}

function clearSearchFilter() {
  currentSearchCriteria = { source: '', destination: '', date: '', travelClass: 'ALL' };
  activeQuickFilter = 'all';

  const filterInput = document.getElementById('train-filter-input');
  if (filterInput) filterInput.value = '';

  const checkAvail = document.getElementById('check-confirmed-only');
  if (checkAvail) checkAvail.checked = false;

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.id === 'pill-all');
  });

  renderTrainSearchResults();
}

// ============================================================================
// Guided Passenger Booking
// ============================================================================
function populateBookingTrainDropdown() {
  const select = document.getElementById('booking-train-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose an available train --</option>' +
    allTrains
      .filter(t => Number(t.seats) > 0)
      .map(t => `<option value="${escapeHtml(t.number)}">${escapeHtml(t.number)} &bull; ${escapeHtml(t.name)} (${escapeHtml(t.source)} → ${escapeHtml(t.destination)}) — ${formatRupee(t.fare)} [${t.seats} seats]</option>`)
      .join('');

  if (allTrains.some(t => t.number === currentVal)) {
    select.value = currentVal;
  }
  onBookingTrainChanged();
}

function startBookingForTrain(trainNumber) {
  navigateTo('booking');
  const select = document.getElementById('booking-train-select');
  if (select) {
    select.value = trainNumber;
    onBookingTrainChanged();
  }
}

function onBookingTrainChanged() {
  const select = document.getElementById('booking-train-select');
  const previewCard = document.getElementById('selected-train-preview');
  const summaryFare = document.getElementById('summary-fare');
  const summaryTotal = document.getElementById('summary-total');

  if (!select || !previewCard) return;

  const t = allTrains.find(x => x.number === select.value);
  if (!t) {
    previewCard.classList.add('hidden');
    summaryFare.textContent = formatRupee(0);
    summaryTotal.textContent = formatRupee(0);
    return;
  }

  previewCard.classList.remove('hidden');
  document.getElementById('preview-train-name').textContent = t.name;
  document.getElementById('preview-train-number').textContent = `Train #${t.number}`;
  document.getElementById('preview-route').textContent = `${t.source} → ${t.destination}`;
  document.getElementById('preview-seats-badge').textContent = `${t.seats} seats available`;

  summaryFare.textContent = formatRupee(t.fare);
  summaryTotal.textContent = formatRupee(t.fare);
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.getElementById('submit-booking-btn');

  const passenger = form.passenger.value.trim();
  const trainNumber = form.train_number.value.trim();
  const age = parseInt(form.age.value, 10);
  const gender = form.gender.value;

  if (!passenger || !trainNumber || !gender || isNaN(age) || age < 1 || age > 120) {
    showToast('Please enter valid passenger details (Age between 1 and 120).', 'error');
    return;
  }

  const payload = {
    train_number: trainNumber,
    passenger: passenger,
    age: age,
    gender: gender
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Confirming Reservation with C++ Engine...';
    }

    const result = await apiCall('/api/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(`Reservation Confirmed! PNR: ${result.pnr}`, 'success');
    form.reset();
    onBookingTrainChanged();
    await refreshData();

    // Show celebratory e-ticket modal immediately
    showTicketModal({
      pnr: result.pnr,
      passenger: payload.passenger,
      age: payload.age,
      gender: payload.gender,
      train_number: payload.train_number,
      fare: result.fare,
      status: 'Confirmed'
    });

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Confirm Reservation & Generate PNR';
    }
  }
}

// ============================================================================
// PNR Status Enquiry & Digital Boarding Pass
// ============================================================================
function renderQuickPnrHints() {
  const container = document.getElementById('quick-pnr-hints');
  if (!container) return;

  if (allBookings.length === 0) {
    container.innerHTML = '<span>No reservations currently recorded.</span>';
    return;
  }

  const recent = allBookings.slice().reverse().slice(0, 4);
  container.innerHTML = '<span>Recent PNRs:</span>' +
    recent.map(b => `<button type="button" class="pnr-tag-chip" onclick="lookupPnr('${escapeHtml(b.pnr)}')">${escapeHtml(b.pnr)} (${escapeHtml(b.passenger.split(' ')[0])})</button>`).join(' ');
}

function handlePnrLookup(event) {
  event.preventDefault();
  const input = document.getElementById('pnr-input');
  if (input) lookupPnr(input.value.trim());
}

function lookupPnr(pnr) {
  const booking = allBookings.find(b => b.pnr === pnr);
  const resultCard = document.getElementById('pnr-result-card');

  if (!booking) {
    showToast(`No reservation record found for PNR: ${pnr}`, 'error');
    if (resultCard) resultCard.classList.add('hidden');
    return;
  }

  // Populate PNR input field
  const pnrInput = document.getElementById('pnr-input');
  if (pnrInput) pnrInput.value = booking.pnr;

  const train = allTrains.find(t => t.number === booking.train_number);
  const trainName = train ? train.name : `Train ${booking.train_number}`;
  const route = train ? `${train.source} → ${train.destination}` : 'National Express Route';

  document.getElementById('ticket-pnr').textContent = booking.pnr;
  document.getElementById('ticket-train-name').textContent = trainName;
  document.getElementById('ticket-train-no').textContent = `Train #${booking.train_number}`;
  document.getElementById('ticket-route').textContent = route;
  document.getElementById('ticket-passenger').textContent = booking.passenger;
  document.getElementById('ticket-passenger-meta').textContent = `Age ${booking.age} • ${booking.gender}`;
  document.getElementById('ticket-fare').textContent = formatRupee(booking.fare);

  const statusPill = document.getElementById('ticket-status-pill');
  const isConfirmed = booking.status.toLowerCase() === 'confirmed';
  statusPill.innerHTML = `<span class="status-badge ${isConfirmed ? 'confirmed' : 'cancelled'}">${escapeHtml(booking.status)}</span>`;

  const cancelBtn = document.getElementById('ticket-cancel-btn');
  if (cancelBtn) {
    cancelBtn.style.display = isConfirmed ? 'inline-flex' : 'none';
    cancelBtn.dataset.pnr = booking.pnr;
  }

  if (resultCard) {
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function copyCurrentPnr() {
  const pnr = document.getElementById('ticket-pnr')?.textContent;
  if (pnr && pnr !== '—') {
    navigator.clipboard.writeText(pnr)
      .then(() => showToast(`PNR ${pnr} copied to clipboard`, 'success'))
      .catch(() => showToast(`PNR: ${pnr}`, 'info'));
  }
}

function cancelFromTicket() {
  const cancelBtn = document.getElementById('ticket-cancel-btn');
  if (cancelBtn && cancelBtn.dataset.pnr) {
    confirmCancelPnr(cancelBtn.dataset.pnr);
  }
}

function printTicket() {
  window.print();
}

function showTicketModal(ticketData) {
  const modal = document.getElementById('ticket-modal');
  const body = document.getElementById('modal-ticket-body');
  if (!modal || !body) return;

  const train = allTrains.find(t => t.number === ticketData.train_number);
  const trainName = train ? train.name : `Train ${ticketData.train_number}`;
  const route = train ? `${train.source} → ${train.destination}` : 'Confirmed Corridor';

  body.innerHTML = `
    <div class="ticket-card" style="box-shadow:none;border:1px solid #cbd5e1">
      <div class="ticket-header-band">
        <div class="ticket-brand">
          <div class="ticket-emblem">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path></svg>
          </div>
          <div>
            <span class="ticket-title-main">RailConnect Official E-Ticket</span>
            <span class="ticket-title-sub">MINISTRY OF RAILWAYS SIMULATION</span>
          </div>
        </div>
        <div class="ticket-pnr-badge">
          <span class="pnr-title">PNR NUMBER</span>
          <strong class="pnr-value">${escapeHtml(ticketData.pnr)}</strong>
        </div>
      </div>
      <div class="ticket-body" style="padding:24px">
        <div class="ticket-grid">
          <div class="ticket-col">
            <span class="ticket-label">TRAIN</span>
            <div class="ticket-val-highlight">${escapeHtml(trainName)}</div>
            <span class="ticket-sub">#${escapeHtml(ticketData.train_number)}</span>
          </div>
          <div class="ticket-col">
            <span class="ticket-label">ROUTE</span>
            <div class="ticket-val">${escapeHtml(route)}</div>
            <span class="ticket-sub">Direct Schedule</span>
          </div>
          <div class="ticket-col">
            <span class="ticket-label">PASSENGER</span>
            <div class="ticket-val">${escapeHtml(ticketData.passenger)}</div>
            <span class="ticket-sub">Age ${escapeHtml(ticketData.age)} • ${escapeHtml(ticketData.gender)}</span>
          </div>
          <div class="ticket-col">
            <span class="ticket-label">STATUS</span>
            <div><span class="status-badge confirmed">Confirmed</span></div>
            <span class="ticket-sub">Allocated by C++ Engine</span>
          </div>
          <div class="ticket-col">
            <span class="ticket-label">TOTAL FARE</span>
            <div class="ticket-fare-val">${formatRupee(ticketData.fare)}</div>
          </div>
          <div class="ticket-col barcode-col">
            <div class="mock-barcode">
              <span class="barcode-lines" aria-hidden="true"></span>
              <small>DIGITAL BOARDING PASS</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

function printModalTicket() {
  window.print();
}

// ============================================================================
// Bookings Ledger & Cancellations
// ============================================================================
function filterBookingsByStatus(status) {
  activeLedgerFilter = status;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `tab-${status}`);
  });

  renderBookingsTable();
}

function renderBookingsTable() {
  const tbody = document.getElementById('bookings-table-body');
  const countLabel = document.getElementById('bookings-count-label');
  if (!tbody) return;

  const searchQuery = (document.getElementById('bookings-search-input')?.value || '').toLowerCase().trim();
  let filtered = allBookings.slice().reverse();

  // Status Filter
  if (activeLedgerFilter === 'confirmed') {
    filtered = filtered.filter(b => b.status.toLowerCase() === 'confirmed');
  } else if (activeLedgerFilter === 'cancelled') {
    filtered = filtered.filter(b => b.status.toLowerCase() === 'cancelled');
  }

  // Text Search Query
  if (searchQuery) {
    filtered = filtered.filter(b =>
      b.pnr.toLowerCase().includes(searchQuery) ||
      b.passenger.toLowerCase().includes(searchQuery) ||
      b.train_number.toLowerCase().includes(searchQuery) ||
      b.status.toLowerCase().includes(searchQuery)
    );
  }

  if (countLabel) {
    countLabel.textContent = `${filtered.length} reservation record${filtered.length === 1 ? '' : 's'} recorded`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:36px;color:#94a3b8">No reservation records match your filter.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const isConfirmed = b.status.toLowerCase() === 'confirmed';
    const train = allTrains.find(t => t.number === b.train_number);
    const trainLabel = train ? `${b.train_number} - ${train.name}` : `Train #${b.train_number}`;

    return `
      <tr>
        <td class="pnr-cell">${escapeHtml(b.pnr)}</td>
        <td>
          <strong>${escapeHtml(b.passenger)}</strong><br>
          <small style="color:#64748b">Age ${escapeHtml(b.age)} • ${escapeHtml(b.gender)}</small>
        </td>
        <td>
          <strong>${escapeHtml(trainLabel)}</strong>
        </td>
        <td><strong>${formatRupee(b.fare)}</strong></td>
        <td>
          <span class="status-badge ${isConfirmed ? 'confirmed' : 'cancelled'}">${escapeHtml(b.status)}</span>
        </td>
        <td>
          <button class="btn-outline-sm" onclick="navigateTo('pnr'); lookupPnr('${escapeHtml(b.pnr)}')">View E-Ticket</button>
          ${isConfirmed ? `<button class="btn-danger-sm" style="margin-left:6px" onclick="confirmCancelPnr('${escapeHtml(b.pnr)}')">Cancel</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function filterBookingsTable() {
  renderBookingsTable();
}

function handleCancelFormSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('cancel-pnr-input');
  if (input) {
    confirmCancelPnr(input.value.trim());
    input.value = '';
  }
}

function confirmCancelPnr(pnr) {
  pendingCancelPnr = pnr;
  const modal = document.getElementById('cancel-confirm-modal');
  const pnrDisplay = document.getElementById('cancel-modal-pnr');

  if (modal && pnrDisplay) {
    pnrDisplay.textContent = pnr;
    modal.classList.remove('hidden');
  } else {
    // Fallback if modal DOM element is not present
    if (confirm(`Cancel reservation with PNR ${pnr}?\n\nThis will release 1 seat back to live C++ inventory.`)) {
      executeCancellationDirect(pnr);
    }
  }
}

async function executeCancellation() {
  if (!pendingCancelPnr) return;
  const pnr = pendingCancelPnr;
  closeModal('cancel-confirm-modal');
  await executeCancellationDirect(pnr);
}

async function executeCancellationDirect(pnr) {
  try {
    const res = await apiCall('/api/cancel', {
      method: 'POST',
      body: JSON.stringify({ pnr })
    });

    showToast(res.message || 'Ticket cancelled successfully. Seat restored to inventory.', 'success');
    await refreshData();

    // If currently viewing this ticket in PNR tab, refresh its display
    const ticketPnrEl = document.getElementById('ticket-pnr');
    if (ticketPnrEl && ticketPnrEl.textContent === pnr) {
      lookupPnr(pnr);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    pendingCancelPnr = null;
  }
}

// ============================================================================
// Operations Console (Admin)
// ============================================================================
function renderAdminConsole() {
  document.getElementById('stat-trains').textContent = networkStats.trains ?? allTrains.length;
  document.getElementById('stat-bookings').textContent = networkStats.bookings ?? 0;
  document.getElementById('stat-passengers').textContent = networkStats.passengers ?? 0;
  document.getElementById('stat-revenue').textContent = formatRupee(networkStats.revenue);

  const tbody = document.getElementById('admin-trains-table');
  if (!tbody) return;

  if (allTrains.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px">No trains registered.</td></tr>';
    return;
  }

  tbody.innerHTML = allTrains.map(t => `
    <tr>
      <td><strong>${escapeHtml(t.number)}</strong></td>
      <td>${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.source)} → ${escapeHtml(t.destination)}</td>
      <td><strong>${formatRupee(t.fare)}</strong></td>
      <td><span class="seat-badge">${escapeHtml(t.seats)} seats</span></td>
    </tr>
  `).join('');
}

async function handleAddTrainSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    number: form.number.value.trim(),
    name: form.name.value.trim(),
    fare: parseInt(form.fare.value, 10),
    source: form.source.value.trim(),
    destination: form.destination.value.trim(),
    seats: parseInt(form.seats.value, 10)
  };

  try {
    const res = await apiCall('/api/trains', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(res.message || 'Train registered successfully to operational network', 'success');
    form.reset();
    await refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showServiceNotice(serviceName) {
  showToast(`${serviceName}: Educational simulation module coming in subsequent milestone.`, 'info');
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default travel date to today
  const dateInput = document.getElementById('home-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
    updateDayTag(today);
  }

  // Initialize station code chips
  updateStationChip('home-src', 'src-code-preview');
  updateStationChip('home-dst', 'dst-code-preview');

  // Load initial dataset from C++ core backend
  refreshData();
});

// ============================================================================
// Route Explorer Feature
// ============================================================================

/**
 * Populate the route train selector from the already-loaded allTrains list.
 * Called whenever navigateTo('route') is triggered.
 */
function populateRouteTrainDropdown() {
  const select = document.getElementById('route-train-select');
  if (!select) return;

  const prevVal = select.value;
  select.innerHTML = '<option value="">— Select a train to view its route —</option>' +
    allTrains.map(t =>
      `<option value="${escapeHtml(t.number)}">#${escapeHtml(t.number)} · ${escapeHtml(t.name)} (${escapeHtml(t.source)} → ${escapeHtml(t.destination)})</option>`
    ).join('');

  // Restore previous selection if still valid
  if (prevVal && allTrains.some(t => t.number === prevVal)) {
    select.value = prevVal;
  }

  // Enable/disable the View Route button
  const btn = document.getElementById('route-view-btn');
  if (btn) btn.disabled = !select.value;
}

/**
 * Called when the dropdown value changes. Enables/disables button.
 */
function onRouteTrainSelected() {
  const select = document.getElementById('route-train-select');
  const btn = document.getElementById('route-view-btn');
  if (!select) return;

  if (btn) btn.disabled = !select.value;

  if (select.value) {
    loadRouteForTrain(select.value);
  } else {
    // Hide display area if no train is chosen
    const area = document.getElementById('route-display-area');
    if (area) area.classList.add('hidden');
  }
}

/**
 * Fetch route data from the Flask API and render the vertical timeline.
 */
async function loadRouteForTrain(trainNumber) {
  const displayArea   = document.getElementById('route-display-area');
  const loadingState  = document.getElementById('route-loading-state');
  const unavailNotice = document.getElementById('route-unavailable-notice');
  const timelineCard  = document.getElementById('route-timeline-card');

  if (!displayArea || !loadingState) return;

  // Show loading
  displayArea.classList.add('hidden');
  loadingState.classList.remove('hidden');

  try {
    const data = await fetch(`/api/route/${encodeURIComponent(trainNumber)}`).then(r => r.json());

    if (data.error) {
      showToast(data.error, 'error');
      loadingState.classList.add('hidden');
      return;
    }

    // ── Populate header summary ──────────────────────────────────────────────
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    setEl('rh-train-number', `#${data.train_number}`);
    setEl('rh-train-name',   data.train_name);
    setEl('rh-route-badge',  `${data.source} → ${data.destination}`);
    setEl('rh-duration',     data.journey_duration  || '—');
    setEl('rh-distance',     data.total_distance_km ? `${data.total_distance_km} km` : '—');
    setEl('rh-stops',        `${data.stops.length} station${data.stops.length !== 1 ? 's' : ''}`);
    setEl('rh-fare',         formatRupee(data.fare));

    // ── Unavailability notice ────────────────────────────────────────────────
    if (!data.has_full_route) {
      unavailNotice && unavailNotice.classList.remove('hidden');
      timelineCard  && timelineCard.classList.add('route-partial');
    } else {
      unavailNotice && unavailNotice.classList.add('hidden');
      timelineCard  && timelineCard.classList.remove('route-partial');
    }

    // ── Build the station timeline rows ─────────────────────────────────────
    const tbody = document.getElementById('route-timeline-body');
    if (tbody) {
      const totalStops = data.stops.length;
      tbody.innerHTML = data.stops.map((stop, idx) => {
        const isOrigin = idx === 0;
        const isDest   = idx === totalStops - 1;
        const isInter  = !isOrigin && !isDest;

        const typeClass = isOrigin ? 'stop-origin' : (isDest ? 'stop-dest' : 'stop-inter');
        const typeLabel = isOrigin ? 'ORIGIN' : (isDest ? 'DESTINATION' : '');

        const distText = stop.distance_km != null
          ? `${stop.distance_km} km`
          : '—';

        const codeHtml = stop.code
          ? `<span class="stn-code-tag">${escapeHtml(stop.code)}</span>`
          : '';

        return `
          <div class="route-stop-row ${typeClass}">
            <div class="rs-col rs-seq">
              <span class="stop-seq-num">${idx + 1}</span>
            </div>
            <div class="rs-col rs-station-col">
              <div class="stop-connector">
                <span class="stop-dot ${typeClass}-dot"></span>
                ${!isDest ? '<span class="stop-line"></span>' : ''}
              </div>
              <div class="stop-station-info">
                <div class="stop-station-name">
                  ${escapeHtml(stop.station)}
                  ${codeHtml}
                  ${typeLabel ? `<span class="stop-type-badge">${typeLabel}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="rs-col rs-arr">
              <span class="${stop.arrival !== '—' ? 'time-val-route' : 'time-na'}">${escapeHtml(stop.arrival)}</span>
            </div>
            <div class="rs-col rs-dep">
              <span class="${stop.departure !== '—' ? 'time-val-route' : 'time-na'}">${escapeHtml(stop.departure)}</span>
            </div>
            <div class="rs-col rs-day">
              <span class="day-badge">Day ${stop.day}</span>
            </div>
            <div class="rs-col rs-dist">
              <span class="dist-val">${distText}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // ── Wire up the "Book This Train" button ─────────────────────────────────
    const bookBtn = document.getElementById('route-book-btn');
    if (bookBtn) {
      const trainData = allTrains.find(t => t.number === data.train_number);
      const hasSeats  = trainData && Number(trainData.seats) > 0;
      bookBtn.disabled = !hasSeats;
      bookBtn.title    = hasSeats ? '' : 'No seats available';
      bookBtn.onclick  = hasSeats ? () => startBookingForTrain(data.train_number) : null;
      bookBtn.innerHTML = hasSeats
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg><span>Book This Train</span>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg><span>Fully Booked</span>`;
    }

    // Show display area
    loadingState.classList.add('hidden');
    displayArea.classList.remove('hidden');
    displayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    loadingState.classList.add('hidden');
    showToast('Failed to load route information: ' + err.message, 'error');
  }
}

/**
 * Navigate to the Route view and pre-select a train (called from search results).
 */
function viewRouteForTrain(trainNumber) {
  navigateTo('route');
  setTimeout(() => {
    const select = document.getElementById('route-train-select');
    if (select) {
      select.value = trainNumber;
      onRouteTrainSelected();
    }
  }, 80);
}

// ============================================================================
// E-Catering Module Controller (C++ OOP CateringService)
// ============================================================================
let foodMenuItems = [];
let foodCart = {}; // { itemId: { item: obj, qty: number } }
let foodOrders = [];
let activeFoodCategory = 'all';

/**
 * Initialize E-Catering view upon tab / page navigation.
 */
async function initCateringView() {
  if (foodMenuItems.length === 0) {
    await fetchFoodMenu();
  } else {
    renderFoodMenu();
  }
  await fetchFoodOrders();
  renderCart();
}

/**
 * Switch between "Browse Food Menu" and "My Food Orders" tabs.
 */
function switchCateringTab(tab) {
  const menuBtn = document.getElementById('c-tab-menu');
  const ordersBtn = document.getElementById('c-tab-orders');
  const menuContent = document.getElementById('catering-tab-menu-content');
  const ordersContent = document.getElementById('catering-tab-orders-content');

  if (tab === 'menu') {
    if (menuBtn) menuBtn.classList.add('active');
    if (ordersBtn) ordersBtn.classList.remove('active');
    if (menuContent) menuContent.style.display = 'block';
    if (ordersContent) ordersContent.style.display = 'none';
  } else {
    if (menuBtn) menuBtn.classList.remove('active');
    if (ordersBtn) ordersBtn.classList.add('active');
    if (menuContent) menuContent.style.display = 'none';
    if (ordersContent) ordersContent.style.display = 'block';
    fetchFoodOrders();
  }
}

/**
 * Fetch available food menu from C++ CateringService backend.
 */
async function fetchFoodMenu() {
  const container = document.getElementById('food-items-container');
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading fresh food menu from C++ Catering Service...</p>
      </div>
    `;
  }

  try {
    const res = await apiCall('/api/catering/menu');
    const rawList = Array.isArray(res) ? res : (res.data || []);
    foodMenuItems = rawList.map(item => {
      const idStr = String(item.id || item.item_id || '').trim();
      return {
        ...item,
        id: idStr,
        item_id: idStr,
        price: Number(item.price || 0),
        is_available: item.available !== false && item.is_available !== false && item.is_available !== '0'
      };
    });
    renderFoodMenu();
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="text-danger">Failed to load food menu: ${escapeHtml(err.message)}</p>
          <button class="btn-outline-sm" onclick="fetchFoodMenu()">Retry</button>
        </div>
      `;
    }
  }
}

/**
 * Render food menu cards in the grid.
 */
function renderFoodMenu() {
  const container = document.getElementById('food-items-container');
  if (!container) return;

  const searchTerm = (document.getElementById('food-search-input')?.value || '').toLowerCase().trim();

  const filtered = foodMenuItems.filter(item => {
    const matchesCategory = (activeFoodCategory === 'all' || item.category === activeFoodCategory);
    const matchesSearch = !searchTerm ||
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <p style="margin-top:12px; font-weight:600; color:#475569;">No food items match your criteria.</p>
        <small style="color:#64748b;">Try searching for another dish or clearing category filters.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const itemId = String(item.id || item.item_id);
    const inCart = foodCart[itemId];
    const qty = inCart ? Number(inCart.qty || 0) : 0;
    const isAvail = item.is_available !== false;

    return `
      <div class="food-card ${!isAvail ? 'food-sold-out' : ''}" data-item-id="${escapeHtml(itemId)}">
        <div class="food-card-top">
          <div class="food-badge-row">
            <span class="veg-badge" title="100% Pure Vegetarian">
              <span class="veg-inner-dot"></span>
            </span>
            <span class="food-cat-pill">${escapeHtml(item.category || 'General')}</span>
            ${!isAvail ? '<span class="sold-out-badge">Sold Out</span>' : '<span class="avail-badge">Available</span>'}
          </div>
          <h4 class="food-card-title">${escapeHtml(item.name)}</h4>
          <p class="food-card-desc">${escapeHtml(item.description || 'Prepared fresh in certified railway pantry.')}</p>
        </div>

        <div class="food-card-bottom">
          <div class="food-price-tag">
            <span class="food-price-val">₹${item.price}</span>
            <span class="food-price-sub">inclusive of all taxes</span>
          </div>

          <div class="food-action-wrap">
            ${!isAvail
              ? `<button class="btn-food-add disabled" disabled>Sold Out</button>`
              : qty > 0
                ? `<div class="food-qty-stepper">
                    <button type="button" class="stepper-btn minus" onclick="changeCartQty('${escapeHtml(itemId)}', -1)">&minus;</button>
                    <span class="stepper-qty">${qty}</span>
                    <button type="button" class="stepper-btn plus" onclick="changeCartQty('${escapeHtml(itemId)}', 1)">&plus;</button>
                  </div>`
                : `<button type="button" class="btn-food-add" onclick="addToCart('${escapeHtml(itemId)}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Add to Tray</span>
                  </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Filter by Category pill button.
 */
function setFoodCategory(category, clickedElement) {
  let normalized = category;
  if (category === 'Breakfast') normalized = 'Breakfast & Snacks';
  else if (category === 'Snacks' || category === 'Fast Food') normalized = 'Snacks & Fast Food';
  else if (category === 'Meals' || category === 'Thali') normalized = 'Thali & Meals';
  else if (category === 'Biryani' || category === 'Rice') normalized = 'Biryani & Rice';
  else if (category === 'Beverages' || category === 'Desserts' || category === 'Chai') normalized = 'Beverages & Desserts';

  activeFoodCategory = normalized;
  const pills = document.querySelectorAll('#food-category-pills .filter-pill');
  pills.forEach(pill => {
    let isMatch = false;
    if (clickedElement && pill === clickedElement) {
      isMatch = true;
    } else {
      const pillCat = pill.getAttribute('data-category');
      if (pillCat) {
        isMatch = (pillCat === normalized);
      } else {
        const onclickAttr = pill.getAttribute('onclick') || '';
        isMatch = onclickAttr.includes(`'${normalized}'`) || (normalized === 'all' && onclickAttr.includes("'all'"));
      }
    }

    if (isMatch) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderFoodMenu();
}

/**
 * Search filter trigger.
 */
function filterFoodMenu() {
  renderFoodMenu();
}

/**
 * Add item to shopping cart tray.
 */
function addToCart(itemId) {
  const cleanId = String(itemId || '').trim();
  const item = foodMenuItems.find(i => String(i.id) === cleanId || String(i.item_id) === cleanId);
  if (!item) {
    console.error('Item not found for id:', itemId, foodMenuItems);
    return;
  }

  const id = String(item.id || item.item_id);
  if (foodCart[id]) {
    foodCart[id].qty += 1;
  } else {
    foodCart[id] = { item: item, qty: 1 };
  }

  showToast(`Added "${item.name}" to food tray`, 'success');
  renderCart();
  renderFoodMenu();
}

/**
 * Increment / Decrement quantity in shopping cart.
 */
function changeCartQty(itemId, delta) {
  const cleanId = String(itemId || '').trim();
  if (!foodCart[cleanId]) return;

  foodCart[cleanId].qty += Number(delta || 0);
  if (foodCart[cleanId].qty <= 0) {
    delete foodCart[cleanId];
  }

  renderCart();
  renderFoodMenu();
}

/**
 * Remove an item completely from the cart.
 */
function removeFromCart(itemId) {
  const cleanId = String(itemId || '').trim();
  if (foodCart[cleanId]) {
    delete foodCart[cleanId];
    renderCart();
    renderFoodMenu();
  }
}

/**
 * Render shopping cart drawer / sidebar.
 */
function renderCart() {
  const countBadge = document.getElementById('cart-items-count');
  const itemsList = document.getElementById('cart-items-list');
  const checkoutWrap = document.getElementById('cart-checkout-wrap');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  const cartEntries = Object.values(foodCart);
  let totalItemsCount = 0;
  let subtotalAmount = 0;

  cartEntries.forEach(entry => {
    const qty = Number(entry.qty || 0);
    const price = Number(entry.item.price || 0);
    totalItemsCount += qty;
    subtotalAmount += (price * qty);
  });

  if (countBadge) {
    countBadge.textContent = `${totalItemsCount} item${totalItemsCount === 1 ? '' : 's'}`;
  }

  if (cartEntries.length === 0) {
    if (itemsList) {
      itemsList.innerHTML = `
        <div class="empty-cart-state">
          <div class="empty-cart-icon">🛒</div>
          <p>Your food cart is currently empty.</p>
          <small>Select delicious thalis, biryani or hot chai from the menu.</small>
        </div>
      `;
    }
    if (checkoutWrap) checkoutWrap.style.display = 'none';
    if (subtotalEl) subtotalEl.textContent = formatRupee(0);
    if (totalEl) totalEl.textContent = formatRupee(0);
    return;
  }

  if (checkoutWrap) checkoutWrap.style.display = 'block';
  if (subtotalEl) subtotalEl.textContent = formatRupee(subtotalAmount);
  if (totalEl) totalEl.textContent = formatRupee(subtotalAmount);

  if (itemsList) {
    itemsList.innerHTML = cartEntries.map(entry => {
      const item = entry.item;
      const itemId = String(item.id || item.item_id);
      const lineTotal = Number(item.price || 0) * Number(entry.qty || 1);
      return `
        <div class="cart-item-row" data-id="${escapeHtml(itemId)}">
          <div class="cart-item-info">
            <div class="cart-item-title-wrap">
              <span class="veg-badge small" title="Pure Veg"><span class="veg-inner-dot"></span></span>
              <strong class="cart-item-name">${escapeHtml(item.name)}</strong>
            </div>
            <span class="cart-item-unit-price">₹${item.price} each</span>
          </div>

          <div class="cart-item-actions">
            <div class="food-qty-stepper compact">
              <button type="button" class="stepper-btn minus" onclick="changeCartQty('${escapeHtml(itemId)}', -1)">&minus;</button>
              <span class="stepper-qty">${entry.qty}</span>
              <button type="button" class="stepper-btn plus" onclick="changeCartQty('${escapeHtml(itemId)}', 1)">&plus;</button>
            </div>
            <span class="cart-item-line-total">₹${lineTotal}</span>
            <button type="button" class="cart-item-remove-btn" onclick="removeFromCart('${escapeHtml(itemId)}')" title="Remove item">
              &times;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Handle PNR autofill suggestions when passenger enters PNR in catering form.
 */
function onFoodPnrInput(pnr) {
  const cleanPnr = (pnr || '').trim();
  const hintsEl = document.getElementById('food-pnr-hints');
  if (!cleanPnr || cleanPnr.length < 3) {
    if (hintsEl) hintsEl.innerHTML = '';
    return;
  }

  // Look for match in confirmed passenger bookings
  const matched = allBookings.find(b => b.pnr === cleanPnr && b.status === 'Confirmed');
  if (matched) {
    const passengerInput = document.getElementById('food-passenger');
    const trainInput = document.getElementById('food-train');
    const stationInput = document.getElementById('food-station');

    if (passengerInput && !passengerInput.value) passengerInput.value = matched.passenger;
    if (trainInput && !trainInput.value) trainInput.value = matched.train_number;
    if (stationInput && !stationInput.value) stationInput.value = matched.destination || matched.source;

    if (hintsEl) {
      hintsEl.innerHTML = `<span class="pnr-match-chip">&check; Matched Booking: <strong>${escapeHtml(matched.passenger)}</strong> (Train #${escapeHtml(matched.train_number)})</span>`;
    }
  } else if (hintsEl) {
    hintsEl.innerHTML = '';
  }
}

/**
 * Place food order via Flask API and C++ CateringService backend.
 */
async function handleCateringOrderSubmit(event) {
  event.preventDefault();

  const cartEntries = Object.values(foodCart);
  if (cartEntries.length === 0) {
    showToast('Your food cart is empty! Add items before placing an order.', 'error');
    return;
  }

  const pnr = document.getElementById('food-pnr')?.value.trim();
  const passenger = document.getElementById('food-passenger')?.value.trim();
  const trainNumber = document.getElementById('food-train')?.value.trim();
  const station = document.getElementById('food-station')?.value.trim();

  if (!pnr || !passenger || !trainNumber || !station) {
    showToast('Please fill in all delivery details (PNR, Passenger Name, Train No, Station).', 'error');
    return;
  }

  const items = cartEntries.map(e => ({
    item_id: String(e.item.id || e.item.item_id),
    name: e.item.name,
    price: Number(e.item.price || 0),
    quantity: Number(e.qty)
  }));

  const submitBtn = document.getElementById('btn-place-food-order');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing Order with C++ Backend...</span>';
  }

  try {
    const res = await apiCall('/api/catering/order', {
      method: 'POST',
      body: JSON.stringify({
        pnr: pnr,
        passenger: passenger,
        train_number: trainNumber,
        delivery_station: station,
        items: items
      })
    });

    const orderData = res.order;
    showToast(`Food order ${orderData.order_id} placed successfully!`, 'success');

    // Reset cart and form
    foodCart = {};
    renderCart();
    renderFoodMenu();
    document.getElementById('catering-checkout-form')?.reset();
    const hintsEl = document.getElementById('food-pnr-hints');
    if (hintsEl) hintsEl.innerHTML = '';

    // Refresh orders list
    await fetchFoodOrders();

    // Show confirmation modal
    showFoodOrderConfirmationModal(orderData);

  } catch (err) {
    showToast('Failed to place food order: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

/**
 * Show order confirmation modal with printable slip.
 */
function showFoodOrderConfirmationModal(order) {
  const modal = document.getElementById('food-order-modal');
  const body = document.getElementById('modal-food-order-body');
  if (!modal || !body) return;

  const summary = order.items_summary || '';
  const itemsDisplay = summary.split(';').map(s => {
    const trimmed = s.trim();
    if (!trimmed) return '';
    return `<div class="modal-order-item-chip">${escapeHtml(trimmed)}</div>`;
  }).join('');

  body.innerHTML = `
    <div class="food-order-receipt" id="food-order-receipt">
      <div class="receipt-header">
        <div class="receipt-brand">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
          <div>
            <strong>RailConnect E-Catering Slip</strong>
            <small>IRCTC APPROVED PANTRY DELIVERY</small>
          </div>
        </div>
        <div class="receipt-order-id">
          <span>ORDER ID</span>
          <strong>${escapeHtml(order.order_id)}</strong>
        </div>
      </div>

      <div class="receipt-grid">
        <div class="receipt-col">
          <span class="label">PASSENGER</span>
          <strong>${escapeHtml(order.passenger)}</strong>
          <span class="sub">PNR: ${escapeHtml(order.pnr)}</span>
        </div>
        <div class="receipt-col">
          <span class="label">TRAIN & STATION</span>
          <strong>Train #${escapeHtml(order.train_number)}</strong>
          <span class="sub">Delivery: ${escapeHtml(order.delivery_station)}</span>
        </div>
        <div class="receipt-col">
          <span class="label">STATUS</span>
          <span class="status-badge confirmed">Confirmed</span>
          <span class="sub">Pantry Dispatched</span>
        </div>
        <div class="receipt-col">
          <span class="label">TOTAL AMOUNT</span>
          <strong class="receipt-amount">${formatRupee(order.total_amount)}</strong>
          <span class="sub">Payment on Delivery</span>
        </div>
      </div>

      <div class="receipt-items-section">
        <span class="label">ORDERED MEALS & BEVERAGES</span>
        <div class="receipt-chips-list">
          ${itemsDisplay}
        </div>
      </div>

      <div class="receipt-delivery-note">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>Your fresh food will be delivered directly to your berth upon train arrival at <strong>${escapeHtml(order.delivery_station)}</strong>. Keep exact cash or UPI ready.</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

/**
 * Fetch placed food orders from C++ backend.
 */
async function fetchFoodOrders() {
  try {
    const res = await apiCall('/api/catering/orders');
    foodOrders = Array.isArray(res) ? res : (res.data || []);
    const ordersCountEl = document.getElementById('c-tab-orders-count');
    if (ordersCountEl) {
      ordersCountEl.textContent = foodOrders.length;
    }
    const labelEl = document.getElementById('food-orders-count-label');
    if (labelEl) {
      labelEl.textContent = `${foodOrders.length} order${foodOrders.length === 1 ? '' : 's'} recorded in C++ CSV backend (data/food_orders.csv).`;
    }
    renderFoodOrdersTable();
  } catch (err) {
    console.error('Failed to fetch food orders:', err);
  }
}

/**
 * Render My Food Orders table.
 */
function renderFoodOrdersTable() {
  const tbody = document.getElementById('food-orders-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('food-orders-search')?.value || '').toLowerCase().trim();

  const filtered = foodOrders.filter(o => {
    if (!searchTerm) return true;
    return (o.order_id && o.order_id.toLowerCase().includes(searchTerm)) ||
      (o.pnr && o.pnr.toLowerCase().includes(searchTerm)) ||
      (o.passenger && o.passenger.toLowerCase().includes(searchTerm)) ||
      (o.delivery_station && o.delivery_station.toLowerCase().includes(searchTerm));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-cell" style="text-align:center; padding: 32px; color: #64748b;">
          ${foodOrders.length === 0 ? 'No food orders placed yet. Choose delicious meals from the menu!' : 'No orders matched your search criteria.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const isCancelled = order.status && order.status.toLowerCase() === 'cancelled';
    const statusClass = isCancelled ? 'cancelled' : 'confirmed';
    const statusText = isCancelled ? 'Cancelled' : 'Confirmed';

    // Format items nicely
    const itemsFormatted = (order.items_summary || '').split(';').map(itemStr => {
      const trimmed = itemStr.trim();
      if (!trimmed) return '';
      return `<span class="order-food-tag">${escapeHtml(trimmed)}</span>`;
    }).join(' ');

    return `
      <tr>
        <td>
          <strong class="order-id-badge">${escapeHtml(order.order_id)}</strong>
          <div class="table-sub-text">${escapeHtml(order.order_time || '')}</div>
        </td>
        <td>
          <div class="table-passenger-name">${escapeHtml(order.passenger)}</div>
          <div class="table-sub-text">PNR: ${escapeHtml(order.pnr)}</div>
        </td>
        <td>
          <div>Train #${escapeHtml(order.train_number)}</div>
          <div class="table-sub-text">Berth Delivery @ ${escapeHtml(order.delivery_station)}</div>
        </td>
        <td class="order-items-cell">
          ${itemsFormatted}
        </td>
        <td>
          <strong class="order-fare-val">${formatRupee(order.total_amount)}</strong>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          ${isCancelled
            ? `<span class="text-muted" style="font-size:0.85rem">Order Cancelled</span>`
            : `<button type="button" class="btn-cancel-action" onclick="cancelFoodOrder('${escapeHtml(order.order_id)}')">
                Cancel
              </button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Filter food orders table based on search input.
 */
function filterFoodOrdersTable() {
  renderFoodOrdersTable();
}

/**
 * Cancel a food order via C++ CateringService backend.
 */
async function cancelFoodOrder(orderId) {
  if (!confirm(`Are you sure you want to cancel food order ${orderId}?`)) {
    return;
  }

  try {
    const res = await apiCall('/api/catering/cancel', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId })
    });

    showToast(`Food order ${orderId} cancelled successfully`, 'success');
    await fetchFoodOrders();
  } catch (err) {
    showToast('Failed to cancel food order: ' + err.message, 'error');
  }
}

// ============================================================================
// Live Train Running Status Controller (C++ LiveStatusService Integration)
// ============================================================================
let activeLiveStatus = null;

/**
 * Initialize Live Status view upon tab / page navigation.
 */
function initLiveStatusView() {
  const input = document.getElementById('live-train-search-input');
  if (input && !activeLiveStatus) {
    // Automatically showcase Deccan Express (12101) on initial view load
    searchLiveStatus('12101');
  }
}

/**
 * Handle Live Train Running Status form submission.
 */
function handleLiveStatusSearch(event) {
  event.preventDefault();
  const input = document.getElementById('live-train-search-input');
  const query = (input?.value || '').trim();
  if (!query) {
    showToast('Please enter a train number or train name.', 'error');
    return;
  }
  searchLiveStatus(query);
}

/**
 * Query C++ LiveStatusService backend for running status of a train.
 */
async function searchLiveStatus(query) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return;

  const input = document.getElementById('live-train-search-input');
  if (input) input.value = cleanQuery;

  const clearBtn = document.getElementById('live-clear-btn');
  if (clearBtn) clearBtn.classList.remove('hidden');

  const loadingEl = document.getElementById('live-status-loading');
  const errorEl = document.getElementById('live-status-error');
  const resultsEl = document.getElementById('live-status-results');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (resultsEl) resultsEl.classList.add('hidden');

  try {
    const res = await apiCall('/api/live-status/search?query=' + encodeURIComponent(cleanQuery));
    if (!res || !res.status) {
      throw new Error(res?.error || `No running status telemetry available for "${cleanQuery}".`);
    }

    activeLiveStatus = res.status;
    renderLiveStatus(res.status);

    if (loadingEl) loadingEl.classList.add('hidden');
    if (resultsEl) {
      resultsEl.classList.remove('hidden');
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) {
      const titleEl = document.getElementById('live-error-title');
      const msgEl = document.getElementById('live-error-message');
      if (titleEl) titleEl.textContent = 'Train Not Found';
      if (msgEl) {
        msgEl.innerHTML = `No running telemetry found matching <strong>"${escapeHtml(cleanQuery)}"</strong>.<br>Please enter a registered train number (e.g. <strong>12101</strong>, <strong>11007</strong>, <strong>12127</strong>, <strong>12025</strong>) or train name (e.g. <strong>Deccan Express</strong>).`;
      }
      errorEl.classList.remove('hidden');
    }
  }
}

/**
 * Render running status telemetry, overview metrics, and station timeline.
 */
function renderLiveStatus(status) {
  if (!status) return;

  // Header identity
  const numEl = document.getElementById('live-display-num');
  const nameEl = document.getElementById('live-display-name');
  const routeEl = document.getElementById('live-display-route');
  if (numEl) numEl.textContent = `#${status.train_number}`;
  if (nameEl) nameEl.textContent = status.train_name;
  if (routeEl) routeEl.innerHTML = `${escapeHtml(status.source)} &rarr; ${escapeHtml(status.destination)}`;

  // Delay / On-time status badge
  const badgeEl = document.getElementById('live-status-badge');
  const badgeText = document.getElementById('live-badge-text');
  const delay = Number(status.overall_delay_minutes || 0);

  if (badgeEl && badgeText) {
    badgeEl.className = 'live-status-badge ' + (delay > 0 ? 'delayed' : 'ontime');
    badgeText.textContent = delay > 0 ? `RUNNING ${delay} MINS LATE` : 'RUNNING ON TIME';
  }

  const updatedEl = document.getElementById('live-last-updated');
  if (updatedEl) updatedEl.textContent = status.last_updated || 'Live Telemetry';

  // Current & next stations
  const currStnEl = document.getElementById('live-current-station');
  const currDescEl = document.getElementById('live-current-status-desc');
  const nextStnEl = document.getElementById('live-next-station');
  const nextEtaEl = document.getElementById('live-next-eta');

  if (currStnEl) currStnEl.textContent = status.current_station || 'In Transit';
  if (currDescEl) currDescEl.textContent = status.status_summary || 'Tracking live progression';
  if (nextStnEl) nextStnEl.textContent = status.next_station || 'Approaching Destination';

  // Find next station scheduled arrival
  const stations = status.stations || [];
  const nextStnObj = stations.find(s => s.station === status.next_station);
  if (nextEtaEl) {
    nextEtaEl.textContent = nextStnObj
      ? `Estimated Arrival: ${nextStnObj.estimated_arrival || nextStnObj.scheduled_arrival}`
      : 'On-schedule progression';
  }

  // Delay metric
  const delayValEl = document.getElementById('live-delay-val');
  if (delayValEl) {
    delayValEl.textContent = delay > 0 ? `${delay} Mins Late` : 'Right Time (0 min)';
    delayValEl.className = 'metric-val ' + (delay > 0 ? 'text-delay' : 'text-ontime');
  }

  // Distance progress bar
  const distCovered = Number(status.distance_covered_km || 0);
  const distRemaining = Number(status.distance_remaining_km || 0);
  const totalDist = distCovered + distRemaining;
  const pct = totalDist > 0 ? Math.min(100, Math.round((distCovered / totalDist) * 100)) : 50;

  const distValEl = document.getElementById('live-distance-val');
  const progressFill = document.getElementById('live-progress-fill');
  const distRemEl = document.getElementById('live-distance-rem');

  if (distValEl) distValEl.textContent = `${distCovered} / ${totalDist} km`;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (distRemEl) distRemEl.textContent = `${distRemaining} km remaining to ${status.destination}`;

  // Station timeline table
  const tbody = document.getElementById('live-stations-tbody');
  if (tbody) {
    tbody.innerHTML = stations.map(s => {
      const isCurrent = s.status === 'Current';
      const isPassed = s.status === 'Passed';
      const isUpcoming = s.status === 'Upcoming';

      let rowClass = '';
      let statusBadgeHtml = '';

      if (isCurrent) {
        rowClass = 'live-row-current';
        statusBadgeHtml = `<span class="live-pill current"><span class="chip-dot pulse"></span> Current Station</span>`;
      } else if (isPassed) {
        rowClass = 'live-row-passed';
        statusBadgeHtml = `<span class="live-pill passed">&check; Departed</span>`;
      } else {
        rowClass = 'live-row-upcoming';
        statusBadgeHtml = `<span class="live-pill upcoming">Upcoming</span>`;
      }

      const stnDelay = Number(s.delay_minutes || 0);
      const delayHtml = stnDelay > 0
        ? `<span class="text-delay font-semibold">+${stnDelay}m</span>`
        : `<span class="text-ontime font-semibold">On Time</span>`;

      return `
        <tr class="${rowClass}">
          <td>
            <div class="stn-cell-wrap">
              <span class="stn-name-main">${escapeHtml(s.station)}</span>
              <div class="stn-meta-pills">
                <span class="stn-code-badge">${escapeHtml(s.code || 'STN')}</span>
                <span class="stn-platform-badge">${escapeHtml(s.platform || 'PF 1')}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="time-block">
              <div>Arr: <strong>${escapeHtml(s.scheduled_arrival || '—')}</strong></div>
              <div>Dep: <strong>${escapeHtml(s.scheduled_departure || '—')}</strong></div>
            </div>
          </td>
          <td>
            <div class="time-block estimated">
              <div>Arr: <strong>${escapeHtml(s.estimated_arrival || s.scheduled_arrival || '—')}</strong></div>
              <div>Dep: <strong>${escapeHtml(s.estimated_departure || s.scheduled_departure || '—')}</strong></div>
            </div>
          </td>
          <td>
            ${delayHtml}
          </td>
          <td>
            <span class="stn-distance-text">${s.distance_km} km</span>
          </td>
          <td>
            ${statusBadgeHtml}
          </td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * Clear search input and reset search view.
 */
function clearLiveSearch() {
  const input = document.getElementById('live-train-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  const clearBtn = document.getElementById('live-clear-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
}
