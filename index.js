const fs = require('fs');
const yaml = require('js-yaml');

const configFilePath = process.argv[2];
const pollInterval = 15000;
const timeout = 500;

// it is assumed that your number of urls is smaller then your tcp connection limit, else request batching would need to be implimented

// and of course if this was going to be used as anything other then a script you would probably want pure functions or perhaps a oop architecture

if (!configFilePath) throw new Error('No input file specified');

const configData = yaml.load(fs.readFileSync(configFilePath, 'utf8'));

const cumulativeData = {};
for (const { url } of configData) {
  const domain = new URL(url).hostname;
  cumulativeData[domain] = { success: 0, total: 0 };
}

const makeRequest = (url, body, headers, method = 'GET') =>
  new Promise((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;
    const domain = new URL(url).hostname;
    fetch(url, {
      method,
      body,
      headers,
      signal,
      redirect: 'error', // redirects wouldn't be in 200-299 range
    })
      .then((res) => {
        let success;
        if (res.status >= 200 && res.status <= 299) success = true;
        else success = false;
        resolve({
          domain,
          success,
        });
      })
      .catch((err) => {
        resolve({
          domain,
          success: false,
        });
      });

    setTimeout(() => {
      try {
        controller.abort();
      } catch (err) {
        console.error(err);
      }
      resolve({ domain, success: false });
    }, timeout);
  });

const main = async () => {
  const requests = [];
  for (const { url, method, body, headers } of configData) {
    requests.push(makeRequest(url, body, headers, method));
  }

  const completedRequests = await Promise.allSettled(requests);
  for await (const { value } of completedRequests) {
    if (value.success) cumulativeData[value.domain].success += 1;
    cumulativeData[value.domain].total += 1;
  }

  for (const domain in cumulativeData) {
    const { success, total } = cumulativeData[domain];

    const availability = Math.round((success / total) * 100);

    // completely arbitrary thresholds, weird chars are to change console.log colors
    if (availability === 100) {
      console.log(`\x1b[35m${domain}\x1b[0m has \x1b[32m${availability}%\x1b[0m availability percentage`);
    } else if (availability === 99 || availability === 98) {
      console.log(`\x1b[35m${domain}\x1b[0m has \x1b[33m${availability}%\x1b[0m availability percentage`);
    } else {
      console.log(`\x1b[35m${domain}\x1b[0m has \x1b[31m${availability}%\x1b[0m availability percentage`);
    }
  }
  console.log('-------------');
};

main();
setInterval(main, pollInterval);
