---
layout: body
eleventyNavigation:
    key: Overview
    parent: Concepts
    order: 1
permalink: concepts/overview/
title: Concepts
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
  "entities": {
    "patron": ["Harold_Cho"]
  },
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

The entities identifier is the entity type and list of keys. In this example, the entity is identified as entity type `patron` with the key `Harold_Cho`.

The `meta` field contains data that can be applied to any event. In this system, the value includes the `actor` and a `commandId` which has meaning to the application. Your application can store any values in the `meta` field.

All values in an event's data and meta fields can be queried with [Selectors](#selectors).

## Ledger

The ledger stores events that have been appended by an application. Applications append events to a ledger and retrieve events from a ledger using a  [Selector](#selectors). Ledgers have [ACID properties](/concepts/acid), similar to relational databases.

## Selectors

Applications find relevant events with selectors. A selector object tells the Ledger which events to select and return to the application.

Selector statements can contain a `limit` property to control the number of events to be retrieved. Additionally they can contain an `after` property to indicate where to start selecting events from. Together these two properties can be used to page through large selector results.

Ledgers accept two types of selectors–replay and filter selectors.

#### Replay Selectors

The replay selector states the entity type, instance keys, and events of interest. Applications use replay selectors to “hydrate” entity state for presentation or business logic purposes.

```json
{
  "entities": {
    "game": ["Zirommok_Dun_&_Bradstreet_Inc._1968_Championship~15_1"] 
  },
  "events": ["game-started", "game-finished"]
}
```

A replay selector scopes to entity types, and can include more than one key in the selection. If desired, the selector can narrow the events returned by using the `events` property. If omitted, then all of the events that match the entities and their keys will be returned.

#### Filter Selectors

The filter selector matches events by their meta and data values. They use [SQL JSONPath](/concepts/sql-jsonpath) statements to find events that match the event’s `data` and `meta` fields.

```json
{
  "data": {
      "match-created": {
        "query": "$.players ? (@==\"Elizabeth_Wilkerson\" || @==\"Amal_Hussein\")"
    }
  }
}
```

A filter query can included named vars as well. These simplify filter statements to make them more understandable and easier to produce in applications.

```json
{
  "data": {
    "match": {
      "match-created": {
        "query": "$.players ? (@ == $names)",
        "vars": {
          "names": ["Elizabeth_Wilkerson", "Amal_Hussein"]
        }
      }
    }
  }
}
```

The selectors can be used to atomically append events to the ledger.

## Appending Events

Evently offers three different ways to append events to a ledger. These ledger events can be retrieved by using [Selectors](#selectors). These same Selectors can be used to control the append conditions to atomically append events. Here are the three ways to append events:

#### Factual Append

Events appended as facts have no conditions to their acceptance. Evently will accept them as-is and will append them to the ledger. This method works well with irrefutable facts, such as events that reflect real-world events. They are irrefutable facts. They also work well to capture measurements, such as scales or temperature gauges.

#### Atomic Append

This approach uses Selectors to control the append action such that the event only appends if the Selector matches no new events. The Selector condition acts as a state guard inside Evently and ensures the new event appends [atomically](/concepts/acid/#atomic). One can use either [Replay](#replay-selectors) or [Filter](#filter-selectors) selectors.

## Selector Notifications

Applications can use a subscribe to [notifications](/concepts/notify/) when new events match a particular Selector. Conceptually, the application reuses a selector used to fetch events by subscribing to it in a notification channel. Evently stores that selector and when new events append to the ledger, the selector tests them for a match. When a match occurs, Evently will notify the subscriber of the match, and the application will fetch the selector again to capture the new events in their local state. 

## Event Registry

Event names are registered before they can be appended. The ledger will reject events that have not been registered for the entity. Applications benefit by keeping the correct events in the right entity and blocking many programming mistakes before they pollute the permanent ledger.
