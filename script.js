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
    // Update the display value when slider changes
    if (slider.id === 'servoSlider') {
      const servoValueDisplay = document.getElementById('servoValue');
      servoValueDisplay.textContent = slider.value;
    }
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
  const command = `RC${channel}#${value};$`;
  sendSerial(command);
}

// Keyboard controls
function initKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    const now = Date.now();
    if (now - lastSendTime < sendInterval) return;
    lastSendTime = now;

    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === 'radio') {
      // Radio mode key bindings (unchanged)
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          sendRadioCommand('4');
          break;
        case 'arrowdown':
        case 's':
          sendRadioCommand('5');
          break;
        case 'arrowleft':
        case 'a':
          sendRadioCommand('6');
          break;
        case 'arrowright':
        case 'd':
          sendRadioCommand('7');
          break;
        case 'f':
          sendRadioCommand('1');
          break;
        case 'g':
          sendRadioCommand('2');
          break;
        case 'r':
          sendRadioCommand('3');
          break;
      }
    } else if (mode === 'serial') {
      // Serial mode key bindings
      const leftSlider = document.getElementById('leftSlider');
      const rightSlider = document.getElementById('rightSlider');
      const servoSlider = document.getElementById('servoSlider');
      const maxSpeed = parseInt(leftSlider.max); // Assuming both motor sliders have same max
      const minSpeed = parseInt(leftSlider.min);
      const servoMax = parseInt(servoSlider.max);
      const servoMin = parseInt(servoSlider.min);
      const motorStep = maxSpeed / 10; // Step size for motor sliders
      const servoStep = (servoMax - servoMin) / 10; // Step size for servo slider

      let leftValue = parseInt(leftSlider.value);
      let rightValue = parseInt(rightSlider.value);
      let servoValue = parseInt(servoSlider.value);
      let changed = false;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          // Both sliders go up; if negative, reset to 0 first
          leftValue = leftValue < 0 ? 0 : Math.min(maxSpeed, leftValue + motorStep);
          rightValue = rightValue < 0 ? 0 : Math.min(maxSpeed, rightValue + motorStep);
          changed = true;
          break;
        case 'arrowdown':
        case 's':
          // Both sliders go down; if positive, reset to 0 first
          leftValue = leftValue > 0 ? 0 : Math.max(minSpeed, leftValue - motorStep);
          rightValue = rightValue > 0 ? 0 : Math.max(minSpeed, rightValue - motorStep);
          changed = true;
          break;
        case 'arrowleft':
        case 'a':
          // Left goes down (if positive, reset to 0); right goes up (if negative, reset to 0)
          leftValue = leftValue > 0 ? 0 : Math.max(minSpeed, leftValue - motorStep);
          rightValue = rightValue < 0 ? 0 : Math.min(maxSpeed, rightValue + motorStep);
          changed = true;
          break;
        case 'arrowright':
        case 'd':
          // Right goes down (if positive, reset to 0); left goes up (if negative, reset to 0)
          rightValue = rightValue > 0 ? 0 : Math.max(minSpeed, rightValue - motorStep);
          leftValue = leftValue < 0 ? 0 : Math.min(maxSpeed, leftValue + motorStep);
          changed = true;
          break;
        case '=': // '+' key (with or without Shift)
        case '+':
          servoValue = Math.min(servoMax, servoValue + servoStep);
          changed = true;
          break;
        case '-':
          servoValue = Math.max(servoMin, servoValue - servoStep);
          changed = true;
          break;
      }
      sendSerialCommand();

      if (changed) {
        // Update sliders
        leftSlider.value = leftValue;
        rightSlider.value = rightValue;
        servoSlider.value = servoValue;

        // Update display values
        document.getElementById('leftSliderValue').textContent = leftValue;
        document.getElementById('rightSliderValue').textContent = rightValue;
        document.getElementById('servoValue').textContent = servoValue;

        // Directly send serial command
        sendSerialCommand();

        // Trigger input event for consistency
        const event = new Event('input', { bubbles: true });
        leftSlider.dispatchEvent(event);
      }
    }
  });

  // Reset motor sliders to 0 on keyup in serial mode
  document.addEventListener('keyup', (e) => {
    const now = Date.now();
    if (now - lastSendTime < sendInterval) return;
    lastSendTime = now;

    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'serial') {
      const leftSlider = document.getElementById('leftSlider');
      const rightSlider = document.getElementById('rightSlider');
      const keys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 's', 'a', 'd'];

      if (keys.includes(e.key.toLowerCase())) {
        leftSlider.value = 0;
        rightSlider.value = 0;
        document.getElementById('leftSliderValue').textContent = 0;
        document.getElementById('rightSliderValue').textContent = 0;
        // Directly send serial command
        sendSerialCommand();
        // Trigger input event for consistency
        const event = new Event('input', { bubbles: true });
        leftSlider.dispatchEvent(event);
      }
    }
  });
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
  initKeyboardControls();
  document.getElementById('connectButton').addEventListener('click', connectSerial);
});