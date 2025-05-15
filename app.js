document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize all tabs
    initializeMotorsTab();
    initializeSensorsTab();
    initializeButtonsTab();
    initializeAdvancedTab();
    
    // Connection button
    document.getElementById('connectBtn').addEventListener('click', connectToMicrobit);
    
    // Initialize status indicator
    updateConnectionStatus(false);
});

function initializeMotorsTab() {
    // Motor 1 controls
    const motor1Slider = document.getElementById('motor1Slider');
    const motor1Value = document.getElementById('motor1Value');
    
    motor1Slider.addEventListener('input', () => {
        motor1Value.textContent = motor1Slider.value + '%';
        sendMotorCommand(1, motor1Slider.value);
    });
    
    document.getElementById('motor1Dec').addEventListener('click', () => {
        motor1Slider.value = Math.max(0, motor1Slider.value - 10);
        motor1Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('motor1Inc').addEventListener('click', () => {
        motor1Slider.value = Math.min(100, parseInt(motor1Slider.value) + 10);
        motor1Slider.dispatchEvent(new Event('input'));
    });
    
    // Motor 2 controls (same as motor 1)
    const motor2Slider = document.getElementById('motor2Slider');
    const motor2Value = document.getElementById('motor2Value');
    
    motor2Slider.addEventListener('input', () => {
        motor2Value.textContent = motor2Slider.value + '%';
        sendMotorCommand(2, motor2Slider.value);
    });
    
    document.getElementById('motor2Dec').addEventListener('click', () => {
        motor2Slider.value = Math.max(0, motor2Slider.value - 10);
        motor2Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('motor2Inc').addEventListener('click', () => {
        motor2Slider.value = Math.min(100, parseInt(motor2Slider.value) + 10);
        motor2Slider.dispatchEvent(new Event('input'));
    });
    
    // Direction buttons
    document.getElementById('motorFwd').addEventListener('click', () => {
        sendDirectionCommand('FWD');
    });
    
    document.getElementById('motorRev').addEventListener('click', () => {
        sendDirectionCommand('REV');
    });
    
    document.getElementById('motorStop').addEventListener('click', () => {
        sendDirectionCommand('STOP');
    });
    
    // Servo controls
    const servo1Slider = document.getElementById('servo1Slider');
    const servo1Value = document.getElementById('servo1Value');
    
    servo1Slider.addEventListener('input', () => {
        servo1Value.textContent = servo1Slider.value + '°';
        sendServoCommand(1, servo1Slider.value);
    });
    
    // Servo preset buttons
    document.getElementById('servo1_0').addEventListener('click', () => {
        servo1Slider.value = 0;
        servo1Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo1_90').addEventListener('click', () => {
        servo1Slider.value = 90;
        servo1Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo1_180').addEventListener('click', () => {
        servo1Slider.value = 180;
        servo1Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo1_270').addEventListener('click', () => {
        servo1Slider.value = 270;
        servo1Slider.dispatchEvent(new Event('input'));
    });
    
    // Servo 2 controls (same as servo 1)
    const servo2Slider = document.getElementById('servo2Slider');
    const servo2Value = document.getElementById('servo2Value');
    
    servo2Slider.addEventListener('input', () => {
        servo2Value.textContent = servo2Slider.value + '°';
        sendServoCommand(2, servo2Slider.value);
    });
    
    // Servo 2 preset buttons
    document.getElementById('servo2_0').addEventListener('click', () => {
        servo2Slider.value = 0;
        servo2Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo2_90').addEventListener('click', () => {
        servo2Slider.value = 90;
        servo2Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo2_180').addEventListener('click', () => {
        servo2Slider.value = 180;
        servo2Slider.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('servo2_270').addEventListener('click', () => {
        servo2Slider.value = 270;
        servo2Slider.dispatchEvent(new Event('input'));
    });
}

function initializeSensorsTab() {
    // IR Sensor threshold
    const irThreshold = document.getElementById('irThreshold');
    const irThresholdValue = document.getElementById('irThresholdValue');
    
    irThreshold.addEventListener('input', () => {
        irThresholdValue.textContent = irThreshold.value + ' cm';
        sendSensorConfig('IR_THRESHOLD', irThreshold.value);
    });
    
    // IR Alert toggle
    document.getElementById('irAlertToggle').addEventListener('change', (e) => {
        sendSensorConfig('IR_ALERT', e.target.checked ? 'ON' : 'OFF');
    });
    
    // Ultrasonic update rate
    document.getElementById('usUpdateRate').addEventListener('change', (e) => {
        sendSensorConfig('US_RATE', e.target.value);
    });
    
    // Initialize sensor graph
    initSensorGraph();
}

function initializeButtonsTab() {
    const buttonA = document.getElementById('buttonA');
    const buttonB = document.getElementById('buttonB');
    const holdDuration = document.getElementById('holdDuration');
    const holdDurationValue = document.getElementById('holdDurationValue');
    
    // Update hold duration display
    holdDuration.addEventListener('input', () => {
        holdDurationValue.textContent = holdDuration.value + ' ms';
    });
    
    // Button A events
    buttonA.addEventListener('mousedown', () => pressButton('A'));
    buttonA.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressButton('A');
    });
    
    buttonA.addEventListener('mouseup', () => releaseButton('A'));
    buttonA.addEventListener('mouseleave', () => releaseButton('A'));
    buttonA.addEventListener('touchend', (e) => {
        e.preventDefault();
        releaseButton('A');
    });
    buttonA.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        releaseButton('A');
    });
    
    // Button B events
    buttonB.addEventListener('mousedown', () => pressButton('B'));
    buttonB.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressButton('B');
    });
    
    buttonB.addEventListener('mouseup', () => releaseButton('B'));
    buttonB.addEventListener('mouseleave', () => releaseButton('B'));
    buttonB.addEventListener('touchend', (e) => {
        e.preventDefault();
        releaseButton('B');
    });
    buttonB.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        releaseButton('B');
    });
}

