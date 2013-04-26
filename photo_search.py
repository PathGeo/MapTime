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
rad = data['rad'].value

#geoResults = geocoder.geocode(location, exactly_one=False)

#if not geoResults:
	#print json.dumps("Nice try, but the location could not be found.")
	#exit()
	
#place, (lat, lng) = geoResults[0]


r = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7262b19617c5a5f568a9b3f25c946c5b&tags=" + keyword + "&lat=" + str(lat) + "&lon=" + str(lng) + "&radius=" + str(rad) + "mi&per_page=100&extras=description,date_upload,date_taken,owner_name,geo,views&has_geo=1&format=json&nojsoncallback=1")

output=r.json

results = []

for i in output['photos']['photo']:
	image = "<div style='height: 200px'><img src='http://farm" + str(i['farm']) + ".staticflickr.com/" + str(i['server']) + "/" + str(i['id']) + "_" + str(i['secret']) + "_s.jpg' alt='image here...'>"
	doc = {}
	doc['type'] = "Feature"
	doc['geometry'] = { "type": "Point"}
	doc['properties'] = {}
	doc['geometry']['coordinates'] = [i['longitude'], i['latitude']]
	doc['properties']["Title"] = i['title']
	doc['properties']["Img"] = image
	doc['properties']["Description"] = i['description']['_content']
	
	results.append(doc)

print json.dumps(results)
