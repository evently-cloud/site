---
layout: body
eleventyNavigation:
    key: Account&nbsp;Registration
    parent: Tutorials
    order: 2
permalink: tutorials/account/
---

## Tutorial 2: Associate a thermostat to an account

[In the first tutorial](/tutorials/thermostat) you created events to measure the temperature in a smart thermostat. Next, its owner wants to link the thermostat to an application account. We will call this new event `associated-to-account`.

First, be sure your `EVENTLY_TOKEN` is in your environment variables:

```shell
echo $EVENTLY_TOKEN
```

This should return your Evently access token. If not, you can set it with this command. Be sure to replace 'your-token-here' with the token you received from Evently when you signed up for Preview access. For browser, run the statement in the JavaScript console.

```shell [g1:cURL]
export EVENTLY_TOKEN="your-token-here"
```
```js [g1:browser]
const EVENTLY_TOKEN = 'your-token-here'
```

### Register New Events

In order to append this new event type, register this new event type in the Event Registry:

```shell [g1:cURL]
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "event":"associated-to-account"}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/registry/register-event', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        entity: 'thermostat',
        event:  'associated-to-account'
    })
  })
  .then(res => res.text())
  .then(console.info)
```

This returns a success message:

```
registered thermostat/temperature-recorded
```

We also need to create an account entity with a creation event:

```shell [g1:cURL]
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"account",
       "event":"account-created"}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/registry/register-event', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        entity: 'account',
        event:  'account-created'
    })
  })
  .then(res => res.text())
  .then(console.info)
```

This returns a success message:

```
registered account/account-created
```

### Create a Unique Account

The next goal is to create a new account for your user, Mike Meyers. Your business rules require that an account’s `username` cannot be used for more than one account, so a filter selector can check to see if an account with username `mikemeyers` already exists.

```shell [g1:cURL]
curl -L https://preview.evently.cloud/selectors/filter \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{
        "account":{
          "account-created":"$.username ? (@==\"mikemeyers\")"}}}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/selectors/filter', {
    method: 'POST', 
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        account: {
          'account-created': '$.username ? (@=="mikemeyers")' 
        }
      }
    })
  })
  .then(res => res.text())
  .then(lines => lines.trim().split('\n').map(JSON.parse))
  .then(console.info)
```

The filter selector looks inside every event for a match in the `data` event field. The first key in the query is the entity name `account` and the keys inside `account` are event names. Each event name key has a [SQL JSONPath](/concepts/sql-jsonpath) query statement that is applied to every `account/account-created` event, and matching events come back in the selector result. If you are familiar with JSONPath dialects, then Evently’s SQL JSONPath should be straightforward to pick up.

This statement returns an empty selector, or a result with only a footer object:

```json
{
  "selectorId": "gaFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIik",
  "mark": "0000000000000000bee3f960",
  "_links": {
    "start": {
      "href": "/selectors/fetch/gaFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIik.ndjson"
    },
    "current": {
      "href": "/selectors/fetch/gqFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIimhYcQMAAAAAAAAAAC-4_lg.ndjson"
    }
  }
}
```

Now that you know the event to create Mike Meyer’s username will be unique, append the event using the footer’s `selectorId` and `mark` values as the atomic append `selector` property. The `key` value must be a unique value, and is usually a business-relevant key:

```shell [g1:cURL]
curl -i https://preview.evently.cloud/append/atomic \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"account",
       "event":"account-created",
       "key":"wqeuru4594",
       "meta":{},
       "data":{"username":"mikemeyers"},
       "selector":{
         "selectorId":"your-selectorId","mark":"your-mark"}}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/append/atomic', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity:   'account',
      event:    'account-created',
      key:      'wqeuru4594',
      meta:     {},
      data:     {username: 'mikemeyers'},
      selector: {
        selectorId: 'your-selectorId',
        mark:       'your-mark'
      }
    })
  })
  .then(res => res.json())
  .then(console.info)
```

You will get back a success message:

```json
{
  "eventId": "0005d13ee253e847da62cab2bee3f960"
}
```

To show that Evently is only appending an event if the supplied selector is empty, meaning no new events have occurred after the selector, simply rerun the exact same command to append with the selector. You will see a `409 Conflict` status code and the following error message:

```json
{
  "message": "Race Condition! Entity has newer events. Please GET /selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson for the most recent events.",
  "current": "/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson"
}
```

### Associate Thermostat to Account

In your business model, thermostats can only be associated to a single account. To satisfy this business requirement, your application should look for an `associated-to-account` event in the thermostat’s entity log.

```shell [g1:cURL]
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "events":["associated-to-account"],
       "keys":["thermostat1"]}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/selectors/replay', {
    method: 'POST', 
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity: 'thermostat',
      event:  'associated-to-account',
      keys:   ['thermostat1']
    })
  })
  .then(res => res.text())
  .then(lines => lines.trim().split('\n').map(JSON.parse))
  .then(console.info)
```

This should return an empty selector, with just the selector footer object:

```json
{
  "selectorId": "g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50",
  "mark": "0000000000000000bee3f960",
  "_links": {
    "start": {
      "href": "/selectors/fetch/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50.ndjson"
    },
    "current": {
      "href": "/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson"
    }
  }
}
```

Now that you know this thermostat has no `associated-to-account` events, use the `selectorId` and `mark` to atomically append the new event. You find these values in the selector footer you just fetched above. The thermostat’s owner `mikemeyers` has an account with the key `wqeuru4594`. Your event stores this association in an `account-key` field in the `data` field.

```shell [g1:cURL]
curl -i https://preview.evently.cloud/append/atomic \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "event":"associated-to-account",
       "key":"thermostat1",
       "meta":{},
       "data":{"account-key":"wqeuru4594"},
       "selector":{
         "selectorId":"your-selectorId","mark":"your-mark"}}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/append/atomic', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity:   'thermostat',
      event:    'associated-to-account',
      key:      'thermostat1',
      meta:     {},
      data:     {'account-key': 'wqeuru4594'},
      selector: {
        selectorId: 'your-selectorId',
        mark:       'your-mark'
      }
    })
  })
  .then(res => res.json())
  .then(console.info)
```

You will get back a success message:

```json
{
  "eventId": "0005d13ee253e847da62cab2bee3f960"
}
```

To verify that Evently is only appending an event if the supplied selector is empty, meaning no new events have occurred after the selector, simply rerun the exact same cURL command to append with the selector. You should see a `409 Conflict` status code and an error message:

```json
{
  "message": "Race Condition! Entity has newer events. Please GET /selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson for the most recent events.",
  "current": "/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson"
}
```
