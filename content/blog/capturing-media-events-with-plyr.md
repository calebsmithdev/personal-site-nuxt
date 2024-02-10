---
title: 'Capturing media events with Plyr and Google Analytics'
description: "Learn how to tag Google Analytics events using the Plyr media player Javascript package."
date: 2023-04-13
categories: ['Javascript']
sitemap:
  lastmod: 2023-04-13
---

Plyr is one of the best media player Javascript packages that I haven't used so far. It's great for handling video playback, as well as audio playback, with the added bonus of being very customizable! If you are using Plyr for your web app or marketing website, then naturally you will probably want to also capture some of the usage for your web analytics reports and see if people are actually consuming your content.

## Setting up Plyr

If you have not already setup Plyr on your site, be sure to check out their documentation for getting started and setting up the first bit of code. For the purposes of this article, we will focus on the Javascript implementation, but you can modify and customize it in many other ways. In your JS file, add the following to get started

```js [main.js]
import Plyr from 'plyr';

const player = new Plyr('#player');
```

## Capturing events

We will the on() event listener to look for specific events that we will hook into to capture Google Analytics details. Here is a list of the current supported events to listen to as of v3.7.8, but you can find a more [up to date list here](https://github.com/sampotts/plyr#standard-media-events).

|Event Type|Description|
|--- |--- |
|progress|Sent periodically to inform interested parties of progress downloading the media. Information about the current amount of the media that has been downloaded is available in the media element’s buffered attribute.|
|playing|Sent when the media begins to play (either for the first time, after having been paused, or after ending and then restarting).|
|play|Sent when playback of the media starts after having been paused; that is, when playback is resumed after a prior pause event.|
|pause|Sent when playback is paused.|
|timeupdate|The time indicated by the element’s currentTime attribute has changed.|
|volumechange|Sent when the audio volume changes (both when the volume is set and when the muted state is changed).|
|seeking|Sent when a seek operation begins.|
|seeked|Sent when a seek operation completes.|
|ratechange|Sent when the playback speed changes.|
|ended|Sent when playback completes. Note: This does not fire if autoplay is true.|
|enterfullscreen|Sent when the player enters fullscreen mode (either the proper fullscreen or full-window fallback for older browsers).|
|exitfullscreen|Sent when the player exits fullscreen mode.|
|captionsenabled|Sent when captions are enabled.|
|captionsdisabled|Sent when captions are disabled.|
|languagechange|Sent when the caption language is changed.|
|controlshidden|Sent when the controls are hidden.|
|controlsshown|Sent when the controls are shown.|
|ready|Triggered when the instance is ready for API calls.|

For our purposes, we will focus on the play, ended, and pause events. The play event will be called everytime the user pushes play, and ended of course is targeted once the media completely finishes, and pause is everytime the media is paused. Our Google Events will be custom events, so feel free to rename these to something more relevant to your tracking system. 

Our Google Analytics event will send over the source URL for all events, as well as the current_time and progress, if relevant. This object is flexible and you can submit more/less data as you see fit for your team.

```js [main.js]
// Sent when playback completes.
player.on('ended', (event) => {
  const instance = event.detail.plyr;

  gtag('event', 'audio_ended', {
    source: instance.source
  });
});

// Sent when playback is paused
player.on('pause', (event) => {
  const instance = event.detail.plyr;
  const progress = ((instance.currentTime / instance.duration) * 100).toFixed(0);

  gtag('event', 'audio_paused', {
    source: instance.source,
    current_time: instance.currentTime.toFixed(0),
    progress,
  });
});

// Sent when playback starts playing
player.on('play', (event) => {
  const instance = event.detail.plyr;
  const progress = ((instance.currentTime / instance.duration) * 100).toFixed(0);

  gtag('event', 'audio_play', {
    source: instance.source,
    current_time: instance.currentTime.toFixed(0),
    progress,
  });
});
```

## Handling errors

In 2023, it's natural for consumers to use ad blockers, or for Google Analytics to be turned off for specific users for one reason or another. To best handle this situation, I encourage wrapping your gtag functions in a try/catch so you aren't breaking your errors experience, or causing other code in your event listeners to fail. We've all been to those sites that have issues when ad blockers are turned on - don't be that site!

```js [main.js]
// Handle event in a safe function
const tryToSubmitEvent = (eventName, eventParams) => {
  try {
    gtag('event', eventName, eventParams);
  } catch (e) {
    // Uncaught error. Google analytics couldn't be loaded on this page. Mostly due to cookie compliance or ad blockers.
  }
};

// Sent when playback completes.
player.on('ended', (event) => {
  const instance = event.detail.plyr;

  tryToSubmitEvent('audio_ended', {
    source: instance.source
  });
});

// Sent when playback is paused
player.on('pause', (event) => {
  const instance = event.detail.plyr;
  const progress = ((instance.currentTime / instance.duration) * 100).toFixed(0);

  tryToSubmitEvent('audio_paused', {
    source: instance.source,
    current_time: instance.currentTime.toFixed(0),
    progress,
  });
});

// Sent when playback starts playing
player.on('play', (event) => {
  const instance = event.detail.plyr;
  const progress = ((instance.currentTime / instance.duration) * 100).toFixed(0);

  tryToSubmitEvent('audio_play', {
    source: instance.source,
    current_time: instance.currentTime.toFixed(0),
    progress,
  });
});
```

That's it! You should now be able to see your events being recorded in the real time view in Google Analytics, or by turning on the debug mode for your Analytics script. If you do not have the GA Debug extension, then I highly recommend you [download it here](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) to make your life a bit easier.
