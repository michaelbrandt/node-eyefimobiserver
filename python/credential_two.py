import hashlib

key = "00000000000000000000000000000000" # Key is always 00..0

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
    snonce  = raw_input()
    mac     = raw_input()
    print str(get_credential(mac + key + snonce))

if __name__ == '__main__':
    main()