let port, writer, isConnected = false;
let bluetoothDevice, bluetoothCharacteristic, isBluetoothConnected = false;
let lastLeft = 0, lastRight = 0, lastServo = 90;
let activeSliders = new Set();
let lastSendTime = 0;
const sendInterval = 100;

// Multi-touch support
let activeTouches = new Map();

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initModeToggle();
  initSliders();
  initRadioControls();
  initServoPresets();
  initKeyboardControls();
  initButtonAnimations();
  initBluetoothControls();
  initTouchControls();
  updateChannelDisplay();
  document.getElementById('connectButton').addEventListener('click', connectSerial);
  document.getElementById('bluetoothConnectBtn').addEventListener('click', connectBluetooth);
});

// Mode handling
function initModeToggle() {
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('serialModePanel').style.display = e.target.value === 'serial' ? 'block' : 'none';
      document.getElementById('radioModePanel').style.display = e.target.value === 'radio' ? 'block' : 'none';
      document.getElementById('bluetoothModePanel').style.display = e.target.value === 'bluetooth' ? 'block' : 'none';
      
      // Add mode switch animation
      const activePanel = e.target.value === 'serial' ? 'serialModePanel' : 
                         e.target.value === 'radio' ? 'radioModePanel' : 'bluetoothModePanel';
      const panel = document.getElementById(activePanel);
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(20px)';
        setTimeout(() => {
          panel.style.opacity = '1';
          panel.style.transform = 'translateY(0)';
        }, 100);
      }
    });
  });
}

// Multi-touch slider handling
function handleTouchStart(e) {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const slider = touch.target.closest('input[type="range"]');
    if (slider) {
      activeSliders.add(slider);
      activeTouches.set(touch.identifier, slider);
      
      // Add visual feedback
      slider.style.boxShadow = '0 0 25px var(--primary-cyan)';
      updateSliderFromTouch(touch, slider);
    }
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const slider = activeTouches.get(touch.identifier);
    if (slider) {
      updateSliderFromTouch(touch, slider);
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const slider = activeTouches.get(touch.identifier);
    if (slider) {
      // Reset visual feedback
      slider.style.boxShadow = '';
      
      if (slider.classList.contains('motor-slider')) {
        slider.value = 0;
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
      }
      
      activeSliders.delete(slider);
      activeTouches.delete(touch.identifier);
    }
  }
}

function updateSliderFromTouch(touch, slider) {
  const rect = slider.getBoundingClientRect();
  let percentage;
  
  if (slider.classList.contains('motor-slider')) {
    // For rotated vertical sliders (-90deg rotation)
    // We need to map clientX to the slider value since it's rotated
    // Left side of rotated slider = top (max value)
    // Right side of rotated slider = bottom (min value)
    percentage = 1 - ((touch.clientX - rect.left) / rect.width);
  } else {
    // Horizontal slider
    percentage = (touch.clientX - rect.left) / rect.width;
  }
  
  const clamped = Math.max(0, Math.min(1, percentage));
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  
  const value = Math.round(min + (max - min) * clamped);

  if (slider.value != value) {
    slider.value = value;
    const event = new Event('input', { bubbles: true });
    slider.dispatchEvent(event);
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

    // Enhanced visual feedback
    slider.addEventListener('input', (e) => {
      handleSliderChange(e);
      e.target.style.boxShadow = '0 0 20px var(--primary-cyan)';
      setTimeout(() => {
        e.target.style.boxShadow = '';
      }, 200);
    });

    slider.addEventListener('change', handleSliderChange);
    
    slider.addEventListener('mouseup', () => {
      if (slider.classList.contains('motor-slider')) {
        slider.style.transition = 'all 0.3s ease';
        slider.value = 0;
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
        setTimeout(() => {
          slider.style.transition = '';
        }, 300);
      }
    });

    // Multi-touch events
    slider.addEventListener('touchstart', handleTouchStart, { passive: false });
    slider.addEventListener('touchmove', handleTouchMove, { passive: false });
    slider.addEventListener('touchend', handleTouchEnd, { passive: false });
  });
}

