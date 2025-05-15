from flask import Flask, render_template, request, jsonify
import serial
import threading
import time

app = Flask(__name__)

# Micro:bit connection state
microbit_connected = False
microbit_serial = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/connect', methods=['POST'])
def connect():
    global microbit_connected, microbit_serial
    
    try:
        # Connect to Micro:bit via serial
        microbit_serial = serial.Serial('COM3', 115200, timeout=1)  # Adjust COM port as needed
        microbit_connected = True
        return jsonify({'status': 'connected'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/command', methods=['POST'])
def handle_command():
    if not microbit_connected:
        return jsonify({'status': 'error', 'message': 'Not connected to Micro:bit'}), 400
    
    data = request.json
    command = data.get('command')
    value = data.get('value')
    
    try:
        # Send command to Micro:bit
        if command == 'motor':
            microbit_serial.write(f"MOTOR {value}\n".encode())
        elif command == 'servo':
            microbit_serial.write(f"SERVO {value}\n".encode())
        elif command == 'button':
            microbit_serial.write(f"BUTTON {value}\n".encode())
        
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def read_from_microbit():
    while microbit_connected:
        if microbit_serial.in_waiting:
            line = microbit_serial.readline().decode().strip()
            # Process incoming data from Micro:bit (sensor readings, etc.)
            print("From Micro:bit:", line)
        time.sleep(0.1)

if __name__ == '__main__':
    # Start a thread to read from Micro:bit
    if microbit_connected:
        thread = threading.Thread(target=read_from_microbit)
        thread.daemon = True
        thread.start()
    
    app.run(host='0.0.0.0', port=5000, debug=True)