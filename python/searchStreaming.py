import cgi, cgitb,json
from datetime import datetime, date
from pymongo import MongoClient
			
print ''



#get url parameter
def getURLParameter(key, cgiFieldStorage):
      return None if not key in cgiFieldStorage or cgiFieldStorage[key].value=='' else cgiFieldStorage[key].value


#geomasking
def geomask(val):
      rounded = round(val, 4)
      r = random.randint(-9, 9) * 1/100000.0
      return rounded + r



#convert to geojson
def convertToGeojson(obj, latFieldName, lonFieldName, geoMasking=None):
      lat=obj[latFieldName]
      lon=obj[lonFieldName]

      doc=dict(type="Feature", geometry=dict(type="Point", coordinates=[lon,lat]), properties=obj)
      
      if(geoMasking):
            doc['geomasked_geometry'] = dict(type="Point", coordinates=[geomask(lon), geomask(lat)])

      return doc





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
results=[]
for tweet in tweets:
      if(hideColumns):
            for column in hideColumns:
                  tweet.pop(column,"None") 


      #convert to geojson
      results.append(convertToGeojson(tweet), "lat", "lon", geoMasking=True)
      


dthandler = lambda obj: (obj.isoformat() if isinstance(obj, datetime) or isinstance(obj, date) else None)	
print json.dumps({"type":"FeatureCollection", "count":tweets.count(), "features":results}, default=dthandler)
