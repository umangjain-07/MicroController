let port, writer, isConnected = false, lastLeft = 0, lastRight = 0;
let activeSlider = null;
let lastSendTime = 0;
const sendInterval = 150; // milliseconds delay between sends

function handleTouchStart(e) {
  activeSlider = e.target;
  e.preventDefault();
}

function handleTouchMove(e) {
  if (!activeSlider) return;
  e.preventDefault();

  const touch = Array.from(e.touches).find(t => t.target === activeSlider || activeSlider.contains(t.target));
  if (!touch) return;

  const rect = activeSlider.getBoundingClientRect();
  const percentage = (touch.clientY - rect.top) / rect.height;
  const clamped = Math.max(0, Math.min(1, percentage));
  
  // Recalculate slider value based on vertical position
  const min = parseInt(activeSlider.min);
  const max = parseInt(activeSlider.max);
  const value = Math.round(min + (max - min) * (1 - clamped));

  if (activeSlider.value != value) {
    activeSlider.value = value;
    const event = new Event('input', { bubbles: true });
    activeSlider.dispatchEvent(event);
  }
}

function handleTouchEnd(e) {
  if (activeSlider) {
    resetSlider(activeSlider.id);
    activeSlider = null;
  }
}

// Initialize sliders with touch support
function initSliders() {
  const sliders = document.querySelectorAll('input[type="range"]');
  
  sliders.forEach(slider => {
    // Mouse/pointer events
    slider.addEventListener('input', handleSliderChange);
    slider.addEventListener('change', handleSliderChange);
    slider.addEventListener('mouseup', () => resetSlider(slider.id));
    
    // Touch events
    slider.addEventListener('touchstart', handleTouchStart, { passive: false });
    slider.addEventListener('touchend', handleTouchEnd, { passive: false });
  });
  
  // Add global touch move listener
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
}

function handleSliderChange(e) {
  const slider = e.target;
  const val = slider.value;
  const side = slider.id === 'leftSlider' ? 'L' : 'R';
  
  if ((side === 'L' && val !== lastLeft) || (side === 'R' && val !== lastRight)) {
    const command = generateMotorCommand(side, val);
    sendSerial(command);
    
    if (side === 'L') lastLeft = val;
    else lastRight = val;
  }
}

function resetSlider(id) {
  const slider = document.getElementById(id);
  slider.value = 0;
  const side = id === 'leftSlider' ? 'L' : 'R';
  sendSerial(generateMotorCommand(side, 0));
  
  if (side === 'L') lastLeft = 0;
  else lastRight = 0;
}

async function connectSerial() {
  try {
    if (!navigator.serial) {
      throw new Error('Web Serial API not supported in this browser.');
    }
    
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    isConnected = true;
    document.getElementById('statusIndicator').classList.add('connected');
    document.getElementById('connectButton').textContent = 'CONNECTED ';
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Connection failed: " + (err.message || err));
    isConnected = false;
    document.getElementById('statusIndicator').classList.remove('connected');
    document.getElementById('connectButton').textContent = 'CONNECT ';
  }
}

async function sendSerial(data) {
  const now = Date.now();
  if (now - lastSendTime < sendInterval) return; // throttle sends
  lastSendTime = now;

  console.log(data);
  document.getElementById('serialOutput').textContent = data;

  if (!writer || !isConnected) return;

  try {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data + "\n"));
  } catch (err) {
    console.error("Send failed:", err);
    isConnected = false;
    document.getElementById('statusIndicator').classList.remove('connected');
    document.getElementById('connectButton').textContent = 'CONNECT ';
  }
}


function generateMotorCommand(side, value) {
  value = parseInt(value);
//   if (value === 0) {
//     return `${side.toUpperCase()}STOP$`;
//   }
  
  const direction = value > 0 ? "CW" : "CCW";
//   const speed = Math.abs(value).toString().padStart(3, '0');
  const speed = Math.abs(value).toString();
  return `${side.toUpperCase()}${direction}#${speed}$,`;
}

// Initialize the controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initSliders();
  document.getElementById('connectButton').addEventListener('click', connectSerial);
});