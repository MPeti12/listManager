listManager.share = {
	lists: []
};

listManager.animation = {
	type: 'ease-in',
	exponent: 3,
	duration: 300,
	method: {
		'ease-in': (t, exponent) => 1 - Math.pow(1 - t, exponent),
		'ease-out': (t, exponent) => Math.pow(t, exponent),
		'ease-in-out': (t, exponent) => 1 - Math.pow(1 - t / 2, exponent) + Math.pow(t / 2, exponent)
	}
};

listManager.scroll = {
	speed: 5,
	threshold: 75
};

listManager.start = function(e, list, ctx) {
	if (e.which !== 1) return;
	if (list.handle && !e.target.matches(list.handle)) return;

	ctx.source = list;
	ctx.target = list;
	ctx.cache.target = list;

	const { dragged, ghost } = ctx;

	if (dragged.el) {
		dragged.el.removeAttribute('dragged');
		dragged.el = null;
	}

	if (ghost.el) {
		cancelAnimationFrame(ghost.raf);
		ghost.raf = null;
		ghost.el.remove();
	}

	list.getFlat(ctx);

	for (const el of list.cache.flat) {
		if (el.contains(e.target)) dragged.el = el;
	}

	if (!dragged.el || dragged.el.hasAttribute('ghost')) return;
	if (list.filter && dragged.el.matches(list.filter)) return;

	dragged.rect = dragged.el.getBoundingClientRect();

	ctx.ghost.create();

	dragged.el.setAttribute('dragged', '');

	ctx.buildPayload();
	list.hook.onStart(ctx.payload);

	dragged.offset.X = e.clientX - dragged.rect.left;
	dragged.offset.Y = e.clientY - dragged.rect.top;

	listManager.move(e, list, ctx);

	ctx.pointer.down = true;
	listManager.scroll.handler(ctx);

	ctx.onMove = e => listManager.move(e, list, ctx);
	ctx.onRemoveHandler = () => listManager.removeHandler(ctx, list);
	document.addEventListener('pointermove', ctx.onMove);
	document.addEventListener('pointerup', ctx.onRemoveHandler);
}

listManager.move = function(e, list, ctx) {
	e.stopPropagation();
	const { ghost, dragged } = ctx;

	ghost.top = e.clientY - dragged.offset.Y;
	ghost.left = e.clientX - dragged.offset.X;

	ghost.el.style.position = `fixed`;
	ghost.el.style.top = `${ghost.top}px`;
	ghost.el.style.left = `${ghost.left}px`;

	ghost.C.Y = ghost.top + dragged.rect.height / 2;
	ghost.C.X = ghost.left + dragged.rect.width / 2;

	dragged.C.Y = dragged.rect.top + dragged.rect.height / 2;
	dragged.C.X = dragged.rect.left + dragged.rect.width / 2;

	if (list.share) listManager.getList(list, ctx);
	else {
		if (list.animation.scheduled) return;
		if (scroll.ing) return;
		if (list.layout === 'grid') listManager.engie.grid.handler(ctx);
		if (list.layout === 'horizontal') listManager.engie.uneven(ctx);
		if (list.layout === 'vertical') listManager.engie.uneven(ctx);
	}
}

