
#PathGeo Libraries
from DataFactory.DataTable import DataTableFactory
from GeocodingEngine.Geocoder import AddressGeocoder

#Standard Libraries
import cgi, json
import cgitb


cgitb.enable()

form = cgi.FieldStorage()
file = form['photo'].file.file
name = form['photo'].filename

#Get DataTable object, and convert rows to JSON
table = DataTableFactory.getDataTable(fileStream=file, fileName=name)
jsonRows = table.getRowsAsJSON()

geoRows = []
geocoder = AddressGeocoder()

#Go through each row and geocode 'location' field.
for row in jsonRows:
	place, (lat, lng) = geocoder.lookup(row['location'])
	if place and lat and lng:
		doc = dict(type='Feature', geometry=dict(type="Point", coordinates=[lng, lat]), properties=row)
		geoRows.append(doc)

print ''
print json.dumps(geoRows);