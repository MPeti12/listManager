<p>
  <h2 align='center'>Infinitely nesteble, drag and drop</h2>
</p>

<p align='center'><img width="250" height="500" alt="" src="/images/nestedList.gif" /></p>

## Features
  - Shared lists
  - Vertical, horizontal, grid layouts
  - Item handle, filter
  - Ghost snap-back animation
  - Auto-scroll
  - Hooks: onStart, onListChange, onSwap, onEnd

## Nesting
Only available in vertical and horizontal layout types.

## Hooks
- `onListChange` runs on both lists affected by a change (lm1 and lm2)
- `onEnd` runs on the list where the drop occurred

Event object:
```js
source: {
    items: {
        flat: [],
        tree: [],
    },
    el: HTMLElement
},
target: {
    items: {
        flat: [],
        tree: [],
    },
    el: HTMLElement
},
dragged: {
    el: HTMLElement,
    rect: DOMRect,
    offset: {
        X: Number,
        Y: Number
    },
    C: {//Center
        X: Number,
        Y: Number
    }
},
ghost: {
    el: HTMLElement,
    top: Number,
    left: Number,
    C: {//Center
        X: Number,
        Y: Number
    }
}
```

## Animation
- ease-in
- ease-out
- ease-in-out

## Stlye
Add box-sizing: border-box to the list items, and sublists.

## Defaults
```js
  const list = getList();

  const lm = new listManager(list, {
    layout: 'grid',
    snapBack: false,
    animation: {
      type: 'ease-in',
      duration: 300,
      exponent: 3
    },
    scroll: {
      speed: 5,
      threshold: 75
    }
  });
```

## Example
```html
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <ul sublist><!--Mark sublist elements with 'sublist' attribute!-->
            <li>Sublist item 1</li>
            <li>Sublist item 2</li>
            <li>Sublist item 3</li>
            <ul sublist>
                <li>1</li>
                <li>2</li>
                <li>3</li>
            </ul>
        </ul>
        <li>Item 3</li>
    </ul>
```

```js
  const list = getList();

  const lm = new listManager(list, {
    layout: 'vertical',
    handle: 'app-icon, app-icon *', //Select the element and its childrens
    filter: 'li[filtered], li[filtered] *',
    share: 'app-list-group-1',
    snapBack: true,
    animation: {
      type: 'ease-in',
      duration: 300,
      exponent: 3
    },
    scroll: {
      speed: 10,
      threshold: 100
    }
  });

  lm.onStart = e => console.log('start', e);
  lm.onListChange = e => console.log(e);
  lm.onSwap = e => console.log(e);
  lm.onEnd = e => console.log(e);
```
