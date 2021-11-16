---
layout: main
eleventyNavigation:
    key: Tutorial
---

# Smart Thermostat Tutorial

This tutorial will take you through the features Evently has to offer in the context of a smart thermostat. Before you start, please request an access token and select your favorite http client. The code herein will be using [cURL](https://curl.se), the ubiquitous command-line http client. For simplicity, you can use the [online cURL site](https://reqbin.com/curl) to work through this tutorial.

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

Evently is a Hypermedia API, which means that every resource contains links to related resources. Client developers can GET the resources at each level to learn how to use them, as well as discover other related resources in the `_links` section of the body or in the http `Link` headers. Additionally, each resource has one or more `Profile` headers with links to what they offer and how they can be used.

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

This command will register an event type called `temperature-recorded` with the `thermostat` entity. We will be using this event type during the tutorial.

To see what event types have been registered, read the `registry/entities` resource:

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

### Append a Factual Event

Now that you have registered an event type, you can append an event of this type to the ledger. Evently offers three different append actions, but the simples append action will add the event as an unconditional fact. In our thermostat example, we want to record a temperature measurement event, and we want to record it without regard to any other events in the ledger.

When a client appends a factual event, they need to provide the following information in the body of the request:

| field  | description                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity | The name of the entity. In this tutorial, it is `thermostat`                                                                                                                                                   |
| event  | The type of event. In this step, it is `temperature-recorded`                                                                                                                                                  |
| key    | The entity instance key, which is something business-relevant. In this tutorial, it is `thermostat1`.                                                                                                          |
| meta   | Meta information about the event context. This object can contain anything your application deems relevant. In this tutorial, we are using a meta value called `causation` to indicate the cause of the event. |
| data   | The event-specific data. In this step, we are sending the temperature in Celsius.                                                                                                                              |

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

Now that we have persisted an event, we will replay that entity’s events and find it in the event log. To do so, we use the Replay Selector API at `/selectors/replay` to fetch this thermostat’s `temperature-recorded` events.

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
{"selectorId":"g6FlqnRoZXJtb3N0YXSha5GrdGhlcm1vc3RhdDGhdpG0dGVtcGVyYXR1cmUtcmVjb3JkZWQ","mark":"0005d0df8d1e990fa0f8f294"}
```

Line 1 has the single event appended for this entity. The JSON in this line contains the event details, eventId and the server’s append timestamp.

Line 2 has the selector footer information. It contains a `selectorId` which identifies the declared selector. In this example, it represents the object we sent in with the `/selectors/replay` request.

```json
{
  "entity": "thermostat",
  "events": ["temperature-recorded"],
  "keys": ["thermostat1"]
}
```

The second footer value, `mark`, is a ledger mark and it points to a place in the ledger that this selector has read to.

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

## Tutorial 2: Register a thermostat account

