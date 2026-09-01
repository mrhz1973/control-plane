#!/bin/bash
docker exec litellm-primary python3 -c "import urllib.request,json; d=json.loads(urllib.request.urlopen('http://127.0.0.1:4000/v1/models').read()); print('models', [x.get('id') for x in d.get('data',[])])"