listManager.getList = function(list, ctx) {
	const { dragged, ghost } = ctx;
	let shareList;

	for (const i of listManager.share.lists) {
		const rect = i.el.getBoundingClientRect();

		if (list.share !== i.share) continue;

		if (ghost.C.X >= rect.left &&
			ghost.C.X <= rect.right &&
			ghost.C.Y >= rect.top &&
			ghost.C.Y <= rect.bottom) {

			shareList = i;
			break;
		}
	}

	if (shareList) {
		ctx.target = shareList;
		ctx.cache.target = shareList;
	} else {
		ctx.target = null;
		return;
	}

	if (dragged.el === ctx.target.el) return;

	if (!ctx.source.el.isSameNode(ctx.target.el)) {
		if (ctx.source.animation.scheduled) return;
		if (ctx.target.animation.scheduled) return;

		listManager.animation.cancel(ctx.source);
		listManager.animation.cancel(ctx.target);

		let listA = listManager.animation.capture(ctx, ctx.source.el);
		listA = listA.filter(i => !i.el.isSameNode(dragged.el));

		let listB = listManager.animation.capture(ctx, ctx.target.el);

		const target = listB.reduce((acc, i, index) => {
			const rect = i.from;
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;

			const dx = cx - ghost.C.X;
			const dy = cy - ghost.C.Y;
			const squared = dx * dx + dy * dy;

			if (!acc || acc.squared > squared) {
				return {
					squared,
					rect,
					el: i.el,
					index
				};
			}

			return acc;
		}, null);

		listB.push({
			el: dragged.el,
			from: dragged.el.getBoundingClientRect()
		});

		if (list.layout === 'grid' && target) {
			if (listB[listB.length - 2].el.isSameNode(target.el)) {
				target.el.after(dragged.el);
			} else {
				target.el.before(dragged.el);
			}
			listManager.engie.grid.getPositions(ctx);
		}

		if (list.layout === 'vertical' && target) {
			if (ghost.C.Y > target.rect.top + target.rect.height / 2) {
				target.el.after(dragged.el);
			} else {
				target.el.before(dragged.el);
			}
		}

		if (list.layout === 'horizontal' && target) {
			if (ghost.C.X > target.rect.left + target.rect.width / 2) {
				target.el.after(dragged.el);
			} else {
				target.el.before(dragged.el);
			}
		}

		if (!target) drag.target.el.append(dragged.el);

		ctx.buildPayload();
		ctx.source.hook.onListChange(ctx.payload);
		ctx.target.hook.onListChange(ctx.payload);

		let treeA = ctx.source.cache.tree;
		let treeB = ctx.target.getTree(ctx);

		listManager.animation.run(listA, treeA, ctx.source, ctx);
		listManager.animation.run(listB, treeB, ctx.target, ctx);

		ctx.source = ctx.target;

		return;
	}

	if (ctx.target.animation.scheduled) return;
	if (scroll.ing) return;
	if (ctx.target.layout === 'grid') listManager.engie.grid.handler(ctx);
	if (ctx.target.layout === 'horizontal') listManager.engie.uneven(ctx);
	if (ctx.target.layout === 'vertical') listManager.engie.uneven(ctx);
}

listManager.engie = {};
listManager.utility = {};

listManager.utility.swap = function(ctx, event, el) {
	const { target, dragged } = ctx;
	listManager.animation.cancel(target);
	const items = listManager.animation.capture(ctx, target.el);

	if (event === 'before') el.before(dragged.el);
	if (event === 'after') el.after(dragged.el);
	if (event === 'append') el.append(dragged.el);

	target.getTree(ctx);
	listManager.animation.run(items, target.cache.tree, target, ctx);

	ctx.buildPayload();
	target.hook.onSwap(ctx.payload);
}

