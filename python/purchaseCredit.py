import hmac, hashlib, cgi, json as simplejson
from pymongo import MongoClient

print "Content-Type: text/html \n"


#global variable
client=MongoClient()
urlParameter=cgi.FieldStorage()



#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in urlParameter and urlParameter[name].value!=""):
        value=urlParameter.getvalue(name)

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


#add credit and record transaction
def addCredit(username, credit):
    transaction=client["maptime"]["transaction"]
    userCollection=client["maptime"]["user"]
    user=userCollection.find_one(username)
    credit=int(credit)
    
    if(user is not None):
        if(user["credit"] is not None):
            user["credit"]=user["credit"] + credit
            userCollection.save(user)
    
            #transaction
            transaction.insert({
                "email": username,
                "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z"),
                "description": "[addCredit] " + str(credit),
                "transaction": credit,
                "balance": user["credit"]
            })
            return "succeed"
        else:
            return "no credit field"
    else:
        return "no such user"
    




#main
username=getParameterValue("login")
sequence=getParameterValue("sequence")
timestamp=getParameterValue("timestamp")
amount=int(getParameterValue("amount"))
msg={
    "status":"error",
    "msg":"email or password is not correct! <br>Please check again"
}

if(login!='null' and sequence!='null' and timestamp!='null' and amount!='null'):
    if(amount>0):
        #generate hashcode
        hashcode=calculateHashcode(username, sequence, timestamp, amount, '')

        #connect to the BOA payment service (not Finish!)
        

        
        #add credit
        result=addCredit(username, amount)

        if(result!="succeed"):
            msg["msg"]=result
        else:
            msg={
                "status":"ok",
                "msg":"add credit succeed"
            }
    else:
        msg["msg"]="Transaction failed: amount <=0."

    
print simplejson.dumps(msg)
