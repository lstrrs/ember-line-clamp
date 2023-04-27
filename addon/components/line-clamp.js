import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { htmlSafe, isHTMLSafe } from '@ember/template';
import { scheduleOnce } from '@ember/runloop';
import { debug } from '@ember/debug';
import { mutateDOM } from 'ember-batcher';
import DidResizeModifier from 'ember-resize-modifier/modifiers/did-resize';

const LINE_CLAMP_CLASS = 'lt-line-clamp';
const SINGLE_LINE_CLAMP_CLASS = htmlSafe(
  `${LINE_CLAMP_CLASS} ${LINE_CLAMP_CLASS}--single-line`
);
const MULTI_LINE_CLAMP_CLASS = htmlSafe(
  `${LINE_CLAMP_CLASS} ${LINE_CLAMP_CLASS}--multi-line`
);
const EMPTY_CLASS = htmlSafe('');
const ELLIPSIS_CLASS = `${LINE_CLAMP_CLASS}__ellipsis`;
const ELLIPSIS_DUMMY_CLASS = `${ELLIPSIS_CLASS}--dummy`;
const MORE_CLASS = `${LINE_CLAMP_CLASS}__more`;

/**
 * Ember.Handlebars.Utils.escapeExpression has not unescapeExpression equivalent
 * hence I have unescape the text myself.
 */
