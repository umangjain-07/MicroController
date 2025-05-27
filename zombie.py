def on_received_number(receivedNumber):
    global Servo, Ldirection, Lspeed, Rdirection, Rspeed
    if receivedNumber == 1:
        basic.show_string("A")
        Servo = 0
    elif receivedNumber == 2:
        basic.show_string("B")
        Servo = 90
    elif receivedNumber == 3:
        basic.show_string("R")
        Ldirection = 0
        Lspeed = 0
        Rdirection = 0
        Rspeed = 0
    elif receivedNumber == 4:
        basic.show_string("W")
        Ldirection = 0
        Lspeed = 255
        Rdirection = 1
        Rspeed = 255
    elif receivedNumber == 5:
        basic.show_string("S")
        Ldirection = 1
        Lspeed = 255
        Rdirection = 0
        Rspeed = 255
    elif receivedNumber == 6:
        basic.show_string("A")
        Ldirection = 0
        Lspeed = 255
        Rdirection = 0
        Rspeed = 255
    elif receivedNumber == 7:
        basic.show_string("D")
        Ldirection = 1
        Lspeed = 255
        Rdirection = 1
        Rspeed = 255
    basic.clear_screen()
radio.on_received_number(on_received_number)

def on_received_value(name, value):
    global Ldirection, Lspeed, Rdirection, Rspeed, Servo
    basic.show_icon(IconNames.SKULL)
    if name == "Ld":
        Ldirection = value
    if name == "Lspeed":
        Lspeed = value
    if name == "Rd":
        Rdirection = 1 - value
    if name == "Rspeed":
        Rspeed = value
    if name == "Servo":
        Servo = value
    basic.clear_screen()
radio.on_received_value(on_received_value)

def Stop():
    global Rspeed, Rdirection, Lspeed, Ldirection
    basic.pause(200)
    Rspeed = 0
    Rdirection = 0
    Lspeed = 0
    Ldirection = 0
    basic.clear_screen()
Rspeed = 0
Rdirection = 0
Lspeed = 0
Ldirection = 0
Servo = 0
basic.show_icon(IconNames.SKULL)
radio.set_group(1)
basic.clear_screen()

def on_forever():
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_A, Rspeed, Rdirection, -1)
    GigoExt.dd_mmotor2(MotorChannel.MOTOR_B, Lspeed, Ldirection, -1)
    pins.servo_write_pin(AnalogPin.P1, Servo)
basic.forever(on_forever)