function initializeAdvancedTab() {
    // Initialize custom joystick
    initJoystick();
    
    // Speed profiles
    document.getElementById('speedLow').addEventListener('click', () => {
        document.getElementById('customSpeed').value = 25;
        document.getElementById('customSpeed').dispatchEvent(new Event('input'));
    });
    
    document.getElementById('speedMed').addEventListener('click', () => {
        document.getElementById('customSpeed').value = 50;
        document.getElementById('customSpeed').dispatchEvent(new Event('input'));
    });
    
    document.getElementById('speedHigh').addEventListener('click', () => {
        document.getElementById('customSpeed').value = 75;
        document.getElementById('customSpeed').dispatchEvent(new Event('input'));
    });
    
    // Custom speed slider
    const customSpeed = document.getElementById('customSpeed');
    const customSpeedValue = document.getElementById('customSpeedValue');
    
    customSpeed.addEventListener('input', () => {
        customSpeedValue.textContent = customSpeed.value + '%';
        sendSpeedProfile(customSpeed.value);
    });
    
    // Ramp controls
    document.getElementById('rampUp').addEventListener('click', () => {
        sendRampCommand('UP');
    });
    
    document.getElementById('rampDown').addEventListener('click', () => {
        sendRampCommand('DOWN');
    });
}

function initJoystick() {
    const joystickArea = document.getElementById('joystickArea');
    const joystickThumb = document.getElementById('joystickThumb');
    const joystickX = document.getElementById('joystickX');
    const joystickY = document.getElementById('joystickY');
    
    const maxDistance = 70; // Maximum distance thumb can move from center
    let active = false;
    
    // Create Hammer manager for touch support
    const manager = new Hammer.Manager(joystickThumb);
    manager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    
    // Mouse events
    joystickThumb.addEventListener('mousedown', (e) => {
        active = true;
        document.addEventListener('mousemove', moveJoystick);
        document.addEventListener('mouseup', releaseJoystick);
    });
    
    // Touch events
    manager.on('panstart', () => {
        active = true;
    });
    
    manager.on('panmove', (e) => {
        if (!active) return;
        
        const rect = joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        moveThumb(e.center.x - centerX, e.center.y - centerY);
    });
    
    manager.on('panend pancancel', releaseJoystick);
    
    function moveJoystick(e) {
        if (!active) return;
        
        const rect = joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        moveThumb(e.clientX - centerX, e.clientY - centerY);
    }
    
    function moveThumb(deltaX, deltaY) {
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Limit to max distance
        const limitedDistance = Math.min(distance, maxDistance);
        
        // Calculate new position
        const newX = Math.cos(angle) * limitedDistance;
        const newY = Math.sin(angle) * limitedDistance;
        
        // Update thumb position
        joystickThumb.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
        
        // Normalize values (-1 to 1)
        const normalizedX = newX / maxDistance;
        const normalizedY = newY / maxDistance;
        
        // Update displayed coordinates
        joystickX.textContent = normalizedX.toFixed(2);
        joystickY.textContent = normalizedY.toFixed(2);
        
        // Send data to Micro:bit
        sendJoystickData(normalizedX, normalizedY);
    }
    
    function releaseJoystick() {
        active = false;
        document.removeEventListener('mousemove', moveJoystick);
        document.removeEventListener('mouseup', releaseJoystick);
        
        // Return to center with animation
        joystickThumb.style.transition = 'transform 0.2s ease-out';
        joystickThumb.style.transform = 'translate(-50%, -50%)';
        
        setTimeout(() => {
            joystickThumb.style.transition = '';
        }, 200);
        
        // Reset coordinates
        joystickX.textContent = '0';
        joystickY.textContent = '0';
        
        // Send zero values
        sendJoystickData(0, 0);
    }
}

