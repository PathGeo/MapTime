import cgi, cgitb,json
from datetime import datetime, date
from pymongo import MongoClient
			
print ''



#get url parameter
def getURLParameter(key, cgiFieldStorage):
      return None if not key in cgiFieldStorage or cgiFieldStorage[key].value=='' else cgiFieldStorage[key].value


#convert to geojson
def convertToGeojson(obj_array, latFieldName, lonFieldName, hideColumns=None):
        import json
        
        dthandler = lambda obj: (obj.isoformat() if isinstance(obj, datetime) or isinstance(obj, date) else None)
        results=[]

        for obj in obj_array:
                lat=obj[latFieldName]
                lon=obj[lonFieldName]

                if(hideColumns):
                      for column in hideColumns:
                            obj.pop(column,"None")
                
                results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon,lat]), properties=obj))

        return json.dumps({"type":"FeatureCollection", "count":obj_array.count(), "features":results}, default=dthandler)





#get url parameter
params=cgi.FieldStorage()
keywords=getURLParameter('keywords', params)
dateFrom=getURLParameter('dateFrom', params)
dateTo=getURLParameter('dateTo', params)
bbox=getURLParameter('bbox', params)
hideColumns=getURLParameter('hideColumns', params)

#change data type
dateFrom=datetime.strptime(dateFrom, "%Y-%m-%d")
dateTo=datetime.strptime(dateTo, "%Y-%m-%d")
keywords=str(keywords).split(",")
hideColumns=str(hideColumns).split(",")

#change keywords to regex
import re
keywords=[re.compile(key) for key in keywords]

        

#query db
col=MongoClient().twitter.streaming_SanDiego
query={
        "text": {"$in": keywords},
        "local_time":{"$gte":dateFrom, "$lt":dateTo}
}
tweets=col.find(query)

#parse tweet
	
print convertToGeojson(tweets, 'lat', 'lon', hideColumns=hideColumns)
