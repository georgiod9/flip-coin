import binascii

# This is the blob data you extract
blob_string = "\x1d\x59\x5f\x3c\x94\x17\x5b\xb6\x14\xad\x4d\xd9\xf9\x7f\x72\x57\xe0\xfc\xec\x87\xee\xa5\x26\xa3\x45\x6f\x33\xce\x0e\x96\x69\xef"

# Convert binary data to hexadecimal string
hex_string = binascii.hexlify(blob_string.encode('latin1')).decode('utf-8')
print(hex_string)
