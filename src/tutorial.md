---
layout: body
eleventyNavigation:
    key: Tutorial
---

# Smart Thermostat Tutorial

This tutorial will take you through the features Evently has to offer in the context of a smart thermostat. Before you start, please request an access token and select your favorite http client. The code herein uses [cURL](https://curl.se), the ubiquitous command-line http client. Please avoid using ReqBin, or other online curl client, as they have bugs and also collect your information.

### Validate access

In your terminal, enter this command:

```shell
curl https://preview.evently.cloud
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

Evently’s API is self-documenting so you can `GET` any URL and learn about the resource, including links to related resources. Form resources will return a JSON Schema document that clients use to construct valid `POST` requests.

:::

## Tutorial 1: Measure and Check Temperature

### Register an Event Type

The Evently Registry contains a listing of all the entity events available in to an application. Before an event can be appended, it’s type must be registered in the Registry. To access the registry, follow the `registry` link from the API root. Be sure to replace `<your-token-here>` with your preview access token.

```shell
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "event":"temperature-recorded"}'
```

This returns a success message:

```
registered thermostat.temperature-recorded
```

To see what event types have been registered, read the `registry/entities` resource. Your access token gains you access to your own entities:

```shell
curl https://preview.evently.cloud/registry/entities \
  -H "Authorization: Bearer <your-token-here>"
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

```shell
curl https://preview.evently.cloud/registry/entities/thermostat \
  -H "Authorization: Bearer <your-token-here>"
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
        ]
    }
}
```

### Append a Factual Event

Now that you have registered an event type, you can append an event of this type to the ledger. Evently offers three different append actions, but the simples append action will add the event as an unconditional fact. In our thermostat example, we want to record a temperature measurement event, and we want to record it without regard to any other events in the ledger.

When a client appends a factual event, they need to provide the following information in the body of the request:

| field  | description                                                                                                                                                                                                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity | The name of the entity. In this tutorial, it is `thermostat`                                                                                                                                                                                                                                             |
| event  | The type of event. In this step, it is `temperature-recorded`                                                                                                                                                                                                                                            |
| key    | The entity instance key, which is something business-relevant. In this tutorial, it is `thermostat1`.                                                                                                                                                                                                    |
| meta   | Meta information about the event context. This object can contain anything your application deems relevant. In this tutorial, we are using a meta value called `causation` to indicate the cause of the event. If your application has no meta information, then send an empty object as the value: `{}` |
| data   | The event-specific data. In this step, we are sending the temperature in Celsius.                                                                                                                                                                                                                        |

Send this request in your terminal:

```shell
curl https://preview.evently.cloud/append/fact \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "event":"temperature-recorded",
       "key":"thermostat1",
       "meta":{"causation":"1"},
       "data":{"celsius":18.5}}'
```

This request returns a success result:

```json
{
    "status": "SUCCESS",
    "ok": {
        "eventId": "0005d037167030998488b808a0f8f294"
    }
}
```

The request body shows a status of `SUCCESS` as well as an `ok` value with the `eventId`of the newly-created event.

### Select Events for Replay

Now that we have persisted an event, we will replay that entity’s events and find it in the event log. To do so, we use the Replay Selector API at `/selectors/replay` to fetch this thermostat’s `temperature-recorded` events. This cURL command uses the `-L` flag to follow the `Location` header in the initial `POST` response.

```shell
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "events":["temperature-recorded"],
       "keys":["thermostat1"]}'
```

This request will replay all of the `temperature-recorded` events for entity `thermostat` with entity key `thermostat1`. The response is a stream of newline-delimited JSON, followed by a footer line.

```json lines
{"entity":"thermostat","key":"thermostat1","event":"temperature-recorded","eventId":"0005d0df8d1e990f13658533a0f8f294","timestamp":"2021-11-16T03:30:47.430415Z","meta":{"causation":"1"},"data":{"celsius":18.5}}
{"selectorId":"g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ","mark":"0005d0df8d1e990fa0f8f294","_links":{"start":{"href":"/selectors/replay/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ.ndjson"},"current":{"href":"/selectors/replay/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWShYcQMAAXQ340emQ-g-PKU.ndjson"}}}
```

The body’s first line has the single event appended for this entity. The JSON in this line contains the event details, eventId and the server’s append timestamp.

The second body line has the selector footer information. It contains a `selectorId` which identifies the declared selector. In this example, it represents the object we sent in with the `/selectors/replay` request, which was:

```json
{
    "entity": "thermostat",
    "events": ["temperature-recorded"],
    "keys": ["thermostat1"]
}
```

The second footer value, `mark`, is a ledger mark and it points to a place in the ledger that this selector has read to.

The footer has two `_link` values that give you access to the selector’s events from the `start` of the ledger, and a `current` link to fetch new events that have occurred since this selector was executed.

### Select New Events

Temperature events may be appended at any time, so an application can ask Evently to send only the events that have occurred _after_ a ledger mark. This will let the application skip events it has already seen and only retrieve new events. POST the selector request, as before, but with a new property called `after`. Use the `mark` value from the selector footer, or use an `eventId` value if easier.

```shell
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "events":["temperature-recorded"],
       "keys":["thermostat1"],
       "after":"<your-mark-or-eventId-here"}'
```

