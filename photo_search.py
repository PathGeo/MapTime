import requests
import json
import cgi
import geopy, re

print ""
geocoder = geopy.geocoders.GeoNames()

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value

#geoResults = geocoder.geocode(location, exactly_one=False)

#if not geoResults:
	#print json.dumps("Nice try, but the location could not be found.")
	#exit()
	
#place, (lat, lng) = geoResults[0]


r = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7262b19617c5a5f568a9b3f25c946c5b&tags=" + keyword + "&lat=" + str(lat) + "&lon=" + str(lng) + "&radius=32&per_page=100&extras=description,date_upload,date_taken,owner_name,geo,views&has_geo=1&format=json&nojsoncallback=1")

test = json.dumps(r.text)



#results = []

#doc = {}
#doc['type'] = "Feature"
#doc['geometry'] = { "type": "Point"}
#doc['properties'] = {}

#results.append(doc)

print test