function handleSliderChange(e) {
  const now = Date.now();
  if (now - lastSendTime < sendInterval) return;
  lastSendTime = now;

  const slider = e.target;
  if (slider.id === 'leftSlider' || slider.id === 'rightSlider' || slider.id === 'servoSlider') {
    if (slider.id === 'servoSlider') {
      const servoValueDisplay = document.getElementById('servoValue');
      if (servoValueDisplay) {
        servoValueDisplay.textContent = slider.value;
        // Add pulse animation
        servoValueDisplay.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
          servoValueDisplay.style.animation = '';
        }, 300);
      }
    }
    sendSerialCommand();
  }
}

// Enhanced servo preset handling
function initServoPresets() {
  document.querySelectorAll('.servo-preset-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const angle = button.getAttribute('data-angle');
      const servoSlider = document.getElementById('servoSlider');
      const servoValueDisplay = document.getElementById('servoValue');

      // Remove active class from all buttons
      document.querySelectorAll('.servo-preset-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      button.classList.add('active');

      // Update slider and display with animation
      servoSlider.style.transition = 'all 0.3s ease';
      servoSlider.value = angle;
      if (servoValueDisplay) {
        servoValueDisplay.textContent = angle;
        servoValueDisplay.style.animation = 'pulse 0.5s ease';
      }

      // Send command
      const now = Date.now();
      if (now - lastSendTime >= sendInterval) {
        lastSendTime = now;
        sendSerialCommand();
      }

      // Reset transition
      setTimeout(() => {
        servoSlider.style.transition = '';
        if (servoValueDisplay) {
          servoValueDisplay.style.animation = '';
        }
      }, 300);
    });
  });
}

// Enhanced serial command generation
function sendSerialCommand() {
  const leftValue = parseInt(document.getElementById('leftSlider').value);
  const rightValue = parseInt(document.getElementById('rightSlider').value);
  const servoValue = parseInt(document.getElementById('servoSlider').value);

  const leftDir = leftValue < 0 ? 'A' : 'C';
  const rightDir = rightValue < 0 ? 'A' : 'C';

  const leftSpeed = Math.abs(leftValue);
  const rightSpeed = Math.abs(rightValue);

  if (leftSpeed !== lastLeft || rightSpeed !== lastRight || servoValue !== lastServo) {
    const command = `L${leftSpeed}R${rightSpeed}S${servoValue}#${leftDir}${rightDir}$`;
    sendCommand(command);

    lastLeft = leftSpeed;
    lastRight = rightSpeed;
    lastServo = servoValue;
  }
}

// Enhanced radio controls
function initRadioControls() {
  const radioChannel = document.getElementById('radioChannel');
  
  radioChannel.addEventListener('input', updateChannelDisplay);

  // Enhanced button handlers with visual feedback
  document.querySelectorAll('.input-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const value = button.getAttribute('data-value');
      
      // Add visual feedback
      button.classList.add('active');
      setTimeout(() => {
        button.classList.remove('active');
      }, 200);
      
      sendRadioCommand(value);
    });

    // Add hover sound effect simulation
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });

  // Custom input handler
  document.getElementById('sendCustomBtn').addEventListener('click', () => {
    const input = document.getElementById('customInput');
    const value = input.value;
    if (value) {
      sendRadioCommand(value);
      // Clear input with animation
      input.style.transition = 'all 0.3s ease';
      input.style.backgroundColor = 'rgba(0, 255, 136, 0.2)';
      setTimeout(() => {
        input.value = '';
        input.style.backgroundColor = '';
        input.style.transition = '';
      }, 300);
    }
  });
}

function updateChannelDisplay() {
  const channel = document.getElementById('radioChannel').value;
  const display = document.getElementById('radioChannelValue');
  if (display) {
    display.textContent = channel.padStart(2, '0');
    display.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
      display.style.animation = '';
    }, 300);
  }
}

function sendRadioCommand(value) {
  const channel = document.getElementById('radioChannel').value;
  const command = `RC${channel}#${value};$`;
  sendCommand(command);
}

