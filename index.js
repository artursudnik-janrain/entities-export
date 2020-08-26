#!/usr/bin/env node
"use strict";

process.chdir(__dirname);

require('dotenv-defaults').config();

const async      = require('async'),
      fs         = require('fs'),
      createGzip = require('zlib').createGzip,
      mkdirp     = require('mkdirp'),
      moment     = require('moment');

const getChunk  = require('./lib/getChunk'),
      getCount  = require('./lib/getCount'),
      getState  = require('./lib/state').get,
      saveState = require('./lib/state').save;

mkdirp('data');

run().catch((err) => {
    console.error(err)
});

async function run() {
    const {REALM, ENTITY, CLIENT_ID, CLIENT_SECRET, PAGE_SIZE} = process.env;
    if (!REALM || !ENTITY || !CLIENT_ID || !CLIENT_SECRET || !PAGE_SIZE) {
        return Promise.reject('required settings not given')
    }

    const state = await getState();

    let deltaExport;

    if (state.lastExport && state.lastExport.start) {
        console.log(`previous export run: ${state.lastExport.start}`);
        console.log(`checking entities count modified since ${state.lastExport.start}`);
        deltaExport = true;
    } else {
        console.log(`this is the first export run for ${process.env.REALM}, ${process.env.ENTITY}`);
        console.log(`checking total entities count`);
        deltaExport = false;
    }

    const profilesCountToBeFetched = await getCount({
        realm         : REALM,
        entity        : ENTITY,
        clientId      : CLIENT_ID,
        clientSecret  : CLIENT_SECRET,
        minLastUpdated: state.lastExport && state.lastExport.start ? moment.utc(state.lastExport.start).format('YYYY-MM-DD HH:mm:ss.SSSSSS ZZ') : null
    });

    if (profilesCountToBeFetched === 0) {
        console.log('no entities to be fetched');
        return;
    }

    console.log(`fetching ${profilesCountToBeFetched} entities`);

    const params = {
        realm       : REALM,
        entity      : ENTITY,
        pageSize    : PAGE_SIZE,
        clientId    : CLIENT_ID,
        clientSecret: CLIENT_SECRET
    };

    if (deltaExport) {
        params.minLastUpdated = moment.utc(state.lastExport.start).format('YYYY-MM-DD HH:mm:ss.SSSSSS ZZ');
    }

    const start = new Date();

    let prevLastIdInChunk = 0,
        chunksCounter     = 0,
        rowsCounter       = 0;

    const outputFile     = `data/entities-${REALM}-${ENTITY}-${deltaExport ? 'delta' : 'full'}-${new Date().toISOString().replace(/:/g, '')}.json.gz`,
          tempOutputFile = `${outputFile}.part`;

    const resultsFileStream = fs.createWriteStream(tempOutputFile),
          gzipStream        = createGzip();

    gzipStream.pipe(resultsFileStream);

    gzipStream.write('[\n');

    await async.doUntil(async () => {
            params.minId = prevLastIdInChunk;

            let chunkStartTime = new Date();
            let records = await getChunk(params);

            chunksCounter++;
            rowsCounter += records.length;

            const lastIdInChunk = records.length ? records[records.length - 1].id : null;

            if (lastIdInChunk) {
                const speedEntPerSec = rowsCounter / (new Date() - start) * 1000;
                console.log(`fetched chunk ${chunksCounter} of ${records.length} entities in ${(new Date() - chunkStartTime) / 1000}s, ` +
                    `${rowsCounter} entities so far, ${profilesCountToBeFetched - rowsCounter} to be fetched (${Math.floor(speedEntPerSec)}/s, estimated time left: ${Math.round((profilesCountToBeFetched - rowsCounter) / speedEntPerSec)}s)`);
            } else {
                console.log(`fetched chunk with no entities in ${(new Date() - chunkStartTime) / 1000}s, ${rowsCounter} entities so far, no more entities to fetch`);
            }

            if (records.length > 0) {
                gzipStream.write(records.map(record => {
                    let recordSerialized = JSON.stringify(record);
                    return `\t${recordSerialized},`
                }).join('\n') + '\n');
            }

            prevLastIdInChunk = lastIdInChunk;

            return records.length < params.pageSize;
        }, async (stop) => stop
    );

    gzipStream.write(']\n');

    gzipStream.end();

    await saveState({
        lastExport: {
            start: start.toISOString(),
            end  : new Date().toISOString()
        }
    });

    if (rowsCounter === 0) {
        console.log('no entities fetched, removing empty file');
        await fs.promises.unlink(tempOutputFile);
    } else {
        console.log(`${rowsCounter} entities fetched`);
        await fs.promises.rename(tempOutputFile, outputFile);
    }

    console.log(`finished in ${(new Date() - start) / 1000}s`);
}


