
#Standard Libraries
import cgi, json
import cgitb, os, pickle

cgitb.enable()

form = cgi.FieldStorage()
fname = form['fileName'].value
geoColumn = form['geoColumn'].value

geoRows = pickle.load(open(os.path.abspath(__file__).replace(__file__, fname + ".p")))

print ''
print json.dumps(geoRows)

