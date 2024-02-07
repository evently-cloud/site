---
title: Event Streams' Fundamental Flaw
layout: post
postPreviewExcerpt: Event sourcing databases use entity-scoped event streams as a core principle, but they get in the way of a simpler, more accurate understanding of state changes over time and how they should be captured as events.
postPreviewImage: false
date: 2024-02-07
tags: ['blogPosts', 'concepts']
---

Event sourcing captures state changes as events and stores them for later retrieval. Different event sourcing components like commands, projections, read models and policies (process managers) use these events in their operations. They scope their event selections and listeners to filter out irrelevant events by organizing events into entity-scoped streams. Entity event streams have been the go-to model for event relevance, yet they have issues that can be addressed with a different approach.

### Event Stream Databases

Event sourced applications require an event-oriented database to store and replay events. A stream usually correlates to an [Aggregate Root](https://www.thoughtworks.com/en-ca/insights/blog/evolutionary-architecture/domain-driven-design-part-two), like a shopping cart, an insurance plan or a hotel. The concept comes from [DDD](https://www.dddcommunity.org/library/vernon_2011/), where an aggregate root is the fulcrum of state change for an entity, or set of entities related to a single root entity. Entity event stream scoping generally follows this pattern: an aggregate root name + its ID ➡ an entity event stream.

Entity event streams exist on most event sourcing databases: 

- EventStore has [Event Streams](https://developers.eventstore.com/server/v23.6/streams.html#event-streams), and each stream has a unique identifier. EventStore also has the `$all` stream which represents all the appended event streams combined. 
- Axon has [Aggregates](https://docs.axoniq.io/reference-guide/axon-framework/axon-framework-commands/modeling/aggregate), which represent an entity. They also support [Multi-Aggregates](https://docs.axoniq.io/reference-guide/axon-framework/axon-framework-commands/modeling/multi-entity-aggregates), which act like a join table to organize related entities under a single entity. One of the entities is the main one, and the others are members.
- Evently organizes individual streams as [Entities](https://evently.cloud/concepts/overview/), which have unique keys to distinguish them. All events must belong to an entity.
- PumpkinDB?

Databases support streams with nice features like serialized event appending, entity stream replays, subscriptions and stream deletion. They scale event stream usage by managing many stream operations concurrently under high load.

### What’s Wrong With Entity Event Streams?

Aggregate roots themselves have proven to be a good way for software to manage state changes, but storing events in an aggregate root stream diminishes the event data’s value and usability. Determining the aggregate root can be challenging and often error-prone, leading to refactoring as business domain understanding increases. Over time, the domain changes as the business evolves, leading to event streams that no longer support the business requirements.

In practice, modellers create [event workflows](https://eventmodeling.org/posts/what-is-event-modeling/) and then go back to organize the events into primary entities by finding the aggregate root. Many events involve multiple entities, but modellers must decide which entity is the ‘root’ entity in the event. They do this, even when not building DDD-oriented software, because the event database requires an entity event stream name in order to atomically append events to the ledger.

#### Events Often Affect Multiple Entities At Once

Real-world events do not have aggregate roots, they have shared state changes. Take a step back and consider what events are all about. Fundamentally, events record state changes at the confluence of multiple entity interactions. The general language construct of an Event name is [Object-Verb-Subject](https://www.thoughtco.com/subjects-verbs-and-objects-1689695). For example:

```yaml
Item Added To Cart:
  cart_id: jriu594jf
  item_id: WRT34-Q
  quantity: 1
```

In this example, the Subject (Cart) is modified by the Verb (Added) with the Object (Item).

What are the entities in this event? One may say the Cart, but the Item could also be an entity. If the item were singular, like a collectible book, or a limited quantity item like a concert seat, then it also represents an entity whose state changes.

So, if both Cart and Item have relevant state changes to track, the `Item Added To Cart` event would modify both entities’ state:

| Entity | State Before | State After |
|--------|--------------|-------------|
| Cart   | Empty        | 1 Item      |
| Item   | Available    | Carted      |

 Now, we have to append this event to a ledger and dispatch it to listeners. Under the event stream model, we have to pick one of these entities to be the aggregate root. Which one is it? Cart or Item?

To answer this, we can look at the actor. The Customer owns the cart, and the business considers the Customer to be paramount, so Cart should be the aggregate root, and it goes in a `cart-138383` stream.

Or, we could determine the Item is the more important entity in the system, given how much demand the item has upon it. What if this was a ticket to an extremely popular concert? The customer is less relevant in this situation than the seat itself, so the event should go in the `item-TSwift-F100` stream.

Or, we really think the Store is the aggregate root, which is an entity over all transactions we track. Perhaps the event should go in the `Chicago-store` event stream. This is not a great choice, however, as that event stream is quite large and difficult to utilize; also the accompanying aggregate root has [many problems to solve](https://gedgei.wordpress.com/2016/06/10/does-ddd-promote-large-aggregates/).

#### Aggregate Roots Misshape Event Data

Note that finding the aggregate root changes the event itself, as one of the identifiers moves into the stream ID. The application has to change this simple record of facts by looking ahead to aggregate root consumers to find the most-relevant aggregate root to house the event. In our Item / Cart example, both entities find state from the one event, yet neither entity owns it. Depending on the outcome of the design sessions, it could be one of these shapes:

###### Cart Root Aggregate Stream `cart-jriu594jf`:

```yaml
Item Added:
  item_id: WRT34-Q
  quantity: 1
```

…or,

###### Item Root Aggregate Stream `item-WRT34-Q`:

```yaml
Item Carted:
  cart_id: jriu594jf
  quantity: 1
```

The event no longer records all the facts, as the storage stream name contains crucial information about the event. Given this data object, one cannot determine the full state of the entity without also knowing the stream ID as well. One can store the entity ID, of course, but that does not feel DRY and often gets cut in the final design.

#### Entity-Free Events Provide More Value

Entity-free events record state changes without prejudice as to which entity owns the event. Events become more durable over time when not shaped to an aggregate root. Take an example of automobile delivery, which models the process of shipping cars to dealerships for sale. In this model we would see an event that looks like this:

```yaml
Vehicle Loaded Onto Carrier:
  vin: string
  carrier_id: string
  load_time: Timestamp
  location: string
  destination: dealer_id
```

Today, the application focuses on the car being delivered, but tomorrow, another application models the dealership, or perhaps the carrier delivering the vehicles. Adding a new aggregate root to represent the dealership will not change the event data, and the new application can consume the existing events.

Business value for entity-free events grows over time when events record just the facts.

### Event Selectors Replace Entity Event Streams

Without entity event streams, how will applications replay events to determine current state, and subscribe to events to trigger other actions? Event databases need to offer up entity-free event streams, defined by event Selectors that select relevant events for the use case. Selectors, conceptually, share the same vision as SQL `SELECT` statements. In SQL, applications use `SELECT` to extract just the right data for their purposes, whether it be for state changes or rendering views.

CQRS/ES Commands select event sets to validate their state changes and can use event Selectors to find relevant events. Projections consume a wide variety of events, often across many entities, to produce their output. Their Selectors pull in the relevant events to fold into a view, or integration message to another system.

Selectors give SQL queries the power to serve applications the data they require without forcing an aggregate root concept. As application requirements change, the SQL selectors change with them, but the data table schema often remains unchanged.

It the same way, Event Selectors provide applications with the events they need. Evently provides [SQL JSONPath](../../concepts/sql-jsonpath) queries to find matching events for projections, read models, new event notifications, and most of all, [Atomic Appends](../../concepts/overview#atomic-append).

#### Event Selectors Can Offer Discrete Event Streams

Abandoning entity event streams as the organizing event principal does not mean software has to abandon aggregate roots. One can design events and selectors to produce an event stream that relates to a single entity just by selecting the entity id in the query.

Think back to our Cart / Item example, where we wanted to track both the Item and the Cart entity state changes. To select all events that have a specific cart ID, the query might look like this:

`$.cart_id ? (@ == "jriu594jf")`

For a specific item, this query will select the relevant events:

`$.item_id ? (@ == "WRT34-Q")`

Both queries will select relevant events based on the event data rather than a stream name. Intriguingly, both queries will likely provide event sets that overlap, showing that a single modeled event can support both entity states.

#### Selectors Lead to True Atomicity

Event storage design today controls append atomicity with a stream position id or stream sequence number. It indicates where in that stream a given event is placed. To append a new event, the application must use this sequence value to indicate the expected position to append an event into the stream. If that position is taken, a race condition has occurred and the application must replay events to find the most-recent sequence number.

Controlling Atomicity with a sequence number is a hack, frankly. Imagine requiring this from a SQL table! Applications should not have to keep track of this value, but instead indicate what events would constitute a race condition. They should use Selectors to verify that no new events relevant to the command have been appended  in order to guard against race conditions.

The same Selector used to gather read model hydration can be used to append atomically, just like a `WHERE` clause in SQL can both `SELECT` values and control `INSERT / UPDATE` statements. Evently offers [atomic appends with a Selector](../../concepts/overview#atomic-append), eliminating the requirement to use a position ID to append atomically.

### Changes to Evently Coming

In light of this post, Evently will need to change. The current API and underlying data stores need to be reworked to eliminate the single entity design and replace it with a more inclusive event persistence and selector approach. The details will come in a follow-up post laying out Evently’s future design.
