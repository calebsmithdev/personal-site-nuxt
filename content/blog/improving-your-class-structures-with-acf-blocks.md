---
title: 'Improving your class structures with ACF Blocks'
description: "Adapting Gutenberg classes into your ACF Blocks can be a pain. Let's look at ways to make that better."
# image: /assets/blog/v3-3.png
date: 2023-12-27
# last_updated: 2024-01-19
categories: ['WordPress']
---

Advanced Custom Fields (ACF) is one of my favorite dev tools to use in a new theme, especially when I am working with the Gutenberg editor since the ACF Blocks are just so smooth to work with. If you are unfamiliar with ACF Blocks, I’d go check out this article first and get up to speed before we dive in.

One of the annoyances when dealing with Gutenberg and ACF Blocks is the different ways that classes can be added to a block and keeping that consistent throughout your projects. It can also be annoying to deal with the dynamic ID that blocks assign, or whether or not your block is using a static anchor at the block level.

In this post, we are going to look at ways that I have streamlined this process over the years and how you can use it in your next project.

## The code

Let’s jump straight into the code. This is a single PHP class that I use in all of my projects. I would highly recommend to keep it as a class, but you can customize the way it works within your theme and where it should be located.

```php [block-wrapper.php]
<?php

namespace Blocks;

/**
 * Block helper functions for the template files.
 */
class BlockTemplate
{
    protected $block;
    protected $block_classes = [];

    /**
     * @param array $block ACF Block of data
     */
    public function __construct($block)
    {
        $this->block = $block;
    }

    /**
     * Returns an escaped ID attribute.
     * 
     * @return string
     */
    public function get_id()
    {
        $html_id = $this->block['id'];
        if (!empty($this->block['anchor'])) {
            $html_id = $this->block['anchor'];
        }

        return esc_attr($html_id);
    }

    /**
     * Add classes to the template object.
     * 
     * @param array $classes Array of classes
     */
    public function add_classes($classes)
    {
        $merged_classes = array_merge($this->block_classes, $classes);
        $this->block_classes = array_unique($merged_classes, SORT_REGULAR);
    }

    /**
     * Returns the escaped classes.
     * 
     * @return string
     */
    public function get_classes()
    {
        // Check for custom classes
        if (!empty($this->block['className'])) {
            $this->block_classes[] = $this->block['className'];
        }

        // Check for the alignment
        if (!empty($this->block['align'])) {
            $this->block_classes[] = 'is-align-' . $this->block['align'];
        }

        // Check for a background color
        if (!empty($this->block['backgroundColor'])) {
            $this->block_classes[] = 'has-background';
            $this->block_classes[] = 'has-' . $this->block['backgroundColor'] . '-background-color';
        }

        // Check for a text color
        if (!empty($this->block['textColor'])) {
            $this->block_classes[] = 'has-text-color';
            $this->block_classes[] = 'has-' . $this->block['textColor'] . '-color';
        }

        // Checks for text alignment
        if (!empty($this->block['alignText'])) {
            $this->block_classes[] = ' has-text-align-' . $this->block['alignText'];
        }

        // Checks for vertical alignment
        if (!empty($this->block['alignContent'])) {
            $this->block_classes[] = ' is-vertically-aligned-' . $this->block['alignContent'];
        }

        $class_string = implode(' ', $this->block_classes);

        return esc_attr($class_string);
    }
}
```

## How does it work?

At the start of each ACF block file, you will initiate the class by passing in the $block variable that is already available in your PHP file - more info here. Next, the code will go through and look for the common classes that blocks have support for, including background colors, text colors, alignment, etc. Feel free add more, or remove some, as you see fit.

The code allows you to use two functions for outputting the data: `get_classes()` and `get_id()`. Here is a code sample of a block with a basic setup for reference:

```php [sample-block.php]
<?php

$block_template = new BlockTemplate($block);
$block_template = $block_template->add_classes(['sample-class']);

?>

<div class="<?= $block_template->get_classes(); ?>" id="<?= $block_template->get_id() ?>">
  Content here
</div>
```

## Using the ID

The function `get_id()` will either return the random ID string provided by ACF, or a custom ID that is passed to the block from the editor. For the custom ID, you will need to enable support for the "anchor" option. More info on that can be found in the official docs here.

This ID is intended to be a totally unique ID to the page and can be safely used for inline CSS for targeting the block wrapper. For example, I'll use this with the ACF Image field to designate a background image that needs to be applied and use the Block ID as the target for the CSS.

## Using classes

As shown in the code above, there are two functions to use here for classes - first is `add_classes()`. This is a function that accepts an array of classes that you can pass in and use as your wrapper class. For my use case, I usually have the name of the block as a class so I can more easily follow the BEM structure. Next, I'll pass in any conditional modifiers as needed. In some blocks this could be a boolean toggle to show/hide elements, or spacing classes, etc.

Next, you'll use `get_classes()` to actually retrieve and use the classes. At this point, the function will go through the `$block` array to retrieve all of the Gutenberg specific classes, grab any custom classes, and then turn it into a space-separated string of classes to use.

## Wrapping up

Gutenberg is ever evolving, so I highly recommend to use a class like this for all of your ACF blocks so you can make use of new features without needing to update every block individually. I hope this code benefits your codebase in some way and feel free to reach out if you have any suggestions for improvements!
