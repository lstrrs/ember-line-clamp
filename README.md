# ember-line-clamp

[![Build Status](https://travis-ci.org/lstrrs/ember-line-clamp.svg?branch=master)](https://travis-ci.org/lstrrs/ember-line-clamp)
[![npm version](https://badge.fury.io/js/ember-line-clamp.svg)](https://badge.fury.io/js/ember-line-clamp)
[![dependencies Status](https://david-dm.org/lstrrs/ember-line-clamp/status.svg)](https://david-dm.org/lstrrs/ember-line-clamp)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![GitHub issues](https://img.shields.io/github/issues/lstrrs/ember-line-clamp.svg)](https://github.com/lstrrs/ember-line-clamp/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/lstrrs/ember-line-clamp/master/LICENSE.md)

This Ember addon provides a component for truncating/clamping text.

* Note: This component currently does not support block form.

## Installation

* `npm install ember-line-clamp`

## Demo

Demo application [here](https://lstrrs.github.io/ember-line-clamp-website/)

## Usage

To get started, place the `line-clamp` component in one of your templates and provide a string to the `text` attribute. The `line-clamp` component supports other attributes, for more details you can always look at the source code.

### `text`

The text attribute is not required but would be nice to truncate something.

Default: ` `

```handlebars
<LineClamp
  @text="A really long text to truncate"
/>
```

### `lines`

This attribute allows you to set the number of lines to clamp the text.

Default: `3`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @lines={{2}}
/>
```

### `stripText`

This attribute allows user to prevent stripping text of `<br>` tags when clamping.

Default: `true`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @lines={{2}}
  @stripText={{false}}
/>
```

### `ellipsis`

The characters/string to be used as the overflow element.

Default: `...`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @lines={{2}}
  @ellipsis="..."
/>
```

### `interactive`

Line clamp is not always interactive, in fact if you use `-webkit-line-clamp` there is not interaction enabled. This attribute allows you to enable see more/see less functionality and overpowers `showMoreButton` and `showLessButton` when `false`. In cases where you do not want any interaction `-webkit-line-clamp` is used in the background to save work.

Default: `true`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @interactive={{false}}
/>
```

### `truncate`

Some users might not like our style for the component, and they would like to do some fancy stuff. You can use this attribute to control truncation from outside the component and have a button that controls the truncation.

Default: `true`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @interactive={{false}}
  @truncate={{this.truncate}}
/>
<button class="super-fancy-style" {{action "toggleTruncate"}}>{{buttonText}}</button>
```

### `showMoreButton`

This attribute enables/disables 'See More' functionality

Default: `true`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showMoreButton={{false}}
/>
```

### `showLessButton`

This attribute enables/disables 'See Less' functionality

Default: `true`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showLessButton={{false}}
/>
```

### `seeMoreText`

This component should work in any language, hence this attribute allows you to set the text for the 'See More' button

Default: `See More`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showLessButton={{false}}
  @seeMoreText="Ver Más"
/>
```

### `seeMoreA11yText`

This component should have optional support for aria-label in the situation where text alone is not enough to convey context of button to users, hence this attribute allows you to set the aria-label for the 'See More' button. By default this attribute is not used.

Default: `false`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showLessButton={{false}}
  @seeMoreText="See more"
  @seeMoreA11yText="A button which expands the content of this text"
/>
```

### `seeLessText`

This component should work in any language, hence this attribute allows you to set the text for the 'See Less' button

Default: `See Less`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showLessButton={{false}}
  @seeMoreText="Read More"
  @seeLessText="Read Less"
/>
```

### `seeLessA11yText`

This component should have optional support for aria-label in the situation where text alone is not enough to convey context of button to users, hence this attribute allows you to set the aria-label for the 'See Less' button. By default this attribute is not used.

Default: `false`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @showLessButton={{false}}
  @seeMoreText="Read More"
  @seeLessText="Read Less"
  @seeLessA11yText="A button which unexpands the content of this text"
/>
```

### `onExpand`

This attribute allows you to pass an action/closure to trigger when text is expanded

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @onExpand={{this.doSomethingWhenTextIsExpanded}}
/>
```

### `onCollapse`

This attribute allows you to pass an action/closure to trigger when text is collapsed

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @onExpand={{this.doSomethingWhenTextIsExpanded}}
  @onCollapse={{this.doSomethingWhenTextIsCollapsed}}
/>
```

### `useJsOnly`

This attribute allows you to ensure `handleTruncate` is called all the time. The caveat is the browser native CSS solutions will never be used. Note: When the browser native CSS solutions are used, `handleTruncate` is never called.

Default: `false`

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @useJsOnly={{false}}
  @handleTruncate={{this.onHandleTruncate}}
/>
```

### `handleTruncate`

This attribute allows you to pass an action/closure to trigger every time the text goes through the truncation process, receives a boolean to determine if the text was truncated. Not called when the browser native CSS solutions are used.

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @handleTruncate={{this.onHandleTruncate}}
/>
```

Note: Will not execute when the native CSS line-clamp is used because there is no good way currently to tell whether the browser actually truncated the text or not. If you need `handleTruncate` to run all the time, please enable `useJsOnly`.

```handlebars
<LineClamp
  @text="A really long text to truncate"
  @useJsOnly={{true}}
  @handleTruncate={{this.onHandleTruncate}}
/>
```

Then create an action that gets notified after the text is truncated. When the text is truncated and ellipsis applied, `didTruncate` will be `true`. When the text isn't truncated, `didTruncate` will be `false`. 

```handlebars
@action onHandleTruncate(didTruncate) {
  if (didTruncate) {
    this.someProperty = true;
  }
}
```

## Dev TODOs

- [x] tests
- [x] demo page
- [ ] support block form

## Thanks

* [CSS Line Clamping](http://guerillalabs.co/blog/css-line-clamping.html) article
* [@nilsynils](https://github.com/nilsynils) for his [Medium Post](https://medium.com/mofed/css-line-clamp-the-good-the-bad-and-the-straight-up-broken-865413f16e5)
* [@One-com](https://github.com/One-com) for a [inspiration](https://github.com/One-com/react-truncate)
