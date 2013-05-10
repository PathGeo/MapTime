
#PathGeo Libraries
from GeocodingEngine.Geocoder import AddressGeocoder

#Standard Libraries
import cgi, json, re, functools
import cgitb, os, pickle


#Functions to check potential location fields
IS_LAT = lambda text: bool(re.compile(r'(?:^|\s|_)lat(?:\s|_|$)|latitude', re.I).search(text))
IS_LON = lambda text: bool(re.compile(r'(?:^|\s|_)lon(?:\s|_|$)|(?:^|\s|_)lng(?:\s|_|$)|longitude', re.I).search(text))
IS_ADDR = lambda text: bool(re.compile(r'addr|address', re.I).search(text))
IS_CITY = lambda text: bool(re.compile(r'city', re.I).search(text))
IS_STATE = lambda text: bool(re.compile(r'state', re.I).search(text))
IS_ZIP = lambda text: bool(re.compile(r'zip|postal', re.I).search(text))
IS_LOCATION = lambda text: bool(re.compile(r'(?:^|\s|_)loc(?:\s|_|$)|location', re.I).search(text))


def containsField(items, checker):
	'''
		Returns True if any of the items in the list match.
	'''

	return any(map(lambda item: checker(item), items))

	
def getField(items, checker):
	'''
		Gets the first item from the list that matches.
	'''
	
	found = filter(lambda item: checker(item), items)
	return None if not found else found.pop()

	
def geocodeRows(rows, locFunc):
	features = []

	#Go through each row and geocode location field.
	for row in rows:
		try: 
			lat, lon = locFunc(row)
			if lat and lon:			
				#NOTE: This is just a temporary workaround for the problem with DataTables (can't display a lot of columns)
				if len(row.keys()) > 5:
					for key in row.keys()[5:]:
						del row[key]
				#End Note
				doc = dict(type='Feature', geometry=dict(type="Point", coordinates=[lon, lat]), properties=row.copy())
				features.append(doc)
		except Exception, e:
			return json.dumps({ 'error': str(e) })
	
	return json.dumps({ 'type': 'FeatureCollection', 'features': features })
	
def geocodeRow(row, fields=None, geocoder=None):
	if not geocoder or not fields:
		return None, None
	
	place, (llat, llon) = geocoder.lookup(' '.join([row[field] for field in fields]))
	
	return llat, llon
	
	
cgitb.enable()


form = cgi.FieldStorage()
fname = form['fileName'].value
geoColumns = form.getlist("geoColumns[]")
geoColumns = map(lambda item: item.replace(' ', '_'), geoColumns)


geoFields = []

lat = getField(geoColumns, IS_LAT)
lon = getField(geoColumns, IS_LON)
addr = getField(geoColumns, IS_ADDR)
city = getField(geoColumns, IS_CITY)
state = getField(geoColumns, IS_STATE)
zip = getField(geoColumns, IS_ZIP)
loc = getField(geoColumns, IS_LOCATION)



#Note: Username and PW for geocoder.US does not currently seem to work with geopy
#so this is not actually using our account right now...
geocoder = AddressGeocoder(username='PathGeo2', password='PGGe0C0der')

geoFunc = None

if lat and lon:
	
	def getByLatLon(row, latField=None, lonField=None):
		try: 
			return float(row[latField]), float(row[lonField])
		except:
			return None, None
		
	geoFunc = functools.partial(getByLatLon, latField=lat, lonField=lon)
elif addr and city and state and zip:
	geoFunc = functools.partial(geocodeRow, fields=[addr, city, state, zip], geocoder=geocoder)	
elif loc:
	geoFunc = functools.partial(geocodeRow, fields=[loc], geocoder=geocoder)
elif addr:
	geoFunc = functools.partial(geocodeRow, fields=[addr], geocoder=geocoder)
	

jsonRows = pickle.load(open(os.path.abspath(__file__).replace(__file__, fname + ".p")))

os.remove(os.path.abspath(__file__).replace(__file__, fname + ".p"))

output = geocodeRows(jsonRows, geoFunc)


print ''
print output

