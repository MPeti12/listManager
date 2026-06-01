<p>
  <h2 align='center'>Infinitely nesteble, drag and drop</h2>
</p>

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

## Example Options
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

  lm.onStart = () => console.log('start');
  lm.onListChange = () => {};
  lm.onSwap = () => {};
  lm.onEnd = () => {};
```
