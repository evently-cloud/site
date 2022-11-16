# Evently.cloud website

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

## Evently Blog

This site is home to the Evently blog with markdown-based articles.

### Creating a new blog post
Blog article folders are filed in `/src/blog` by post title kebab-case.

All elements related to the article are grouped together in their folder, like linked assets and the markdown index file containing the content. An example of this file structure is as such:

```
src
└── blog
    ├── article-name
    │   ├── image.jpg
    │   └── index.md
    └── article-name
        ├── image.gif
        └── index.md
```

### Blog post template front matter

The following is an example of the front matter of a blog post:

```
---
title: Blog post title
layout: post
featuredImage: ./image.jpg
featuredImageAltText: Alt text for the featured image.
featuredImageInArticle: true
postPreviewImage: false
postPreviewExcerpt: Text excerpt that appears on blog listing page.
date: 2022-11-01
tags: ['blogPosts, concepts']
---
```

- `title` sets the title of the blog post, the main header of the article.
- `layout` sets the template to the blog post template. Must be `post`.
- `featuredImage` is the image that represents the blog post. Optional.
- `featuredImageAltText` is the descriptive text that accompanies the featured image.
- `featuredImageInArticle` this is property that will control if the featured image renders as the hero image of the article, right under the title header. If excluded or set to false, will the featured image will not render in the article. Optional.
- `postPreviewImage` this is an optional property that will control if the featured image renders in the blog listing page in the post preview. By default the image will render, set to `false` to have the blog post render on the blog listing pages without an image.
- `postPreviewExcerpt` is the excerpt rendered on the blog post listing pages. The post previews will render five lines of text before being clamped with trailing eclipses, best strategy is to write an excerpt around 180-200 characters max. 
- `date` is when the article was posted. This will also impact the order the posts appear in the blogPosts collection, as it is ordered latest to oldest. The date takes the time into consideration when ordering posts, if there's two posts on the same day add the time to the date value `2022-11-03 21:22:08`. With time omitted, defaults to `00:00:00`.
- `tags` are the keywords associated with the blog post. **All blog posts must have the `blogPosts` tag to be considered content for the blogPosts collection array.** Any further tags will be handled as the subject tags associated with the post.

### Blog post content
A blog posts is written in markdown. Posts can support rendering images from their parent folder, and will render embedded content via url link using the [embed everything](https://gfscott.com/embed-everything) eleventy plugin. Just paste the full url to whatever supported media that needs to be included in the article and an iframe embed will render.
