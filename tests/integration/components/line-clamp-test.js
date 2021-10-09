import { hbs } from 'ember-cli-htmlbars';
import { htmlSafe } from '@ember/string';
import { module, test, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';

module('Integration | Component | line clamp', function(hooks) {
  setupRenderingTest(hooks);

  test('inline form works as expected', async function(assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];
    const dummyEllipsis = element.querySelectorAll('.lt-line-clamp--dummy');

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      lines.length,
      3,
      'text is clamped at 3 lines (default)'
    );

    // This test a bit flaky, depends on the width of div and knowing 'helloworld helloworld' will be a line
    // assert.ok(
    //   lines.slice(0,2)
    //     .every((line) => line.innerText.trim() === 'helloworld helloworld'),
    //   'first lines contain expected text'
    // );

    // This is a better test since we know the truncation will push 'helloworld' to a new line if it does not fit
    assert.ok(
      lines.slice(0,2)
        .every((line) => line.innerText.trim().split(' ')[0] === 'helloworld'),
      'first lines contain expected text'
    );

    assert.ok(
      lastLine.classList.contains('lt-line-clamp__line--last'),
      'lt-line-clamp__line--last is applied to last line'
    );

    assert.equal(
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

    assert.dom(ellipsisElement).hasText('... See More', 'Ellipsis element contains expetend ellipsis and see more text');

    assert.ok(
      seeMoreButton,
      'see more button exists'
    );

    assert.ok(
      seeMoreButton.classList.contains('lt-line-clamp__more'),
      'see more button contains right CSS class'
    );

    assert.equal(
      seeMoreButton.innerText,
      'See More',
      'see more button contains expected text'
    );

    assert.ok(
      dummyEllipsis,
      'dummy ellipsis element exists'
    );

    assert.dom(element).containsText('... See More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(
      seeLessButton,
      'see less button exists'
    );

    assert.dom(element).containsText('See Less');
  });

  test('lines attribute works as expected', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        lines=2
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      lines.length,
      2,
      'text is clamped at 2 lines specified by user'
    );

    assert.ok(
      lines.slice(0,1)
        .every((line) => line.innerText.trim().split(' ')[0] === 'helloworld'),
      'first lines contain expected text'
    );

    assert.ok(
      lastLine.classList.contains('lt-line-clamp__line--last'),
      'lt-line-clamp__line--last is applied to last line'
    );

    assert.dom(element).containsText('... See More');

  });

  test('ellipsis attribute works as expected', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        ellipsis="-"
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.dom(ellipsisElement).hasText('- See More');
    assert.dom(element).containsText('- See More');
  });

  test('interactive=false hides see more button', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        interactive=false
      }}
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      lineClampElement.length,
      1,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.equal(
      lines.length,
      0,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('useJsOnly=true disables native CSS solution', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        interactive=false
        useJsOnly=true
      }}
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      lineClampElement.length,
      0,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.equal(
      lines.length,
      3,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.dom(element).containsText('...');
  });

  test('showMoreButton=false hides see more button', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        showMoreButton=false
      }}
    </div>`);

    // We are running in headless chrome - it supports -webkit-line-clamp
    const element = this.element;
    const lineClampElement = element.querySelectorAll('.lt-line-clamp');
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      lines.length,
      0,
      'No truncation happen, we use -webkit-line-clamp'
    );

    assert.equal(
      lineClampElement.length,
      1,
      'element fallbacks to -webkit-line-clamp'
    );

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('showLessButton=false hides see less button', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        showLessButton=false
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.ok(
      seeMoreButton,
      'see more button exists'
    );

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less');

    assert.equal(
      seeLessButton.length,
      0,
      'see less button does not exist'
    );

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    );
  });

  test('seeMoreText and seeLessText attributes work as expected', async function(assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        seeMoreText="Read More"
        seeLessText="Read Less"
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.ok(
      ellipsisElement,
      'last line child is the ellipsis element and it exists'
    );

    assert.ok(
      seeMoreButton,
      'see more button exists'
    );

    assert.equal(
      seeMoreButton.innerText,
      'Read More',
      'see more button contains expected text'
    );

    assert.dom(seeMoreButton).doesNotHaveAttribute('aria-label', 'see more button does not set aria-label by default');

    assert.dom(element).containsText('... Read More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(
      seeLessButton,
      'see less button exists'
    );

    assert.equal(
      seeLessButton.innerText,
      'Read Less',
      'see less button contains expected text'
    );

    assert.dom(seeLessButton).doesNotHaveAttribute('aria-label', 'see less button does not set aria-label by default');

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld Read Less'
    );
  });

  test('seeMoreA11yText and seeLessA11yText attributes work as expected', async function(assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        seeMoreText="Read More"
        seeMoreA11yText="A button which expands the content of this text"
        seeLessText="Read Less"
        seeLessA11yText="A button which unexpands the content of this text"
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.ok(
      ellipsisElement,
      'last line child is the ellipsis element and it exists'
    );

    assert.ok(
      seeMoreButton,
      'see more button exists'
    );

    assert.equal(
      seeMoreButton.innerText,
      'Read More',
      'see more button contains expected text'
    );

    assert.dom(seeMoreButton).hasAttribute('aria-label', 'A button which expands the content of this text', 'see more button sets aria-label if provided');

    assert.dom(element).containsText('... Read More');

    await click(seeMoreButton);

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(
      seeLessButton,
      'see less button exists'
    );

    assert.equal(
      seeLessButton.innerText,
      'Read Less',
      'see less button contains expected text'
    );

    assert.dom(seeLessButton).hasAttribute('aria-label', 'A button which unexpands the content of this text', 'see less button sets aria-label if provided');

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld Read Less'
    );
  });

  test('see more button is hidden if text is not long enough to truncate', async function(assert) {
    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld"
      }}
    </div>`);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      seeMoreButton.length,
      0,
      'see more button is not needed'
    );

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld'
    );
  });

  test('clicking see more button toggles full text', async function(assert) {
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      }}
    </div>`);

    const element = this.element;
    const lines = Array.from(element.querySelectorAll('.lt-line-clamp__line'));
    const lastLine = lines[lines.length - 1];
    const lastLineChildren = lastLine.children;
    const ellipsisElement = lastLineChildren[0];
    const seeMoreButton = ellipsisElement.children[1];

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.ok(
      seeMoreButton,
      'see more button exists'
    );

    assert.dom(element).containsText('... See More');

    await click(seeMoreButton);

    assert.dom(element).containsText('helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less');
  });

  skip('resizing triggers component to re-truncate', async function(assert) {
    assert.expect(4);
    const done = assert.async();

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
      }}
    </div>`);

    const element = this.element;
    const seeMoreButtonBeforeResize = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      seeMoreButtonBeforeResize.length,
      1,
      'see more button exists'
    );

    assert.dom(element).containsText('... See More')

    // Mimic window resize
    element.querySelector('#test-conatiner').style.width = '960px';
    window.dispatchEvent(new CustomEvent('resize'));

    setTimeout(() => {
      const seeMoreButtonAfterResize = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

      assert.equal(
        seeMoreButtonAfterResize.length,
        0,
        'see more button does not exist'
      );

      done();
    }, 10);
    // const seeMoreButtonAfterResize = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

    // assert.equal(
    //   seeMoreButtonAfterResize.length,
    //   0,
    //   'see more button does not exist'
    // );

    // assert.equal(
    //   element.innerText.trim(),
    //   'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld'
    // );
  });

  test('clicking see more/see less button fires user defined action', async function(assert) {
    assert.expect(5);

    this.set('assertOnExpand', () => assert.ok(true, 'onExpand action triggered'));
    this.set('assertOnCollapse', () => assert.ok(true, 'onCollapse action triggered'));

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        onExpand=(action assertOnExpand)
        onCollapse=assertOnCollapse
      }}
    </div>`);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      seeMoreButton.length,
      1,
      'see more button exists'
    );

    seeMoreButton[0].click();

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(
      seeLessButton,
      'see less button exists'
    );

    await click(seeLessButton);
  });

  test('clicking see more/see less buttons should not bubble event', async function(assert) {
    assert.expect(3);

    this.set('assertOnParentAction', () => assert.ok(true, 'parent action should not be triggered'));
    this.set('assertOnParentClick', () => assert.ok(true, 'parent click action should not be triggered'));

    await render(hbs`
      <div
        id="test-conatiner"
        style="width: 300px; font-size: 16px; font-family: sans-serif;"
        {{action assertOnParentAction}}
        onclick={{action assertOnParentClick}}
        >
        {{line-clamp
          text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        }}
      </div>
    `);

    const element = this.element;
    const seeMoreButton = element.querySelectorAll('.lt-line-clamp__line .lt-line-clamp__more');

    assert.ok(
      element,
      'line clamp target exists'
    );

    assert.equal(
      seeMoreButton.length,
      1,
      'see more button exists'
    );

    seeMoreButton[0].click();

    const seeLessButton = element.querySelectorAll('.lt-line-clamp__less')[0];

    assert.ok(
      seeLessButton,
      'see less button exists'
    );

    await click(seeLessButton);
  });

  test('changing the component\'s text changes the component', async function(assert) {
    assert.expect(2);

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld');

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text=textToTruncate
      }}
    </div>`);

    const element = this.element;

    assert.dom(element).containsText('... See More');

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld');

    assert.dom(element).containsText('helloworld helloworld helloworld helloworld');
  });

  test('changing the component\'s lines changes the component', async function(assert) {
    assert.expect(3);

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld');
    this.set('linesToTruncate', 3);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text=textToTruncate
        lines=linesToTruncate
      }}
    </div>`);

    const element = this.element;
    const length = element.innerText.trim().length;
    assert.dom(element).containsText('... See More');

    this.set('linesToTruncate', 2);

    const newLength = element.innerText.trim().length;
    assert.ok(newLength < length);
    assert.dom(element).containsText('... See More');
  });

  test('truncation can be controlled via the truncate attribute', async function(assert) {
    assert.expect(3);

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld');
    this.set('truncate', true);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text=textToTruncate
        truncate=truncate
      }}
    </div>`);

    const element = this.element;
    assert.dom(element).containsText('... See More');

    this.set('truncate', false);

    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less'
    );

    this.set('truncate', true);
    assert.dom(element).containsText('... See More');
  });

  test('initial truncation can be controlled via the truncate attribute (false case)', async function (assert) {
    assert.expect(3);

    this.set('textToTruncate', 'helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld');
    this.set('truncate', false);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text=textToTruncate
        truncate=truncate
      }}
    </div>`);

    const element = this.element;
    assert.dom(element).containsText('helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less');

    this.set('truncate', false);

    assert.dom(element).containsText('helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld See Less');

    this.set('truncate', true);

    assert.dom(element).containsText('... See More');
  });

  test('stripText correctly strips <br> tags', async function(assert) {
    assert.expect(2);

    this.set('textToTruncate', htmlSafe('helloworld<br />helloworld<br />helloworld<br />helloworld'));
    this.set('truncate', true);
    this.set('stripText', true);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        truncate=truncate
        text=textToTruncate
        stripText=stripText
      }}
    </div>`);

    const element = this.element;
    assert.equal(
      element.innerText.trim(),
      'helloworld helloworld helloworld helloworld'
    );

    this.set('truncate', false);

    assert.equal(
      element.innerText.trim(),
      `helloworld\nhelloworld\nhelloworld\nhelloworld See Less`
    );
  });

  test('stripText correctly strips preserves newlines when stripText is false', async function(assert) {
    assert.expect(2);

    this.set('textToTruncate', htmlSafe('helloworld<br />helloworld<br />helloworld<br />helloworld'));
    this.set('truncate', true);
    this.set('stripText', false);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        truncate=truncate
        text=textToTruncate
        stripText=stripText
      }}
    </div>`);

    const element = this.element;
    assert.dom(element).containsText('... See More');

    this.set('truncate', false);

    assert.equal(element.innerText.trim(), 'helloworld\nhelloworld\nhelloworld\nhelloworld See Less')
  });

  test('null/undefined text handled correctly', async function(assert) {
    assert.expect(2);

    this.set('textToTruncate', null);
    this.set('truncate', true);

    await render(hbs`
      {{line-clamp
        truncate=truncate
        text=textToTruncate
      }}`);

    const element = this.element;
    assert.equal(
      element.innerText.trim(),
      ''
    );

    this.set('textToTruncate', undefined);

    assert.equal(
      element.innerText.trim(),
      ''
    );
  });

  test('[A11y] aria-expanded is correct', async function(assert) {
    assert.expect(3);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        {{line-clamp
          text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
          lines=1
        }}
      </div>`
    );

    assert.dom('[data-test-line-clamp-show-more-button]').hasAttribute('aria-expanded', "false");

    await click('[data-test-line-clamp-show-more-button]');

    assert.dom('[data-test-line-clamp-show-less-button]').hasAttribute('aria-expanded', "true");

    await click('[data-test-line-clamp-show-less-button]');

    assert.dom('[data-test-line-clamp-show-more-button]').hasAttribute('aria-expanded', "false");
  });

  test('[A11y] button is correctly focused after expanding/collapsing', async function(assert) {
    assert.expect(2);

    await render(hbs`
      <div style="width: 300px; font-size: 16px; font-family: sans-serif;">
        {{line-clamp
          text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
          lines=1
        }}
      </div>`
    );

    await click('[data-test-line-clamp-show-more-button]');

    assert.dom('[data-test-line-clamp-show-less-button]').isFocused('show less button is focused');

    await click('[data-test-line-clamp-show-less-button]');

    assert.dom('[data-test-line-clamp-show-more-button]').isFocused('show more button is focused');
  });

  test('text suffix works as expected', async function (assert) {
    assert.expect(3);

    // Render component
    await render(hbs`<div style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        lines=2
        textSuffix="#ID-001"
      }}
    </div>`);

    const element = this.element;
    const suffixElement = element.querySelector('.lt-line-clamp__suffix');

    assert.ok(element, 'line clamp target exists');
    assert.dom(suffixElement).hasText('#ID-001');
    assert.dom(element).containsText('#ID-001');
  });

  test('\'forceEvaluate\' flag re-triggers the width computation works as expected', async function (assert) {
    assert.expect(4);
    const done = assert.async();

    this.set('forceEvaluate', false);

    await render(hbs`<div id="test-conatiner" style="width: 300px; font-size: 16px; font-family: sans-serif;">
      {{line-clamp
        text="helloworld helloworld helloworld helloworld helloworld helloworld helloworld helloworld"
        lines=3
        forceEvaluate=forceEvaluate
      }}
    </div>`);

    const element = this.element;
    const linesExceptLast = Array.from(
      element.querySelectorAll(
        ".lt-line-clamp__line:not(.lt-line-clamp__line--last)"
      ));
    const contentLengthBefore = linesExceptLast.map(e => e.innerText).join().length;

    assert.ok(element, 'line clamp target exists');
    assert.equal(contentLengthBefore, 43);

    // Force evaluate after width changes in the parent container
    element.querySelector('#test-conatiner').style.width = '200px';
    this.set('forceEvaluate', true);

    setTimeout(() => {
      const linesExceptLast = Array.from(
        element.querySelectorAll(
          ".lt-line-clamp__line:not(.lt-line-clamp__line--last)"
        ));
      const contentLengthAfter = linesExceptLast.map(e => e.innerText).join().length;

      assert.notDeepEqual(contentLengthBefore, contentLengthAfter);
      assert.equal(contentLengthAfter, 21);

      done();
    }, 100);
  });

})
