import hashlib
#
# @author Maximilian Golla, RUB, 2015
# For more details visit: https://www.os3.nl/_media/2013-2014/courses/ot/connor_stavros.pdf
#
# Generating Eye-Fi Mobi SOAP credentials
#
# Protocol:
# Eye-Fi ----------------------------------------------------- App
#        ------------------ mac, cnonce --------------------->
#        <-credential_1 = MD5(FUNC(mac||cnonce||key)), snonce
#        --credential_2 = MD5(FUNC(mac||key||snonce)) ------->
#
# FUNC = hexStringToByteArray
#
# Developer of Eye-Fi used this Stockoverflow code:
# https://stackoverflow.com/questions/140131
#
#    public static byte[] hexStringToByteArray(String s) {
#        int len = s.length();
#        byte[] data = new byte[len / 2];
#        for (int i = 0; i < len; i += 2) {
#            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
#                                 + Character.digit(s.charAt(i+1), 16));
#        }
#        return data;
#    }

key = "00000000000000000000000000000000" # Key is always 00..0
mac = "00185669affc" # Your Eye-Fi card has a different MAC address
cnonce = "6205b2623d62e63a70090757db569158" # Number Used Once (NONCE), different for every datatransfer
snonce = "30c1ac2479d4ae4b52c80ea9809a6fcc" # Number Used Once (NONCE), different for every datatransfer
# Values observed via Wireshark 
# credentail1 = "0abb59eb0ba33cf96b8d5916c33b215b"
# credentail2 = "4b9203ad6bdb40fadbd36ccafb17223d"

def get_credential(string):
    h = hashlib.md5()                        # Init a new empty MD5 hash
    for i in range (0 , len(string) , 2):    # Move along the string, take 2 chars (1 Byte, e.g., 'af') at once
        chunk = string[i:i+2]                # Store 2 chars (1 Byte, e.g., 'af')
        hexval = '0x' + chunk                # Prepend '0x' -> '0xaf'
        dec = int(hexval, 16)                # Convert Hex ('0xaf') to Decimal (175)
        byte = unichr(dec).encode('Latin-1') # Get unicode char at position <dec> (e.g., 'SymbolX'), convert it to Latin-1 (e.g., 'SymbolY')
        h.update(byte)                       # Add this single byte to the hash for later use (do not yet calculat the md5 hash)
    return h.hexdigest()                     # At the end calculate MD5 hash for the complete byte array

def main():
    print "MAC address:\t"+str(mac)
    print "cnonce:\t\t"+str(cnonce)
    print "key:\t\t"+str(key)
    print "Calculating\tMD5{hexStringToByteArray(MAC address + cnonce + key)}"
    print "Credential 1:\t"+str(get_credential(mac + cnonce + key))
    print
    print "MAC address:\t"+str(mac)
    print "key:\t\t"+str(key)
    print "snonce:\t\t"+str(snonce)
    print "Calculating\tMD5{hexStringToByteArray(MAC address + key + snonce)}"
    print "Credential 2:\t"+str(get_credential(mac + key + snonce))

if __name__ == '__main__':
    main()