listManager.engie.uneven = function(ctx) {
	const { target, ghost, dragged } = ctx;

	const isVertical = target.layout === 'vertical';
	const ghostC = isVertical ? ghost.C.Y : ghost.C.X;

	let prev = {}, next = {}, parent = {};

	prev.el = dragged.el.previousElementSibling;
	next.el = dragged.el.nextElementSibling;

	parent.el = dragged.el.parentElement;
	parent.rect = parent.el.getBoundingClientRect();

	if (isVertical && !parent.el.isSameNode(target.el)) {

		if (parent.rect.top > ghostC && !prev.el) {
			return listManager.utility.swap(ctx, 'before', parent.el);
		}

		if (parent.rect.bottom < ghostC && !next.el) {
			if (parent.el.hasAttribute('ghost')) return;
			return listManager.utility.swap(ctx, 'after', parent.el);
		}
	}

	if (!isVertical && !parent.el.isSameNode(target.el)) {
		if (parent.rect.left > ghostC && !prev.el) {
			return listManager.utility.swap(ctx, 'before', parent.el);
		}

		if (parent.rect.right < ghostC && !next.el) {
			if (parent.el.hasAttribute('ghost')) return;
			return listManager.utility.swap(ctx, 'after', parent.el);
		}
	}

	if (next.el?.hasAttribute('ghost')) next.el = null;

	prev.rect = prev.el?.getBoundingClientRect();
	next.rect = next.el?.getBoundingClientRect();

	if (prev.el) {
		if (isVertical && prev.el.hasAttribute('sublist') &&
			prev.rect.bottom > ghostC) {

			if (prev.el.children.length !== 0) {
				prev.el = prev.el.children[prev.el.children.length - 1];
				return listManager.utility.swap(ctx, 'before', prev.el);
			} else {
				return listManager.utility.swap(ctx, 'append', prev.el);
			}
		}

		if (!isVertical && prev.el.hasAttribute('sublist') &&
			prev.rect.right > ghostC) {

			if (prev.el.children.length !== 0) {
				prev.el = prev.el.children[prev.el.children.length - 1];
				return listManager.utility.swap(ctx, 'before', prev.el);
			} else {
				return listManager.utility.swap(ctx, 'append', prev.el);
			}
		}

		prev.C = isVertical ?
			prev.rect.top + prev.rect.height / 2 :
			prev.rect.left + prev.rect.width / 2;

		if (ghostC < prev.C) return listManager.utility.swap(ctx, 'before', prev.el);
	}

	if (next.el) {
		if (isVertical && next.el.hasAttribute('sublist') &&
			next.rect.top < ghostC) {

			if (next.el.children.length !== 0) {
				next.el = next.el.children[0];
				return listManager.utility.swap(ctx, 'before', next.el);
			} else {
				return listManager.utility.swap(ctx, 'append', next.el);
			}
		}

		if (!isVertical && next.el.hasAttribute('sublist') &&
			next.rect.left < ghostC) {

			if (next.el.children.length !== 0) {
				next.el = next.el.children[0];
				return listManager.utility.swap(ctx, 'before', next.el);
			} else {
				return listManager.utility.swap(ctx, 'append', next.el);
			}
		}

		next.C = isVertical ?
			next.rect.top + next.rect.height / 2 :
			next.rect.left + next.rect.width / 2;

		if (ghostC > next.C) return listManager.utility.swap(ctx, 'after', next.el);
	}
}

listManager.engie.grid = {};

listManager.engie.grid.getPositions = function(ctx) {
	ctx.target.getFlat(ctx);

	this.positions = ctx.target.cache.flat.map(i => {
		const rect = i.getBoundingClientRect();

		return {
			cx: rect.left + rect.width / 2,
			cy: rect.top + rect.height / 2
		};
	});
}

listManager.engie.grid.handler = function(ctx) {
	const { ghost, dragged } = ctx;
	if (!this.positions) this.getPositions(ctx);

	const closest = this.positions.reduce((acc, i, index) => {
		const dx = i.cx - ghost.C.X;
		const dy = i.cy - ghost.C.Y;
		const squared = dx * dx + dy * dy;

		if (!acc || acc.squared > squared) {
			return {
				squared,
				index
			};
		}

		return acc;
	}, null);

	dragged.index = ctx.target.cache.flat.findIndex(i => i.isSameNode(dragged.el));

	if (dragged.index === closest.index) return;

	const item = ctx.target.cache.flat[closest.index];
	if (!item || item.isSameNode(dragged.el)) return;

	if (dragged.index > closest.index) {
		listManager.utility.swap(ctx, 'before', item);
		this.getPositions(ctx);
	} else {
		listManager.utility.swap(ctx, 'after', item);
		this.getPositions(ctx);
	}
}

listManager.animation.cancel = function(list) {
	if (list.animation.raf !== null) {
		cancelAnimationFrame(list.animation.raf);
		list.animation.raf = null;
	}
}

listManager.animation.capture = function(ctx, el) {
	const items = [];

	const nextLayer = el => {
		[...el.children].forEach(i => {
			if (i.isSameNode(ctx.ghost.el)) return;
			items.push({
				el: i,
				from: i.getBoundingClientRect()
			});

			if (i.hasAttribute('sublist')) nextLayer(i);
		});
	}

	nextLayer(el);
	return items;
}

