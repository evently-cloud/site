---
layout: body
eleventyNavigation:
    key: Notifications
    parent: Concepts
    order: 2
permalink: concepts/notify/
title: Concepts - Notifications
---

# Selector Notifications

Selector notifications bring liveness to your applications by signalling new events directly to a listener in real time, as the event is stored in the ledger. All notifications are sent through a single channel opened by an application instance. Once a channel has been opened, the client can listen to it’s stream–a [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) stream–and subscribe to many selectors. When a new event appended to the ledger matches a selector, the client receives a notification event indicating which selector has been triggered. The client then fetches that selector to retreive the new events.

TODO a diagram will really help here. 

#### Channels

Clients open a notification channel when their application instance starts. They preserve this channel reference and follow the `stream` link to attach an EventSource to the SSE stream. They also follow the `subscriptions` link to manage the application’s selector subscriptions.

When the application no longer wishes to listen to events, it can DELETE the channel to clean up resources. It is not necessary to delete a channel on application closure.

#### Stream

This endpoint sends [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) (SSE) to the client whenever a selector subscription triggers on a new event. SSE clients exist in most programming languages, so select one that supports your environment as well as one that can pass the `Authorization` header with your Evently access token.

#### Subscriptions

Evently uses selectors to find events in a ledger. Clients create selectors and reuse them to fetch event updates over time. These selectors are reused as notifiation subscriptions. Clients send their `selectorId` to the subscription form and then receive notifications when that selector has new events. Upon notification, the client will run the same fetch event updates code and update their application state accordingly.

#### Lifecycle

These are the steps an application follows to utilise notifications:

1. Open a channel.
2. Listen to the stream with an EventSource library.
3. Subscribe to selectors.
4. Stream will send selector IDs that have new event matches.
5. Fetch those selectors with the [/selectors](./overview.md#selectors) API.
6. When a selector is no longer interesting, DELETE the subscription URL.
7. When the app closes, DELETE the channel URL.

#### Why Don’t Events Come In Notifications?

You may be wondering why Evently sends selector notifications rather than the events themselves. Why make the client directly fetch the selector again when it has new events? The main reason for this approach is simplicity. The application can use the same code to load data from selectors as notifiation handlers. They do not need to write logic to understand how an event might affect their application state and account for other selector update actions that have occurred.

Another issue that this design avoids is data overload. Given that multiple selectors may be triggered by a single event, the notification stream would either have to just send the event and let the client determine what selector it affects (hard, probably impossible in larger apps) or it would need to send the affected selectors with the event. While on it’s face, this approach sounds reasonable, it cannot guarantee that the application has seen all the events in the selector stream. An event may be missed between the subscription to a selector and delivery of new events.

Additionally, the event stream may move so fast that the notification channel is actually slower than the selector API. A client may not want to process every event as it arrives but instead time their consumption to handle batches of new events. Small notifications allow the client to “skip ahead” when a new matching notification arrives.

A final issue avoided is event size. Well-designed events are usually quite small, but not always. The event stream may contain large values that soak up the client’s connection and eat up valuable network resources at a time the client does not wish to spend on them. Notifications give the client control as to when to consume the events, if at all.

