---
layout: layout.liquid
---
# Event Sourcing for Everyone

Start up your event-sourced applications with Evently's easy-to-use and reliable event ledger service. Evently stores your events in the cloud and replays them with an intuitive REST API. Simply [request your access key](signup/) to get started!

### Safe, Fast and Secure

Evently’s [ACID](acid/) event storage gives you confidence to store all your business events with no data loss, forever. Keep your event models consistent with the Event Registry, so applications can only append correct events. Enjoy the performance of Evently’s SaaS architecture with near-instantaneous appends and event retrieval.

* [Concepts](concepts/)
* Tutorial
* Cheat Sheet
* API Reference

## What is Event Sourcing?

Event Sourcing is an application data model that record events that have happened to an entity in a permanent log. Then, when the application needs to determine the current state of an entity, it “replays” the relevant events and calculates the state from these events. When the application wants to add a new event for an entity, it can use this current state calculation to decide if the event should be recorded.

::: sidebar

### Event sourcing in the 1400s

Event sourcing has been used for hundreds of years in accounting, where events are called “account entries” and the log is called a “ledger”. Individual entries record credits or debits to an account, and the current value, or state, of the account. One calculates the current account value by summing up these credits and debits.
:::

