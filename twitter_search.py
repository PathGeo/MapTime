import tweepy
from GeocodingEngine.Geocoder import CityGeocoder
import cgi, cgitb
import geopy, re
from geopy import distance
import json

#enable debugger
cgitb.enable()

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value
rad = data['rad'].value
ts = data['ts'].value


api = tweepy.API()
tweets = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100, show_user=True)

geocoder = CityGeocoder()

results = []

for tweet in tweets:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates'] and tweet.geo['coordinates'][0] and tweet.geo['coordinates'][1]:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (glat, glon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		
		#make sure that geocoded lat and lons are within search radius
		if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

print ''	
print json.dumps(results)