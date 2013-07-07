
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
    def returnMsg(type, accountInfo):
        if(accountInfo is None):
            accountInfo={}
        
        msg={
            "success": {"status":"ok","msg": "login succesfully", "account":accountInfo},
            "error.password": {"status":"error","msg":"password is not correct! Please check again"},
            "error.email":{ "status":"error","msg":"Email is not validated. Please try again. Or not a member yet? Please sign up first!"}
        }
        return msg[type]


    accountInfo={
        "Email": "",
        "Email_Verified": True,
        "Signup_Date":"2013/07/01"
    }
    
    #exception
    if email in exception:
        if (password==exception[email]):
            accountInfo["Email"]=email
            return returnMsg("success", accountInfo)
        else:
            return returnMsg("error.email")
    else:
        db=MongoClient()["maptime"]
        collection=db["user"]
        user=collection.find_one({"email": email})

        #check if email exists
        if(user is not None):
            #check password
            pw=user["password"]
            
            if(pw==password):
                accountInfo["Email"]=user["email"]
                accountInfo["Email_Verified"]=user["emailVerified"]
                accountInfo["Signup_Date"]=user["dateRegister"].strftime("%Y-%m-%d %H:%M:%S %Z")
                return returnMsg("success", accountInfo)
            else:
                return returnMsg("error.password", None)
        else:
            return returnMsg("error.email", None)


    
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

if(email!='null' and password!='null'):
    #check login
    msg=checkLogin(email, password)

print simplejson.dumps(msg)
