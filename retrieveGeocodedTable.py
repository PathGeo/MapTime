
#PathGeo Libraries
from GeocodingEngine.Geocoder import AddressGeocoder

#Standard Libraries
import cgi, json
import cgitb, os, pickle

cgitb.enable()

form = cgi.FieldStorage()
fname = form['fileName'].value
geoColumn = form['geoColumn'].value

jsonRows = pickle.load(open(os.path.abspath(__file__).replace(__file__, fname + ".p")))

geoRows = []
geocoder = AddressGeocoder()

#Go through each row and geocode 'location' field.
for row in jsonRows:
	place, (lat, lng) = geocoder.lookup(row[geoColumn])
	if place and lat and lng:
		doc = dict(type='Feature', geometry=dict(type="Point", coordinates=[lng, lat]), properties=row)
		geoRows.append(doc)


print ''
print json.dumps(geoRows)

