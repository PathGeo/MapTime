
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
def changePassword(email, oldPW, newPW):
    def returnMsg(type):
        msg={
            "success": {"status":"ok","msg": "change password succesfully"},
            "error.notMatch": {"status":"error","msg":"old password is not correct! Please check again"},
            "error.cannotChange":{"status":"error","msg":"This account is only for demo and cannot change the password"}
        }
        return msg[type]

    
    #exception
    if email in exception:
        return returnMsg("error.cannotChange")
    else:
        db=MongoClient()["maptime"]
        collection=db["user"]
        user=collection.find_one({"email": email})

        #check if email exists
        if(user is not None):
            if(user["password"]==oldPW):
                #update password
                collection.update({"_id": user["_id"]}, {"$set":{"password": newPW}},upsert=False)
                
                return returnMsg("success")
            else:
                return returnMsg("error.notMatch");
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
oldPW=getParameterValue("oldPW")
newPW=getParameterValue("newPW")

msg={
    "status":"error",
    "msg":"email, old password, or new password is missing! Please check again"
}

if(email!='null' and oldPW!='null' and newPW!='null'):
    #get account info
    msg=changePassword(email, oldPW, newPW)

print simplejson.dumps(msg)
