# site

Evently.cloud web site

## Modifying Navigation

### To add a page to the navigation menu:

1. Add `eleventyNavigation:` to front matter
2. Add ` key:` and the nav name that should appear in the menu
3. Add ` order:` and the position which it should appear in the menu. Without this, order defaults to 0, then alphabetical

### To create a submenu 
As an example, this would be how to create a submenu named "Things":

1. Create a new folder in the src folder with the same name as the submenu but in lowercase - in this case it would be "things"
2. Create a .md file in the concepts folder, also named "things"
3. At the top of the concepts file, add front matter:

```
---
eleventyNavigation:
    key: Things
    order: 1
    url: /things/main-thing
permalink: false
---
```

This defines the parent menu item for eleventyNavigation, but thanks to `permalink: false` doesn't actually generate a HTML file. Also, the `url:` parameter means if the parent menu item is clicked, it actually goes somewhere - in this case, /main-thing. An overview/introductory page makes the most sense here. The trailing slash is purposely left off here (see why [here](<https://www.11ty.dev/docs/permalinks/#remapping-output-(permalink)>))

4. Add child pages to the things folder. Each one should have front matter like this:

```
eleventyNavigation:
    key: A Thing
    parent: Things
    order: 3
permalink: things/a-thing/
```
