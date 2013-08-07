
#Standard Libraries
import cgi #import cgi library to get url parameters from users
import json as simplejson  #import libaray to use json
from pymongo import MongoClient
import smtplib #send email by using smtp
import datetime


print "Content-Type: text/html \n"


app={
    "parameter":cgi.FieldStorage(),
    "dbName":"maptime",
    "dbCollection": "user",
    "smtpServer":"smtp.gmail.com",
    "smtpPort":587,
    "gmailAccount":"pathgeo@gmail.com",
    "gmailPassword": "NETRE_2012"
}



#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in app["parameter"] and app["parameter"][name].value!=""):
        value=app["parameter"].getvalue(name)

    return value
#--------------------------------------------------------------------------

    
#register user to db-------------------------------------------------------
def register(obj):
    client=MongoClient()
    collection=client[app["dbName"]][app["dbCollection"]]
    user=collection.find_one({"email":obj["email"]})
    
    #determine whether email is already registered
    if (user is not None):
        return {
            "status":"error",
            "msg":"The email address is already existed. Please use other email to sign up"
        }
    else:
        collection.insert(obj)

        id=collection.find_one({"email": obj["email"]})["_id"]
        id=str(id)
        #sendEmail(obj["email"], id)
        
        return {
            "status":"ok",
            "msg":"signup succesfully",
            "account":{
                "email":obj["email"],
                "emailVerified": obj["emailVerified"],
                "signupDate": obj["dateRegister"]
            }
        }
#----------------------------------------------------------------------------


#send email for validation-------------------------------------------------
def sendEmail(email, id):
    subject="[Pathgeo] Confirm your email address"
    body="""
    Dear Customers: <p></p> We are excited to have you with Pathgeo. <br>
    Please confirm your email by clicking the following link. <p></p>
    <a href='https://www.pathgeo.com/demo/maptime/python/verify.py?id=""" + id + """ target='_blank'>https://www.pathgeo.com/demo/maptime/python/verify.py?id=""" + id + """</a><p></p> 
    This link will redirect you to our Pathgeo product: MapTime.<br>
    From there you can start to upload your customers' data and geotagging on the map!<br>
    If you have any comments or feedbacks, please feel free to <a href='mailto:pathgeo@mail.com'>contact us</a><p></p>
    Sincerely,<br>Pathgeo"""

    body = "" + body + ""

    headers = [
        "From: " + app["gmailAccount"],
        "Subject: " + subject,
        "To: " + email,
        "MIME-Version: 1.0",
        "Content-Type: text/html"
    ]
    headers = "\r\n".join(headers)

    session = smtplib.SMTP(app["smtpServer"], app["smtpPort"])
    session.ehlo()
    session.starttls()
    session.ehlo
    session.login(app["gmailAccount"], app["gmailPassword"])

    session.sendmail(app["gmailAccount"], email, headers + "\r\n\r\n" + body)
    session.quit()
#------------------------------------------------------------------



#main
email=getParameterValue("email")
password=getParameterValue("password")


msg={
    "status":"error",
    "msg":"email or password is not correct! Please check again"
}

if(email!='null' and password!='null'):
    #sign up
    #user obj
    obj={
        "email":email,
        "password":password,
        "emailSent":False,
        "emailVerified": False,
        "dateRegister": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z"),
        "accountType": "free",
        "credit": 3000
    }

    #resiter a user account and print result
    msg=register(obj)
   

print simplejson.dumps(msg)
