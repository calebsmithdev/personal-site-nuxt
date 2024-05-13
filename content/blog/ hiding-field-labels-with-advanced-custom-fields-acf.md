---
title: 'Hiding field labels with Advanced Custom Fields (ACF)'
description: "Sometimes it's really nice to be able to hide a field from UI. Maybe you want to show instructions, but without the unnecessary label. Let's see how to best handle that."
date: 2024-05-12
categories: ['WordPress', 'Advanced Custom Fields (ACF)']
sitemap:
  lastmod: 2024-05-12
---

As a WordPress developer who routinely uses Advanced Custom Fields, I occasionally run into small things where I think "Woah - why isn't this part of the core feature set?". They are usually small things, but I end up copy/pasting them between projects anyway. One of those features is the ability to hide fields labels for admins, whether with just any meta field or with ACF blocks. 

For me - I specifically use this with the Message field type. Message fields are static message spots that I primarily use for leaving instructions, or important messages, while my content editors are in the backend. For ACF Blocks, I'll use them at the very top for any specific details about how to use a block, or to list any rules to consider at the design system level.

Let's check out the different options to make this happen! Note: All of the code you see below is built using an OOP-based class structure. You may need to adjust the filters to match your code structure.

## Option A: Field Settings

The first option is using filters in PHP to add a new settings option to your fields to toggle the feature off/on as needed. This is generally my preferred method since everyone knows what the setting does, it's always present (you won't forget how to use it later), and easy to comprehend for no developers who are just needing to create data structures with ACF.

![Preview of the updated Presentation UI](/assets/img/blog/63-01-20240411-hide-field-labels-01.png)

Let's look at this code snippet:

```php
public function render_field_settings($field)
{
	acf_render_field_setting($field, array(
		'label'            => __('Hide Label?'),
		'instructions'    => '',
		'name'            => 'hide_label',
		'type'            => 'true_false',
		'ui'            => 1,
	), true);
}

public function modify_field_output($field)
{
	$hide_label = $field['hide_label'] ?? false;
	if ($hide_label) {
		echo '
		<style type="text/css">
			.acf-field-', substr($field['key'], 6), ' > .acf-label {display: none;}
		</style>
		';
	}

	return $field;
}

add_action('acf/render_field_presentation_settings/type=message', [$this, 'render_field_settings']);
add_filter('acf/prepare_field', [$this, 'modify_field_output']);
```

The first function handles the rendering of the field settings, which will create a true/false field with the fancy UI that shows a toggle switch instead of a checkbox. This function is called as part of the action that renders under the "Presentation" tab and only for the field type of "message". If you would like to see more configuration options, including adding this field to your own settings tab, check out the [official docs here](https://www.advancedcustomfields.com/resources/adding-custom-settings-fields/).

The second function handles the output of the field. For this, we are checking to confirm if the value exists and is true. If so, we add an inline CSS snippet that targets the specific field and hides it directly. This approach is great since its more specific and targeted, in case you want to use other classes to control other elements.

## Option B: CSS Classes

The second option is to add a class for the WordPress admin only that can be added to a field directly in the ACF "class" settings option. This is acceptable, but requires you and your ACF devs to remember that the class exists and to use it when you need it. Generally speaking, I prefer to have all of my options laid out and easy to configure, but handling this with classes is just as easy and may be preferred with your project.

![Preview of the updated Presentation UI](/assets/img/blog/63-01-20240411-hide-field-labels-02.png)

Let's take a look at some code on how to achieve this:

```php
public function render_acf_label_classes()
{
	?>
	
	<style type="text/css">
		.acf-field.hide-title .acf-label { display: none }
	</style>

	<?php
}
    
add_action('acf/input/admin_head', [$this, 'render_acf_label_classes']);
```

The function here is just adding a `<style>` tag on the page that targets the ACF field that has the class `hide-title`, then hides the label. We use the `acf/input/admin_head` so we are only loading this on a page that uses ACF, instead of every admin page globally. Just gives us one less bit of code to run and keep on a page that does not need it.

## Conclusion

That wraps up the process for adding quick options for hiding labels in ACF. Making small adjustments and modifications to your ACF workflow is always a warm welcome, especially when it trickles down to improving the flow for your content editors.

If you think this is something you might benefit from, feel free to use it on your WordPress projects. I'll continue to post more useful snippets using Advanced Custom Fields, so be sure to bookmark my blog. You can also follow me on [Github](https://github.com/calebsmithdev) and [watch my blog repository](https://github.com/calebsmithdev/personal-site-nuxt) for any other updates going out. My blog is built using [Nuxt](https://nuxt.com/) and [Nuxt Content](https://content.nuxt.com/), so all of my blogs can be viewed directly in Markdown as well.