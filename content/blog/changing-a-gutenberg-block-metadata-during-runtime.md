---
title: 'Changing a Gutenberg block metadata during runtime'
description: "Manipulating Gutenberg blocks at runtime is easy and sometimes necessary. Let's give it a try with the block_type_metadata filter."
# image: /assets/blog/v3-3.png
date: 2022-09-30
# last_updated: 2024-01-19
categories: ['WordPress']
---

I have ran into at least one situation where I needed to modify either an ACF Block or a core Gutenberg block selectively during runtime, but keep the `blocks.json` structure the same since it applied to 90% of my use cases. This could be either removing or adding a supports option at a per post type level, or maybe adding new typography options during on what post type the user is using. Fortunately, this process is pretty easy to do using the `block_type_metadata` filter.

## What blocks can be modified?

First, it's important to note that not all blocks in WordPress can be modified during runtime. This only applies to blocks using the new v2 structure and uses the `blocks.json` file to setup their metadata. If you are using WordPress 6.0+, then this method will work for any core blocks. If you are using ACF 6+, then this will work for any blocks using the new structure. This may or may not work for third-party plugin blocks.

## Adding the filter

The [block_type_metadata](https://developer.wordpress.org/reference/hooks/block_type_metadata/) filter will let you hook into all blocks being processed at that moment and view their metadata as a PHP array. You can use the `$metadata['name']` variable to decide which block you want to target specifically, then use any further Wordpress function to look for items, such as the admin screen page, post type, `is_single()`, etc. Below is a simple example of removing the `anchor` and `customClassName` from all blocks.

```php
add_filter( 'block_type_metadata', 'remove_the_advanced_options' );
function remove_the_advanced_options($metadata ) {
    $metadata['supports']['customClassName'] = false;
    $metadata['supports']['anchor'] = false;
    return $metadata;
}
```

Let's say that we only want to limit this for core blocks:

```php
if (str_starts_with($metadata['name'], 'core/')) {
    $metadata['supports']['anchor'] = false;
    $metadata['supports']['customClassName'] = false;
}
return $metadata;
```