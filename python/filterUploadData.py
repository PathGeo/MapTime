from pymongo import MongoClient
from os import path
import cgi, simplejson


urlParameter=cgi.FieldStorage()

print "Content-Type: text/html \n"

#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value=None
    
    if(name in urlParameter and urlParameter[name].value!=""):
        value=urlParameter.getvalue(name)

    if(value is not None and value.upper()=='NULL'):
        value=None
    
    return value
#--------------------------------------------------------------------------

#save data as excel--------------------------------------------------------
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
#--------------------------------------------------------------------------




#connect mongodb
client=MongoClient()
collection=client["maptime"]["uploadData"]


#get url parameter
username=getParameterValue("username")
rows=getParameterValue("rows").split(",")
tableID=getParameterValue("table")
term=getParameterValue("term")
oauth=getParameterValue("oauth")


msg={
    "status":"error",
    "msg":"username, rows, table is not correct! <br>Please check again"
}


if(username is not None and rows is not None and tableID is not None and term is not None):
   table=collection.find_one({"email":username, "timestamp":tableID, "oauth": oauth})

   if(table is not None):
        results=map(lambda row: table["geojson"][int(row)], rows)
        if results:
            saveDataAsExcel(map(lambda item: item['properties'], results), '..\\geocoded_files\\' + table["name"] + '_' + term +'.xls')

        msg={'type': 'FeatureCollection', 'features': results, 'URL_xls': '' if not results else './geocoded_files/' + table["name"] + '_' + term + '.xls' }

print simplejson.dumps(msg)
