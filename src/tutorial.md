---
layout: main
eleventyNavigation:
    key: Tutorial
---

# Tutorial: Smart Thermostat

This tutorial will take you through the features Evently has to offer in the context of a smart thermostat. Before you start, please request an access token and select your favorite http client. The code herein will be using [cURL](https://curl.se), the ubiquitous command-line http client. For simplicity, you can use the [online cURL site](https://reqbin.com/curl) to work through this tutorial.

### Step 1: Validate access

In your terminal, enter this command:

```shell
curl -X GET https://preview.evently.cloud
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

### Step 2: Register an Event Type

The Evently Registry contains a listing of all the entity events available in to an application. Before an event can be appended, it’s type must be registered in the Registry. To access the registry, follow the `registry` link from the API root. Be sure to replace `<your-token-here>` with your preview access token.

```shell
curl -X POST -H "Authorization: Bearer <your-token-here>" -H "Content-Type: application/json" https://preview.evently.cloud/registry/register-event -d '{"entity":"thermostat","event":"temperature-recorded"}'
```

This command will register an event type called `temperature-recorded` with the `thermostat` entity. We will be using this event type during the tutorial.

To see what event types have been registered, read the `registry/entities` resource:

```shell
curl -X GET -H "Authorization: Bearer <your-token-here>" https://preview.evently.cloud/registry/entities
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

### Step 3: Append a Factual Event

Now that you have registered an event type, you can append an event of this type to the ledger. Evently offers three different append actions, but the simples append action will add the event as an unconditional fact. In our thermostat example, we want to record a temperature measurement event, and we want to record it without regard to any other events in the ledger.

When a client appends a factual event, they need to provide the following information in the body of the request:

| field  | description                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity | The name of the entity. In this tutorial, it is `thermostat`                                                                                                                                                   |
| event  | The type of event. In this step, it is `temperature-recorded`                                                                                                                                                  |
| key    | The entity instance key, which is something business-relevant. In this tutorial, it is `thermostat1`.                                                                                                          |
| meta   | Meta information about the event context. This object can contain anything your application deems relevant. In this tutorial, we are using a meta value called `causation` to indicate the cause of the event. |
| data   | The event-specific data. In this step, we are sending the temperature in Celsius.                                                                                                                              |

Send this requestin your terminal:

```shell
curl -X POST -H "Authorization: Bearer <your-token-here>" -H "Content-Type: application/json" https://preview.evently.cloud/append/fact -d '{"entity":"thermostat","event":"temperature-recorded","key":"thermostat1","meta":{"causation":"1"},"data":{"celsius":18.5}}'
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

The request body shows a status of `SUCCESS` as well as an `ok` value with the eventId of the newly-created event. Hang on to this eventId as we will be using it in the next tutorial.

TODO:

-   Select that event for replay (latest temperature)
-   Register a thermostat account (atomic append), add in idempotency-key header
