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
Rdirection = 0
Lspeed = 0
Ldirection = 0
basic.show_icon(IconNames.SKULL)
radio.set_group(1)
basic.clear_screen()

def on_forever():
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_A, Rspeed, Rdirection, -1)
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_B, Lspeed, Ldirection, -1)
    pins.servo_write_pin(AnalogPin.P1, Servo)
basic.forever(on_forever)
