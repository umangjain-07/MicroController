def rotatecheck():
    global Ldirection, Rdirection
    if String2.includes("CC"):
        Ldirection = 0
        Rdirection = 0
    elif String2.includes("CA"):
        Ldirection = 0
        Rdirection = 1
    elif String2.includes("AC"):
        Ldirection = 1
        Rdirection = 0
    elif String2.includes("AA"):
        Ldirection = 1
        Rdirection = 1
    radio.send_value("Ldirection", Ldirection)
    radio.send_value("Rdirection", Rdirection)
def convert(startindex: str, endindex: str):
    global start_index, end_index, value
    start_index = String2.index_of(startindex)
    end_index = String2.index_of(endindex)
    value = parse_float(String2.substr(start_index + 1, end_index))
value = 0
end_index = 0
start_index = 0
Rdirection = 0
Ldirection = 0
String2 = ""
basic.show_icon(IconNames.HOUSE)
serial.set_baud_rate(BaudRate.BAUD_RATE115200)
serial.redirect_to_usb()
radio.set_group(1)
basic.pause(100)
basic.clear_screen()

def on_forever():
    global String2
    String2 = serial.read_until(serial.delimiters(Delimiters.DOLLAR))
    if String2.includes("RC"):
        convert("C", "#")
        radio.set_group(value)
        convert("#", ";")
        radio.send_number(value)
        basic.show_icon(IconNames.SWORD)
        basic.clear_screen()
    else:
        convert("L", "R")
        radio.send_value("Lspeed", value)
        convert("R", "S")
        radio.send_value("Rspeed", value)
        convert("S", "#")
        radio.send_value("Servo", value)
        rotatecheck()
basic.forever(on_forever)
