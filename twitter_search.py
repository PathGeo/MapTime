import tweepy
from GeocodingEngine.Geocoder import CityGeocoder
import cgi
import geopy, re
import json

print ""

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value
rad = data['rad'].value
ts = data['ts'].value


 
api = tweepy.API()
tweets = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100)

geocoder = CityGeocoder()
 
results = []

for tweet in tweets:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates']:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Title=tweet.text, Source="twitter")))
	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (lat, lon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		if lat and lon:
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Title=tweet.text, Source="twitter")))
	#doc['properties'] = {}
	#doc['properties']["Title"] = "testing"
	#results.append(doc)
			
print json.dumps(results)