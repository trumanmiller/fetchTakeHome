const yaml = require('js-yaml');
const fs = require('fs');
const configFilePath = process.argv[2] ?? 'test.yml';
const pollInterval = process.argv[3] ?? 15000;
const timeout = process.argv[4] ?? 500;

// it is assumed that your number of urls is smaller then your tcp connection limit, else request batching would need to be implimented

// and of course if this was going to be used as anything other then a script you would probably want pure functions or perhaps a oop architecture

let configData;
try {
  configData = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
} catch (err) {
  console.error(err);
}

const cumulativeData = {};
for (const { name } of configData) cumulativeData[name] = { success: 0, total: 0 };

const makeRequest = (url, name, body, headers, method = 'GET') =>
  new Promise((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(url, {
      method,
      body,
      headers,
      signal,
    })
      .then((res) => {
        let success;
        if (res.status >= 200 && res.status <= 299) success = true;
        else success = false;
        resolve({
          name,
          success,
        });
      })
      .catch((err) => {
        resolve({
          name,
          success: false,
        });
      });

    setTimeout(() => {
      controller.abort();
      resolve({ name, success: false });
    }, timeout);
  });

const main = async () => {
  const requests = [];
  for (const { url, name, method, body, headers } of configData) {
    requests.push(makeRequest(url, name, body, headers, method));
  }

  const completedRequests = await Promise.allSettled(requests);
  for await (const { value } of completedRequests) {
    if (value.success) cumulativeData[value.name].success += 1;
    cumulativeData[value.name].total += 1;
  }

  for (const name in cumulativeData) {
    const { success, total } = cumulativeData[name];

    const availability = Math.round((success / total) * 100);

    // completely arbitrary thresholds
    if (availability === 100) {
      console.log(`\x1b[35m${name}\x1b[0m has \x1b[32m${availability}%\x1b[0m availability percentage`);
    } else if (availability === 99 || availability === 98) {
      console.log(`\x1b[35m${name}\x1b[0m has \x1b[33m${availability}%\x1b[0m availability percentage`);
    } else {
      console.log(`\x1b[35m${name}\x1b[0m has \x1b[31m${availability}%\x1b[0m availability percentage`);
    }
  }
  console.log('-------------');
};

main();
setInterval(main, pollInterval);
