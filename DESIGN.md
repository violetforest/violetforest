# violet's space

---

## why i'm building this

i don't want to post on platforms that sell my attention to advertisers and feed my photos to AI models. every post i make on instagram is content i don't own, shown to people by an algorithm i don't control, wrapped in ads i don't benefit from.

i want a space online that's mine. somewhere i can put my work, my thoughts, my links — and it just stays there, exactly how i left it.

## what it should feel like

a place, not a platform. quiet. beautiful. mine.

not a portfolio. not a blog. not a brand. just a living space that changes with me.

## principles

- **posting has to be easy.** if it's harder than instagram i won't use it.
- **no algorithms.** newest first. that's it.
- **the site is the art.** the way it looks and feels matters as much as what's on it. it's also where i show my browser art experiments — sketches, three.js pieces, interactive work. the site is the gallery.
- **i can leave anytime.** my content is exportable. i'm not locked into any service.

## architecture

- **frontend:** vite + react on github pages
- **database:** supabase (free tier) — posts, guestbook entries, links
- **images:** supabase storage
- **admin:** password-protected page for posting, works as a PWA on mobile

the repo is structure. the database is content.

## pages

- **feed** — text and images, reverse chronological. replaces instagram/twitter. different post types (text, photo, quote, link) get distinct visual treatments.
- **guestbook** — visitors leave messages. replaces comments/DMs.
- **affiliate links** — curated list of links i want to share.
- **stories** — ephemeral posts that disappear after 24 hours. replaces instagram stories. something that feels temporary and alive — a reason for people to come back.
- **ask box** — visitors send me questions (anonymous or not), i answer publicly. a conversation between me and my visitors. inspired by tumblr.
- **DMs** — visitors can send me private messages. stored in supabase, i read them from the admin page.
- **admin** — text field, image upload, post button. read DMs. that's it.
- **graveyards** — my downloaded data from instagram and facebook, displayed as art. not a faithful archive — the data is disrupted, rearranged, broken apart. the export is raw material, not a backup. the tracking metadata (IP addresses, cookies, browser fingerprints, timestamps) gets rendered as 3D layered cards in three.js — making the surveillance data visible and beautiful. inspired by my earlier fbdatadump piece.

## indieweb

- **RSS** so people can follow me without an account anywhere
- **microformats** so the posts are machine-readable
- **webmentions** so other sites can talk to mine
- **POSSE** — post here first, share to social media if i want to

## short term

1. set up supabase
2. build the feed page
3. build the admin page
4. build the guestbook
5. build the affiliate links page
6. PWA manifest so i can post from my phone
7. RSS feed
8. microformats markup
9. instagram graveyard page
10. facebook graveyard page
11. DM page
12. stories
13. ask box

## decentralized tech

supabase is the reliable backbone, but i want to layer decentralized stuff on top as experiments:

- **gun.js** — decentralized database. guestbook/DMs without a third party owning the data.
- **webrtc** — peer-to-peer connections between browsers. live "open studio" where visitors can watch/talk to me. shared art between visitors on the site at the same time.
- **ipfs** — decentralized file storage. art lives permanently, content-addressed, not owned by anyone.
- **nostr** — decentralized social protocol. feed posts exist on an open network, not just my domain.

## long term

- webmention support
- bridgy for auto-syndication to social platforms
- data export (all my content as JSON)
- email subscriptions for visitors

## references

- [indieweb.org](https://indieweb.org)
- [indieweb.org/POSSE](https://indieweb.org/POSSE)
- [brid.gy](https://brid.gy)
- [webmention.io](https://webmention.io)
- [chat.indieweb.org](https://chat.indieweb.org)
