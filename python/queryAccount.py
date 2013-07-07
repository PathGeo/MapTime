
#Standard Libraries
import cgi #import cgi library to get url parameters from users
import json as simplejson  #import libaray to use json
from pymongo import MongoClient

print "Content-Type: text/html \n"


app={
    "parameter":cgi.FieldStorage()
}

exception={
    "pathgeodemo":"demo@42",
    "maptime":"maptimedemo"
}


#queyr db to get the account info-------------------------------------------------------------------
def getAccountInfo(email):
    msg={
        "status":"ok",
        "msg": "query succesfully",
        "account":{
            "Email": "",
            "Email_Verified": True,
            "Signup_Date":"2013/07/01"
        }
    }

    
    #exception
    if email in exception:
        msg["account"]["Email"]=email
        return msg
    else:
        db=MongoClient()["maptime"]
        collection=db["user"]
        user=collection.find_one({"email": email})

        #check if email exists
        if(user is not None):
           msg["account"]["Email"]=user["email"]
           msg["account"]["Email_Verified"]=user["emailVerified"]
           msg["account"]["Signup_Date"]=user["dateRegister"].strftime("%Y-%m-%d %H:%M:%S %Z")

           return msg
        else:
           return {
                "status":"error",
                "msg": "No such account. Please check again."
            }


    
#---------------------------------------------------------------------------------------


#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in app["parameter"] and app["parameter"][name].value!=""):
        value=app["parameter"].getvalue(name)

    return value
#--------------------------------------------------------------------------



#main
email=getParameterValue("email")

msg={
    "status":"error",
    "msg":"email is missing! Please check again"
}


if(email!='null'):
    #get account info
    msg=getAccountInfo(email)

print simplejson.dumps(msg)