listManager.animation.run = function(items, tree, list, ctx) {
	list.animation.scheduled = true;

	items.forEach(i => {
		i.el.style.transform = '';
		i.el.style.minHeight = '';
		i.el.style.maxHeight = '';
		i.el.style.minWidth = '';
		i.el.style.maxWidth = '';
	});

	requestAnimationFrame(() => {
		const nextLayer = tree => {
			return tree.reduce((acc, i) => {
				let item = items.find(ai => ai.el.isSameNode(i.el));
				if (!item) return acc;
				let children;

				if (i.children && i.children.length !== 0) children = nextLayer(i.children);
				else children = i.children;

				if (i.el.isSameNode(ctx.dragged.el)) ctx.dragged.rect = i.el.getBoundingClientRect();

				let obj = {
					el: i.el,
					from: item.from,
					to: i.el.getBoundingClientRect(),
				};

				if (children) obj.children = children;

				acc.push(obj)
				return acc;
			}, []);
		}

		let animatableTree = nextLayer(tree);

		listManager.animation.play(animatableTree, list);
	});
}

listManager.animation.play = function(items, list) {
	function tranform(items, offsetX, offsetY) {
		let offsetHeight = 0, offsetWidth = 0;

		items.forEach(({ el, from, to, children }) => {
			const dx = from.left - to.left - offsetX + offsetWidth;
			const dy = from.top - to.top - offsetY + offsetHeight;

			if (children) tranform(
				children,
				offsetX + dx - offsetWidth,
				offsetY + dy - offsetHeight
			);

			if (list.layout === 'horizontal') offsetWidth += to.width - from.width;
			if (list.layout === 'vertical') offsetHeight += to.height - from.height;

			el.style.transform = `translate(${dx}px, ${dy}px)`;
			el.style.minHeight = `${from.height}px`;
			el.style.maxHeight = `${from.height}px`;
			el.style.minWidth = `${from.width}px`;
			el.style.maxWidth = `${from.width}px`;
		});
	}
	tranform(items, 0, 0);

	const start = performance.now();
	const duration = list.animation.duration ?? listManager.animation.duration;
	const type = list.animation.type ?? listManager.animation.type;
	const exponent = list.animation.exponent ?? listManager.animation.exponent;

	const step = time => {
		const t = Math.min((time - start) / duration, 1);
		const eased = listManager.animation.method[type](t, exponent);

		function tranform(items, offsetX, offsetY) {
			let offsetHeight = 0, offsetWidth = 0;

			items.forEach(({ el, from, to, children }) => {
				const dx = from.left - to.left - offsetX + offsetWidth;
				const dy = from.top - to.top - offsetY + offsetHeight;

				if (children) tranform(
					children,
					offsetX + dx - offsetWidth,
					offsetY + dy - offsetHeight
				);

				const dwidth = to.width - from.width;
				const dheight = to.height - from.height;

				if (list.layout === 'horizontal') offsetWidth += to.width - from.width;
				if (list.layout === 'vertical') offsetHeight += to.height - from.height;

				const x = dx * (1 - eased);
				const y = dy * (1 - eased);
				const height = to.height - dheight * (1 - eased);
				const width = to.width - dwidth * (1 - eased);

				el.style.transform = `translate(${x}px, ${y}px)`;
				el.style.minHeight = `${height}px`;
				el.style.maxHeight = `${height}px`;
				el.style.minWidth = `${width}px`;
				el.style.maxWidth = `${width}px`;
			});
		}
		tranform(items, 0, 0);

		if (t < 1) list.animation.raf = requestAnimationFrame(step);
		else {
			const removeStlye = items => {
				for (const i of items) {
					i.el.removeAttribute('style');
					if (i.children) removeStlye(i.children);
				}
			}
			removeStlye(items);
		}

		list.animation.scheduled = false;
	}

	list.animation.raf = requestAnimationFrame(step);
}

