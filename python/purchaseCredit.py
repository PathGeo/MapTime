import hmac, hashlib, cgi, json as simplejson, httplib2
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
#--------------------------------------------------------------------------
    
#send data to FirstData,our BOA payment service, to pay
def purchase(cardholder_name, cardholder_number, cardholder_authNumber, cardholder_expiryDate, amount):
    http=httplib2.Http()
    url="https://api.globalgatewaye4.firstdata.com/transaction/v12"
    header={"Content-Type":"application/json", "accept": "application/json", "User-Agent":"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)"}
    data={
        "gateway_id":"A76868-01",
        "password":"4t72hkjv",
        "transaction_type":"00",
        "amount": amount,
        "cardholder_name": cardholder_name,
        "cc_number": cardholder_number,
        "Authorization_Num": cardholder_authNumber,
        "cc_expiry": cardholder_expiryDate
    }
    
    response, send=http.request(url, "POST", headers=header, body=data)

    print send
    print response

    return response
#--------------------------------------------------------------------------




#main
username=getParameterValue("username")
amount=int(getParameterValue("amount"))
card_name=getParameterValue("card_name")
card_number=getParameterValue("card_number")
card_authNumber=getParameterValue("card_authNumber")
card_expiryDate=getParameterValue("card_expiryDate")

msg={
    "status":"error",
    "msg":"email or password is not correct! <br>Please check again"
}

if(username!='null' and sequence!='null' and timestamp!='null' and amount!='null'):
    if(amount>0):
        #generate hashcode
        hashcode=calculateHashcode(username, sequence, timestamp, amount, '')

        #connect to the BOA payment service
        outcome=purchase(card_name, card_number, card_authNumber, card_expiryDate, amount)

        if(outcome==''):
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
            msg["msg"]=outcome
        
    else:
        msg["msg"]="Transaction failed: amount <=0."

    
print simplejson.dumps(msg)
