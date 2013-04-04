import cgi, json
import cgitb
import excelUtils

cgitb.enable()

form = cgi.FieldStorage()
file = form['photo']

book = excelUtils.getExcelFromBinary(file.file)
results = excelUtils.getJSONFromWorksheet(book.sheet_by_index(0))

print ''
print json.dumps(results)