listManager.removeHandler = function(ctx, list) {
	document.removeEventListener('pointermove', ctx.onMove);
	document.removeEventListener('pointerup', ctx.onRemoveHandler);

	const { ghost, dragged } = ctx;

	if (list.snapBack) listManager.snapBack(ctx, list);
	else {
		dragged.el.removeAttribute('dragged');
		ghost.el.remove();
	}

	ctx.buildPayload();
	ctx.cache.target.hook.onEnd(ctx.payload);

	ctx.source = null;
	ctx.target = null;
	ctx.cache.target = null;

	ctx.pointer.down = false;
	listManager.engie.grid.positions = null;
}

listManager.snapBack = function(ctx, list) {
	const { ghost, dragged } = ctx;

	const dx = ghost.left - dragged.rect.left;
	const dy = ghost.top - dragged.rect.top;

	if (dx + dy === 0) {
		dragged.el?.removeAttribute('dragged');
		ghost.el.remove();
		return;
	}

	ghost.rect = ghost.el.getBoundingClientRect();

	const start = performance.now();
	const duration = list.animation.duration ?? listManager.animation.duration;
	const type = list.animation.type ?? listManager.animation.type;
	const exponent = list.animation.exponent ?? listManager.animation.exponent;

	const step = time => {
		if (!dragged.el) return;
		dragged.rect = dragged.el.getBoundingClientRect();

		const dx = ghost.left - dragged.rect.left;
		const dy = ghost.top - dragged.rect.top;

		const t = Math.min((time - start) / duration, 1);
		const eased = listManager.animation.method[type](t, exponent);

		const x = dragged.rect.left + dx * (1 - eased);
		const y = dragged.rect.top + dy * (1 - eased);

		const dwidth = ghost.rect.width - dragged.rect.width;
		const width = ghost.rect.width - dwidth * eased;

		const dheight = ghost.rect.height - dragged.rect.height;
		const height = ghost.rect.height - dheight * eased;

		ghost.el.style.left = `${x}px`;
		ghost.el.style.top = `${y}px`;

		ghost.el.style.width = `${width}px`;
		ghost.el.style.height = `${height}px`;

		if (t < 1) ghost.raf = requestAnimationFrame(step);
		else {
			dragged.el?.removeAttribute('dragged');
			ghost.el.remove();
		}
	}

	ghost.raf = requestAnimationFrame(step);
}

listManager.scroll.handler = function(ctx) {
	const { ghost } = ctx;
	if (!ctx.pointer.down) return;

	if (ctx.target?.el) {
		const target = ctx.target.el;
		const rect = target.getBoundingClientRect();

		const threshold = ctx.target.scroll.threshold ?? listManager.scroll.threshold;
		const speed = ctx.target.scroll.speed ?? listManager.scroll.speed;

		let scrollY = 0, scrollX = 0;

		if (ctx.target.layout === 'horizontal') {
			if (ghost.C.X < rect.left + threshold && target.scrollLeft !== 0) {
				const distance = ghost.C.X - rect.left;
				const intensity = Math.max(0, Math.min(1, 1 - distance / threshold));

				scrollX = -intensity * speed;
			}

			if (ghost.C.X > rect.right - threshold &&
				target.scrollWidth > target.scrollLeft + target.clientWidth) {

				const distance = rect.right - ghost.C.X;
				const intensity = Math.max(0, Math.min(1, 1 - distance / threshold));

				scrollX = intensity * speed;
			}
		}
		if (ctx.target.layout === 'vertical') {
			if (ghost.C.Y < rect.top + threshold && target.scrollTop !== 0) {
				const distance = ghost.C.Y - rect.top;
				const intensity = Math.max(0, Math.min(1, 1 - distance / threshold));

				scrollY = -intensity * speed;
			}

			if (ghost.C.Y > rect.bottom - threshold &&
				target.scrollHeight > target.scrollTop + target.clientHeight) {
				const distance = rect.bottom - ghost.C.Y;
				const intensity = Math.max(0, Math.min(1, 1 - distance / threshold));

				scrollY = intensity * speed;
			}
		}

		ctx.scroll.accumulator.X += scrollX;
		ctx.scroll.accumulator.Y += scrollY;

		const integerX = Math.trunc(ctx.scroll.accumulator.X);
		const integerY = Math.trunc(ctx.scroll.accumulator.Y);

		let isScrolling = false;

		if (integerY !== 0) {
			target.scrollTop += integerY;
			ctx.scroll.accumulator.Y = 0;

			isScrolling = true;
		}

		if (integerX !== 0) {
			target.scrollLeft += integerX;
			ctx.scroll.accumulator.X = 0;

			isScrolling = true;
		}

		if (isScrolling) ctx.scroll.ing = true;
		else ctx.scroll.ing = false;
	}

	requestAnimationFrame(() => listManager.scroll.handler(ctx));
}