const R_ENTITIES = /&(?:([a-z0-9]+)|#x([\da-f]{1,6})|#(\d{1,8}));/gi;
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
 *
 * @example
 * ```
 * <LineClamp @text="Some long text" />
 * ```
 *
 * @class LineClampComponent
 */
export default class LineClampComponent extends Component {
  /**
   * Text to truncate/clamp
   * @type {String}
   */
  get text() {
    return this.args.text ?? '';
  }

  /**
   * Characters/text to be used as the overflow/ellipsis when text is truncated
   * @type {String}
   * @default '...'
   */
  get ellipsis() {
    return this.args.ellipsis ?? '...';
  }

  /**
   * The number of lines at which to clamp text
   * @type {Number}
   * @default 3
   */
  get lines() {
    return this.args.lines ?? 3;
  }

  /**
   * An override to the default behavior when clamping text and removing `<br>` tags and `\n` characters.
   * @type {Boolean}
   * @default true
   */
  get stripText() {
    return this.args.stripText ?? true;
  }

  /**
   * An override that can be used to hide both seeMore and seeLess interactive elements
   * @type {Boolean}
   * @default true
   */
  get interactive() {
    return this.args.interactive ?? true;
  }

  /**
   * An override that can be used to skip native CSS solution when available and instead use JS solution
   * @type {Boolean}
   * @default false
   */
  get useJsOnly() {
    return this.args.useJsOnly ?? false;
  }

  /**
   * Attribute that can be used to control truncation from outside of the component
   * @type {Boolean}
   * @default true
   */
  get truncate() {
    return this.args.truncate ?? true;
  }

  /**
   * An override that can be used to hide "see more" interactive element
   * @type {Boolean}
   * @default true
   */
  get showMoreButton() {
    return this.args.showMoreButton ?? true;
  }

  /**
   * An override that can be used to hide "see less" interactive element
   * @type {Boolean}
   * @default true
   */
  get showLessButton() {
    return this.args.showLessButton ?? true;
  }

  /**
   * Text to display in "see more" interactive element
   * @type {String}
   * @default 'See More'
   */
  get seeMoreText() {
    return this.args.seeMoreText ?? 'See More';
  }

  /**
   * Text to display in "see less" interactive element
   * @type {String}
   * @default 'See Less'
   */
  get seeLessText() {
    return this.args.seeLessText ?? 'See Less';
  }

  /**
   * Line clamp class to use
   * @type {String}
   */
  get _lineClampClass() {
    if (this._shouldUseNativeLineClampCSS) {
      return this.truncate ? MULTI_LINE_CLAMP_CLASS : EMPTY_CLASS;
    } else if (this._shouldUseNativeTextOverflowCSS) {
      return this.truncate ? SINGLE_LINE_CLAMP_CLASS : EMPTY_CLASS;
    } else {
      return EMPTY_CLASS;
    }
  }

  /**
   * Line clamp style to use
   * @type {String}
   */
  get _lineClampStyle() {
    return this._shouldUseNativeLineClampCSS && this.truncate
      ? htmlSafe(`-webkit-line-clamp: ${this.lines}`)
      : htmlSafe('');
  }

  /**
   * Should this use native line clamp CSS? Checks for -webkit-line-clamp support, _isInteractive and lines > 1
   * @type {Boolean}
   */
  get _shouldUseNativeLineClampCSS() {
    return this.useJsOnly
      ? false
      : 'webkitLineClamp' in document.body.style &&
          !this._isInteractive &&
          this.lines > 1;
  }

  /**
   * Should this use native text overflow CSS? Checks for _isInteractive and lines === 1
   * @type {Boolean}
   */
  get _shouldUseNativeTextOverflowCSS() {
    return this.useJsOnly ? false : !this._isInteractive && this.lines === 1;
  }

  /**
   * Returns the reference to the `did-resize` modifier if we are not using native line clamping
   * @return {DidResizeModifier | null}
   */
  get didResize() {
    return this._shouldUseNativeLineClampCSS ? null : DidResizeModifier;
  }

  /**
   * Based on showMoreButton and interactive flags
   * @type {Boolean}
   * @private
   */
  @tracked _isInteractive = true;

  /**
   * Property to keep an internal state for showMoreButton and used in the template
   * @type {Boolean}
   * @private
   */
  @tracked _showMoreButton = true;

  /**
   * Property to keep an internal state for showLessButton and used in the template
   * @type {Boolean}
   * @private
   */
  @tracked _showLessButton = true;

  /**
   * Used to track state of text as expanded or not expanded/collapsed
   * @type {Boolean}
   * @private
   */
  @tracked _expanded = false;

  /**
   * Used to track state of text as truncated or not truncated
   * @type {Boolean}
   * @private
   */
  @tracked _truncated = true;

  /**
   * Used to track changes in the `truncate` attribute
   */
  @tracked _oldTruncate = true;

  /**
   * Used to track state and know if text should be stripped
   * @type {Boolean}
   * @private
   */
  @tracked _stripText = false;

  @tracked element;
  @tracked targetWidth;

  /**
   * Property that returns a stripped version of the text with no <br> tags
   * @type {String}
   * @private
   */
  get _strippedText() {
    if (typeof FastBoot === 'undefined') {
      if (typeof window !== 'undefined' && !!this.element && this._stripText) {
        if (
          this._shouldUseNativeLineClampCSS ||
          this._shouldUseNativeTextOverflowCSS
        ) {
          return this._stripBrTags(this._unescapeText(this.text));
        }
        return '';
      }
    }
    return '';
  }

  /**
   * Property that returns array of lines to render
   * @type {Array}
   * @private
   */
  get _textLines() {
    if (typeof FastBoot === 'undefined') {
      const mounted = !!(this.element && this.targetWidth);
      if (typeof window !== 'undefined' && mounted) {
        if (!this._expanded) {
          return this._getLines();
        } else {
          scheduleOnce('afterRender', this, this.onTruncate, false);
          return [];
        }
      }
      return [];
    }
    return [];
  }

  /**
   * Unique identifier used to differentiate between multiple instances.
   * @type {String}
   */
  buttonId = guidFor(this);

  constructor() {
    super(...arguments);

    // interative prop overpowers showMoreButton and showLessButton when false
    this._showMoreButton = this.interactive && this.showMoreButton;
    // No point in showLessButton true if showMoreButton is false
    this._showLessButton = this._showMoreButton
      ? this.interactive && this.showLessButton
      : false;

    // Interativity of the component is driven by showMoreButton value
    this._isInteractive = this._showMoreButton;

    this._getLines = this._getLines.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onTruncate = this.onTruncate.bind(this);
    this._measureWidth = this._measureWidth.bind(this);
    this._calculateTargetWidth = this._calculateTargetWidth.bind(this);
  }

  @action
  onDidUpdate() {
    if (this.truncate !== this._oldTruncate) {
      this._handleNewTruncateAttr(this.truncate);
      this._oldTruncate = this.truncate;
    }
  }

  @action
  onDidInsert(element) {
    this.element = element;
    if (this._shouldUseNativeLineClampCSS) {
      this._stripText = this.stripText;
    } else if (this._shouldUseNativeTextOverflowCSS) {
      this._stripText = this.stripText;
    } else {
      const canvas = document.createElement('canvas');
      this.canvasContext = canvas.getContext('2d');

      this._createDummyEllipsisElement();
      this.element.appendChild(this.dummyEllipsisElement);

      this._calculateTargetWidth();
    }
    this.onDidUpdate();
  }

  willDestroy() {
    if (this.dummyEllipsisElement) {
      this.element.removeChild(this.dummyEllipsisElement);
    }

    window.cancelAnimationFrame(this._scheduledResizeAnimationFrame);

    super.willDestroy(...arguments);
  }

  onResize() {
    // This is used to allow us to "spy" on this function for testing purposes
    if (debug && this.args.onResizeSpy) {
      this.args.onResizeSpy();
    }
    if (this._scheduledResizeAnimationFrame) {
      window.cancelAnimationFrame(this._scheduledResizeAnimationFrame);
    }

    this._scheduledResizeAnimationFrame = window.requestAnimationFrame(
      this._calculateTargetWidth
    );
  }

  onTruncate(didTruncate) {
    this._handleTruncate(didTruncate);

    if (typeof this.args.handleTruncate === 'function') {
      this.args.handleTruncate(didTruncate);
    }
  }

  _handleNewTruncateAttr(truncate) {
    if (this._shouldUseNativeLineClampCSS) {
      this._stripText = this.stripText && truncate;
    } else if (this._shouldUseNativeTextOverflowCSS) {
      this._stripText = this.stripText && truncate;
    }

    this._onToggleTruncate();
  }

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
        style['font-family'],
      ].join(' ');

      this.canvasContext.font = font;
      this.targetWidth = targetWidth;
    }
  }

  /**
   * Calculates text width using canvas
   * @method _measureWidth
   * @param {String} text
   * @return {Number}
   * @private
   */
  _measureWidth(text) {
    return this.canvasContext && this.canvasContext.measureText(text).width;
  }

  /**
   * Gets an element offsetWidth
   * @method _getElementWidth
   * @param {HTMLElement} node
   * @return {Number}
   * @private
   */
  _getElementWidth(node) {
    return node.offsetWidth;
  }

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
  }

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
    this.dummyEllipsisElement.innerHTML = this._isInteractive
      ? `${this.ellipsis} <a class="${MORE_CLASS}" href="#" role="button">${this.seeMoreText}</a>`
      : this.ellipsis;
  }

  /**
   * This method removes `<br>` tags in the text
   * @method _stripBrTags
   * @param {String} text
   * @private
   */
  _stripBrTags(text) {
    return text
      .toString()
      .replace(/<br.*?[/]?>/gi, ' ')
      .replace(/\r\n|\n|\r/g, ' ');
  }

  /**
   * This method converts `<br>` tags in the text to newline characters
   * @method _convertBrTags
   * @param {String} text
   * @private
   */
  _convertBrTags(text) {
    return text.toString().replace(/<br.*?[/]?>/gi, '\n');
  }

  /**
   * This method unescapes the string when escaped
   * Ember.Handlebars.Utils.escapeExpression has not unescapeExpression equivalent
   * @method _unescapeText
   * @param {String} text
   * @private
   */
  _unescapeText(text) {
    return text
      .toString()
      .replace(
        R_ENTITIES,
        (match) =>
          HTML_ENTITIES_TO_CHARS[match] ||
          HTML_ENTITIES_TO_CHARS[
            match.replace(/([0-9]+)/gi, (m) => `x${(+m).toString(16)}`)
          ] ||
          match
      );
  }

  /**
   * This method does the truncation by maipulating the text and creating lines
   * TODO: Remove mutation on state with textLines in each loop, getting hard to debug
   * @method _getLines
   * @return {Array}
   * @private
   */
  _getLines() {
    const lines = [];
    const numLines = this.lines;
    const text = this.text;
    const textToTruncate = isHTMLSafe(text) ? this._unescapeText(text) : text;
    const formattedText = this.stripText
      ? this._stripBrTags(textToTruncate)
      : this._convertBrTags(textToTruncate);
    const textLines = formattedText
      .split('\n')
      .map((line) => line.trim().split(' '));
    let didTruncate = true;

    const ellipsisWidth = this._getEllipsisWidth();

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

      const resultLine = textWords.join(' ');

      if (this._measureWidth(resultLine) <= this.targetWidth) {
        if (textLines.length === 1) {
          // Line is end of text and fits without truncating
          didTruncate = false;

          lines.push({
            text: resultLine,
            lastLine: true,
            needsEllipsis: false,
          });
          break;
        }
      }

      if (line === numLines) {
        // Binary search determining the longest possible line including truncate string
        const textRest = textWords.join(' ');

        let lower = 0;
        let upper = textRest.length - 1;

        while (lower <= upper) {
          const middle = Math.floor((lower + upper) / 2);

          const testLine = textRest.slice(0, middle + 1);

          if (
            this._measureWidth(testLine) + ellipsisWidth <=
            this.targetWidth
          ) {
            lower = middle + 1;
          } else {
            upper = middle - 1;
          }
        }

        // Add line - last
        lines.push({
          text: textRest.slice(0, lower),
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

    scheduleOnce('afterRender', this, this.onTruncate, didTruncate);

    return lines;
  }

  /**
   * Handles state for _truncated
   * @method _handleTruncate
   * @param {Boolean} truncated
   * @return {Void}
   * @private
   */
  _handleTruncate(truncated) {
    if (this._truncated !== truncated) {
      this._truncated = truncated;
    }
  }

  _onToggleTruncate() {
    this._expanded = !this._expanded;

    const justExpanded = this._expanded;

    if (justExpanded) {
      mutateDOM(() => {
        const showLessButton = this.element.querySelector(
          `#line-clamp-show-less-button-${this.buttonId}`
        );
        if (showLessButton) {
          showLessButton.focus();
        }
      });
      if (typeof this.args.onExpand === 'function') {
        this.args.onExpand();
      }
    } else {
      mutateDOM(() => {
        const showMoreButton = this.element.querySelector(
          `#line-clamp-show-more-button-${this.buttonId}`
        );
        if (showMoreButton) {
          showMoreButton.focus();
        }
      });

      if (typeof this.args.onCollapse === 'function') {
        this.args.onCollapse();
      }
    }
  }

  /**
   * We use a closure action to prevent closure actions on containing elements from being called
   * @param {Object} event
   */
  @action
  toggleTruncate(event) {
    event.preventDefault();
    event.stopPropagation();

    this._onToggleTruncate();
  }
}
