from pymongo import MongoClient
import cgi, simplejson


urlParameter=cgi.FieldStorage()

print "Content-Type: text/html \n"

#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in urlParameter and urlParameter[name].value!=""):
        value=urlParameter.getvalue(name)

    return value
#--------------------------------------------------------------------------




#connect mongodb
client=MongoClient()
collection=client["maptime"]["uploadData"]


#get url parameter
username=getParameterValue("username")
rows=getParameterValue("rows").split(",")
tableID=getParameterValue("table")


msg={
    "status":"error",
    "msg":"username, rows, table is not correct! <br>Please check again"
}


if(username is not None and rows is not None and tableID is not None):
   table=collection.find_one({"email":username, "timestamp":tableID})

   if(table is not None):
        results=map(lambda row: table["geojson"][int(row)], rows)
        msg={'type': 'FeatureCollection', 'features': results, 'URL_xls': '' }

print simplejson.dumps(msg)
