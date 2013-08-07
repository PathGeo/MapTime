
#PathGeo Libraries
from DataFactory.DataTable import DataTableFactory
from GeocodingEngine.Geocoder import CityGeocoder

#Standard Libraries
import cgi, json, pickle, re, itertools
import cgitb, os

#pymongo Library
from pymongo import MongoClient
client=MongoClient()

geocoder = CityGeocoder()

cgitb.enable()

#bounds of US (roughly)
NORTH = 50.000
SOUTH = 24.000
WEST = -125.000
EAST = -66.000

STATE_ABBRVS = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]
	
STATE_NAMES = ['ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO', 'CONNECTICUT', 'WASHINGTON D.C.', 'WASHINGTON DC', 
	'DELEWARE', 'FLORIDA', 'GEORGIA', 'IDAHO', 'ILLINOIS', 'ILL', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA', 'MAINE', 'MARYLAND', 
	'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE', 'NEW JERSEY', 'NEW MEXICO', 'NEW YORK', 
	'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA', 
	'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON', 'WEST VIRGINIA', 'WISCONSIN', 'WYOMING']


def isFloat(val):
	try:
		return bool(float(val))
	except:
		return False

def isLonAndLat(val):
	if type(val) not in (str, unicode):
		return False
	
	try:
		a, b = val.split(',')
		return isLat(b) and isLon(a)
	except:
		return False	
		
def isLatLonCombined(val):
	if type(val) not in (str, unicode):
		return False
	
	try:
		a, b = val.split(',')
		return isLat(a) and isLon(b)
	except:
		return False
		
		
def isLat(val):
	return isFloat(val) and WEST <= float(val) <= EAST
	
def isLon(val):
	return isFloat(val) and SOUTH <= float(val) <= NORTH

def isAddress(val):
	return bool(re.findall(r'[0-9]{1,4}( \w+){1,3}'))
	
def isCity(val):
	place, (lat, lon) = geocoder.lookup(val.encode('ascii', 'ignore'))
	return bool(place and lat and lon)
	
def isState(val):
	return val.strip().upper() in STATE_ABBRVS + STATE_NAMES
	
def isZip(val):
	return bool(re.findall(r'[0-9]{5}', val))
		
def findLonLatColumns(rows):	
	'''
		This function finds candidate lon/lat columns.
		Returns tuple of (lon_column, lat_column)
	'''
	'''
	columns = rows[0].keys()
	
	colValues = dict((c, []) for c in columns)
	for row in rows:
		for col in row.keys():
			colValues[col].append(row[col])
	 	
	oneKeyCombos = columns
	twoKeyCombos = list(itertools.permutations(columns), 2))
	threeKeyCombos = list(itertools.permutations(columns), 3))
	fourKeyCombos = list(itertools.permutations(columns), 4))
	
	
	coordCandidates = [(len(filter(lambda x, y: isLat(x) and isLon(y), colValues[col])), col) for col in colValues.keys() if any(map(isLat, colValues[col]))
	
	latCandidates = [(len(filter(lambda x: isLat(x), colValues[col])), col) for col in colValues.keys() if any(map(isLat, colValues[col]))]
	lonCandidates = [(len(filter(lambda x: isLon(x), colValues[col])), col) for col in colValues.keys() if any(map(isLon, colValues[col]))]

	
	
	latCandidates = sorted(latCandidates, key=lambda x: x[0], reverse=True)
	lonCandidates = sorted(lonCandidates, key=lambda x: x[0], reverse=True)
	
	bestLat = None if not latCandidates else latCandidates[0][1]
	bestLon = None if not lonCandidates else lonCandidates[0][1]
	
	return (bestLon, bestLat)
	'''
	pass

#get users' credit
def getUserCredit(username):
        collection=client["maptime"]["user"]
        user=collection.find_one({"email":username})

        if(user is not None):
                return user["credit"]
        else:
                return None



form = cgi.FieldStorage()
file = form['photo'].file.file
name = form['photo'].filename
username=form['username'].value

msg={
        "status":"error",
        "msg":"no username or no such username"
}

if(username is not None):
        #get user's credit
        credit=getUserCredit(username)

        #Get DataTable object, and convert rows to JSON
        table = DataTableFactory.getDataTable(fileStream=file, fileName=name)
        jsonRows = table.getRowsAsJSON()

        #if credit is not a number
        if(credit is not None):
                #if credit is enough
                if(credit>=len(jsonRows)):
                        pickle.dump(jsonRows, open(os.path.abspath(__file__).replace(__file__, name + ".p"), "w"))
                        msg={'columns': [col for col in table.getColumnNames() if col], 'fileName': name}
                else:
                        msg["msg"]="Your credit is not enough at this time. <br>Total needed credit: "+ str(len(jsonRows))+"<br>Your credit: "+ str(credit)+"<br>Needed credit: "+ str(len(jsonRows)-credit)+"<br>Please buy some credit first. Thank you."
	else:
                msg["msg"]="The account,'" + username + "', does not have credit field"

print ''
print json.dumps(msg)
