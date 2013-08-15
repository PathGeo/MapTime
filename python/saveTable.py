
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

def isLonLat(val):
	if type(val) not in (str, unicode):
		return False
	
	try:
		a, b = val.split(',')
		return isLat(b) and isLon(a)
	except:
		return False	
		
def isLatLon(val):
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

'''
def isMultiPartAddress(parts):
	if len(parts) == 4:
		return isAddress(parts[0]) and isCity(parts[1]) and isState(parts[2]) and isZip(parts[3])
	elif len(parts) == 3:
		return isAddress(parts[0]) and isCity(parts[1]) and isState(parts[2])
	else:
		return False
	
def isFullAddress(val):
	return bool(re.findall(r'\d{1,4}( \w+){1,3}(,)? (\w+){1,3}(,)? [A-Z]{2}', val))

def isAddress(val):
	return bool(re.findall(r'[0-9]{1,4}( \w+){1,3}', val))
	
def isCity(val):
	place, (lat, lon) = geocoder.lookup(val.encode('ascii', 'ignore'))
	return bool(place and lat and lon)
	
def isState(val):
	return val.strip().upper() in STATE_ABBRVS + STATE_NAMES
	
def isZip(val):
	return bool(re.findall(r'[0-9]{5}', val))
'''
def mostCommon(l):
	if not l:
		return None, None
		
	val = max(set(l), key=l.count)
	return (val, l.count(val))

def findLocColumns(rows):	
	
	columns = rows[0].keys() 	
	twoKeyCombos = list(itertools.permutations(columns, 2))
	threeKeyCombos = list(itertools.permutations(columns, 3))
	fourKeyCombos = list(itertools.permutations(columns, 4))
	
	latLonCombinedCandidate = mostCommon([key for row in rows for key in columns if isLatLon(row[key])])
	lonLatCombinedCandidate = mostCommon([key for row in rows for key in columns if isLonLat(row[key])])
	latLonCandidate = mostCommon([pair for row in rows for pair in twoKeyCombos if isLat(row[pair[0]]) and isLon(row[pair[1]])])
	
	
	#addrCandidate = mostCommon([key for row in rows for key in columns if isFullAddress(row[key])])
	#threePartAddrCandidate = mostCommon([perm for row in rows for perm in fourKeyCombos if isMultiPartAddress(perm)])
	#fourPartAddrCandidate = mostCommon([perm for row in rows for perm in fourKeyCombos if isMultipartAddress(perm)])
	
	if latLonCombinedCandidate[1] > lonLatCombinedCandidate[1] and latLonCombinedCandidate[1] > latLonCandidate[1]:
		return [ { 'type': 'latitude, longitude', 'column': latLonCombinedCandidate[0] } ]
	elif lonLatCombinedCandidate[1] > latLonCandidate[1]:
		return [ { 'type': 'longitude, latitude', 'column': lonLatCombinedCandidate[0] } ]
	elif latLonCandidate[1] > 0:
		lat, lon = latLonCandidate[0]
		return [ { 'type': 'longitude', 'column': lon }, { 'type': 'latitude', 'column': lat } ]
	
	return []	


#get users' credit
def getUserCredit(username, oauth):
        collection=client["pathgeo"]["user"]
        user=collection.find_one({"email":username, "oauth": oauth})

        if(user is not None):
                return user["credit"]
        else:
                return None



form = cgi.FieldStorage()
file = form['photo'].file.file
name = form['photo'].filename
username=form['username'].value
oauth=form['oauth'].value

if (oauth is not None and (oauth=='' or oauth.upper()=='NULL')):
        oauth=None



msg={
        "status":"error",
        "msg":"no username or no such username"
}

if(username is not None):
        #get user's credit
        credit=getUserCredit(username, oauth)

        #Get DataTable object, and convert rows to JSON
        table = DataTableFactory.getDataTable(fileStream=file, fileName=name)
        jsonRows = table.getRowsAsJSON()

        cols = [col for col in table.getColumnNames() if col]
        locs = findLocColumns(jsonRows[:20])
		
        jsonCols = []
        for c in cols:
            if c in [l['column'] for l in locs]:
                target = filter(lambda item: item['column'] == c, locs)[0]
                jsonCols.append({'name': c, 'suggested': target['type']})
            else:
                jsonCols.append({'name': c})
		
				
		
		
		
        #if credit is not None
        if(credit is not None):
                #if credit is enough
                if(credit>0):
                        pickle.dump(jsonRows, open(os.path.abspath(__file__).replace(__file__, name + ".p"), "w"))
                        msg={'columns': [col for col in table.getColumnNames() if col], 'fileName': name, 'jsonCols': jsonCols, 'rowCount': len(jsonRows), 'geocodeCount': len(jsonRows) }

                        if(credit < len(jsonRows)):
                                msg["geocodeCount"]=len(jsonRows) - credit;
                else:
                        msg["msg"]="Your credit is not enough at this time. <br>Total needed credit: "+ str(len(jsonRows))+"<br>Your credit: "+ str(credit)+"<br>Needed credit: "+ str(len(jsonRows)-credit)+"<br>Please buy some credit first. Thank you."
        else:
                msg["msg"]="The account,'" + username + "', does not have credit field"

print ''
print json.dumps(msg)
