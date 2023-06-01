# fetchTakeHome

## Prerequisites

Make sure you have Node.js installed in your environment.

## Installation

First, clone the repo:

```bash
git clone https://github.com/trumanmiller/fetchTakeHome.git
```

Then navigate into the directory and install dependencies:

```bash
cd fetchTakeHome
npm install
```

## Configuration

Create a YAML file that lists the APIs you want to check. For each API, specify its URL, name (optional), method (optional), body (optional), and headers (optional).

```yaml
- name: "API Name 1"
  url: "http://api.url/1"
  method: "GET"
  headers:
    Content-Type: "application/json"
- name: "API Name 2"
  url: "http://api.url/2"
  method: "POST"
  body: "{ \"key\": \"value\" }"
  headers:
    Content-Type: "application/json"
```

## Usage

Run the script using Node.js. Here's the command format (argument order matters):

```bash
node index.js [configFilePath]
```

- `configFilePath` - The path to your YAML configuration file.

Here's an example:

```bash
node index.js test.yml
```

This will start the script with the configuration from `test.yml`, making requests every 30 seconds and considering any request that takes longer than 1 second to respond as failed.

## Output

The script logs the availability of each domain to the console:

- If availability is 100%, it's logged in green.
- If availability is 99%-98%, it's logged in yellow.
- For lower availability, it's logged in red.


The script keeps running, repeating the checks at the specified interval. To stop it, press Ctrl/Cmd+C.
