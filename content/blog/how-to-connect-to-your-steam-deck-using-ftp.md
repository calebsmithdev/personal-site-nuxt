---
title: 'How to connect to your Steam Deck using FTP'
description: "Adding/removing files in your Steam Deck doesn't have to be a pain. Let's see how we can smooth out the process."
date: 2023-01-20
categories: ['Steam Deck']
sitemap:
  lastmod: 2023-01-20
---

The [Steam Deck](https://store.steampowered.com/steamdeck) is one of the coolest gaming platforms to have came out recently and has been a nice system to play retro video games on. If you are looking to jump more into retro games, then your first hurdle will be "How do I get my ROMS onto the Steam Deck?" There are several ways to do it, but the easiest is just use the native FTP process.

## Enable SSH Connection

First, we need to enable SSH and set our system default password. Let's get started by going over to the Desktop Mode by clicking the Steam button -> "Switch to Desktop". Once the desktop boots up, you'll click on the Start Menu -> System -> Konsole to open the terminal. Next, you'll need to setup your default password for your Steam Deck user account - If you have already done this, then you can ignore this command. Enter the following and set your default password:

```bash
passwd
```

Next, we will enable the built-in SSH process using this command:

```bash
sudo systemctl enable sshd
```

Last, restart your Steam Deck. That's it! You can now connect using an FTP client.

## Connecting with Filezilla

We are going to use [Filezilla](https://filezilla-project.org/) to connect to our Steam Deck. You are welcome to use any other FTP client, or the built-in functionality on your operating system.

We will connect to our Steam Deck using it's hostname, which is default to "steamdeck". If you changed this name at any point, then be sure to adjust accordingly. You can find your hostname in the settings by clicking the Steam button -> Settings -> System, then looking for Hostname in the about section.

Once you have Filezilla loaded up, you can enter the following information in the Quick Connect bar at the top of the window:

* **Hostname**: steamdeck (or steamdeck.local, if on a Mac)

* **Username**: deck

* **Password**: (Password created earlier)

* **Port**: 22

Congratulations! You've successfully connected to your Steam Deck and can transfer files whether you are in Desktop mode or Gaming mode. If you are looking to add games to your SD card, then you will want to change the directory to /run/media/(SD card folder)

If you are more of a visual person, then I highly recommend watching this video by [MonroeWorld](https://www.youtube.com/@Darkuni) as well.

<iframe loading="lazy" title="Steam Deck Quickie:  Transfer Files From PC to Deck with SSH (Under 3 Minutes!) - Reupload" width="500" height="281" src="https://www.youtube.com/embed/Cb1U0_KbtLQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen=""></iframe>