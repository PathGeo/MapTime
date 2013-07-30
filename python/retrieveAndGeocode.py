
#PathGeo Libraries
from GeocodingEngine.Geocoder import AddressGeocoder

#Standard Libraries
import cgi, json, re, functools
import cgitb, os, pickle, time
from os import path
from pymongo import MongoClient


#Functions to check potential location fields (are all these functions necessary?  just pass pattern as argument!)
IS_LAT = lambda text: bool(re.compile(r'(?:^|\s|_)\d*lat\d*(?:\s|_|$)|latitude', re.I).search(text))
IS_LON = lambda text: bool(re.compile(r'(?:^|\s|_)\d*lon\d*(?:\s|_|$)|(?:^|\s|_)\d*lng\d*(?:\s|_|$)|longitude', re.I).search(text))
IS_ADDR = lambda text: bool(re.compile(r'addr|address', re.I).search(text))
IS_CITY = lambda text: bool(re.compile(r'city', re.I).search(text))
IS_STATE = lambda text: bool(re.compile(r'state', re.I).search(text))
IS_ZIP = lambda text: bool(re.compile(r'zip|postal', re.I).search(text))
IS_LOCATION = lambda text: bool(re.compile(r'(?:^|\s|_)\d*loc\d*(?:\s|_|$)|location', re.I).search(text))
IS_GEO = lambda text: bool(re.compile(r'^geo$', re.I).search(text))

def containsField(items, checker):
	'''
		Returns True if any of the items in the list match.
	'''

	return any(map(checker, items))

	
def getField(items, checker):
	'''
		Gets the first item from the list that matches.
	'''
	
	found = filter(lambda item: checker(item), items)
	return None if not found else found.pop()

	
def saveDataAsExcel(data, outputFileName):
	import xlwt

	book = xlwt.Workbook(encoding="UTF-8")
	sheet = book.add_sheet('Data')
	
	columns = data[0].keys()
	for colIndx, column in enumerate(columns):
		sheet.write(0, colIndx, column)

	for rowIndx, row in enumerate(data):
		for colIndx, column in enumerate(columns):
			val = row.get(column, '')
			sheet.write(rowIndx+1, colIndx, val)
	
	curDir = path.dirname(path.realpath(__file__))	
	book.save(curDir + "\\" + outputFileName)
		
		
def geocodeRows(rows, locFunc):
	features = []

	#Go through each row and geocode location field.
	for row in rows:
		try: 
			#convert any whole number floats into string
			#must convert to int first, in order to trim off decimal values
			for k,v in row.iteritems():
				if type(v) is float and v.is_integer():
					row[k] = str(int(v))
				elif type(v) is unicode:
					row[k] = v.encode('ascii', 'ignore')
				else:
					row[k] = str(v)
						
			if '' in row:
				del row['']
			
			place, (lat, lon) = locFunc(row)
			
			if lat and lon:			
				doc = dict(type='Feature', geometry=dict(type="Point", coordinates=[lon, lat]), properties=row.copy())
				
				#for some reason, the condition is being met, even when 'place' == None (why????)
				if place and type(place) in (str, unicode):
					zips = re.findall(r'\b[0-9]{5}\b', place)
					if zips:
						doc['properties']['zip_code'] = zips[-1]
				
				doc['properties']['latitude'] = lat
				doc['properties']['longitude'] = lon
				
				features.append(doc)
				
		except Exception, e:
			return json.dumps({ 'error': str(e), 'row': str(row) })

	return features
	
	
def geocodeRow(row, fields=None, geocoder=None):
	if not geocoder or not fields:
		return None, (None, None)
	
	place, (llat, llon) = geocoder.lookup(' '.join([row[field] for field in fields]))
	
	return place, (llat, llon)



def saveDatainMongo(geojson, fileName, username):
        client=MongoClient()
        collection=client["maptime"]["user"]
        user=collection.find_one({"email":username})
        timestamp=str(int(time.mktime(time.gmtime()))) #using gmt timeStamp as dataID
        
        if(user is not None):
                if(user["uploadData"]is None):
                        user["uploadData"]={}
                
                user["uploadData"][timestamp]={
                        "name": fileName,
                        "geojson": geojson
                }

                collection.save(user)
                
                return timestamp
        else:
                return None


	
cgitb.enable()


form = cgi.FieldStorage()
fname = form['fileName'].value
username = form['username'].value
geoColumns = form.getlist("geoColumns[]")
geoColumns = map(lambda item: item.replace(' ', '_'), geoColumns)

lat = getField(geoColumns, IS_LAT)
lon = getField(geoColumns, IS_LON)
addr = getField(geoColumns, IS_ADDR)
city = getField(geoColumns, IS_CITY)
state = getField(geoColumns, IS_STATE)
zip = getField(geoColumns, IS_ZIP)
loc = getField(geoColumns, IS_LOCATION)
#geo just temporary for the angelina jolie tweets
geo = getField(geoColumns, IS_GEO)


#Note: Username and PW for geocoder.US does not currently seem to work with geopy
#so this is not actually using our account right now...
geocoder = AddressGeocoder(username='PathGeo2', password='PGGe0C0der')

geoFunc = None

if lat and lon:
	
	def getByLatLon(row, latField=None, lonField=None):
		try: 
			return None, (float(row[latField]), float(row[lonField]))
		except:
			return None, (None, None)
		
	geoFunc = functools.partial(getByLatLon, latField=lat, lonField=lon)
	
elif geo:
	def getByLatLon(row, geoField=None):
		try: 
			coords = row[geoField].split(',')
			return None, (float(coords[0]), float(coords[1]))
		except:
			return None, (None, None)
		
	geoFunc = functools.partial(getByLatLon, geoField=geo)
	
elif addr:
	#only address is necessary to geocode, but check if city, state or zipcode are present
	#and, if so, add them to out list of geocoding fields
	otherFields = filter(lambda item: bool(item), [city, state, zip])
	geoFunc = functools.partial(geocodeRow, fields=[addr] + otherFields, geocoder=geocoder)	
elif loc:
	geoFunc = functools.partial(geocodeRow, fields=[loc], geocoder=geocoder)
	
#still just serializing the python object for excel data.  should save to DB?
jsonRows = pickle.load(open(os.path.abspath(__file__).replace(__file__, fname + ".p")))

os.remove(os.path.abspath(__file__).replace(__file__, fname + ".p"))

features = geocodeRows(jsonRows, geoFunc)

#save geocoded result in the Mongo DB
dataID=saveDatainMongo(features, fname, username)

fname = fname.lower().replace('.xlsx', '.xls')

if features:
	saveDataAsExcel(map(lambda item: item['properties'], features), '..\\geocoded_files\\' + fname)

featureSet = {'type': 'FeatureCollection', 'features': features, 'URL_xls': '' if not features else './geocoded_files/' + fname, 'dataID': dataID }

print ''
print json.dumps(featureSet)