// Bluetooth functionality
function initBluetoothControls() {
  // Check if Web Bluetooth is supported
  if (!navigator.bluetooth) {
    console.log('Web Bluetooth not supported');
    document.getElementById('bluetoothConnectBtn').disabled = true;
    document.getElementById('bluetoothConnectBtn').textContent = 'NOT SUPPORTED';
  }
}

async function connectBluetooth() {
  const connectBtn = document.getElementById('bluetoothConnectBtn');
  
  try {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API not supported in this browser.');
    }

    connectBtn.textContent = 'PAIRING...';
    connectBtn.disabled = true;

    // Request Bluetooth device
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'BBC micro:bit' }],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] // UART service UUID
    });

    // Connect to GATT server
    const server = await bluetoothDevice.gatt.connect();
    
    // Get UART service
    const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
    
    // Get TX characteristic (for sending data to micro:bit)
    bluetoothCharacteristic = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
    
    isBluetoothConnected = true;
    connectBtn.textContent = 'CONNECTED';
    connectBtn.style.background = 'linear-gradient(45deg, var(--success-green), var(--accent-green))';
    
    // Handle disconnection
    bluetoothDevice.addEventListener('gattserverdisconnected', () => {
      isBluetoothConnected = false;
      connectBtn.textContent = 'PAIR';
      connectBtn.disabled = false;
      connectBtn.style.background = '';
    });
    
  } catch (err) {
    console.error("Bluetooth connection failed:", err);
    alert("Bluetooth connection failed: " + (err.message || err));
    isBluetoothConnected = false;
    connectBtn.textContent = 'PAIR';
    connectBtn.disabled = false;
  }
}

// Touch controls for Bluetooth mode
function initTouchControls() {
  const touchPad = document.getElementById('touchPad');
  const touchIndicator = document.getElementById('touchIndicator');
  const touchZones = document.querySelectorAll('.touch-zone');
  
  // Touch pad controls
  touchPad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = touchPad.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    touchIndicator.style.left = x + 'px';
    touchIndicator.style.top = y + 'px';
    touchIndicator.style.opacity = '1';
    
    // Determine direction
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Use a threshold to determine primary direction
    const threshold = 20; // minimum distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < threshold) {
      // Too close to center, don't register direction
      return;
    }
    
    let direction = '';
    // Determine primary direction based on larger component
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement is primary
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical movement is primary
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    // Activate corresponding zone
    touchZones.forEach(zone => {
      zone.classList.remove('active');
      if (zone.dataset.direction === direction) {
        zone.classList.add('active');
      }
    });
    
    // Send Bluetooth command
    sendBluetoothDirectionCommand(direction);
  });
  
  touchPad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = touchPad.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    touchIndicator.style.left = x + 'px';
    touchIndicator.style.top = y + 'px';
    
    // Update direction during move
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    const threshold = 20;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance >= threshold) {
      let direction = '';
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      // Update active zones
      touchZones.forEach(zone => {
        zone.classList.remove('active');
        if (zone.dataset.direction === direction) {
          zone.classList.add('active');
        }
      });
    }
  });
  
  touchPad.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchIndicator.style.opacity = '0';
    touchZones.forEach(zone => zone.classList.remove('active'));
  });
  
  // Touch buttons
  document.getElementById('touchBtnA').addEventListener('touchstart', (e) => {
    e.preventDefault();
    sendBluetoothCommand('1'); // A button
  });
  
  document.getElementById('touchBtnB').addEventListener('touchstart', (e) => {
    e.preventDefault();
    sendBluetoothCommand('2'); // B button
  });
}

function sendBluetoothDirectionCommand(direction) {
  const directionMap = {
    'up': '4',
    'down': '5',
    'left': '6',
    'right': '7'
  };
  
  if (directionMap[direction]) {
    sendBluetoothCommand(directionMap[direction]);
  }
}