The result is:

```json
{
    "selectorId": "g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ",
    "mark": "0005d0df8d1e990fa0f8f294",
    "_links": {
        "start": {
            "href": "/selectors/replay/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ.ndjson"
        },
        "current": {
            "href": "/selectors/replay/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWShYcQMAAXQ340emQ-g-PKU.ndjson"
        }
    }
}
```

No new events have been appended, so the response only has the selector footer.

## Tutorial 2: Associate a thermostat to an account

Now that your thermostat is measuring temperature and sending events, its owner wants to link the thermostat to an application account. We will call this new event `associated-to-account`.

### Register New Events

First, register this new event type in the Event Registry:

```shell
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "event":"associated-to-account"}'
```

This returns a success message:

```
registered thermostat.temperature-recorded
```

We also need to create an account entity with a creation event:

```shell
curl https://preview.evently.cloud/registry/register-event \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"account",
       "event":"account-created"}'
```

This returns a success message:

```
registered account.account-created
```

### Create a Unique Account

Now you want to create a new account for your user, Mike Meyers. Your business rules require that an account name cannot be used for more than one account, so a filter selector can check to see if an account named `mike_meyers@example.com` already exists.

```shell
curl -L https://preview.evently.cloud/selectors/filter \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"data":{
        "account":{
          "account-created":"$.name ? (@==\"mike_meyers@example.com\")"}}}'
```

The filter selector looks inside every event for a match in `meta` and/or `data`. In this example, it filters on `data` values. The first key is the entity name `account` and the keys inside `account` are event names. Each event name key has a [SQL JSONPath](sql-json-path) query statement that is applied to every `account.account-created` event, and matching events come back in the selector result. If you are familiar with JSONPath dialects, then Evently’s SQL JSONPath should be straightforward to pick up.

This statement returns an empty selector, or a result with only a footer object:

```json
{"selectorId":"gaFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIik","mark":"0000000000000000bee3f960","_links":{"start":{"href":"/selectors/filter/gaFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIik.ndjson"},"current":{"href":"/selectors/filter/gqFkgadhY2NvdW50ga9hY2NvdW50LWNyZWF0ZWTZJSQubmFtZT8oQD09Im1pa2VfbWV5ZXJzQGV4YW1wbGUuY29tIimhYcQMAAAAAAAAAAC-4_lg.ndjson"}}}
```

Now that you know the event to create Mike Meyer’s account will be unique, append the event using the footer’s `selectorId` and `mark` values as an append conditional. The `key` value must be a unique value, and is usually a business-relevant key:

```shell
curl https://preview.evently.cloud/append/selector \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"account",
       "event":"account-created",
       "key":"wqeuru4594",
       "meta":{},
       "data":{"name":"mike_meyers@example.com"},
       "selector": {
         "selectorId":"<your-selectorId>",
         "mark":"<your-mark>"}}}'
```

You will get back a success message:

```json
{
    "status": "SUCCESS",
    "ok": {
        "eventId": "0005d13ee253e847da62cab2bee3f960"
    }
}
```

Now, to show that Evently is only appending an event if the supplied selector is empty, meaning no new events have occured after the selector, simply rerun the exact same cURL command to append with the selector. You should see an error result:

```json
{
    "status": "RACE CONDITION",
    "error": "Entity has newer events. Please GET /selectors/replay/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson for the most recent events."
}
```

### Associate Thermostat to Account

In your business model, thermostats can only be associated to a single account. Your thermostat owner has an account in your system with a key, say `mike_meyers@example.com`. To satisfy this business requirement, your application should look for an `associated-to-account` event in the thermostat’s entity log.

```shell
curl -L https://preview.evently.cloud/selectors/replay \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "events":["associated-to-account"],
       "keys":["thermostat1"]}'
```

This should return an empty selector, with just the selector footer object:

```json
{
    "selectorId": "g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50",
    "mark": "0000000000000000bee3f960",
    "_links": {
        "start": {
            "href": "/selectors/replay/g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50.ndjson"
        },
        "current": {
            "href": "/selectors/replay/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson"
        }
    }
}
```

Now that you know this thermostat has no `associated-to-account` events, use the `selectorId` and `mark` to conditionally append the event. You find these values in the selector footer you just fetched above.

```shell
curl https://preview.evently.cloud/append/selector \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"entity":"thermostat",
       "event":"associated-to-account",
       "key":"thermostat1",
       "meta":{},
       "data":{"account-key":"wqeuru4594"},
       "selector": {
         "selectorId":"<your-selectorId>",
         "mark":"<your-mark>"}}}'
```

You will get back a success message:

```json
{
    "status": "SUCCESS",
    "ok": {
        "eventId": "0005d13ee253e847da62cab2bee3f960"
    }
}
```

Now, to show that Evently is only appending an event if the supplied selector is empty, meaning no new events have occured after the selector, simply rerun the exact same cURL command to append with the selector. You should see an error result:

```json
{
    "status": "RACE CONDITION",
    "error": "Entity has newer events. Please GET /selectors/replay/hKFlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG1YXNzb2NpYXRlZC10by1hY2NvdW50oWHEDAAAAAAAAAAAvuP5YA.ndjson for the most recent events."
}
```
