#!/bin/python
from rethinkdb import r
import sys

# Connect to the database
TESTRESPONSE = "defaultIntroHash"

try:
    r.connect(sys.argv[1], sys.argv[2]).repl()
    result = r.db('TadaDB_v1').table('meta').get(0).run()
    # print(f'Connection returned: {result}')
    if result == TESTRESPONSE:
        print('Successful Connection and valid database')
        sys.exit(0)
    else:
        sys.exit(1)
except:
    sys.exit(1)