async function sendBluetoothCommand(value) {
  if (!isBluetoothConnected || !bluetoothCharacteristic) return;
  
  try {
    const channel = document.getElementById('radioChannel').value;
    const command = `RC${channel}#${value};$`;
    const encoder = new TextEncoder();
    await bluetoothCharacteristic.writeValue(encoder.encode(command + "\n"));
    
    // Update output display
    document.getElementById('serialOutput').textContent = command;
    const outputElement = document.getElementById('serialOutput');
    outputElement.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
      outputElement.style.animation = '';
    }, 300);
    
  } catch (err) {
    console.error("Bluetooth send failed:", err);
    isBluetoothConnected = false;
  }
}

// Enhanced keyboard controls
function initKeyboardControls() {
  let keysPressed = new Set();

  document.addEventListener('keydown', (e) => {
    if (keysPressed.has(e.key.toLowerCase())) return;
    keysPressed.add(e.key.toLowerCase());

    const now = Date.now();
    if (now - lastSendTime < sendInterval) return;
    lastSendTime = now;

    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === 'radio' || mode === 'bluetooth') {
      handleRadioKeyboard(e.key.toLowerCase());
    } else if (mode === 'serial') {
      handleSerialKeyboard(e.key.toLowerCase());
    }
  });

  document.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key.toLowerCase());
    
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'serial') {
      const now = Date.now();
      if (now - lastSendTime < sendInterval) return;
      lastSendTime = now;

      const motorKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 's', 'a', 'd'];
      if (motorKeys.includes(e.key.toLowerCase())) {
        resetMotorSliders();
      }
    }
  });
}

function handleRadioKeyboard(key) {
  const keyMap = {
    'arrowup': '4', 'w': '4',
    'arrowdown': '5', 's': '5',
    'arrowleft': '6', 'a': '6',
    'arrowright': '7', 'd': '7',
    'f': '1', 'g': '2', 'r': '3',
    'q': '10', 'e': '11', // L1, R1
    '1': '12', '2': '13', // L2, R2
    'space': '15', 'enter': '16', 'escape': '17' // Menu, Home, Select
  };
  
  if (keyMap[key]) {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'bluetooth') {
      sendBluetoothCommand(keyMap[key]);
    } else {
      sendRadioCommand(keyMap[key]);
    }
    highlightButton(keyMap[key]);
  }
}

function handleSerialKeyboard(key) {
  const leftSlider = document.getElementById('leftSlider');
  const rightSlider = document.getElementById('rightSlider');
  const servoSlider = document.getElementById('servoSlider');
  
  const maxSpeed = parseInt(leftSlider.max);
  const minSpeed = parseInt(leftSlider.min);
  const servoMax = parseInt(servoSlider.max);
  const servoMin = parseInt(servoSlider.min);
  const motorStep = 50;
  const servoStep = 15;

  let leftValue = parseInt(leftSlider.value);
  let rightValue = parseInt(rightSlider.value);
  let servoValue = parseInt(servoSlider.value);

  switch (key) {
    case 'arrowup':
    case 'w':
      leftValue = leftValue < 0 ? 0 : Math.min(maxSpeed, leftValue + motorStep);
      rightValue = rightValue < 0 ? 0 : Math.min(maxSpeed, rightValue + motorStep);
      break;
    case 'arrowdown':
    case 's':
      leftValue = leftValue > 0 ? 0 : Math.max(minSpeed, leftValue - motorStep);
      rightValue = rightValue > 0 ? 0 : Math.max(minSpeed, rightValue - motorStep);
      break;
    case 'arrowleft':
    case 'a':
      leftValue = leftValue > 0 ? 0 : Math.max(minSpeed, leftValue - motorStep);
      rightValue = rightValue < 0 ? 0 : Math.min(maxSpeed, rightValue + motorStep);
      break;
    case 'arrowright':
    case 'd':
      rightValue = rightValue > 0 ? 0 : Math.max(minSpeed, rightValue - motorStep);
      leftValue = leftValue < 0 ? 0 : Math.min(maxSpeed, leftValue + motorStep);
      break;
    case '=':
    case '+':
      servoValue = Math.min(servoMax, servoValue + servoStep);
      break;
    case '-':
      servoValue = Math.max(servoMin, servoValue - servoStep);
      break;
  }

  // Update sliders with animation
  updateSliderWithAnimation(leftSlider, leftValue);
  updateSliderWithAnimation(rightSlider, rightValue);
  updateSliderWithAnimation(servoSlider, servoValue);
  
  sendSerialCommand();
}

