from xlrd import open_workbook

MAX_ROW_COUNT = 1000000


def getExcelFromBinary(binFile):
	output = binFile.read()
	book = open_workbook(file_contents=output)
	
	return book
	
def getJSONFromWorksheet(sheet, locField="LOCATION", maxCount=MAX_ROW_COUNT):
	import geopy
	g = geopy.geocoders.GeocoderDotUS()

	columns = [sheet.cell_value(0, col) for col in range(sheet.ncols)]

	results = []
	
	for rowIndx in range(1, min(maxCount, sheet.nrows)):
		try: 
			doc = {}
			doc['type'] = "Feature"
			doc['geometry'] = { "type": "Point"}
			doc['properties'] = {}
			
			for colIndx, colName in enumerate(columns):
				doc['properties'][colName.lower()] = sheet.cell_value(rowIndx, colIndx)
				
				if colName.upper() == "LOCATION":
					coded = g.geocode(sheet.cell_value(rowIndx, colIndx), exactly_one=False)  
					if coded and coded is list:
						place, (lat, lng) = coded[0]
						if lat and lng:
							doc['geometry']['coordinates'] = [lng, lat]
					elif coded:
						place, (lat, lng) = coded
						if lat and lng:
							doc['geometry']['coordinates'] = [lng, lat]
				
			if 'coordinates' in doc['geometry']:
				results.append(doc)
		except Exception, e:
			return { 'error': str(e) }
	
	return results




