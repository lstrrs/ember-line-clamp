import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from '../templates/components/line-clamp';
import { computed } from '@ember/object';
import { htmlSafe, isHTMLSafe } from '@ember/string';
import { mutateDOM } from 'ember-batcher';

const LINE_CLAMP_CLASS = 'lt-line-clamp';
const SINGLE_LINE_CLAMP_CLASS = `${LINE_CLAMP_CLASS} ${LINE_CLAMP_CLASS}--single-line`;
const MULTI_LINE_CLAMP_CLASS = `${LINE_CLAMP_CLASS} ${LINE_CLAMP_CLASS}--multi-line`;
const ELLIPSIS_CLASS = `${LINE_CLAMP_CLASS}__ellipsis`;
const ELLIPSIS_DUMMY_CLASS = `${ELLIPSIS_CLASS}--dummy`;
const MORE_CLASS = `${LINE_CLAMP_CLASS}__more`;

/**
 * Ember.Handlebars.Utils.escapeExpression has not unescapeExpression equivalent
 * hence I have unescape the text myself.
 */
const R_ENTITIES = /&(?:([a-z0-9]+)|#x([\da-f]{1,6})|#(\d{1,8}));/ig;
const HTML_ENTITIES_TO_CHARS = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x60;': '`',
  '&#x3D;': '=',
  '&#x3d;': '=',
  '&#8212': '—',
};

/**
 * Function to enescape entity
 * Note that we might need to convert to hex from dec entity
 *
 * @param {String} entity
 * @return {String}
 */
// function unescape(entity) {
//   return HTML_ENTITIES_TO_CHARS[entity] ||
//     HTML_ENTITIES_TO_CHARS[entity.replace(
//       /([0-9]+)/gi,
//       m => `x${(+m).toString(16)}`
//     )] ||
//     entity;
// }

/**
 * Generic component used to truncate/clamp text to a specified number of lines
 * @param {String}  text @required Text to be clamped
 * @param {Number}  lines @default 3 Number of lines to clamp
 * @param {Boolean} stripText @default false Enable stripping <br> tags when using native css line-clamp
 * @param {String}  ellipsis @default '...' Characters to be used as ellipsis
 * @param {Boolean} interactive @default true Enable see more/see less functionality
 * @param {Boolean} truncate @default true Allow managing truncation from outside component
 * @param {Boolean} showMoreButton @default true
 * @param {Boolean} showLessButton @default true
 * @param {String}  seeMoreText @default 'See More'
 * @param {String}  seeLessText @default 'See Less'
 * @param {Action}  onExpand Action triggered when text is expanded
 * @param {Action}  onCollapse Action triggered when text is collapsed
 * @param {Boolean} useJsOnly @default false Disables native CSS solution
 * @param {Action}  handleTruncate @returns {boolean} didTruncate Action triggered every time text goes true truncation process. Only called when native CSS solution isn't used. If didTruncate is true, text truncated and ellipsis applied.
 * @param {Boolean} forceEvaluate @default false Force evaluate the line clamp based on some condition
 *
 * @example
 * ```
 * {{line-clamp text="Some long text"}}
 * ```
 *
 * @class LineClampComponent
 */
export default Component.extend({
  layout,

  unifiedEventHandler: service('unified-event-handler'),

  componentName: 'LineClamp',

  tagName: 'div',

  /**
   * Attribute binding for class - sets specific CSS classes when CSS solution is available
   */
  classNameBindings: ['_lineClampClass'],

  /**
   * Attribute binding for style - sets specific CSS styles when CSS solution is available
   */
  attributeBindings: ['_lineClampStyle:style'],

  /**
   * Text to truncate/clamp
   * @type {String}
   */
  text: '',

  /**
   * Characters/text to be used as the overflow/ellipsis when text is truncated
   * @type {String}
   * @default '...'
   */
  ellipsis: '...',

  /**
   * The number of lines at which to clamp text
   * @type {Number}
   * @default 3
   */
  lines: 3,

  /**
   * An override to the default behavior when clamping text and removing `<br>` tags and `\n` characters.
   * @type {Boolean}
   * @default true
   */
  stripText: true,

  /**
   * An override that can be used to hide both seeMore and seeLess interactive elements
   * @type {Boolean}
   * @default true
   */
  interactive: true,

  /**
   * An override that can be used to skip native CSS solution when available and instead use JS solution
   * @type {Boolean}
   * @default false
   */
  useJsOnly: false,

  /**
   * Attribute that can be used to control truncation from outside of the component
   * @type {Boolean}
   * @default true
   */
  truncate: true,

  /**
   * An override that can be used to hide "see more" interactive element
   * @type {Boolean}
   * @default true
   */
  showMoreButton: true,

  /**
   * An override that can be used to hide "see less" interactive element
   * @type {Boolean}
   * @default true
   */
  showLessButton: true,

  /**
   * Text to display in "see more" interactive element
   * @type {String}
   * @default 'See More'
   */
  seeMoreText: 'See More',

  /**
   * Text to display in "see less" interactive element
   * @type {String}
   * @default 'See Less'
   */
	seeLessText: 'See Less',

	/**
	 * Text suffix to append after the truncation
	 * @type {String}
	 * @default ""
	 * @example: "Some sample content that is truncated now...continue"
	 */
  textSuffix: "",

  /**
	 * Force evaluate the line clamp ?
	 * @type {Boolean}
	 * @default false
	 */
	forceEvaluate: false,

  /**
   * Based on showMoreButton and interactive flags
   * @type {Boolean}
   * @private
   */
  _isInteractive: true,

  /**
   * Property to keep an internal state for showMoreButton and used in the template
   * @type {Boolean}
   * @private
   */
  _showMoreButton: true,

  /**
   * Property to keep an internal state for showLessButton and used in the template
   * @type {Boolean}
   * @private
   */
  _showLessButton: true,

  /**
   * Used to track state of text as expanded or not expanded/collapsed
   * @type {Boolean}
   * @private
   */
  _expanded: false,

  /**
   * Used to track state of text as truncated or not truncated
   * @type {Boolean}
   * @private
   */
  _truncated: true,

  /**
   * Used to track changes in the `truncate` attribute
   */
  _oldTruncate: true,

  /**
   * Used to track state and know if text should be stripped
   * @type {Boolean}
   * @private
   */
  _stripText: false,

  /**
   * Property that returns a stripped version of the text with no <br> tags
   * @type {String}
   * @private
   */
  _strippedText: computed('text', '_stripText', function getStrippedText() {
    if (typeof FastBoot === 'undefined') {
      if (typeof window !== 'undefined' && !!this.element && this.get('_stripText')) {
        if ((this._shouldUseNativeLineClampCSS() || this._shouldUseNativeTextOverflowCSS())) {
          return this._stripBrTags(this._unescapeText(this.get('text') || ''));
        }

        return '';
      }
    }

    return '';
  }),

  /**
   * Property that returns array of lines to render
   * @type {Array}
   * @private
   */
  _textLines: computed('lines', 'text', 'targetWidth', '_expanded', function getTextLines() {
    if (typeof FastBoot === 'undefined') {
      const mounted = !!(this.element && this.get('targetWidth'));
      if (typeof window !== 'undefined' && mounted) {
        if (!this.get('_expanded')) {
          return this._getLines();
        } else {
          this.onTruncate(false);
          return [];
        }
      }

      return [];
    }

    return [];
  }),

  init() {
    this._super(...arguments);

    // interative prop overpowers showMoreButton and showLessButton when false
    this._showMoreButton = this.interactive && this.showMoreButton;
    this._showLessButton = this.interactive && this.showLessButton;

    // Interativity of the component is driven by showMoreButton value
    this._isInteractive = this._showMoreButton;

    // No point in showLessButton true if showMoreButton is false
    this._showLessButton = this._showMoreButton ? this._showLessButton : false;

    this._getLines = this._getLines.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onTruncate = this.onTruncate.bind(this);
    this._measureWidth = this._measureWidth.bind(this);
    this._calculateTargetWidth = this._calculateTargetWidth.bind(this);
  },

  didReceiveAttrs() {
    if (this.get('truncate') !== this.get('_oldTruncate')) {
      this._handleNewTruncateAttr(this.get('truncate'));
      this.set('_oldTruncate', this.get('truncate'));
    }

    // For cases where the clamping has to be forced dynamically
		// ex: parent container resizing, etc.,
		if (this.get('forceEvaluate')) {
			this.onResize();
		}
  },

  didInsertElement() {
    if (this._shouldUseNativeLineClampCSS()) {
      this.set('_lineClampClass', MULTI_LINE_CLAMP_CLASS);
      this.set('_lineClampStyle', htmlSafe(`-webkit-line-clamp: ${this.get('lines')}`));
      this.set('_stripText', this.stripText);
    } else if (this._shouldUseNativeTextOverflowCSS()) {
      this.set('_lineClampClass', SINGLE_LINE_CLAMP_CLASS);
      this.set('_stripText', this.stripText);
    } else {
      const canvas = document.createElement('canvas');
      this.canvasContext = canvas.getContext('2d');

      this._createDummyEllipsisElement();
      this.element.appendChild(this.dummyEllipsisElement);

      this._calculateTargetWidth();
      this._bindResize();
    }
  },

  willDestroyElement() {
    if (this.dummyEllipsisElement) {
      this.element.removeChild(this.dummyEllipsisElement);
    }

    this._unbindResize();
    window.cancelAnimationFrame(this._scheduledResizeAnimationFrame);

    this._super(...arguments);
  },

  onResize() {
    if (this._scheduledResizeAnimationFrame) {
      window.cancelAnimationFrame(this._scheduledResizeAnimationFrame);
    }

    this._scheduledResizeAnimationFrame = window.requestAnimationFrame(this._calculateTargetWidth);
  },

	onTruncate(didTruncate) {
    this._handleTruncate(didTruncate);

    const handleTruncate = this.getAttr('handleTruncate');
    if (handleTruncate) {
      if (typeof handleTruncate === 'function') {
        handleTruncate(didTruncate);
      } else {
        this.sendAction('handleTruncate', didTruncate); // eslint-disable-line
      }
    }
  },

  _handleNewTruncateAttr(truncate) {
    if (this._shouldUseNativeLineClampCSS()) {
      this.set('_lineClampClass', truncate ? MULTI_LINE_CLAMP_CLASS : '');
      this.set('_lineClampStyle', truncate ? htmlSafe(`-webkit-line-clamp: ${this.get('lines')}`) : htmlSafe(''));
      this.set('_stripText', this.stripText && truncate);
    } else if (this._shouldUseNativeTextOverflowCSS()) {
      this.set('_lineClampClass', truncate ? SINGLE_LINE_CLAMP_CLASS : '');
      this.set('_stripText', this.stripText && truncate);
    }

    this._onToggleTruncate();
  },

  /**
   * Calculates target width for the text (i.e. parent elment width)
   * @method _calculateTargetWidth
   * @return {Void}
   * @private
   */
  _calculateTargetWidth() {
    if (this.element) {
      const targetWidth = this.element.getBoundingClientRect().width;

      if (!targetWidth) {
        return window.requestAnimationFrame(this._calculateTargetWidth);
      }

      const style = window.getComputedStyle(this.element);
      const font = [
        style['font-weight'],
        style['font-style'],
        style['font-size'],
        style['font-family']
      ].join(' ');

      this.canvasContext.font = font;
      this.set('targetWidth', targetWidth);
    }
  },

  /**
   * Calculates text width using canvas
   * @method _measureWidth
   * @param {String} text
   * @return {Number}
   * @private
   */
  _measureWidth(text) {
    return this.canvasContext && this.canvasContext.measureText(text).width;
  },

  /**
   * Gets an element offsetWidth
   * @method _getElementWidth
   * @param {HTMLElement} node
   * @return {Number}
   * @private
   */
  _getElementWidth(node) {
    return node.offsetWidth;
  },

  // TODO: Remove this method - if consuming app has responsive styles that affect ellipsis element
  // this will give wrong width
  /**
   * Gets dummyEllipsisElement's offsetWidth
   * @method _getEllipsisWidth
   * @return {Number}
   * @private
   */
  _getEllipsisWidth() {
    if (!this._ellipsisWidth) {
      this._ellipsisWidth = this._getElementWidth(this.dummyEllipsisElement);
    }

    return this._ellipsisWidth;
  },

  /**
   * Utility method to create a DOM element mimicking the elment to be used for textoverflow/clamping
   * This element's purpose is for measuring only
   * @method _createDummyEllipsisElement
   * @return {Void}
   * @private
   */
  _createDummyEllipsisElement() {
    this.dummyEllipsisElement = document.createElement('span');
    this.dummyEllipsisElement.className = `${ELLIPSIS_CLASS} ${ELLIPSIS_DUMMY_CLASS}`;
    this.dummyEllipsisElement.innerHTML = this._isInteractive ? `${this.ellipsis} <a class="${MORE_CLASS}" href="#" role="button">${this.seeMoreText}</a>` : this.ellipsis;
  },

  /**
   * Checks for -webkit-line-clamp support, _isInteractive and lines > 1
   * @method _shouldUseNativeLineClampCSS
   * @return {Boolean}
   * @private
   */
  _shouldUseNativeLineClampCSS() {
    return this.get('useJsOnly') ? false : 'webkitLineClamp' in document.body.style && !this._isInteractive && this.get('lines') > 1;
  },

  /**
   * Checks for _isInteractive and lines === 1
   * @method _shouldUseNativeTextOverflowCSS
   * @return {Boolean}
   * @private
   */
  _shouldUseNativeTextOverflowCSS() {
    return this.get('useJsOnly') ? false : !this._isInteractive && this.get('lines') === 1;
  },

  /**
   * Binds/registers resize listener
   * @method _bindResize
   * @return {Void}
   * @private
   */
  _bindResize() {
    this.get('unifiedEventHandler').register('window', 'resize', this.get('onResize'));
    this._resizeHandlerRegistered = true;
  },

  /**
   * Unbinds/Unregisters resize listener in 'willDestroy'
   * @method _unbindResize
   * @return {Void}
   * @private
   */
  _unbindResize() {
    if (this._resizeHandlerRegistered) {
      this.get('unifiedEventHandler').unregister('window', 'resize', this.get('onResize'));
      this._resizeHandlerRegistered = false;
    }
  },

  /**
   * This method removes `<br>` tags in the text
   * @method _stripBrTags
   * @param {String} text
   * @private
   */
  _stripBrTags(text) {
    return text.toString().replace(/<br.*?[/]?>/gi, ' ').replace(/\r\n|\n|\r/g, ' ');
  },

  /**
   * This method converts `<br>` tags in the text to newline characters
   * @method _convertBrTags
   * @param {String} text
   * @private
   */
  _convertBrTags(text) {
    return text.toString().replace(/<br.*?[/]?>/gi, '\n');
  },

  /**
   * This method unescapes the string when escaped
   * Ember.Handlebars.Utils.escapeExpression has not unescapeExpression equivalent
   * @method _unescapeText
   * @param {String} text
   * @private
   */
  _unescapeText(text) {
    return text.toString().replace(R_ENTITIES, match =>
      HTML_ENTITIES_TO_CHARS[match] ||
      HTML_ENTITIES_TO_CHARS[match.replace(
        /([0-9]+)/gi,
        m => `x${(+m).toString(16)}`
      )] ||
      match
    );
  },

  /**
   * This method does the truncation by maipulating the text and creating lines
   * TODO: Remove mutation on state with textLines in each loop, getting hard to debug
   * @method _getLines
   * @return {Array}
   * @private
   */
  _getLines() {
    const lines = [];
    const numLines = this.get('lines');
    const text = this.get('text') || '';
    const textToTruncate = isHTMLSafe(text) ? this._unescapeText(text) : text;
    const formattedText = this.stripText ? this._stripBrTags(textToTruncate) : this._convertBrTags(textToTruncate);
    const textLines = formattedText.split('\n').map(line => line.trim().split(' '));
    let didTruncate = true;

		const ellipsisWidth = this._getEllipsisWidth();
		const textSuffixWidth = this._measureWidth(this.textSuffix);
		const textSuffixLength = this.textSuffix.length;

    for (let line = 1; line <= numLines; line += 1) {
      const textWords = textLines[0];

      // handle new line -- ???
      if (textWords.length === 0) {
        lines.push({
          newLine: true,
        });
        textLines.shift();
        line -= 1;
        continue;
      }

			let resultLine = textWords.join(' ');
			let resultLineWidth = this._measureWidth(resultLine);

      if (resultLineWidth <= this.targetWidth) {
        if (textLines.length === 1) {
          // Line is end of text and fits without truncating
					didTruncate = false;

					let isTextWidthWithSuffixNotWithinTarget = (resultLineWidth + textSuffixWidth) > this.targetWidth;
					if (this.textSuffix && isTextWidthWithSuffixNotWithinTarget) {
						resultLine = resultLine.slice(0, -textSuffixLength);
						resultLineWidth = this._measureWidth(resultLine);
					}

          lines.push({
            text: resultLine,
            lastLine: true,
						needsEllipsis: isTextWidthWithSuffixNotWithinTarget
          });
          break;
        }
      }

      if (line === numLines) {
        // Binary search determining the longest possible line including truncate string
        let textRest = textWords.join(' ');

        let lower = 0;
        let upper = textRest.length - 1;

        while (lower <= upper) {
          const middle = Math.floor((lower + upper) / 2);

          const testLine = textRest.slice(0, middle + 1);

					const currentWidths = this._measureWidth(testLine) + ellipsisWidth + textSuffixWidth;
          if (currentWidths <= this.targetWidth) {
            lower = middle + 1;
          } else {
            upper = middle - 1;
          }
				}

        // Add line - last
        lines.push({
          text: this.textSuffix ? textRest.slice(0, lower).slice(0, -textSuffixLength) : textRest.slice(0, lower),
          lastLine: true,
          needsEllipsis: true,
        });
      } else {
        // Binary search determining when the line breaks
        let lower = 0;
        let upper = textWords.length - 1;

        while (lower <= upper) {
          const middle = Math.floor((lower + upper) / 2);

          const testLine = textWords.slice(0, middle + 1).join(' ');

          if (this._measureWidth(testLine) <= this.targetWidth) {
            lower = middle + 1;
          } else {
            upper = middle - 1;
          }
        }

        // The first word of thid line is too long to fit it
        if (lower === 0) {
          // Jump to processing of last line
          line = numLines - 1;
          continue;
        }

        // Add line
        lines.push({
          text: textWords.slice(0, lower).join(' '),
        });
        textLines[0].splice(0, lower);
      }
    }

    this.onTruncate(didTruncate);

    return lines;
  },

  /**
   * Handles state for _truncated
   * @method _handleTruncate
   * @param {Boolean} truncated
   * @return {Void}
   * @private
   */
  _handleTruncate(truncated) {
    if (this.get('_truncated') !== truncated) {
      this.set('_truncated', truncated);
    }
  },

  _onToggleTruncate() {
    this.toggleProperty('_expanded');

    const justExpanded = this.get('_expanded');

    if (justExpanded) {
      mutateDOM(() => {
        const showLessButton = this.element.querySelector('#line-clamp-show-less-button');
        if (showLessButton) {
          showLessButton.focus();
        }
      });
      const onExpand = this.getAttr('onExpand');

      if (onExpand) {
        if (typeof onExpand === 'function') {
          onExpand();
        } else {
          this.sendAction('onExpand'); // eslint-disable-line
        }
      }
    } else {
      mutateDOM(() => {
        const showMoreButton = this.element.querySelector('#line-clamp-show-more-button');
        if (showMoreButton) {
          showMoreButton.focus();
        }
      });

      const onCollapse = this.getAttr('onCollapse');

      if (onCollapse) {
        if (typeof onCollapse === 'function') {
          onCollapse();
        } else {
          this.sendAction('onCollapse'); // eslint-disable-line
        }
      }
    }
  },

  actions: {
    /**
     * We use a closure action to prevent closure actions on containing elements from being called
     * @param {Object} event
     */
    toggleTruncate(event) {
      event.preventDefault();
      event.stopPropagation();

      this._onToggleTruncate();
    },
  },
});
