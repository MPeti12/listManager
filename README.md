<p>
    <h2 align='center'>Infinitely nesteble, drag and drop</h2>
</p>

<p align='center'><img width="250" height="500" alt="" src="/images/nestedList.gif" /></p>

## ✨ Features
- Item transformation between horizontal and vertical lists:
    - Uneven sized item are supported
- Horizontal, vertical, grid layouts
- Shared lists
- Item handle, filter
- Ghost snap-back animation
- Auto-scroll
- Hooks: `onStart`, `onListChange`, `onSwap`, `onEnd`, `onSBA`

## Nesting
Only available in vertical and horizontal layout types.

## Hooks
- `onStart` runs on the source list
- `onSwap` runs on the current list when items positions are swapped
- `onListChange` runs on both lists affected by a change (lm1 and lm2)
- `onEnd` runs on the list where the drop occurred
    - `onSBA` SnapBackAnimation(event, time)
    - runs on each frame of the animation
    - time: starts at 0, ends with 1

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
- `ease-in` 
- `ease-out` 
- `ease-in-out` 

## Stlye
Add `box-sizing: border-box;`  to the list items, and sublists.<br/>
This prevent jittering created by paddings, margins;

## Defaults
```js
const listEl = getListElement();

const lm = new listManager(listEl, {
    layout: 'grid',
    snapBack: false,
    animation: {
        type: 'ease-in',
        duration: 300,
        exponent: 3
    },
    scroll: {
        enable: true,
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
const listEl = document.querySelector('ul');

const lm = new listManager(listEl, {
    layout: 'vertical',
    handle: 'app-icon, app-icon *',//If u click on a containing element, the handle wont work unless u add 'ELEMENT *'
    filter: 'li[filtered], li[filtered] *',
    share: 'app-group-1',
    snapBack: true,
    animation: {
        type: 'ease-in',
        duration: 300,
        exponent: 3
    },
    scroll: {
        speed: 7,
        threshold: 100
    }
});

lm.onStart = e => console.log('start', e);
lm.onListChange = e => console.log(e);
lm.onSwap = e => console.log(e);
lm.onEnd = e => console.log(e);
lm.onSBA = (e, time) => {
	e.dragged.el.style.background = `hsl(0, ${100 - (time * 100)}%, 50%)`;
	e.ghost.el.style.opacity = `${1 - time}`;

    if (t === 1) {//when the animation ends u can remove it
        e.dragged.el.removeAttribute('style');
    }
}
```
