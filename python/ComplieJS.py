#!/usr/bin/python2.4

import httplib, urllib, sys


#open js file : "..\\js\\main.js", readonly
filePath="..\js\\main.js"
filePath_min="..\js\\main_min.js"


file=open(filePath, 'r')
js=file.read()
js_min=open(filePath_min, 'w')


# Define the parameters for the POST request and encode them in
# a URL-safe format.

params = urllib.urlencode([
    ('js_code', js),
    ('compilation_level', 'SIMPLE_OPTIMIZATIONS'),
    ('output_format', 'text'),
    ('output_info', 'compiled_code'),
  ])

# Always use the following value for the Content-type header.
headers = { "Content-type": "application/x-www-form-urlencoded" }

conn = httplib.HTTPConnection('closure-compiler.appspot.com')
conn.request('POST', '/compile', params, headers)
response = conn.getresponse()
data = response.read()


#print complied js
print data



#write file
js_min.write(data)
js_min.close()

print "compile JS from '" + filePath + "' to '" + filePath_min + "' successfully"



file.close()
conn.close()