function initSensorGraph() {
    const ctx = document.getElementById('usGraph').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'Distance (cm)',
                data: Array(20).fill(null),
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 200
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            animation: {
                duration: 0
            }
        }
    });
    
    // Store chart reference for updates
    window.usChart = chart;
}

function pressButton(button) {
    const btnElement = document.getElementById(`button${button}`);
    btnElement.classList.add('pressed');
    
    // Get hold duration
    const duration = parseInt(document.getElementById('holdDuration').value);
    
    // Send button press command
    sendButtonCommand(button, 'PRESS');
    
    // Auto-release after duration if still pressed
    btnElement._pressTimer = setTimeout(() => {
        if (btnElement.classList.contains('pressed')) {
            releaseButton(button);
        }
    }, duration);
}

function releaseButton(button) {
    const btnElement = document.getElementById(`button${button}`);
    btnElement.classList.remove('pressed');
    
    // Clear any pending auto-release
    if (btnElement._pressTimer) {
        clearTimeout(btnElement._pressTimer);
        delete btnElement._pressTimer;
    }
    
    // Send button release command
    sendButtonCommand(button, 'RELEASE');
}

async function connectToMicrobit() {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    const connectBtn = document.getElementById('connectBtn');
    const connectingIcon = document.querySelector('.connecting-icon');
    
    // Visual feedback
    statusElement.textContent = 'Connecting...';
    statusText.textContent = 'Connecting...';
    connectBtn.disabled = true;
    connectingIcon.classList.add('fa-spin');
    connectingIcon.classList.remove('fa-check', 'fa-times');
    
    try {
        // Simulate connection (replace with actual connection code)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Random success/failure for demo (remove in production)
        const success = Math.random() > 0.2;
        
        if (success) {
            statusElement.textContent = 'Connected';
            statusText.textContent = 'Connected';
            connectingIcon.classList.replace('fa-circle-notch', 'fa-check');
            connectingIcon.classList.remove('fa-spin');
            updateConnectionStatus(true);
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        statusElement.textContent = 'Error: ' + error.message;
        statusText.textContent = 'Disconnected';
        connectingIcon.classList.replace('fa-circle-notch', 'fa-times');
        connectingIcon.classList.remove('fa-spin');
        updateConnectionStatus(false);
    } finally {
        connectBtn.disabled = false;
    }
}

function updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusIndicator.style.backgroundColor = '#38b000'; // Green
        statusText.textContent = 'Connected';
    } else {
        statusIndicator.style.backgroundColor = '#ef233c'; // Red
        statusText.textContent = 'Disconnected';
    }
}

// Communication functions (replace with your actual implementation)
function sendMotorCommand(motor, speed) {
    console.log(`Motor ${motor} set to ${speed}%`);
    // Implement actual Micro:bit communication
}

function sendDirectionCommand(direction) {
    console.log(`Direction set to ${direction}`);
    // Implement actual Micro:bit communication
}

function sendServoCommand(servo, angle) {
    console.log(`Servo ${servo} set to ${angle}°`);
    // Implement actual Micro:bit communication
}

function sendSensorConfig(sensor, value) {
    console.log(`Sensor ${sensor} config set to ${value}`);
    // Implement actual Micro:bit communication
}

function sendButtonCommand(button, action) {
    console.log(`Button ${button} ${action}`);
    // Implement actual Micro:bit communication
}

function sendJoystickData(x, y) {
    console.log(`Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
    // Implement actual Micro:bit communication
}

function sendSpeedProfile(speed) {
    console.log(`Speed profile set to ${speed}%`);
    // Implement actual Micro:bit communication
}

function sendRampCommand(direction) {
    console.log(`Ramp ${direction}`);
    // Implement actual Micro:bit communication
}

// Simulate incoming sensor data (remove in production)
setInterval(() => {
    if (document.getElementById('statusText').textContent === 'Connected') {
        // Update IR sensor reading
        const irReading = Math.floor(Math.random() * 200);
        document.getElementById('irReading').textContent = irReading;
        
        // Update US sensor reading and chart
        const usReading = Math.floor(Math.random() * 200);
        document.getElementById('usReading').textContent = usReading;
        
        if (window.usChart) {
            window.usChart.data.datasets[0].data.push(usReading);
            window.usChart.data.datasets[0].data.shift();
            window.usChart.update();
        }
        
        // Update battery level
        const batteryLevel = Math.max(10, Math.floor(Math.random() * 100));
        document.getElementById('batteryLevel').textContent = batteryLevel + '%';
    }
}, 1000);