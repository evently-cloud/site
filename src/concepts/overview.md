---
layout: body
eleventyNavigation:
    key: Overview
    parent: Concepts
    order: 1
permalink: concepts/overview/
---

# Evently Concepts

## Entity

An Entity can be anything that has distinct state in a domain, such as a shopper, a rental car, or a hotel room. An entity instance is identified by its key, often a business identifier string.

## Events

An event records that something has occurred to an entity. Events are immutable, meaning they cannot be altered, and irrevokable, meaning they cannot be deleted out of the ledger. An event has a name, an entity identifier, data and meta information.

Here is an example of an event named `Item Ordered`:

```json
{
    "event": "Item Ordered",
    "entity": "patron",
    "key": "Harold_Cho",
    "eventId": "0005d0df8d1e990f13658533a0f8f294",
    "timestamp": "2021-11-16T03:30:47.430415Z",
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

The entity identifier is the entity type and key. In this example, the entity is identified as entity type `patron` with the key `Harold_Cho`.

The `meta` field contains data that can be applied to any event. In this system, the value includes the `actor` and a `commandId` which has meaning to the application. Your application can store any values in the `meta` field.

All of the values in an event can be queried with [Selectors](#selectors).

## Ledger

The ledger stores events that have been appended by an application. Applications append events to a ledger and retrieve events from a ledger using a  [Selector](#selectors). Ledgers have [ACID properties](/concepts/acid), similar to relational databases.

## Selectors

Applications find relevant events with selectors. A selector object tells the Ledger which events to select and return to the application.

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

The filter selector matches events by their meta and data values. They use [SQL JSONPath](/concepts/sql-jsonpath) statements to find events that match the event’s `data` and `meta` fields.

```json
{
    "data": {
        "match": {
            "match-created": "$.players ? (@==\"Elizabeth_Wilkerson\" || @==\"Amal_Hussein\")"
        }
    }
}
```

These same selectors can also be use to atomically append events to the ledger.

## Event Registry

Event names are registered before they can be appended. The ledger will reject events that have not been registered for the entity. Applications benefit by keeping the correct events in the right entity and blocking many programming mistakes before they pollute the permanent ledger.
