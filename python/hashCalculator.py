import hmac
import hashlib
import cgi #import cgi library to get url parameters from users
import json as simplejson  #import libaray to use json

print "Content-Type: text/html \n"

app={
    "parameter":cgi.FieldStorage()
}


#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in app["parameter"] and app["parameter"][name].value!=""):
        value=app["parameter"].getvalue(name)

    return value
#--------------------------------------------------------------------------


#calculate hascode------------------------------------------------------------
def calculateHashcode(x_login, x_fp_sequence, x_fp_timestamp, x_amount, x_currency):
    # Instantiate hmac with Transaction key (HMAC-MD5)
    digest_maker = hmac.new('TEKIi3lkko_WjRfE_uJ0', '', hashlib.md5)

    # Instantiate hmac with Transaction key (HMAC-SHA1)
    # digest_maker = hmac.new('TEKIi3lkko_WjRfE_uJ0', '', hashlib.sha1)

    format = '%(x_login)s^%(x_fp_sequence)s^%(x_fp_timestamp)s^%(x_amount)s^%(x_currency)s'
    data =  format % {'x_login' : x_login,
                      'x_fp_sequence' : x_fp_sequence, 
                      'x_fp_timestamp' : x_fp_timestamp, 
                      'x_amount' : x_amount, 
                      'x_currency' : x_currency}

    digest_maker.update(data)
    x_fp_hash = digest_maker.hexdigest()

    return x_fp_hash
#--------------------------------------------------------------------------


#main
login=getParameterValue("login")
sequence=getParameterValue("sequence")
timestamp=getParameterValue("timestamp")
amount=getParameterValue("amount")

msg={
    "status":"error",
    "msg":"email or password is not correct! <br>Please check again"
}

if(login!='null' and sequence!='null' and timestamp!='null' and amount!='null'):
    #check login
    msg={
        "status": "ok",
        "hashcode":calculateHashcode(login, sequence, timestamp, amount, '')
    }

print simplejson.dumps(msg)
