
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


#queyr db to verify the login info.-------------------------------------------------------------------
def checkLogin(email, password):
    def returnMsg(type):
        msg={
            "success": {"status":"ok","msg": "login succesfully"},
            "error.password": {"status":"error","msg":"password is not correct! Please check again"},
            "error.email":{ "status":"error","msg":"Email is not validated. Please try again. Or not a member yet? Please sign up first!"}
        }
        return msg[type]

    
    #exception
    if email in exception:
        if (password==exception[email]):
            return returnMsg("success")
        else:
            return returnMsg("error.email")
    else:
        db=MongoClient()["maptime"]
        collection=db["user"]

        #check if email exists
        if(collection.find({"email": email}).count()>0):
            #check password
            pw=collection.find_one({"email": email})["password"]
          
            if(pw==password):
                return returnMsg("success")
            else:
                return returnMsg("error.password")
        else:
            return returnMsg("error.email")


    
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
password=getParameterValue("password")

msg={
    "status":"error",
    "msg":"email or password is not correct! <br>Please check again"
}

if(email!=None and password!=None):
    #check login
    msg=checkLogin(email, password)

print simplejson.dumps(msg)
