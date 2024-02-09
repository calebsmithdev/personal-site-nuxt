---
title: 'Sync Plex with Trakt.tv using PlexTraktSync'
description: "Use PlexTraktSync to automate your media consumption between Plex and Trakt.tv."
# image: /assets/blog/v3-3.png
date: 2022-09-30
# last_updated: 2024-01-19
categories: ['Home Server']
---

As a big consumer of entertainment and data, one of my favorite tools out there is Trakt.tv, which allows me to keep track of movies and TV shows that I have watched. Since we use Plex for our home media server, it only made sense for me to find a way to keep that information in sync without any additional effort in my day-to-day workflow. Fortunately, there is an open source project out there that does the heavy lifting for me!

## What is Plex?

Plex is a self-hosted server that allows you to view and share your media with your friends and/or family. On top of being able to serve your local media files, you can have access to Live TV, podcasts, and streaming content through their services. [Check out the Plex website for more details](https://www.plex.tv/).

## What is Trakt.tv?

Trakt.tv is a bootstrapped platform to aggregate TV/movie data, track watch history, and discover new movies or TV shows. Trakt is a great way to track your consumption and to view a lot of great stats the entertainment you consume. [Check out the Trakt website for more details](https://trakt.tv/).

## Getting started with PlexTraktSync

[PlexTraktSync](https://github.com/Taxel/PlexTraktSync) is an open-source project that can add a two-way sync between a Plex server and your Trakt profile. It does require a Plex and Trakt account to use, but you do not need Trakt Premium or Plex Pass to get the full use of the software. Check out some of the features that you can config with PlexTraktSync:

* Mark the Media in Trakt as collected, if it's part of your Plex server.
* Ratings are synced, with preference on Trakt when available.
* Watched statuses are synced, but dates are not reported from Trakt to Plex.
* Watchlists are synced.
* Options are all configured locally and can be changed at any time.

PlexTraktSync supports several different installation methods, including Python, Windows, Unraid, and Docker. For our purposes, we will be using Docker Compose. You should get started by [visiting their Setup instructions](https://github.com/Taxel/PlexTraktSync#setup) for the latest configurations on setting up with Trakt. Next, you'll want to add a folder on your computer for your Docker volume, then add a config.yml file. Below is an example of what my file looks like, which is using the default settings:

```yaml [config.yml]
cache:
  path: $PTS_CACHE_DIR/trakt_cache

# Add as many libraries as needed to exclude from the Trakt sync
excluded-libraries:
  - Private
  - Family Holidays

config:
  dotenv_override: true

plex:
  timeout: 30

logging:
  append: true
  # Whether to show timestamps in console messages
  console_time: false
  debug: false
  filename: plextraktsync.log

sync:
  plex_to_trakt:
    collection: true
    ratings: true
    watched_status: true
    watchlist: true
  trakt_to_plex:
    liked_lists: true
    ratings: true
    watched_status: true
    watchlist: true
    watchlist_as_playlist: false

watch:
  add_collection: true
  remove_collection: true
  scrobble_threshold: 80
  username_filter: true

xbmc-providers:
  movies: imdb
  shows: tvdb
```

## Setting up your Docker Compose stack

Next, you'll want to add setup your Docker Compose file. For my home server, I use Portainer to manage my Docker Compose stacks and monitor all of my containers, but you can use any Docker Compose setup to achieve this.

We will pull in two different containers for this. The first one is a scheduler container to run the sync command on a scheduled CRON time, preferably every 6 hours. The second is in the sync container itself. Since PlexTraktSync does not have a GUI, we have enabled `stdin_open` so we can run an exec command on our own to configure our Plex account.  Below is the Docker Compose file that I used to get setup:

```yaml [docker-compose.yml]
version: "2.1"
services:
  scheduler:
    image: mcuadros/ofelia:latest
    depends_on:
      - plextraktsync
    command: daemon --docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      ofelia.job-run.plextraktsync.schedule: "@every 6h"
      ofelia.job-run.plextraktsync.container: "plextraktsync"

  plextraktsync:
    image: ghcr.io/taxel/plextraktsync
    container_name: plextraktsync
    restart: unless-stopped
    command: watch
    privileged: true
    stdin_open: true
    tty: true
    volumes:
      - /run/desktop/mnt/host/f/Docker/plextraxtsync:/app/config # Adjust this to match your folder with the config.yml file.
```

If you are using Portainer (or Docker Desktop), you can open up the console and run the command `plextraktsync` to configure the application and run the initial sync. If you setup the stack through a ternimal, then you can run `docker-compose exec plextraktsync` to get started. You'll be prompted to enter your Plex information and Trakt API information, then the sync will run immediately afterwards.

## Enable Scrobbling

Scrobbling is the process of automatically tracking what you're watching back to Trakt without any interaction needed. The Compose file above is set to use the command watch which will look for activity for the synced user and update Trakt in real time, including any partial watches. This will not run the sync between Plex and Trakt, but will mark the media as watched on Trakt when the media is finished.

## Things to Know

**This does not allow you to sync statuses for multiple users.** You can setup multiple containers for each user, if you want to sync other users.

**This does not sync information for multiple servers at the same time.** You can setup multiple containers for each server though.

**Watch is optional and only for the synced user.** If you are using another account to watch TV, or others are using your account on a device, then that watch history will be synced in real-time.