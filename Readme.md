# Prerequisites
Only node (https://nodejs.org/en/) interpreter is required to be installed in the system. Script was tested with v12 of 
nodejs, however, it may work with earlier versions.
# Installation

Download source files into a folder. Then execute from within it the following:
```shell script
npm install
```

# Configuration
.env.defaults file contains a list of environment variables used by the script during execution. The script reads their 
values from .env.defaults file or if .env file exists, values are read from it or if environment variables exist, they 
take precedence.

## .env file
Create .env file and put there variables values you want to override. For example:
```text
REALM=myapp.us-dev
```

## Environment variables
Define environment variables values you need to override, for example:
```shell script
export REALM=myapp.us-dev
```

# Execution
Execute
```shell script
node index.js
```
or
```shell script
./index.js
```

During execution, script produces console output with some details. 

When executed for the first time output:
```text
this is the first export run for jenmcapture.us-dev, DCS_840
checking total entities count
fetching 928857 entities
fetched chunk 1 of 1000 entities in 1.778s, 1000 entities so far, 927857 to be fetched (562/s, estimated time left: 1652s)
fetched chunk 2 of 1000 entities in 1.475s, 2000 entities so far, 926857 to be fetched (609/s, estimated time left: 1524s)
fetched chunk 3 of 1000 entities in 1.285s, 3000 entities so far, 925857 to be fetched (653/s, estimated time left: 1421s)
3951 entities fetched
finished in 8.159s
```
When executed next times, when no modified entities since last run found:
```text
previous export run: 2020-02-18T15:38:36.133Z
checking entities count modified since 2020-02-18T15:38:36.133Z
no entities to be fetched
```

Results are saved in data folder that is created if does not exist. Results files are compressed and versioned with
execution time included in filename. For example:
```text
-rw-r--r--   1 jsudnikh  staff  86243923 Feb 17 19:13 results-2020-02-17T17:45:49.808Z.json.gz
-rw-r--r--   1 jsudnikh  staff     25055 Feb 18 14:29 results-2020-02-18T13:29:41.673Z.json.gz
-rw-r--r--   1 jsudnikh  staff     25055 Feb 18 14:30 results-2020-02-18T13:30:05.866Z.json.gz

```

Results are saved in `.part` files until script finishes execution when they are renamed to `.gz`. This allows to
identify not complete data sets when script crashes.

Last execution time is saved in a `data/state.json` file. Content of this file is checked during next executions
and only entities modified after last execution are exported.