function listManager(listEl, o = {}) {
	this.onStart = this.onStart || (() => { });
	this.onListChange = this.onListChange || (() => { });
	this.onSwap = this.onSwap || (() => { });
	this.onEnd = this.onEnd || (() => { });
	const hook = this;

	const list = {
		el: listEl,
		layout: o.layout ?? 'grid',
		handle: o.handle,
		filter: o.filter,
		share: o.share,
		snapBack: o.snapBack ?? false,
		animation: {
			scheduled: false,
			type: o.animation?.type,
			duration: o.animation?.duration,
			exponent: o.animation?.exponent,
			raf: null
		},
		cache: {
			flat: [],
			tree: []
		},
		scroll: {
			speed: o.scroll?.speed,
			threshold: o.scroll?.threshold
		},
		hook,
		getFlat(ctx) {
			this.cache.flat.length = 0;

			const walk = el => {
				for (const i of [...el.children]) {
					if (!i.isSameNode(ctx.ghost.el)) this.cache.flat.push(i);
					if (i.hasAttribute('sublist')) walk(i);
				}
			}

			walk(this.el);
			return this.cache.flat;
		},
		getTree(ctx) {
			this.cache.tree.length = 0;

			const walk = (el, list) => {
				for (const i of [...el.children]) {
					let obj = {};

					if (!i.isSameNode(ctx.ghost.el)) obj.el = i;
					else continue;

					if (i.hasAttribute('sublist')) {
						obj.children = [];
						walk(i, obj.children);
					}

					list.push(obj);
				}
			}

			walk(this.el, this.cache.tree);
			return this.cache.tree;
		}
	};

	const ctx = {
		cache: { target: null },
		source: null,
		target: null,
		dragged: {
			el: null,
			rect: null,
			offset: {
				X: null,
				Y: null
			},
			C: {
				X: null,
				Y: null
			}
		},
		ghost: {
			el: null,
			top: null,
			left: null,
			C: {
				X: null,
				Y: null
			},
			raf: null,
			create() {
				this.el = ctx.dragged.el.cloneNode(true);
				this.el.setAttribute('ghost', '');

				this.el.style.width = `${ctx.dragged.rect.width}px`;
				this.el.style.height = `${ctx.dragged.rect.height}px`;

				if (ctx.source.fallBackOn) ctx.source.fallBackOn.append(this.el);
				else ctx.source.el.append(this.el);
			}
		},
		payload: null,
		buildPayload() {
			this.payload = {
				source: {
					items: {
						flat: list.getFlat(ctx),
						tree: list.getTree(ctx),
					},
					el: ctx.source.el
				},
				target: {
					items: {
						flat: ctx.cache.target.getFlat(ctx),
						tree: ctx.cache.target.getTree(ctx),
					},
					el: ctx.cache.target.el
				},
				dragged: ctx.dragged,
				ghost: ctx.ghost
			};
		},
		pointer: {
			down: false
		},
		scroll: {
			accumulator: {
				X: 0,
				Y: 0
			},
			ing: false
		}
	};

	if (list.share) listManager.share.lists.push(list);

	list.el.addEventListener('pointerdown', e => listManager.start(e, list, ctx));
}
