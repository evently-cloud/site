---
layout: main
eleventyNavigation:
    key: Concepts
---

# Evently Concepts

## Entity

An Entity can be anything that has distinct state in a domain, such as a shopper, a rental car, or a hotel room. An entity instance is identified by its key, which is often a business identifier string.

## Events

An event records that something has occurred to an entity. Events are immutable, meaning they cannot be altered, and irrevokable, meaning they cannot be deleted out of the ledger. An event has a name, an entity identifier, data and meta information.

Here is an example:

```json
{
    "event": "Item Ordered",
    "entity": "patron",
    "key": "Harold_Cho",
    "data": {
        "menuItem": "Bean Burrito",
        "toppings": ["chiles", "salsa verde"],
        "spicy": true,
        "peppers": 5
    },
    "meta": {
        "actor": "register-2",
        "commandId": "e33692e9-3e73-4028-8962-2753ddae2a0f",
        "correlationId": "22341"
    }
}
```

The event is named `Item Ordered` and has an event-specific `data` value.

The entity identifier is the entity type and key. In this example, the entity is identified as entity type `patron` with the key `Harold_Cho`.

The `meta` field contains data that can be applied to any event. In this system, the value includes the `actor` and a `commandId` which has meaning to the application. Your application can store any values in the `meta` field.

All of the values in an event can be queried with [Selectors](#selectors).

## Ledger

The ledger stores events that have been appended by an application. Applications append events to a ledger and retrieve events from a ledger using a Selector.

## Selectors

Applications find relevant events with selectors. A selector object tells the Ledger which events to select and return to the application. The selector result contains a selector ID that points to where the results leave off, and that selector Id can be used to fetch events that occur after the selector to catch up with matching current events.

Selector statements can contain a `limit` property to control the number of events to be retrieved. Additionally they can contain an `after` property to indicate where to start selecting events from. Together these two properties can be used to page through large selector results.

Ledgers accept two types of selectors–Replay and Filter selectors.

#### Replay Selectors

The replay selector states the entity type, instance keys, and events of interest. Applications use replay selectors to “hydrate” entity state for presentation or business logic purposes.

```json
{
    "entity": "game",
    "keys": ["Zirommok_Dun_&_Bradstreet_Inc._1968_Championship~15_1"],
    "events": ["game-started", "game-finished"]
}
```

A replay selector scopes to a single entity type, but can include more than one key in the selection. If desired, the selector can narrow the events returned by using the `events` property. If omitted, then all of the events that match the entity and keys will be returned.

#### Filter Selectors

The filter selector matches events by their meta and data values. They use SQL JSON Path statements to find events that match the event’s `data` and `meta` fields.

```json
{
    "data": {
        "match": {
            "match-created": "$.players ? (@==\"Elizabeth_Wilkerson\" || @==\"Amal_Hussein\")"
        }
    }
}
```

These same selectors can also be use to control event append actions. The Append Event API accepts a Selector ID (part of the Selector response) for atomic appends.

## Event Registry

Event names are registered before they can be appended. Once an event has been appended, that Event name cannot be deleted from the registry.
