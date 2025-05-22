def on_button_pressed_a():
    basic.show_string("" + str((Ldirection)))
input.on_button_pressed(Button.A, on_button_pressed_a)

def on_button_pressed_b():
    basic.show_string("" + str((Rdirection)))
input.on_button_pressed(Button.B, on_button_pressed_b)

def on_received_value(name, value):
    global Ldirection, Lspeed, Rdirection, Rspeed, Servo
    if name == "Ld":
        Ldirection = value
    if name == "Lspeed":
        Lspeed = value
    if name == "Rd":
        Rdirection = value
    if name == "Rspeed":
        Rspeed = value
    if name == "Servo":
        Servo = value
radio.on_received_value(on_received_value)

Servo = 0
Rspeed = 0
Lspeed = 0
Rdirection = 0
Ldirection = 0
radio.set_group(1)

def on_forever():
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_A, Rspeed, Rdirection, -1)
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_B, Lspeed, Ldirection, -1)
    pins.servo_write_pin(AnalogPin.P1, Servo)
basic.forever(on_forever)
