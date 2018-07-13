// ==UserScript==
// @name         Spotify ad skipper
// @version      1.0
// @namespace    http://tampermonkey.net/
// @description  A small script which will help to skip audio ads on spotify
// @match        https://*.spotify.com/*
// @grant        none
// @run-at document-end
// ==/UserScript==

!async function () {

    function getLocationQueries() {
        if (document.location) {
            const raw = document.location.search.substring(1);
            const rawParts = raw.split(/&/g);
            const queries = {};

            for (let p of rawParts) {
                const name = decodeURIComponent(p.substring(0, p.indexOf('=')));
                queries[name] = decodeURIComponent(p.substring(name.length + 1, p.length));
            }

            return queries;
        }
    }

    function createLocationQuery(obj) {
        const keys = Object.keys(obj);
        let query = '?';

        for (let i = 0; i < keys.length; i++) {
            const name = encodeURIComponent(keys[i]);
            const value = encodeURIComponent(obj[name]);
            query += `${name}=${value}&`;
        }

        return query.substring(0, query.length - 1);
    }

    async function queryAsync(query) {
        return new Promise(resolve => {
            !function check() {
                const element = document.querySelector(query);
                if (element) {
                    return resolve(element);
                }
                setTimeout(check, 250);
            }();
        });
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const queries = getLocationQueries();
    if (Boolean(queries.autoplay)) {
        queryAsync('button.spoticon-play-16').then(async b => {
            while (b.title === 'Play') {
                b.click();
                await sleep(2000);
            }
        });
    }

    // Wait a little bit
    setTimeout(() => {
        queryAsync('.now-playing-bar').then(element => {
            new MutationObserver(() => {
                const link = document.querySelector('.now-playing > a');
                console.log('Check for ad.', new Date().toString());

                if (link) {
                    console.log('Ad found, reload and autoplay.');
                    queries.autoplay = true;

                    // Reload page
                    const base = document.location.origin + document.location.pathname;
                    const queryString = createLocationQuery(queries);

                    console.log('Open', base + queryString);
                    window.open(base + queryString, '_self');
                }
            }).observe(element, {
                characterData: true,
                childList: true,
                attributes: true,
                subtree: true
            });
        });
    }, 1000);
}();
