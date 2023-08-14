---
layout: body
eleventyNavigation:
    key: ACID
    parent: Concepts
    order: 3
permalink: concepts/acid/
title: Concepts - ACID
---

# ACID for Event Ledgers

Relational transaction-oriented databases have a set of properties called “ACID”, which stands for Atomic, Consistent, Isolated and Durable. Evently has similar properties, though with some reconceptualization given the append-only nature of a ledger. One notable difference is that Evently’s “I” stands for Immutable, which is a more valuable property than Isolation.

## Atomic

A state change occurs if the previously-known state has not changed. In Evently, an atomic append uses a selector to act as the state conditional. If the selector is quiescent, meaning no new events match it, then the event appends to the ledger.

## Consistent

Consistency means the data changes in a way one expects.

- In a successful conditional append, the selector is consistent up to the new event. Between the time the selector is tested for quiescence and the new event is appended, no other events that match the selector are appended.
- Append order in a ledger is known and never varies. Events are appended serially, and their ordering is maintained forever.
- An event ledger can be [validated with documented steps](/concepts/event-id-design/#ledger-validation) to ensure consistency of event contents and sequencing.
- Events match their registry definition. One cannot append an event to the wrong entity type.

## Immutable

1. Events are immutable and irrevocable. Once appended, they cannot be modified or individually removed from the ledger.
2. Ledger event sequence is unmodifiable. Events cannot be inserted into the ledger ahead of other events. Events can only be appended to the end of a ledger.

## Durable

1. Ledger events stay persisted once they are successfully appended.
2. The ledger survives restarts.
