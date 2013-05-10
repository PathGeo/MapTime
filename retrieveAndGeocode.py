
#PathGeo Libraries
from GeocodingEngine.Geocoder import AddressGeocoder

#Standard Libraries
import cgi, json, re
import cgitb, os, pickle


#Functions to check potential location fields
IS_LAT = lambda text: bool(re.compile(r'lat|latitude', re.I).search(text))
IS_LON = lambda text: bool(re.compile(r'lon|lng|longitude', re.I).search(text))
IS_ADDR = lambda text: bool(re.compile(r'addr|address', re.I).search(text))
IS_CITY = lambda text: bool(re.compile(r'city', re.I).search(text))
IS_STATE = lambda text: bool(re.compile(r'state', re.I).search(text))
IS_ZIP = lambda text: bool(re.compile(r'zip|postal', re.I).search(text))
IS_LOCATION = lambda text: bool(re.compile(r'loc|location', re.I).search(text))


def containsField(items, checker):
	return any(map(lambda item: checker(item), items))

def getField(items, checker):
	found = filter(lambda item: checker(item), items)
	return None if not found else found.pop()

	
cgitb.enable()


form = cgi.FieldStorage()
fname = form['fileName'].value
geoColumns = form.getlist("geoColumns[]")


geoFields = []

lat = getField(geoColumns, IS_LAT)
lon = getField(geoColumns, IS_LON)
addr = getField(geoColumns, IS_ADDR)
city = getField(geoColumns, IS_CITY)
state = getField(geoColumns, IS_STATE)
zip = getField(geoColumns, IS_ZIP)
loc = getField(geoColumns, IS_LOCATION)


if lat and lon:
	print 'COOL!'
	
elif addr and city and state and zip:
	geoFields.append(addr)
	geoFields.append(city)
	geoFields.append(state)
	geoFields.append(zip)
	
elif loc:
	geoFields.append(loc)
	
elif addr:
	geoFields.append(addr)
	

jsonRows = pickle.load(open(os.path.abspath(__file__).replace(__file__, fname + ".p")))

os.remove(os.path.abspath(__file__).replace(__file__, fname + ".p"))

geoRows = []

#Note: Username and PW for geocoder.US does not currently seem to work with geopy
#so this is not actually using our account right now...
geocoder = AddressGeocoder(username='PathGeo2', password='PGGe0C0der')

#Go through each row and geocode location field.
for row in jsonRows:
	try: 
		place, (lat, lng) = geocoder.lookup(' '.join([row[field] for field in geoFields]))
		if place and lat and lng:
			doc = dict(type='Feature', geometry=dict(type="Point", coordinates=[lng, lat]), properties=row.copy())
			geoRows.append(doc)
	except Exception, e:
		print ''
		print json.dumps({ 'error': str(e) })
		exit()


print ''
print json.dumps({ 'type': 'FeatureCollection', 'features': geoRows })

