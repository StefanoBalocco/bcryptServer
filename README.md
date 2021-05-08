# bcryptServer

A microservice that expose a bcrypt API server, to separate computational expensive hashing from nodejs application.

It expose two api command:

###HASH
POST `/hash/[rounds]`
Must receive, in json format, a field named `data` that will be hashed.
Round must be a number, indicating the salting rounds.
It return a json containg a result field with the hash or an error field contain the text description of the error.

###COMPARE
POST `/compare`
Must receive, in json format, a field named `data` with the data to be hashed and a field named 'hash' with the existing hash.
It return a json containg a boolean result field or an error field contain the text description of the error.

###HTTPS
With the default configuration it listen on http.
To listen on https you should configure, in config.js, HTTPS.key and HTTPS.certificate with the path to the two files.

Inspired by BaaS (https://auth0.engineering/bcrypt-as-a-service-9e71707bda47) but with less dependencies.
