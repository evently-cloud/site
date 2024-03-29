---
layout: body
eleventyNavigation:
    key: Smart&nbsp;Thermostat
    parent: Tutorials
    order: 1
permalink: tutorials/thermostat/
title: Tutorials
---

# Smart Thermostat Tutorials

This tutorial will take you through the features Evently has to offer in the context of a smart thermostat. Before you start, please request an access token and select your favorite http client. This tutorial provides examples using both [cURL](https://curl.se) and the browser console. Please avoid using ReqBin, or other online cURL clients, as they have bugs and also collect your information.

To use the browser, open the Javascript Console execute the `fetch()` statements in the command prompt. You will see results in the console log.

### Validate access

In your terminal, run this command:

```shell [g1:cURL]
curl https://preview.evently.cloud
```
```js [g1:browser]
fetch('https://preview.evently.cloud')
  .then(res => res.json())
  .then(console.info)
```

You should get back this JSON response, in [HAL format](https://tools.ietf.org/id/draft-kelly-json-hal-01.html):

```json
{
  "_links": {
    "registry": {
      "title": "Register Entity Events for the ledger.",
      "href": "/registry",
      "profile": "<https://level3.rest/profiles/home>"
    },
    "append": {
      "title": "Append Events to the ledger.",
      "href": "/append",
      "profile": "<https://level3.rest/profiles/home>"
    },
    "selectors": {
      "title": "Select Events to replay from the ledger.",
      "href": "/selectors",
      "profile": "<https://level3.rest/profiles/home>"
    },
    "ledgers": {
      "title": "Download or reset ledger Events.",
      "href": "/ledgers",
      "profile": "<https://level3.rest/profiles/home>"
    }
  }
}
```

This root document contains links to Evently services. You can GET each link and inspect its contents to learn more about the service. This tutorial will be exploring all of these services. First, we need to register an event.

::: sidebar

Evently is a Hypermedia API, which means that every resource contains links to related resources. Client developers can GET the resources at each level to learn how to use them, as well as discover other related resources in the `_links` section of the body or in the http `Link` headers. Additionally, each resource has one or more `Profile` headers with links to documentation describing they offer and how they can be used.

Evently’s API is self-documenting; you can `GET` any URL and learn about the resource, including links to related resources. Form resources will return a JSON Schema document that clients use to construct valid `POST` requests.

:::

## Tutorial 1: Measure and Check Temperature

### Register an Event Type

The Evently Registry contains a listing of all the entity events available in to an application. Before an event can be appended, it’s type must be registered in the Registry. To access the registry, follow the `registry` link from the API root. For convenience, add your API access token as an environment variable for cURL commands or a window constant in the browser. The statements below will pick up this constant and use them:

```shell [g1:cURL]
export EVENTLY_TOKEN="your-token-here"
```
```js [g1:browser]
const EVENTLY_TOKEN = 'your-token-here'
```

Now you can use that var in your cURL calls to populate the `Authorization` header. Be sure to use double quotes (`"`) so that the shell can replace `$EVENTLY_TOKEN` with your actual token value.

```shell [g1:cURL]
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "event":"temperature-recorded"}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/registry/register-event', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${EVENTLY_TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        entity: 'thermostat',
        event:  'temperature-recorded'
    })
  })
  .then(res => res.text())
  .then(console.info)
```

This returns a success message:

```
registered thermostat/temperature-recorded
```

To see what event types have been registered, read the `registry/entities` resource. Your access token gains you access to your own entities:

```shell [g1:cURL]
curl https://preview.evently.cloud/registry/entities \
  -H "Authorization: Bearer $EVENTLY_TOKEN"
```
```js [g1:browser]
fetch('https://preview.evently.cloud/registry/entities', {
    headers: {
      Authorization: `Bearer ${EVENTLY_TOKEN}`
    }})
  .then(res => res.json())
  .then(console.info)
```

Will return this result:

```json
{
  "_links": {
    "https://level3.rest/patterns/list#list-entry": [
      {
        "name": "thermostat",
        "href": "/registry/entities/thermostat",
        "profile": "<https://level3.rest/profiles/home>"
      }
    ],
    "https://level3.rest/patterns/list/editable#add-entry": {
      "title": "Register an Entity Event",
      "href": "/registry/register-event",
      "profile": "<https://level3.rest/profiles/form>"
    }
  }
}
```

The thermostat entity is listed, along with a link to the form resource to add new event entries. Follow the thermostat link:

```shell [g1:cURL]
curl https://preview.evently.cloud/registry/entities/thermostat \
  -H "Authorization: Bearer $EVENTLY_TOKEN"
```
```js [g1:browser]
fetch('https://preview.evently.cloud/registry/entities/thermostat', {
    headers: {
      Authorization: `Bearer ${EVENTLY_TOKEN}`
    }})
  .then(res => res.json())
  .then(console.info)
```

Here you will find the events registered to the thermostat entity:

```json
{
  "_links": {
    "https://level3.rest/patterns/list#list-entry": [
      {
        "name": "temperature-recorded",
        "href": "/registry/entities/thermostat/temperature-recorded",
        "profile": "<https://level3.rest/profiles/data>"
      }
    ],
    "https://level3.rest/patterns/list/editable#add-entry": {
      "title": "Register an Entity Event",
      "href": "/registry/register-event",
      "profile": "<https://level3.rest/profiles/form>"
    }
  }
}
```

### Append an Event

Now that you have registered an event type, you can append an event of this type to the ledger. Evently offers three different append actions, but the simplest append action will add the event as an unconditional fact. In our thermostat example, we want to record a temperature measurement event, and we want to record it without regard to any other events in the ledger.

When a client appends a factual event, they need to provide the following information in the body of the request:

| field    | description                                                                                                                                                                                                                                                                                              |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity` | The name of the entity. In this tutorial, it is `thermostat`                                                                                                                                                                                                                                             |
| `event`  | The type of event. In this step, it is `temperature-recorded`                                                                                                                                                                                                                                            |
| `key`    | The entity instance key, which is something business-relevant. In this tutorial, it is `thermostat1`.                                                                                                                                                                                                    |
| `meta`   | Meta information about the event context. This object can contain anything your application deems relevant. In this tutorial, we are using a meta value called `causation` to indicate the cause of the event. If your application has no meta information, then send an empty object as the value: `{}` |
| `data`   | The event-specific data. In this step, we are sending the temperature in Celsius.                                                                                                                                                                                                                        |

Send this request in your terminal:

```shell [g1:cURL]
curl https://preview.evently.cloud/append/fact \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "event":"temperature-recorded",
       "key":"thermostat1",
       "meta":{"causation":"14rew3494"},
       "data":{"celsius":18.5}}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/append/fact', {
    method: 'POST',
    headers: {
        Authorization:  `Bearer ${EVENTLY_TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity: 'thermostat',
      event:  'temperature-recorded',
      key:    'thermostat1',
      meta:   {causation: '14rew3494'},
      data:   {celsius: 18.5}
    })
  })
  .then(res => res.json())
  .then(console.info)
```

This request returns a success result:

```json
{
  "eventId": "0005d037167030998488b808a0f8f294"
}
```

The request body shows the `eventId` of the newly-created event.

### Select Events for Replay

Now that we have persisted an event, we will replay that entity’s events and find it in the event log. To do so, we use the Replay Selector API at `/selectors/replay` to fetch this thermostat’s `temperature-recorded` events. This cURL command uses the `-L` flag to follow the `Location` header in the initial `POST` response.

```shell [g1:cURL]
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "events":["temperature-recorded"],
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
      event:  'temperature-recorded',
      keys:   ['thermostat1']
    })
  })
  .then(res => res.text())
  .then(lines => lines.trim().split('\n').map(JSON.parse))
  .then(console.info)
```

This request will replay all of the `temperature-recorded` events for entity `thermostat` with entity key `thermostat1`. The response is a stream of newline-delimited JSON, followed by a footer line.

```json lines
{"entity":"thermostat","key":"thermostat1","event":"temperature-recorded","eventId":"0005d0df8d1e990f13658533a0f8f294","timestamp":"2021-11-16T03:30:47.430415Z","meta":{"causation":"1"},"data":{"celsius":18.5}}
{"selectorId":"g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ","mark":"0005d0df8d1e990fa0f8f294","_links":{"start":{"href":"/selectors/fetch/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ.ndjson"},"current":{"href":"/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWShYcQMAAXQ340emQ-g-PKU.ndjson"}}}
```

The body’s first line has the single event appended for this entity. The JSON in this line contains the event details, eventId and the server’s append timestamp.

```json
{
  "entity": "thermostat",
  "key": "thermostat1",
  "event": "temperature-recorded",
  "eventId": "0005d0df8d1e990f13658533a0f8f294",
  "timestamp": "2021-11-16T03:30:47.430415Z",
  "meta": {
    "causation": "1"
  },
  "data": {
    "celsius": 18.5
  }
}
```

The second body line has the selector footer information. Reformatted, the footer looks like this:

```json
{
  "selectorId": "g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ",
  "mark": "0005d0df8d1e990fa0f8f294",
  "_links": {
    "start": {
      "href": "/selectors/fetch/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ.ndjson"
    },
    "current": {
      "href": "/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWShYcQMAAXQ340emQ-g-PKU.ndjson"
    }
  }
}
```
The first footer value, `selectorId`, identifies the declared selector. In this example, it represents the object we sent in with the `/selectors/replay` request.

The second footer value, `mark`, identifies the ledger mark for the selector. The ledger mark points to a place in the ledger that this selector has read up to.

The footer has two `_link` values that give you access to the selector’s events from the `start` of the ledger, and a `current` link to fetch new events that have occurred since this selector was executed.

### Select New Events

Temperature events may be appended at any time, so an application can ask Evently to send only the events that have occurred _after_ a ledger mark. This will let the application skip events it has already seen and only retrieve new events. The client has two choices:

1. GET the url in the `current` link. This link will fetch any new events that have occurred after this selector was executed.
2. If you no longer have the `current` link, then POST the selector request, as before, but with a new property called `after`. Use the `mark` value from the selector footer, or use an `eventId` value if easier.

Step 2 is listed below; please edit the value of `after` to match the value from the selector’s footer.

```shell [g1:cURL]
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer $EVENTLY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entity":"thermostat",
       "events":["temperature-recorded"],
       "keys":["thermostat1"],
       "after":"your-mark-or-eventId-here"}'
```
```js [g1:browser]
fetch('https://preview.evently.cloud/selectors/replay', {
    method: 'POST', 
    headers: {
      Authorization: `Bearer ${EVENTLY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity: 'thermostat',
      event:  'temperature-recorded',
      keys:   ['thermostat1'],
      after:  'your-mark-or-eventId-here'
    })
  })
  .then(res => res.text())
  .then(lines => lines.trim().split('\n').map(JSON.parse))
  .then(console.info)
```

The result of either of these approaches is a single line–the selector footer:

```json
{"selectorId":"g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ","mark":"0005d0df8d1e990fa0f8f294","_links":{"start":{"href":"/selectors/fetch/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ.ndjson"},"current":{"href":"/selectors/fetch/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWShYcQMAAXQ340emQ-g-PKU.ndjson"}}}
```

No new events have been appended, so the response only has the selector footer.

## Next Tutorial: Account Registration

Now that the thermostat can post new event facts, the next tutorial shows how to create an owner account and register the thermostat to this account.

### [Tutorial 2: Account Registration](/tutorials/account)
