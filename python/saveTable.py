
#PathGeo Libraries
from DataFactory.DataTable import DataTableFactory

#Standard Libraries
import cgi, json, pickle
import cgitb, os

cgitb.enable()

NORTH = 50.000
SOUTH = 24.000
WEST = -125.000
EAST = -66.000

def isFloat(val):
	try:
		return bool(float(val))
	except:
		return False

def isLat(val):
	if isFloat(val):
		return WEST <= float(val) <= EAST
	else:
		return False
	
def isLon(val):
	if isFloat(val):
		return SOUTH <= float(val) <= NORTH
	else:
		return False	


def findLonLatColumns(rows):	
	'''
		This function finds candidate lon/lat columns.
		Returns tuple of (lon_column, lat_column)
	'''

	columns = rows[0].keys()
	
	colValues = dict((c, []) for c in columns)
	for row in rows:
		for col in row.keys():
			colValues[col].append(row[col])
	
	latCandidates = [(len(filter(lambda x: isLat(x), colValues[col])), col) for col in colValues.keys() if any(map(isLat, colValues[col]))]
	lonCandidates = [(len(filter(lambda x: isLon(x), colValues[col])), col) for col in colValues.keys() if any(map(isLon, colValues[col]))]
	
	latCandidates = sorted(latCandidates, key=lambda x: x[0], reverse=True)
	lonCandidates = sorted(lonCandidates, key=lambda x: x[0], reverse=True)
	
	bestLat = None if not latCandidates else latCandidates[0][1]
	bestLon = None if not lonCandidates else lonCandidates[0][1]
	
	return (bestLon, bestLat)


form = cgi.FieldStorage()
file = form['photo'].file.file
name = form['photo'].filename

#Get DataTable object, and convert rows to JSON
table = DataTableFactory.getDataTable(fileStream=file, fileName=name)
jsonRows = table.getRowsAsJSON()






pickle.dump(jsonRows, open(os.path.abspath(__file__).replace(__file__, name + ".p"), "w"))
	
print ''
print json.dumps({'columns': [col for col in table.getColumnNames() if col], 'fileName': name})