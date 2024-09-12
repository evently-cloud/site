---
layout: body
eleventyNavigation:
    key: Event ID Design
    parent: Concepts
    order: 4
permalink: concepts/event-id-design/
title: Concepts - Event ID Design
---

# Event ID

#### 128 Bits

An Event ID is 128 bits in length.

-   String encoded as a hex string with Big Endian bytes.
-   Applications might use UUID native types like MySQL’s UUID field type, or C#’s Guid class. However, an event ID will not validate to a known UUID version.

#### Sortable

Both byte array and string encoding of Event IDs are sortable. See [Ordering](#ordering) for details.

#### Monotonic

If two events occur at the exact same microsecond, Evently increments the timestamp by one microsecond. Thus, no two events will ever occur at the exact same time. If the current time on the system is behind the last event’s time component, Evently will disregard current time and utilize the time value of the last event time, incrementing the microsecond to move past the previous event time. This will keep the event ledger in order if the clock is reset into the past.

NOTE: this is how Google’s [TrueTime](https://cloud.google.com/spanner/docs/true-time-external-consistency) works; it does not duplicate timestamps but will increment ahead in case timestamps collide.

#### Traceable

An Event ID can be traced to the event ledger it belongs to, and its place therein. It is a reference to a point in the ledger that marks the event. It also contains a verification checksum to validate the event contents matches the Event ID.

#### Timestamped

The Event ID can provide the timestamp for when the event was added to the ledger.

#### Checksummed

The Event ID contains a [CRC32C checksum](https://tools.ietf.org/html/rfc3385#section-4.1) to verify the content of the event. CRC32C is a 32-bit hash and was chosen for these reasons:

-   Low probability of collisions, although every hash has collisions.
-   Widespread adoption in software languages and hardware. Intel and AMD have CRC32C calculation instructions.

Once computed, a checksum will never change.

### Event ID Composition

#### Components

-   Timestamp: timestamp is 64 bits
-   Checksum: 32 bits
-   Ledger ID: 32 bits

#### Timestamp

The timestamp component is a 64-bit microsecond (µsecond) value in the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time). Note that 1 millisecond = 1,000 microseconds. When parsing the `timestamp` component in the event body to convert to a datetime, verify that your date parsing library can parse more than to the millisecond. Some will not be able to parse microseconds.

#### Ledger ID

A Ledger ID is a 32-bit integer. It is computed as a partial checksum of the ledger’s genesis event, ANDed with the Ledger ID version. The genesis event is the ledger’s very first event and does not have a Ledger ID itself for the checksum. As a result, the Ledger ID is computed by following steps 1-4 of the [Event checksum](#ledger-id--event-checksum) algorithm.

Here is an example genesis event:

```json
{
  "event": "Ledger Created",
  "entities": {
    "ledger": "testing⑆preview"
  },
  "timestamp":"2021-10-03T16:32:12.816530Z",
  "meta": {
    "actor": "matt"
  },
  "data": {
    "name": "My Ledger",
    "description": "This ledger is for my example events."
  }
}
```

###### Version Information

Evently anticipates that future event IDs will need different data structures, so versioning is built into the ID. 

-   00: 30 bit Ledger ID, 2 bit version

To apply the version to Ledger ID: `ledgerId & 0xfffffffc` where `&` is a bitwise AND operation.

The reader can examine the end of the Ledger ID to determine its version.

Versioning allows for future changes to the Ledger ID format to be identified and utilized. A ledger can contain events with Ledger IDs that have different versions over time.

#### Ledger ID / Event Checksum

The checksum calculation utilizes [CRC32C](https://datatracker.ietf.org/doc/html/rfc3385) and requires each event's attribute to be fed to the CRC32C calculator in this order. Note that ledger ID checksums omit the last two steps.

1. Event name
2. Sorted^1^ entities object as a compact^2^ JSON string
3. Sorted^1^ meta object as a compact^2^ JSON string
4. Sorted^1^ data value, if an object, as a compact^2^ JSON string
5. Timestamp as lower-case 16 byte hex string, left-padded with `0`.

_Skip the following steps for Ledger ID calculation_

5. Ledger ID as lower-case, 8 byte hex string, left-padded with `0`.
6. Previous Event ID as lower-case, 16 byte hex string.
   1. If this is the genesis event, then this value is an Event ID with a checksum of 0. The timestamp portion is the ledger creation timestamp, and the ledger ID is the checksum computed from steps 1-4.


^1^ A “sorted” object has its keys sorted in case-sensitive, UCS Basic collated, ascending order. An object’s properties, if they are themselves objects, are sorted in the same way. This guarantees the objects are serialized to JSON consistently from the JSON parser’s results, which may be an unordered map. Array values are never sorted, but the object entries in an array are sorted in this manner.

^2^ A “compact” JSON string is represented as a single line with no whitespace between the braces, brackets, commas or other separators.

#### Ordering

Timestamp + Checksum + Ledger ID (LID) means an Event list can be sorted by occurrence.

#### Event ID encoded

| Timestamp | Checksum | LID | Version |
|-----------|----------|-----|---------|
| 64        | 32 bits  | 30  | 2       |

| Time Lo   | Time Hi   | CHECKSUM  | LID + Version |
|-----------|-----------|-----------|---------------|
| `T T T T` | `T T T T` | `C C C C` | `L L L L+V`   |

#### Event ID Collisions

A collision is when two different events share the same event ID. While theoretically possible, a collision is unlikely for these reasons:

1. Monotonic timestamp means a ledger will never have a duplicate timestamp for any event.
2. Very rare checksum collisions: two different events will almost never have the same checksum.

If #1 does not hold, and a ledger's event timestamps could be the same, the checksum would also have to collide for the event id to point to two different events that occur at the same time in the ledger.

### Ledger Validation

The checksum can be used to validate an event ledger. It can validate the entire ledger, or a subsection of the ledger if one trusts the starting point of the ledger section being validated. Validation follows these steps.

1. [Calculate the Ledger ID](#ledger-id) using the genesis (first) event in the ledger.
2. For each event, [calculate its checksum](#ledger-id--event-checksum).
3. Compare this calculated eventId to the event’s ID field.
    1. If they are equal, save the eventId as previousEventId and go back to step 2.
    2. If they are not equal, the ledger has been corrupted.

### Prior Art:

https://github.com/ulid/spec

https://firebase.googleblog.com/2015/02/the-2120-ways-to-ensure-unique_68.html

https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c

http://bookkeeper.apache.org/docs/latest/getting-started/concepts/

### Are Event IDs like UUIDv1?

https://duo.com/labs/tech-notes/breaking-down-uuids

https://tools.ietf.org/html/rfc4122

Sort of. UUID fields are:

-   Time: 48 bits
-   Clock sequence: 16 bits
-   Node Id: 48 bits
-   Version and variant

The time and clock sequence can store µSecond timestamps, and Node Id could hold a ledger ID. However, no space exists to hold the checksum.