function updateSliderWithAnimation(slider, value) {
  slider.style.transition = 'all 0.2s ease';
  slider.value = value;
  slider.style.boxShadow = '0 0 20px var(--primary-cyan)';
  
  const event = new Event('input', { bubbles: true });
  slider.dispatchEvent(event);
  
  setTimeout(() => {
    slider.style.transition = '';
    slider.style.boxShadow = '';
  }, 200);
}

function resetMotorSliders() {
  const leftSlider = document.getElementById('leftSlider');
  const rightSlider = document.getElementById('rightSlider');
  
  updateSliderWithAnimation(leftSlider, 0);
  updateSliderWithAnimation(rightSlider, 0);
  
  sendSerialCommand();
}

function highlightButton(value) {
  const button = document.querySelector(`[data-value="${value}"]`);
  if (button) {
    button.classList.add('active');
    setTimeout(() => {
      button.classList.remove('active');
    }, 200);
  }
}

// Button animation system
function initButtonAnimations() {
  document.querySelectorAll('button, .input-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(0, 242, 255, 0.5);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Enhanced serial connection
async function connectSerial() {
  const connectBtn = document.getElementById('connectButton');
  const statusIndicator = document.getElementById('statusIndicator');
  const connectionText = document.getElementById('connectionText');
  
  try {
    if (!navigator.serial) {
      throw new Error('Web Serial API not supported in this browser.');
    }

    connectBtn.style.opacity = '0.7';
    connectBtn.disabled = true;
    connectionText.textContent = 'CONNECTING...';

    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    isConnected = true;
    
    statusIndicator.classList.add('connected');
    connectionText.textContent = 'CONNECTED';
    connectBtn.textContent = 'CONNECTION ESTABLISHED';
    
    // Success animation
    connectBtn.style.background = 'linear-gradient(45deg, var(--success-green), var(--accent-green))';
    connectBtn.style.animation = 'pulse 1s ease';
    
    setTimeout(() => {
      connectBtn.style.animation = '';
    }, 1000);
    
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Connection failed: " + (err.message || err));
    isConnected = false;
    statusIndicator.classList.remove('connected');
    connectionText.textContent = 'CONNECTION FAILED';
    connectBtn.textContent = 'RETRY CONNECTION';
    connectBtn.style.background = 'linear-gradient(45deg, var(--error-red), var(--warning-orange))';
  } finally {
    connectBtn.style.opacity = '1';
    connectBtn.disabled = false;
  }
}

// Universal command sender
async function sendCommand(data) {
  console.log(data);
  const outputElement = document.getElementById('serialOutput');
  outputElement.textContent = data;
  
  // Add transmission animation
  outputElement.style.animation = 'pulse 0.3s ease';
  setTimeout(() => {
    outputElement.style.animation = '';
  }, 300);

  const mode = document.querySelector('input[name="mode"]:checked').value;
  
  if (mode === 'bluetooth' && isBluetoothConnected && bluetoothCharacteristic) {
    // Send via Bluetooth
    try {
      const encoder = new TextEncoder();
      await bluetoothCharacteristic.writeValue(encoder.encode(data + "\n"));
    } catch (err) {
      console.error("Bluetooth send failed:", err);
      isBluetoothConnected = false;
    }
  } else if (writer && isConnected) {
    // Send via Serial
    try {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(data + "\n"));
    } catch (err) {
      console.error("Serial send failed:", err);
      isConnected = false;
      document.getElementById('statusIndicator').classList.remove('connected');
      document.getElementById('connectionText').textContent = 'CONNECTION LOST';
      document.getElementById('connectButton').textContent = 'RECONNECT';
    }
  }
}