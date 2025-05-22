let port, writer, isConnected = false;
let lastLeft = 0, lastRight = 0, lastServo = 90;
let activeSlider = null;
let lastSendTime = 0;
const sendInterval = 150; // milliseconds delay between sends

// Mode handling
function initModeToggle() {
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('serialModePanel').style.display = e.target.value === 'serial' ? 'block' : 'none';
      document.getElementById('radioModePanel').style.display = e.target.value === 'radio' ? 'block' : 'none';
    });
  });
}

// Touch and slider handling
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
    if (activeSlider.classList.contains('motor-slider')) {
      activeSlider.value = 0;
      const event = new Event('input', { bubbles: true });
      activeSlider.dispatchEvent(event);
    }
    activeSlider = null;
  }
}

function initSliders() {
  const sliders = document.querySelectorAll('input[type="range"]');

  sliders.forEach(slider => {
    // Update value displays
    const valueDisplay = document.getElementById(`${slider.id}Value`);
    if (valueDisplay) {
      valueDisplay.textContent = slider.value;
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
      });
    }

    // Mouse/pointer events
    slider.addEventListener('input', handleSliderChange);
    slider.addEventListener('change', handleSliderChange);
    slider.addEventListener('mouseup', () => {
      if (slider.classList.contains('motor-slider')) {
        slider.value = 0;
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
      }
    });

    // Touch events
    slider.addEventListener('touchstart', handleTouchStart, { passive: false });
    slider.addEventListener('touchend', handleTouchEnd, { passive: false });
  });

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
}

function handleSliderChange(e) {
  const now = Date.now();
  if (now - lastSendTime < sendInterval) return;
  lastSendTime = now;

  const slider = e.target;
  if (slider.id === 'leftSlider' || slider.id === 'rightSlider' || slider.id === 'servoSlider') {
    sendSerialCommand();
  }
}

// Servo preset button handling
function initServoPresets() {
  document.querySelectorAll('.servo-preset-btn').forEach(button => {
    button.addEventListener('click', () => {
      const angle = button.getAttribute('data-angle');
      const servoSlider = document.getElementById('servoSlider');
      const servoValueDisplay = document.getElementById('servoValue');

      // Update slider value and display
      servoSlider.value = angle;
      servoValueDisplay.textContent = angle;

      // Directly trigger serial command to ensure it's sent
      const now = Date.now();
      if (now - lastSendTime >= sendInterval) {
        lastSendTime = now;
        sendSerialCommand();
      }
    });
  });
}

// Serial mode command generation
function sendSerialCommand() {
  const leftValue = parseInt(document.getElementById('leftSlider').value);
  const rightValue = parseInt(document.getElementById('rightSlider').value);
  const servoValue = parseInt(document.getElementById('servoSlider').value);

  // Get directions (A for negative/anticlockwise, C for positive/clockwise)
  const leftDir = leftValue < 0 ? 'A' : 'C';
  const rightDir = rightValue < 0 ? 'A' : 'C';
  
  // Get absolute speeds
  const leftSpeed = Math.abs(leftValue);
  const rightSpeed = Math.abs(rightValue);

  // Only send if values have changed
  if (leftSpeed !== lastLeft || rightSpeed !== lastRight || servoValue !== lastServo) {
    const command = `L${leftSpeed}R${rightSpeed}S${servoValue}#${leftDir}${rightDir}$`;
    sendSerial(command);
    
    lastLeft = leftSpeed;
    lastRight = rightSpeed;
    lastServo = servoValue;
  }
}

// Radio mode command generation
function initRadioControls() {
  // Update radio channel display
  const radioChannel = document.getElementById('radioChannel');
  const radioChannelValue = document.getElementById('radioChannelValue');
  radioChannel.addEventListener('input', () => {
    radioChannelValue.textContent = radioChannel.value;
  });

  // Button handlers
  document.querySelectorAll('.input-btn').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');
      sendRadioCommand(value);
    });
  });

  // Custom input handler
  document.getElementById('sendCustomBtn').addEventListener('click', () => {
    const value = document.getElementById('customInput').value;
    if (value) {
      sendRadioCommand(value);
    }
  });
}

function sendRadioCommand(value) {
  const channel = document.getElementById('radioChannel').value;
  const command = `RC${channel}#${value}$`;
  sendSerial(command);
}

// Serial connection functions
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initModeToggle();
  initSliders();
  initRadioControls();
  initServoPresets();
  document.getElementById('connectButton').addEventListener('click', connectSerial);
});