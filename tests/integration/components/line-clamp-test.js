import { hbs } from 'ember-cli-htmlbars';
import { htmlSafe } from '@ember/template';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent } from '@ember/test-helpers';
import sinon from 'sinon';

/**
 * Pauses the test until the resize has settled and then calls a callback with assertions
 * TODO: Use ember-test-waiters and do this properly
 */
function waitForResizeRAF(assert, callback) {
  const done = assert.async();

  setTimeout(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(function () {
        done();
        callback();
      })
    );
  }, 5000);
}

module('Integration | Component | line clamp', function (hooks) {
  setupRenderingTest(hooks);

  test('inline form works as expected', async function (assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];
    const dummyEllipsis = element.querySelectorAll('.lt-line-clamp--dummy');

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(lines.length, 3, 'text is clamped at 3 lines (default)');

    // This test a bit flaky, depends on the width of div and knowing 'helloworld helloworld' will be a line
    // assert.ok(
    //   lines.slice(0,2)
    //     .every((line) => line.innerText.trim() === 'helloworld helloworld'),
    //   'first lines contain expected text'
    // );

    // This is a better test since we know the truncation will push 'helloworld' to a new line if it does not fit
    assert.ok(
      lines
        .slice(0, 2)
        .every((line) => line.innerText.trim().split(' ')[0] === 'helloworld'),
      'first lines contain expected text'
    );

    assert.ok(
      lastLine.classList.contains('lt-line-clamp__line--last'),
      'lt-line-clamp__line--last is applied to last line'
    );

    assert.strictEqual(
      lastLineChildren.length,
      1,
      'last line contains 1 child'
    );

    assert.ok(
      ellipsisElement,
      'last line child is the ellipsis element and it exists'
    );

    assert.ok(
      ellipsisElement.classList.contains('lt-line-clamp__ellipsis'),
      'ellipsis element contains right CSS class'
    );

    assert
      .dom(ellipsisElement)
      .hasText(
        '... See More',
        'Ellipsis element contains expetend ellipsis and see more text'
      );

    assert.ok(seeMoreButton, 'see more button exists');

    assert.ok(
      seeMoreButton.classList.contains('lt-line-clamp__more'),
      'see more button contains right CSS class'
    );

    assert.strictEqual(
      seeMoreButton.innerText,
      'See More',
      'see more button contains expected text'
    );

    assert.ok(dummyEllipsis, 'dummy ellipsis element exists');

    assert.dom(element).containsText('... See More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(seeLessButton, 'see less button exists');

    assert.dom(element).containsText('See Less');
  });

  test('lines attribute works as expected', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @lines={{2}}
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(
      lines.length,
      2,
      'text is clamped at 2 lines specified by user'
    );

    assert.ok(
      lines
        .slice(0, 1)
        .every((line) => line.innerText.trim().split(' ')[0] === 'helloworld'),
      'first lines contain expected text'
    );

    assert.ok(
      lastLine.classList.contains('lt-line-clamp__line--last'),
      'lt-line-clamp__line--last is applied to last line'
    );

    assert.dom(element).containsText('... See More');
  });

  test('ellipsis attribute works as expected', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @ellipsis="-"
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];

    assert.ok(element, 'line clamp target exists');

    assert.dom(ellipsisElement).hasText('- See More');
    assert.dom(element).containsText('- See More');
  });

  test('interactive=false hides see more button', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @interactive={{false}}
      />
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(
      lineClampElement.length,
      1,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.strictEqual(
      lines.length,
      0,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('useJsOnly=true disables native CSS solution', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @interactive=false
        @useJsOnly=true
      />
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(
      lineClampElement.length,
      0,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.strictEqual(
      lines.length,
      3,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.dom(element).containsText('...');
  });

  test('showMoreButton=false hides see more button', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @showMoreButton={{false}}
      />
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(
      lines.length,
      0,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.strictEqual(
      lineClampElement.length,
      1,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('showLessButton=false hides see less button', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @showLessButton={{false}}
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(element, 'line clamp target exists');

    assert.ok(seeMoreButton, 'see more button exists');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less');

    assert.strictEqual(
      seeLessButton.length,
      0,
      'see less button does not exist'
    );

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('seeMoreText and seeLessText attributes work as expected', async function (assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @seeMoreText="Read More"
        @seeLessText="Read Less"
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(element, 'line clamp target exists');

    assert.ok(
      ellipsisElement,
      'last line child is the ellipsis element and it exists'
    );

    assert.ok(seeMoreButton, 'see more button exists');

    assert.strictEqual(
      seeMoreButton.innerText,
      'Read More',
      'see more button contains expected text'
    );

    assert
      .dom(seeMoreButton)
      .doesNotHaveAttribute(
        'aria-label',
        'see more button does not set aria-label by default'
      );

    assert.dom(element).containsText('... Read More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(seeLessButton, 'see less button exists');

    assert.strictEqual(
      seeLessButton.innerText,
      'Read Less',
      'see less button contains expected text'
    );

    assert
      .dom(seeLessButton)
      .doesNotHaveAttribute(
        'aria-label',
        'see less button does not set aria-label by default'
      );

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld Read Less'
    );
  });

  test('seeMoreA11yText and seeLessA11yText attributes work as expected', async function (assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @seeMoreText="Read More"
        @seeMoreA11yText="A button which expands the content of this text"
        @seeLessText="Read Less"
        @seeLessA11yText="A button which unexpands the content of this text"
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(element, 'line clamp target exists');

    assert.ok(
      ellipsisElement,
      'last line child is the ellipsis element and it exists'
    );

    assert.ok(seeMoreButton, 'see more button exists');

    assert.strictEqual(
      seeMoreButton.innerText,
      'Read More',
      'see more button contains expected text'
    );

    assert
      .dom(seeMoreButton)
      .hasAttribute(
        'aria-label',
        'A button which expands the content of this text',
        'see more button sets aria-label if provided'
      );

    assert.dom(element).containsText('... Read More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(seeLessButton, 'see less button exists');

    assert.strictEqual(
      seeLessButton.innerText,
      'Read Less',
      'see less button contains expected text'
    );

    assert
      .dom(seeLessButton)
      .hasAttribute(
        'aria-label',
        'A button which unexpands the content of this text',
        'see less button sets aria-label if provided'
      );

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld Read Less'
    );
  });

  test('see more button is hidden if text is not long enough to truncate', async function (assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld"
      />
    </div>`);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll(
      '.lt-line-clamp__line .lt-line-clamp__more'
    );

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(
      seeMoreButton.length,
      0,
      'see more button is not needed'
    );

    assert.strictEqual(element.innerText.trim(), 'helloworld helloworld');
  });

  test('clicking see more button toggles full text', async function (assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      />
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(element, 'line clamp target exists');

    assert.ok(seeMoreButton, 'see more button exists');

    assert.dom(element).containsText('... See More');

    await click(seeMoreButton);

    assert
      .dom(element)
      .containsText(
        'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less'
      );
  });

  test('resizing triggers component to re-truncate', async function (assert) {
    assert.expect(5);

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      />
    </div>`);

    const element = this.element;

    assert.ok(element, 'line clamp target exists');

    assert
      .dom('.lt-line-clamp__line .lt-line-clamp__more')
      .exists({ count: 1 }, 'see more button exists');

    assert.dom(element).containsText('... See More');

    // Mimic window resize
    element.querySelector('#test-container').style.width = '960px';
    await triggerEvent(window, 'resize');

    waitForResizeRAF(assert, function () {
      assert.dom('.lt-line-clamp__line .lt-line-clamp__more').doesNotExist();
      assert.strictEqual(
        element.innerText.trim(),
        'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld',
        'text is correct after resize'
      );
    });
  });

  test('When using native CSS clamping, onResize is not called', async function (assert) {
    assert.expect(1);

    const onResizeSpy = sinon.spy();
    this.onResizeSpy = onResizeSpy;

    await render(hbs`
      <div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @useJsOnly={{false}}
          @interactive={{false}}
          @onResizeSpy={{this.onResizeSpy}}
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        />
      </div>
    `);

    waitForResizeRAF(assert, function () {
      assert.strictEqual(onResizeSpy.callCount, 0);
    });
  });

  test('When using native CSS text overflow, onResize is not called', async function (assert) {
    assert.expect(1);

    const onResizeSpy = sinon.spy();
    this.onResizeSpy = onResizeSpy;

    await render(hbs`
      <div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @useJsOnly={{false}}
          @interactive={{false}}
          @lines={{1}}
          @onResizeSpy={{this.onResizeSpy}}
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        />
      </div>
    `);

    waitForResizeRAF(assert, function () {
      assert.strictEqual(onResizeSpy.callCount, 0);
    });
  });

  test('When using JS clamping, onResize is called', async function (assert) {
    assert.expect(1);

    const onResizeSpy = sinon.spy();
    this.onResizeSpy = onResizeSpy;

    await render(hbs`
      <div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @useJsOnly={{true}}
          @onResizeSpy={{this.onResizeSpy}}
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        />
      </div>
    `);

    waitForResizeRAF(assert, function () {
      assert.strictEqual(onResizeSpy.callCount, 1);
    });
  });

  test('clicking see more/see less button fires user defined action', async function (assert) {
    assert.expect(5);

    this.assertOnExpand = () => assert.ok(true, 'onExpand action triggered');
    this.assertOnCollapse = () =>
      assert.ok(true, 'onCollapse action triggered');

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        @onExpand={{this.assertOnExpand}}
        @onCollapse={{this.assertOnCollapse}}
      />
    </div>`);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll(
      '.lt-line-clamp__line .lt-line-clamp__more'
    );

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(seeMoreButton.length, 1, 'see more button exists');

    await click(seeMoreButton[0]);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(seeLessButton, 'see less button exists');

    await click(seeLessButton);
  });

  test('clicking see more/see less buttons should not bubble event', async function (assert) {
    assert.expect(3);

    this.assertOnParentAction = () =>
      assert.ok(true, 'parent action should not be triggered');
    this.assertOnParentClick = () =>
      assert.ok(true, 'parent click action should not be triggered');

    await render(hbs`
      <div
        id="test-container"
        style="width: 300px; font-size: 16px; font-family: sans-serif;"
        {{action this.assertOnParentAction}}
        {{on 'click' this.assertOnParentClick}}
        >
        <LineClamp
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        />
      </div>
    `);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll(
      '.lt-line-clamp__line .lt-line-clamp__more'
    );

    assert.ok(element, 'line clamp target exists');

    assert.strictEqual(seeMoreButton.length, 1, 'see more button exists');

    await click(seeMoreButton[0]);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(seeLessButton, 'see less button exists');

    await click(seeLessButton);
  });

  test("changing the component's text changes the component", async function (assert) {
    assert.expect(2);

    this.textToTruncate =
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld';

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text={{this.textToTruncate}}
      />
    </div>`);

    const element = this.element;

    assert.dom(element).containsText('... See More');

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld');

    assert
      .dom(element)
      .containsText('helloworld helloworld helloworld helloworld');
  });

  test("changing the component's lines changes the component", async function (assert) {
    assert.expect(3);

    this.textToTruncate =
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld';
    this.linesToTruncate = 3;

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text={{this.textToTruncate}}
        @lines={{this.linesToTruncate}}
      />
    </div>`);

    const element = this.element;
    const length = element.innerText.trim().length;
    assert.dom(element).containsText('... See More');

    this.set('linesToTruncate', 2);

    const newLength = element.innerText.trim().length;
    assert.ok(newLength < length);
    assert.dom(element).containsText('... See More');
  });

  test('truncation can be controlled via the truncate attribute', async function (assert) {
    assert.expect(3);

    this.textToTruncate =
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld';
    this.truncate = true;

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text={{this.textToTruncate}}
        @truncate={{this.truncate}}
      />
    </div>`);

    const element = this.element;
    assert.dom(element).containsText('... See More');

    this.set('truncate', false);

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less'
    );

    this.truncate = true;
    assert.dom(element).containsText('... See More');
  });

  test('initial truncation can be controlled via the truncate attribute (false case)', async function (assert) {
    assert.expect(3);

    this.textToTruncate =
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld';
    this.truncate = false;

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @text={{this.textToTruncate}}
        @truncate={{this.truncate}}
      />
    </div>`);

    const element = this.element;
    assert
      .dom(element)
      .containsText(
        'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less'
      );

    this.truncate = false;

    assert
      .dom(element)
      .containsText(
        'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less'
      );

    this.truncate = true;

    assert.dom(element).containsText('... See More');
  });

  test('stripText correctly strips <br> tags', async function (assert) {
    assert.expect(2);

    this.textToTruncate = htmlSafe(
      'helloworld<br />helloworld<br />helloworld<br />helloworld'
    );
    this.truncate = true;
    this.stripText = true;

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @truncate={{this.truncate}}
        @text={{this.textToTruncate}}
        @stripText={{this.stripText}}
      />
    </div>`);

    const element = this.element;
    assert.strictEqual(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld'
    );

    this.set('truncate', false);

    assert.strictEqual(
      element.innerText.trim(),
      `helloworld\nhelloworld\nhelloworld\nhelloworld See Less`
    );
  });

  test('stripText correctly strips preserves newlines when stripText is false', async function (assert) {
    assert.expect(2);

    this.textToTruncate = htmlSafe(
      'helloworld<br />helloworld<br />helloworld<br />helloworld'
    );
    this.truncate = true;
    this.stripText = false;

    await render(hbs`<div id="test-container" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      <LineClamp
        @truncate={{this.truncate}}
        @text={{this.textToTruncate}}
        @stripText={{this.stripText}}
      />
    </div>`);

    const element = this.element;
    assert.dom(element).containsText('... See More');

    this.set('truncate', false);

    assert.strictEqual(
      element.innerText.trim(),
      'helloworld\nhelloworld\nhelloworld\nhelloworld See Less'
    );
  });

  test('null/undefined text handled correctly', async function (assert) {
    assert.expect(2);

    this.textToTruncate = null;
    this.truncate = true;

    await render(hbs`
      <LineClamp
        @truncate={{this.truncate}}
        @text={{this.textToTruncate}}
      />`);

    const element = this.element;
    assert.strictEqual(element.innerText.trim(), '');

    this.textToTruncate = undefined;

    assert.strictEqual(element.innerText.trim(), '');
  });

  test('[A11y] aria-expanded is correct', async function (assert) {
    assert.expect(3);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
          @lines={{1}}
        />
      </div>`);

    assert
      .dom('[data-test-line-clamp-show-more-button]')
      .hasAttribute('aria-expanded', 'false');

    await click('[data-test-line-clamp-show-more-button]');

    assert
      .dom('[data-test-line-clamp-show-less-button]')
      .hasAttribute('aria-expanded', 'true');

    await click('[data-test-line-clamp-show-less-button]');

    assert
      .dom('[data-test-line-clamp-show-more-button]')
      .hasAttribute('aria-expanded', 'false');
  });

  test('[A11y] button is correctly focused after expanding/collapsing', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
          @lines={{1}}
        />
      </div>`);

    await click('[data-test-line-clamp-show-more-button]');

    assert
      .dom('[data-test-line-clamp-show-less-button]')
      .isFocused('show less button is focused');

    await click('[data-test-line-clamp-show-less-button]');

    assert
      .dom('[data-test-line-clamp-show-more-button]')
      .isFocused('show more button is focused');
  });

  test('tag name is <div> by default', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @text="helloworld helloworld helloworld"
        />
      </div>`);

    assert.dom('[data-test-line-clamp]').hasTagName('div');
  });

  test('tag name is able to be changed', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        <LineClamp
          @text="helloworld helloworld helloworld"
          @tagName="p"
        />
      </div>`);

    assert.dom('[data-test-line-clamp]').hasTagName('p');
  });
});
