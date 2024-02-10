---
title: 'Switching between Classic and Gutenberg editors using the built-in post type templates'
description: "Improve your content editor experience by removing when the Gutenberg editor selectively when it's not needed."
date: 2023-12-27
categories: ['WordPress']
sitemap:
  lastmod: 2023-12-27
---

As a WordPress developer who regularly uses [Advanced Custom Fields](https://www.advancedcustomfields.com/), I occasionally run into an issue where I want to use the Gutenberg editor, but I sometimes want to have more rigid control of layout using ACF instead. I could handle this by creating two different custom post types and just disable the Gutenberg editor for one of them, but then I end up with different base slug paths and could also confuse content editors. So what's the solution? Let's use an add_filter to handle that process for us. In our use case, we will allow the default template to always use a Gutenberg editor, but more specific templates will use the Classic editor instead.

## Getting started

First, I am going to assume that you have already setup a custom post type and have added the extra templates that you want to use for that post type. If you have not, then you can refer to the official documentation on [how to go about setting that up](https://developer.wordpress.org/themes/template-files-section/page-template-files/#creating-page-templates-for-specific-post-types). Next, I am going to walk through some code examples that is based around an object-oriented structure with classes. If you are not using classes, then you will need to tweak the code to better fit your current codebase.

## The code

```php [class-cpt.php]
<?php

class MyCustomPostType {
    const CPT_SLUG = 'mycpt';

    public function init() {
        add_filter('use_block_editor_for_post_type', array( $this, 'disable_gutenberg_by_template' ), 10, 2);
        add_action('admin_head', array( $this, 'trigger_save_on_template_change' ));
        add_action('admin_head', array( $this, 'script_page_manipulations' ));
    }

    /**
     * Check if a page should disable the Gutenberg editor. This is based on the name of the template after it has been saved.
     */
    public function check_to_disable_editor( $id = false ) {
        // The full name of the templates to show the classic editor for.
        $excluded_templates = array(
            'template-cpt-classic-mode.php',
        );

        if ( empty($id) ) {
            return false;
        }

        $id       = intval($id);
        $template = get_page_template_slug($id);

        return in_array($template, $excluded_templates);
    }

    /**
     * Disable Gutenberg by template name.
     */
    public function disable_gutenberg_by_template( $can_edit, $post_type ) {
        // Ensure this is running in the WP Admin area and that this is an actual post type page.
        if ( ! (is_admin() && !empty($_GET['post'])) ) {
            return $can_edit;
        }

        // Check the templates using our custom function above.
        if ( $this->check_to_disable_editor($_GET['post']) ) {
            $can_edit = false;
        }

        return $can_edit;
    }

    /**
     * Force the page to save and refresh when a template changes.
     * This is especially important for Gutenberg, since the page is saved with AJAX instead of a forced page reload.
     */
    public function trigger_save_on_template_change() {
        $screen = get_current_screen();
        if ( self::CPT_SLUG !== $screen->id || ! isset($_GET['post']) ) {
            return;
        }
        ?>

        <script>
            jQuery(document).ready(function($) {
                // This handles the template change for the classic editor.
                $('#page_template').change(function() {
                    var form = $(this).closest('form');
                    form.submit();
                });

                // This handles the template change for the Gutenberg editor.
                $('.block-editor-page').on('change', '.edit-post-post-template__form select', function() {
                    const { dispatch } = wp.data;
                    var selectedTemplate = $(this).val();
                    dispatch('core/editor').savePost().then(function() {
                        location.reload();
                    });
                });
            });
        </script>

        <?php
    }

     /**
     * Show instruction blurbs next to the template dropdown selection so users are not confused/irritated with the page saves.
     */
    public function script_page_manipulations() {
        $screen = get_current_screen();
        if ( self::CPT_SLUG !== $screen->id || ! isset($_GET['post']) ) {
            return;
        }
        ?>

        <script>
            jQuery(document).ready(function($) {
                // Show instructions for the Classic Editor.
                $('.post-attributes-label-wrapper.page-template-label-wrapper').each(function() {
                    var instructions = '<p class="description">Changing this will save and reload the page.</p>';
                    $(this).append(instructions);
                });

                // Show instructions for the Gutenberg Editor.
                $('.block-editor-page').on('click', '.edit-post-post-template__toggle', function() {
                    var existingInstructions = $('.edit-post-post-template__form .block-editor-inspector-popover-header > .components-text');
                    var existingInstructionsText = existingInstructions.text();
                    var newInstructions = existingInstructionsText + ' Changing this will save and reload the page.';
                    $(existingInstructions).text(newInstructions);
                });
            });
        </script>

        <?php
    }
}

(new MyCustomPostType())->init();
```

## How does it work?

When the class loads, the `init()` function runs which will set our actions and filters used to make all of the magic happen. First, the [use_block_editor_for_post_type](https://developer.wordpress.org/reference/functions/use_block_editor_for_post_type/) filter will run that will check for if the page is compatible with Gutenberg or not. If the template name of the current post matches the template in our exclusion list, then the Classic editor will render. To reduce the risk of typos and to keep this reusable, we also added a constant at the top of the file for the slug of the custom post type.

Next, we load in a couple of [admin_head](https://developer.wordpress.org/reference/hooks/admin_head/) scripts to give us better control of the editor changing in real-time. For users in Gutenberg, the select dropdown will force an AJAX request to fire to save the page, then force a reload of the page. This needs to happen due to how the React elements are used on the page and how Gutenberg natively handled everything via AJAX. The code for the Gutenberg side is also a bit more complex due to the reactive nature of the page. The sidebar is reactive and the dropdown for templates is rendered dynamically, so we have to handle the DOM navigation a bit differently.

If the user is seeing the Classic Editor, then we will just trigger the form to save. This naturally forces the page to reload, so no additional work is needed to make that happen.

## Wrapping up

You are now ready to have dynamic transitions between the Gutenberg and Classic editor! Alternatively, there have been plugins created that can also do this at some level. I prefer to do most of this work in code so I can test it out and keep the environments consistent without regularly syncing the database. Ultimately - do whatever works best for you and your project!