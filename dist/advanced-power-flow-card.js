//#region node_modules/@lit/reactive-element/css-tag.js
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$1 = globalThis;
var e$2 = t$1.ShadowRoot && (void 0 === t$1.ShadyCSS || t$1.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s$2 = Symbol();
var o$3 = /* @__PURE__ */ new WeakMap();
var n$2 = class {
	constructor(t, e, o) {
		if (this._$cssResult$ = !0, o !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = t, this.t = e;
	}
	get styleSheet() {
		let t = this.o;
		const s = this.t;
		if (e$2 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length;
			e && (t = o$3.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$3.set(s, t));
		}
		return t;
	}
	toString() {
		return this.cssText;
	}
};
var r$2 = (t) => new n$2("string" == typeof t ? t : t + "", void 0, s$2);
var i$3 = (t, ...e) => {
	return new n$2(1 === t.length ? t[0] : e.reduce((e, s, o) => e + ((t) => {
		if (!0 === t._$cssResult$) return t.cssText;
		if ("number" == typeof t) return t;
		throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
	})(s) + t[o + 1], t[0]), t, s$2);
};
var S$1 = (s, o) => {
	if (e$2) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
	else for (const e of o) {
		const o = document.createElement("style"), n = t$1.litNonce;
		void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
	}
};
var c$2 = e$2 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
	let e = "";
	for (const s of t.cssRules) e += s.cssText;
	return r$2(e);
})(t) : t;
//#endregion
//#region node_modules/@lit/reactive-element/reactive-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var { is: i$2, defineProperty: e$1, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$2, getPrototypeOf: n$1 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t, s) => t, u$1 = {
	toAttribute(t, s) {
		switch (s) {
			case Boolean:
				t = t ? l$1 : null;
				break;
			case Object:
			case Array: t = null == t ? t : JSON.stringify(t);
		}
		return t;
	},
	fromAttribute(t, s) {
		let i = t;
		switch (s) {
			case Boolean:
				i = null !== t;
				break;
			case Number:
				i = null === t ? null : Number(t);
				break;
			case Object:
			case Array: try {
				i = JSON.parse(t);
			} catch (t) {
				i = null;
			}
		}
		return i;
	}
}, f$1 = (t, s) => !i$2(t, s), b$1 = {
	attribute: !0,
	type: String,
	converter: u$1,
	reflect: !1,
	useDefault: !1,
	hasChanged: f$1
};
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y$1 = class extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(t, s = b$1) {
		if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
			const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
			void 0 !== h && e$1(this.prototype, t, h);
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: r } = h$1(this.prototype, t) ?? {
			get() {
				return this[s];
			},
			set(t) {
				this[s] = t;
			}
		};
		return {
			get: e,
			set(s) {
				const h = e?.call(this);
				r?.call(this, s), this.requestUpdate(t, h, i);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? b$1;
	}
	static _$Ei() {
		if (this.hasOwnProperty(d$1("elementProperties"))) return;
		const t = n$1(this);
		t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(d$1("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
			const t = this.properties, s = [...r$1(t), ...o$2(t)];
			for (const i of s) this.createProperty(i, t[i]);
		}
		const t = this[Symbol.metadata];
		if (null !== t) {
			const s = litPropertyMetadata.get(t);
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s);
			void 0 !== i && this._$Eh.set(i, t);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(s) {
		const i = [];
		if (Array.isArray(s)) {
			const e = new Set(s.flat(1 / 0).reverse());
			for (const s of e) i.unshift(c$2(s));
		} else void 0 !== s && i.push(c$2(s));
		return i;
	}
	static _$Eu(t, s) {
		const i = s.attribute;
		return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
	}
	addController(t) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
	}
	removeController(t) {
		this._$EO?.delete(t);
	}
	_$E_() {
		const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
		t.size > 0 && (this._$Ep = t);
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return S$1(t, this.constructor.elementStyles), t;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.());
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i);
	}
	_$ET(t, s) {
		const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
		if (void 0 !== e && !0 === i.reflect) {
			const h = (void 0 !== i.converter?.toAttribute ? i.converter : u$1).toAttribute(s, i.type);
			this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
		}
	}
	_$AK(t, s) {
		const i = this.constructor, e = i._$Eh.get(t);
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u$1;
			this._$Em = e;
			const r = h.fromAttribute(s, t.type);
			this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
		}
	}
	requestUpdate(t, s, i, e = !1, h) {
		if (void 0 !== t) {
			const r = this.constructor;
			if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f$1)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
			this.C(t, s, i);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
		i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (t) {
			Promise.reject(t);
		}
		const t = this.scheduleUpdate();
		return null != t && await t, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (const [t, s] of this._$Ep) this[t] = s;
				this._$Ep = void 0;
			}
			const t = this.constructor.elementProperties;
			if (t.size > 0) for (const [s, i] of t) {
				const { wrapped: t } = i, e = this[s];
				!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
			}
		}
		let t = !1;
		const s = this._$AL;
		try {
			t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
		} catch (s) {
			throw t = !1, this._$EM(), s;
		}
		t && this._$AE(s);
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(t) {
		return !0;
	}
	update(t) {
		this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
	}
	updated(t) {}
	firstUpdated(t) {}
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t = globalThis;
var i$1 = (t) => t;
var s$1 = t.trustedTypes;
var e = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t) => t }) : void 0;
var h = "$lit$";
var o$1 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n = "?" + o$1;
var r = `<${n}>`;
var l = document;
var c = () => l.createComment("");
var a = (t) => null === t || "object" != typeof t && "function" != typeof t;
var u = Array.isArray;
var d = (t) => u(t) || "function" == typeof t?.[Symbol.iterator];
var f = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t) => (i, ...s) => ({
	_$litType$: t,
	strings: i,
	values: s
});
var b = x(1);
var w = x(2);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l.createTreeWalker(l, 129);
function V(t, i) {
	if (!u(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return void 0 !== e ? e.createHTML(i) : i;
}
var N = (t, i) => {
	const s = t.length - 1, e = [];
	let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v;
	for (let i = 0; i < s; i++) {
		const s = t[i];
		let a, u, d = -1, f = 0;
		for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m : void 0 !== u[2] ? (y.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p) : void 0 !== u[3] && (c = p) : c === p ? ">" === u[0] ? (c = n ?? v, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p : c === _ || c === m ? c = v : (c = p, n = void 0);
		const x = c === p && t[i + 1].startsWith("/>") ? " " : "";
		l += c === v ? s + r : d >= 0 ? (e.push(a), s.slice(0, d) + h + s.slice(d) + o$1 + x) : s + o$1 + (-2 === d ? i : x);
	}
	return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
};
var S = class S {
	constructor({ strings: t, _$litType$: i }, e) {
		let r;
		this.parts = [];
		let l = 0, a = 0;
		const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
		if (this.el = S.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
			const t = this.el.content.firstChild;
			t.replaceWith(...t.childNodes);
		}
		for (; null !== (r = P.nextNode()) && d.length < u;) {
			if (1 === r.nodeType) {
				if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h)) {
					const i = v[a++], s = r.getAttribute(t).split(o$1), e = /([.?@])?(.*)/.exec(i);
					d.push({
						type: 1,
						index: l,
						name: e[2],
						strings: s,
						ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
					}), r.removeAttribute(t);
				} else t.startsWith(o$1) && (d.push({
					type: 6,
					index: l
				}), r.removeAttribute(t));
				if (y.test(r.tagName)) {
					const t = r.textContent.split(o$1), i = t.length - 1;
					if (i > 0) {
						r.textContent = s$1 ? s$1.emptyScript : "";
						for (let s = 0; s < i; s++) r.append(t[s], c()), P.nextNode(), d.push({
							type: 2,
							index: ++l
						});
						r.append(t[i], c());
					}
				}
			} else if (8 === r.nodeType) if (r.data === n) d.push({
				type: 2,
				index: l
			});
			else {
				let t = -1;
				for (; -1 !== (t = r.data.indexOf(o$1, t + 1));) d.push({
					type: 7,
					index: l
				}), t += o$1.length - 1;
			}
			l++;
		}
	}
	static createElement(t, i) {
		const s = l.createElement("template");
		return s.innerHTML = t, s;
	}
};
function M(t, i, s = t, e) {
	if (i === E) return i;
	let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
	const o = a(i) ? void 0 : i._$litDirective$;
	return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M(t, h._$AS(t, i.values), h, e)), i;
}
var R = class {
	constructor(t, i) {
		this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(t) {
		const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l).importNode(i, !0);
		P.currentNode = e;
		let h = P.nextNode(), o = 0, n = 0, r = s[0];
		for (; void 0 !== r;) {
			if (o === r.index) {
				let i;
				2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
			}
			o !== r?.index && (h = P.nextNode(), o++);
		}
		return P.currentNode = l, e;
	}
	p(t) {
		let i = 0;
		for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
	}
};
var k = class k {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(t, i, s, e) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
	}
	get parentNode() {
		let t = this._$AA.parentNode;
		const i = this._$AM;
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(t, i = this) {
		t = M(this, t, i), a(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d(t) ? this.k(t) : this._(t);
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB);
	}
	T(t) {
		this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
	}
	_(t) {
		this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l.createTextNode(t)), this._$AH = t;
	}
	$(t) {
		const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S.createElement(V(s.h, s.h[0]), this.options)), s);
		if (this._$AH?._$AD === e) this._$AH.p(i);
		else {
			const t = new R(e, this), s = t.u(this.options);
			t.p(i), this.T(s), this._$AH = t;
		}
	}
	_$AC(t) {
		let i = C.get(t.strings);
		return void 0 === i && C.set(t.strings, i = new S(t)), i;
	}
	k(t) {
		u(this._$AH) || (this._$AH = [], this._$AR());
		const i = this._$AH;
		let s, e = 0;
		for (const h of t) e === i.length ? i.push(s = new k(this.O(c()), this.O(c()), this, this.options)) : s = i[e], s._$AI(h), e++;
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
	}
	_$AR(t = this._$AA.nextSibling, s) {
		for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
			const s = i$1(t).nextSibling;
			i$1(t).remove(), t = s;
		}
	}
	setConnected(t) {
		void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
	}
};
var H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(t, i, s, e, h) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings;
		let o = !1;
		if (void 0 === h) t = M(this, t, i, 0), o = !a(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
		else {
			const e = t;
			let n, r;
			for (t = h[0], n = 0; n < h.length - 1; n++) r = M(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
		}
		o && !e && this.j(t);
	}
	j(t) {
		t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
	}
};
var I = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(t) {
		this.element[this.name] = t === A ? void 0 : t;
	}
};
var L = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== A);
	}
};
var z = class extends H {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), this.type = 5;
	}
	_$AI(t, i = this) {
		if ((t = M(this, t, i, 0) ?? A) === E) return;
		const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
		e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
	}
	handleEvent(t) {
		"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
	}
};
var Z = class {
	constructor(t, i, s) {
		this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(t) {
		M(this, t);
	}
};
var B = t.litHtmlPolyfillSupport;
B?.(S, k), (t.litHtmlVersions ??= []).push("3.3.3");
var D = (t, i, s) => {
	const e = s?.renderBefore ?? i;
	let h = e._$litPart$;
	if (void 0 === h) {
		const t = s?.renderBefore ?? null;
		e._$litPart$ = h = new k(i.insertBefore(c(), t), t, void 0, s ?? {});
	}
	return h._$AI(t), h;
};
//#endregion
//#region node_modules/lit-element/lit-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s = globalThis;
var i = class extends y$1 {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		const t = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= t.firstChild, t;
	}
	update(t) {
		const r = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return E;
	}
};
i._$litElement$ = !0, i["finalized"] = !0, s.litElementHydrateSupport?.({ LitElement: i });
var o = s.litElementPolyfillSupport;
o?.({ LitElement: i });
(s.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/config.ts
function clone(value) {
	return structuredClone(value);
}
function legacySolarToArray(solar) {
	if (!solar || typeof solar !== "object" || Array.isArray(solar)) return [];
	const entries = Object.entries(solar).filter(([key, value]) => key.toLowerCase().startsWith("pv") && value && typeof value === "object").map(([key, value]) => {
		const source = value;
		return {
			name: typeof source.name === "string" ? source.name : key.toUpperCase(),
			power: typeof source.power === "string" ? source.power : void 0,
			voltage: typeof source.voltage === "string" ? source.voltage : void 0,
			current: typeof source.current === "string" ? source.current : void 0
		};
	});
	if (!entries.length) return [];
	return [{
		name: "PV-Anlage",
		children: entries
	}];
}
function normalizeConfig(input) {
	const raw = input && typeof input === "object" ? clone(input) : {};
	const solar = Array.isArray(raw.solar) ? raw.solar : legacySolarToArray(raw.solar);
	let batteries;
	if (Array.isArray(raw.batteries)) batteries = raw.batteries;
	else {
		batteries = [];
		if (raw.battery1 && typeof raw.battery1 === "object") batteries.push(raw.battery1);
		if (raw.battery2 && typeof raw.battery2 === "object") batteries.push(raw.battery2);
	}
	return {
		type: typeof raw.type === "string" ? raw.type : "custom:advanced-power-flow-card",
		title: typeof raw.title === "string" ? raw.title : "Energiefluss",
		solar,
		batteries,
		grid: raw.grid && typeof raw.grid === "object" ? raw.grid : void 0,
		house: raw.house && typeof raw.house === "object" ? raw.house : void 0,
		heat_pump: raw.heat_pump && typeof raw.heat_pump === "object" ? raw.heat_pump : void 0,
		consumers: Array.isArray(raw.consumers) ? raw.consumers : [],
		daily: raw.daily && typeof raw.daily === "object" ? raw.daily : void 0,
		power_threshold: typeof raw.power_threshold === "number" && Number.isFinite(raw.power_threshold) ? raw.power_threshold : 5,
		balance_warning_threshold: typeof raw.balance_warning_threshold === "number" && Number.isFinite(raw.balance_warning_threshold) ? raw.balance_warning_threshold : 50,
		text_size: raw.text_size === "small" || raw.text_size === "large" || raw.text_size === "normal" ? raw.text_size : "large"
	};
}
function createStubConfig() {
	return {
		type: "custom:advanced-power-flow-card",
		title: "Energiefluss",
		solar: [{
			name: "GoodWe",
			power: "sensor.goodwe_pv_power",
			children: [
				{
					name: "MPPT 1",
					power: "sensor.goodwe_pv1_power",
					voltage: "sensor.goodwe_pv1_voltage",
					current: "sensor.goodwe_pv1_current"
				},
				{
					name: "MPPT 2",
					power: "sensor.goodwe_pv2_power",
					voltage: "sensor.goodwe_pv2_voltage",
					current: "sensor.goodwe_pv2_current"
				},
				{
					name: "MPPT 3",
					power: "sensor.goodwe_pv3_power",
					voltage: "sensor.goodwe_pv3_voltage",
					current: "sensor.goodwe_pv3_current"
				}
			]
		}, {
			name: "Victron",
			children: [{
				name: "MPPT 1",
				power: "sensor.victron_mppt_1_power",
				voltage: "sensor.victron_mppt_1_voltage",
				current: "sensor.victron_mppt_1_current"
			}, {
				name: "MPPT 2",
				power: "sensor.victron_mppt_2_power",
				voltage: "sensor.victron_mppt_2_voltage",
				current: "sensor.victron_mppt_2_current"
			}]
		}],
		batteries: [{
			name: "Batterie 1",
			power: "sensor.battery_1_power",
			soc: "sensor.battery_1_soc",
			positive_is_charging: true
		}, {
			name: "Batterie 2",
			power: "sensor.battery_2_power",
			soc: "sensor.battery_2_soc",
			positive_is_charging: true
		}],
		grid: {
			power: "sensor.grid_power",
			positive_is_import: true
		},
		house: { name: "Haus" },
		heat_pump: {
			name: "Wärmepumpe",
			power: "sensor.heatpump_power",
			part_of_house: true,
			flow_temperature: "sensor.heatpump_flow_temperature",
			return_temperature: "sensor.heatpump_return_temperature",
			outdoor_temperature: "sensor.heatpump_outdoor_temperature",
			hot_water_temperature: "sensor.heatpump_hot_water_temperature",
			mode: "sensor.heatpump_mode",
			compressor_status: "binary_sensor.heatpump_compressor",
			compressor_frequency: "sensor.heatpump_compressor_frequency",
			thermal_power: "sensor.heatpump_thermal_power",
			cop: "sensor.heatpump_cop",
			daily_energy: "sensor.heatpump_daily_energy"
		},
		consumers: [],
		daily: {},
		power_threshold: 5,
		balance_warning_threshold: 50,
		text_size: "large"
	};
}
//#endregion
//#region src/editor.ts
var AdvancedPowerFlowCardEditor = class extends i {
	constructor(..._args) {
		super(..._args);
		this._config = createStubConfig();
	}
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true }
		};
	}
	setConfig(config) {
		this._config = normalizeConfig(config);
	}
	_commit(config) {
		this._config = structuredClone(config);
		this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: this._config },
			bubbles: true,
			composed: true
		}));
	}
	_with(mutator) {
		const next = structuredClone(this._config);
		mutator(next);
		this._commit(next);
	}
	_entityPicker(label, value, onChange) {
		return b`
      <label>${label}</label>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${value ?? ""}
        .allowCustomEntity=${true}
        @value-changed=${(event) => {
			const next = event.detail?.value;
			onChange(next || void 0);
		}}
      ></ha-entity-picker>
    `;
	}
	_textInput(label, value, placeholder, onChange) {
		return b`
      <label>${label}</label>
      <input
        type="text"
        .value=${value ?? ""}
        placeholder=${placeholder}
        @input=${(event) => {
			onChange(event.target.value.trim() || void 0);
		}}
      />
    `;
	}
	_numberInput(label, value, fallback, onChange) {
		return b`
      <label>${label}</label>
      <input
        type="number"
        min="0"
        step="1"
        .value=${String(value ?? fallback)}
        @input=${(event) => {
			const parsed = Number(event.target.value);
			if (Number.isFinite(parsed)) onChange(parsed);
		}}
      />
    `;
	}
	_selectInput(label, value, options, onChange) {
		return b`
      <label>${label}</label>
      <select
        .value=${value ?? options[0]?.value ?? ""}
        @change=${(event) => onChange(event.target.value)}
      >
        ${options.map((option) => b`
          <option value=${option.value} ?selected=${(value ?? options[0]?.value) === option.value}>
            ${option.label}
          </option>
        `)}
      </select>
    `;
	}
	_checkbox(label, value, fallback, onChange) {
		return b`
      <label class="check">
        <input
          type="checkbox"
          .checked=${typeof value === "boolean" ? value : fallback}
          @change=${(event) => onChange(event.target.checked)}
        />
        <span>${label}</span>
      </label>
    `;
	}
	_updateSolar(index, patch) {
		this._with((config) => {
			config.solar ??= [];
			config.solar[index] = {
				...config.solar[index],
				...patch
			};
		});
	}
	_updateMppt(solarIndex, inputIndex, patch) {
		this._with((config) => {
			config.solar ??= [];
			const system = config.solar[solarIndex];
			system.children ??= [];
			system.children[inputIndex] = {
				...system.children[inputIndex],
				...patch
			};
		});
	}
	_updateBattery(index, patch) {
		this._with((config) => {
			config.batteries ??= [];
			config.batteries[index] = {
				...config.batteries[index],
				...patch
			};
		});
	}
	_updateConsumer(index, patch) {
		this._with((config) => {
			config.consumers ??= [];
			config.consumers[index] = {
				...config.consumers[index],
				...patch
			};
		});
	}
	_updateHeatPump(patch) {
		this._with((config) => {
			config.heat_pump = {
				...config.heat_pump,
				...patch
			};
		});
	}
	render() {
		if (!this.hass) return A;
		return b`
      <div class="editor">
        <section>
          <div class="section-title">
            <h3>Allgemein</h3>
          </div>
          ${this._textInput("Titel", this._config.title, "Energiefluss", (value) => this._with((config) => {
			config.title = value;
		}))}
          ${this._numberInput("Animationsschwelle in W", this._config.power_threshold, 5, (value) => this._with((config) => {
			config.power_threshold = value;
		}))}
          ${this._numberInput("Bilanz-Warnschwelle in W", this._config.balance_warning_threshold, 50, (value) => this._with((config) => {
			config.balance_warning_threshold = value;
		}))}
          ${this._selectInput("Schriftgröße", this._config.text_size, [
			{
				value: "small",
				label: "Klein"
			},
			{
				value: "normal",
				label: "Normal"
			},
			{
				value: "large",
				label: "Groß"
			}
		], (value) => this._with((config) => {
			config.text_size = value;
		}))}
        </section>

        <section>
          <div class="section-title">
            <h3>PV-Systeme</h3>
            <button
              class="add"
              @click=${() => this._with((config) => {
			config.solar ??= [];
			config.solar.push({
				name: `PV ${config.solar.length + 1}`,
				children: []
			});
		})}
            >+ PV-System</button>
          </div>

          <div class="stack full">
            ${(this._config.solar ?? []).map((system, solarIndex) => b`
              <div class="group">
                <div class="group-head">
                  <strong>${system.name || `PV ${solarIndex + 1}`}</strong>
                  <button
                    class="danger"
                    @click=${() => this._with((config) => {
			config.solar?.splice(solarIndex, 1);
		})}
                  >Entfernen</button>
                </div>

                <div class="form-grid">
                  ${this._textInput("Name", system.name, `PV ${solarIndex + 1}`, (value) => this._updateSolar(solarIndex, { name: value }))}
                  ${this._entityPicker("Gesamtleistung (optional)", system.power, (value) => this._updateSolar(solarIndex, { power: value }))}
                </div>

                <div class="subhead">
                  <span>Sub-PV / MPPTs</span>
                  <button
                    class="add small"
                    @click=${() => this._with((config) => {
			const target = config.solar?.[solarIndex];
			if (!target) return;
			target.children ??= [];
			target.children.push({ name: `MPPT ${target.children.length + 1}` });
		})}
                  >+ MPPT</button>
                </div>

                <div class="stack">
                  ${(system.children ?? []).map((input, inputIndex) => b`
                    <div class="subgroup">
                      <div class="group-head compact">
                        <strong>${input.name || `MPPT ${inputIndex + 1}`}</strong>
                        <button
                          class="danger small"
                          @click=${() => this._with((config) => {
			config.solar?.[solarIndex]?.children?.splice(inputIndex, 1);
		})}
                        >Entfernen</button>
                      </div>
                      <div class="form-grid">
                        ${this._textInput("Name", input.name, `MPPT ${inputIndex + 1}`, (value) => this._updateMppt(solarIndex, inputIndex, { name: value }))}
                        ${this._entityPicker("Leistung", input.power, (value) => this._updateMppt(solarIndex, inputIndex, { power: value }))}
                        ${this._entityPicker("Spannung", input.voltage, (value) => this._updateMppt(solarIndex, inputIndex, { voltage: value }))}
                        ${this._entityPicker("Strom", input.current, (value) => this._updateMppt(solarIndex, inputIndex, { current: value }))}
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `)}
          </div>
        </section>

        <section>
          <div class="section-title">
            <h3>Batterien</h3>
            <button
              class="add"
              @click=${() => this._with((config) => {
			config.batteries ??= [];
			config.batteries.push({
				name: `Batterie ${config.batteries.length + 1}`,
				positive_is_charging: true
			});
		})}
            >+ Batterie</button>
          </div>

          <div class="stack full">
            ${(this._config.batteries ?? []).map((battery, index) => b`
              <div class="group">
                <div class="group-head">
                  <strong>${battery.name || `Batterie ${index + 1}`}</strong>
                  <button
                    class="danger"
                    @click=${() => this._with((config) => {
			config.batteries?.splice(index, 1);
		})}
                  >Entfernen</button>
                </div>
                <div class="form-grid">
                  ${this._textInput("Name", battery.name, `Batterie ${index + 1}`, (value) => this._updateBattery(index, { name: value }))}
                  ${this._entityPicker("Leistung", battery.power, (value) => this._updateBattery(index, { power: value }))}
                  ${this._entityPicker("SOC", battery.soc, (value) => this._updateBattery(index, { soc: value }))}
                  ${this._checkbox("Positiver Wert bedeutet Laden", battery.positive_is_charging, true, (value) => this._updateBattery(index, { positive_is_charging: value }))}
                </div>
              </div>
            `)}
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Netz & Haus</h3></div>
          <div class="form-grid full">
            ${this._entityPicker("Netzleistung", this._config.grid?.power, (value) => this._with((config) => {
			config.grid = {
				...config.grid,
				power: value
			};
		}))}
            ${this._checkbox("Positiver Netzwert bedeutet Bezug", this._config.grid?.positive_is_import, true, (value) => this._with((config) => {
			config.grid = {
				...config.grid,
				positive_is_import: value
			};
		}))}
            ${this._textInput("Hausname", this._config.house?.name, "Haus", (value) => this._with((config) => {
			config.house = {
				...config.house,
				name: value
			};
		}))}
            ${this._entityPicker("Hausleistung (optional)", this._config.house?.power, (value) => this._with((config) => {
			config.house = {
				...config.house,
				power: value
			};
		}))}
            <div class="help">
              Leer lassen = Hausverbrauch automatisch aus PV, Netz und Batterien berechnen.
              Separate Verbraucher mit „Teil des Hausverbrauchs“ werden dabei nicht doppelt gezählt.
            </div>
          </div>
        </section>


        <section>
          <div class="section-title"><h3>Tageswerte (optional)</h3></div>
          <div class="form-grid full">
            ${this._entityPicker("PV-Energie heute", this._config.daily?.pv_energy, (value) => this._with((config) => {
			config.daily = {
				...config.daily,
				pv_energy: value
			};
		}))}
            ${this._entityPicker("Netzbezug heute", this._config.daily?.grid_import_energy, (value) => this._with((config) => {
			config.daily = {
				...config.daily,
				grid_import_energy: value
			};
		}))}
            ${this._entityPicker("Einspeisung heute", this._config.daily?.grid_export_energy, (value) => this._with((config) => {
			config.daily = {
				...config.daily,
				grid_export_energy: value
			};
		}))}
            ${this._entityPicker("Hausverbrauch heute", this._config.daily?.house_energy, (value) => this._with((config) => {
			config.daily = {
				...config.daily,
				house_energy: value
			};
		}))}
            <div class="help">
              Nur konfigurierte Tageswerte werden über dem Flussdiagramm angezeigt.
            </div>
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Wärmepumpe</h3></div>
          <div class="form-grid full">
            ${this._textInput("Name", this._config.heat_pump?.name, "Wärmepumpe", (value) => this._updateHeatPump({ name: value }))}
            ${this._entityPicker("Elektrische Leistung", this._config.heat_pump?.power, (value) => this._updateHeatPump({ power: value }))}
            ${this._checkbox("Teil des Hausverbrauchs", this._config.heat_pump?.part_of_house, true, (value) => this._updateHeatPump({ part_of_house: value }))}
            ${this._checkbox("Details standardmäßig geöffnet", this._config.heat_pump?.details_expanded_by_default, false, (value) => this._updateHeatPump({ details_expanded_by_default: value }))}
            ${this._entityPicker("Vorlauftemperatur", this._config.heat_pump?.flow_temperature, (value) => this._updateHeatPump({ flow_temperature: value }))}
            ${this._entityPicker("Rücklauftemperatur", this._config.heat_pump?.return_temperature, (value) => this._updateHeatPump({ return_temperature: value }))}
            ${this._entityPicker("Außentemperatur", this._config.heat_pump?.outdoor_temperature, (value) => this._updateHeatPump({ outdoor_temperature: value }))}
            ${this._entityPicker("Warmwassertemperatur", this._config.heat_pump?.hot_water_temperature, (value) => this._updateHeatPump({ hot_water_temperature: value }))}
            ${this._entityPicker("Raumtemperatur", this._config.heat_pump?.room_temperature, (value) => this._updateHeatPump({ room_temperature: value }))}
            ${this._entityPicker("Solltemperatur", this._config.heat_pump?.target_temperature, (value) => this._updateHeatPump({ target_temperature: value }))}
            ${this._entityPicker("Betriebsmodus", this._config.heat_pump?.mode, (value) => this._updateHeatPump({ mode: value }))}
            ${this._entityPicker("Kompressorstatus", this._config.heat_pump?.compressor_status, (value) => this._updateHeatPump({ compressor_status: value }))}
            ${this._entityPicker("Kompressorfrequenz", this._config.heat_pump?.compressor_frequency, (value) => this._updateHeatPump({ compressor_frequency: value }))}
            ${this._entityPicker("Thermische Leistung", this._config.heat_pump?.thermal_power, (value) => this._updateHeatPump({ thermal_power: value }))}
            ${this._entityPicker("COP", this._config.heat_pump?.cop, (value) => this._updateHeatPump({ cop: value }))}
            ${this._entityPicker("Tagesenergie", this._config.heat_pump?.daily_energy, (value) => this._updateHeatPump({ daily_energy: value }))}
          </div>
        </section>

        <section>
          <div class="section-title">
            <h3>Weitere Verbraucher</h3>
            <button
              class="add"
              @click=${() => this._with((config) => {
			config.consumers ??= [];
			config.consumers.push({
				name: `Verbraucher ${config.consumers.length + 1}`,
				part_of_house: true
			});
		})}
            >+ Verbraucher</button>
          </div>

          <div class="stack full">
            ${(this._config.consumers ?? []).map((consumer, index) => b`
              <div class="group">
                <div class="group-head">
                  <strong>${consumer.name || `Verbraucher ${index + 1}`}</strong>
                  <button
                    class="danger"
                    @click=${() => this._with((config) => {
			config.consumers?.splice(index, 1);
		})}
                  >Entfernen</button>
                </div>
                <div class="form-grid">
                  ${this._textInput("Name", consumer.name, `Verbraucher ${index + 1}`, (value) => this._updateConsumer(index, { name: value }))}
                  ${this._entityPicker("Leistung", consumer.power, (value) => this._updateConsumer(index, { power: value }))}
                  ${this._checkbox("Teil des Hausverbrauchs", consumer.part_of_house, true, (value) => this._updateConsumer(index, { part_of_house: value }))}
                </div>
              </div>
            `)}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = i$3`
    :host { display: block; }
    .editor { display: grid; gap: 14px; padding: 4px 0; }
    section {
      display: grid;
      grid-template-columns: minmax(150px, .75fr) minmax(220px, 1.5fr);
      gap: 10px 14px;
      padding: 14px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
    }
    .section-title,
    .group-head,
    .subhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .section-title { grid-column: 1 / -1; }
    h3 { margin: 0; font-size: 16px; }
    label { align-self: center; font-size: 14px; }
    .help {
      grid-column: 1 / -1;
      font-size: 12px;
      line-height: 1.45;
      color: var(--secondary-text-color);
    }
    input[type="text"], input[type="number"], select {
      box-sizing: border-box;
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 8px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }
    button {
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 8px 11px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
    }
    button:hover { border-color: var(--primary-color); }
    .add { font-weight: 600; }
    .danger { color: var(--error-color); }
    .small { padding: 5px 8px; font-size: 12px; }
    .full, .stack { grid-column: 1 / -1; }
    .stack { display: grid; gap: 10px; }
    .group, .subgroup {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: color-mix(in srgb, var(--secondary-background-color) 55%, transparent);
    }
    .subgroup { margin-top: 8px; }
    .group-head { margin-bottom: 10px; }
    .group-head.compact { margin-bottom: 8px; }
    .subhead { margin-top: 12px; font-weight: 600; font-size: 13px; }
    .form-grid {
      display: grid;
      grid-template-columns: minmax(150px, .75fr) minmax(220px, 1.5fr);
      gap: 9px 14px;
    }
    .check {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    @media (max-width: 680px) {
      section, .form-grid { grid-template-columns: 1fr; }
      .section-title, .full, .stack, .check { grid-column: 1; }
    }
  `;
	}
};
if (!customElements.get("advanced-power-flow-card-editor")) customElements.define("advanced-power-flow-card-editor", AdvancedPowerFlowCardEditor);
//#endregion
//#region src/advanced-power-flow-card.ts
var CARD_NAME = "Advanced Power Flow Card";
var CARD_VERSION = "0.2.4";
var AdvancedPowerFlowCard = class extends i {
	constructor(..._args) {
		super(..._args);
		this._config = createStubConfig();
		this._heatExpanded = false;
		this._heatExpansionInitialized = false;
	}
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true },
			_heatExpanded: { state: true },
			_hoveredNode: { state: true }
		};
	}
	static getConfigElement() {
		return document.createElement("advanced-power-flow-card-editor");
	}
	static getStubConfig() {
		return createStubConfig();
	}
	setConfig(config) {
		this._config = normalizeConfig(config);
		if (!this._heatExpansionInitialized) {
			this._heatExpanded = this._config.heat_pump?.details_expanded_by_default ?? false;
			this._heatExpansionInitialized = true;
		}
	}
	getCardSize() {
		return this._heatExpanded ? 7 : 6;
	}
	getGridOptions() {
		return {
			rows: this._heatExpanded ? 7 : 6,
			columns: 12,
			min_rows: 5,
			min_columns: 6
		};
	}
	_state(entityId) {
		if (!entityId || !this.hass) return void 0;
		return this.hass.states[entityId];
	}
	_number(entityId) {
		const state = this._state(entityId);
		if (!state || state.state === "unknown" || state.state === "unavailable") return void 0;
		const value = Number(state.state.replace(",", "."));
		return Number.isFinite(value) ? value : void 0;
	}
	_raw(entityId) {
		const state = this._state(entityId);
		if (!state || state.state === "unknown" || state.state === "unavailable") return void 0;
		return state.state;
	}
	_unit(entityId) {
		const unit = this._state(entityId)?.attributes?.unit_of_measurement;
		return typeof unit === "string" ? unit : "";
	}
	_powerW(entityId) {
		const value = this._number(entityId);
		if (value === void 0) return void 0;
		const unit = this._unit(entityId).trim().toLowerCase();
		if (unit === "kw") return value * 1e3;
		if (unit === "mw") return value * 1e6;
		return value;
	}
	_formatW(value, absolute = false) {
		if (value === void 0) return "—";
		const shown = absolute ? Math.abs(value) : value;
		if (Math.abs(shown) >= 1e3) return `${(shown / 1e3).toLocaleString(void 0, { maximumFractionDigits: 2 })} kW`;
		return `${shown.toLocaleString(void 0, { maximumFractionDigits: 0 })} W`;
	}
	_formatPower(entityId, absolute = true) {
		return this._formatW(this._powerW(entityId), absolute);
	}
	_formatMeasurement(entityId, fallbackUnit = "") {
		const numeric = this._number(entityId);
		if (numeric !== void 0) {
			const unit = this._unit(entityId) || fallbackUnit;
			return `${numeric.toLocaleString(void 0, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
		}
		return this._raw(entityId) ?? "—";
	}
	_formatSoc(entityId) {
		const value = this._number(entityId);
		return value === void 0 ? "SOC —" : `SOC ${value.toLocaleString(void 0, { maximumFractionDigits: 0 })} %`;
	}
	_pvSub(input) {
		const parts = [];
		if (input.voltage) {
			const voltage = this._formatMeasurement(input.voltage, "V");
			if (voltage !== "—") parts.push(voltage);
		}
		if (input.current) {
			const current = this._formatMeasurement(input.current, "A");
			if (current !== "—") parts.push(current);
		}
		return parts.join(" · ");
	}
	_threshold() {
		return Math.max(0, this._config.power_threshold ?? 5);
	}
	_activityFromPower(power) {
		if (power === void 0) return "unknown";
		return Math.abs(power) > this._threshold() ? "active" : "idle";
	}
	_clampPercent(value) {
		if (value === void 0 || !Number.isFinite(value)) return void 0;
		return Math.min(100, Math.max(0, value));
	}
	_positiveFlow(power) {
		if (power === void 0 || Math.abs(power) <= this._threshold()) return "off";
		return power > 0 ? "forward" : "reverse";
	}
	_gridFlow() {
		const p = this._powerW(this._config.grid?.power);
		if (p === void 0 || Math.abs(p) <= this._threshold()) return "off";
		return (this._config.grid?.positive_is_import ?? true ? p > 0 : p < 0) ? "forward" : "reverse";
	}
	_batteryFlow(config) {
		const p = this._powerW(config.power);
		if (p === void 0 || Math.abs(p) <= this._threshold()) return "off";
		return (config.positive_is_charging ?? true ? p > 0 : p < 0) ? "forward" : "reverse";
	}
	_pvSystemPowerW(system) {
		const direct = this._powerW(system.power);
		if (direct !== void 0) return direct;
		const values = (system.children ?? []).map((child) => this._powerW(child.power)).filter((value) => value !== void 0);
		return values.length ? values.reduce((sum, value) => sum + value, 0) : void 0;
	}
	_totalPvW() {
		const values = (this._config.solar ?? []).map((system) => this._pvSystemPowerW(system)).filter((value) => value !== void 0);
		return values.length ? values.reduce((sum, value) => sum + value, 0) : void 0;
	}
	_gridNetToHouseW() {
		const entity = this._config.grid?.power;
		if (!entity) return 0;
		const power = this._powerW(entity);
		if (power === void 0) return void 0;
		return this._config.grid?.positive_is_import ?? true ? power : -power;
	}
	_batteryNetToHouseW(config) {
		if (!config.power) return void 0;
		const power = this._powerW(config.power);
		if (power === void 0) return void 0;
		return config.positive_is_charging ?? true ? -power : power;
	}
	_housePowerInfo() {
		const configuredEntity = this._config.house?.power;
		if (configuredEntity) {
			const value = this._powerW(configuredEntity);
			return {
				value,
				calculated: false,
				complete: value !== void 0
			};
		}
		let pv = 0;
		for (const system of this._config.solar ?? []) {
			const value = this._pvSystemPowerW(system);
			if (value === void 0) return {
				calculated: true,
				complete: false
			};
			pv += Math.max(0, value);
		}
		const grid = this._gridNetToHouseW();
		if (grid === void 0) return {
			calculated: true,
			complete: false
		};
		let batteries = 0;
		for (const battery of this._config.batteries ?? []) {
			const value = this._batteryNetToHouseW(battery);
			if (value === void 0) return {
				calculated: true,
				complete: false
			};
			batteries += value;
		}
		let directConsumers = 0;
		const direct = [...(this._config.consumers ?? []).filter((consumer) => !(consumer.part_of_house ?? true)), ...this._config.heat_pump && !(this._config.heat_pump.part_of_house ?? true) ? [this._config.heat_pump] : []];
		for (const consumer of direct) {
			if (!consumer.power) return {
				calculated: true,
				complete: false
			};
			const value = this._powerW(consumer.power);
			if (value === void 0) return {
				calculated: true,
				complete: false
			};
			directConsumers += Math.abs(value);
		}
		return {
			value: Math.max(0, pv + grid + batteries - directConsumers),
			calculated: true,
			complete: true
		};
	}
	_batteryStatus(config) {
		const p = this._powerW(config.power);
		if (p === void 0) return "Status —";
		if (Math.abs(p) <= this._threshold()) return "Ruhe";
		return (config.positive_is_charging ?? true ? p > 0 : p < 0) ? "Lädt" : "Entlädt";
	}
	_directConsumersPowerW() {
		let total = 0;
		const direct = [...(this._config.consumers ?? []).filter((consumer) => !(consumer.part_of_house ?? true)), ...this._config.heat_pump && !(this._config.heat_pump.part_of_house ?? true) ? [this._config.heat_pump] : []];
		for (const consumer of direct) {
			if (!consumer.power) return { complete: false };
			const value = this._powerW(consumer.power);
			if (value === void 0) return { complete: false };
			total += Math.abs(value);
		}
		return {
			value: total,
			complete: true
		};
	}
	_systemBalanceInfo() {
		const pv = this._totalPvW();
		const grid = this._gridNetToHouseW();
		const house = this._housePowerInfo();
		const direct = this._directConsumersPowerW();
		if (pv === void 0 || grid === void 0 || !house.complete || !direct.complete) return {
			complete: false,
			calculatedHouse: house.calculated,
			warning: false
		};
		let batterySource = 0;
		let batterySink = 0;
		for (const battery of this._config.batteries ?? []) {
			const value = this._batteryNetToHouseW(battery);
			if (value === void 0) return {
				complete: false,
				calculatedHouse: house.calculated,
				warning: false
			};
			batterySource += Math.max(0, value);
			batterySink += Math.max(0, -value);
		}
		const source = Math.max(0, pv) + Math.max(0, grid) + batterySource;
		const sink = Math.max(0, house.value ?? 0) + Math.max(0, direct.value ?? 0) + Math.max(0, -grid) + batterySink;
		const residual = source - sink;
		const limit = Math.max(0, this._config.balance_warning_threshold ?? 50);
		return {
			source,
			sink,
			residual,
			complete: true,
			calculatedHouse: house.calculated,
			warning: !house.calculated && Math.abs(residual) > limit
		};
	}
	_formatSignedW(value) {
		if (value === void 0) return "—";
		return `${value > 0 ? "+" : value < 0 ? "−" : "±"}${this._formatW(Math.abs(value), true)}`;
	}
	_formatEnergy(entityId) {
		const value = this._number(entityId);
		if (value === void 0) return "—";
		const unit = this._unit(entityId).trim();
		if (unit.toLowerCase() === "wh" && Math.abs(value) >= 1e3) return `${(value / 1e3).toLocaleString(void 0, { maximumFractionDigits: 2 })} kWh`;
		return `${value.toLocaleString(void 0, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
	}
	_dailyItems() {
		const daily = this._config.daily;
		if (!daily) return [];
		return [
			["PV heute", daily.pv_energy],
			["Netzbezug", daily.grid_import_energy],
			["Einspeisung", daily.grid_export_energy],
			["Haus heute", daily.house_energy]
		].filter((item) => Boolean(item[1])).map(([label, entity]) => ({
			label,
			value: this._formatEnergy(entity),
			entity
		}));
	}
	_flowFocusClass(relatedNodes) {
		if (!this._hoveredNode) return "";
		return relatedNodes.includes(this._hoveredNode) ? "focus" : "dimmed";
	}
	_durationFromPower(power) {
		const p = Math.abs(power ?? 0);
		if (p <= this._threshold()) return 2.3;
		return 2.25 - Math.min(1, Math.log10(Math.max(100, p)) / 4) * 1.45;
	}
	_short(value, max = 25) {
		if (value.length <= max) return value;
		return `${value.slice(0, max - 1)}…`;
	}
	_layout() {
		const solar = this._config.solar ?? [];
		const batteries = this._config.batteries ?? [];
		const consumers = this._config.consumers ?? [];
		Boolean(this._config.heat_pump);
		const width = 1e3;
		const sideMargin = 28;
		const pvGapX = 20;
		const pvGapY = 20;
		const pvColumns = solar.length <= 1 ? 1 : 2;
		const clusterWidth = pvColumns === 1 ? 620 : 462;
		const childGapX = 12;
		const childGapY = 10;
		const childH = 78;
		const parentW = 210;
		const parentH = 86;
		const clusterPadY = 18;
		const pvClusters = [];
		let pvY = 18;
		for (let rowStart = 0; rowStart < solar.length; rowStart += pvColumns) {
			const rowSystems = solar.slice(rowStart, rowStart + pvColumns);
			const maxChildren = Math.max(1, ...rowSystems.map((system) => Math.max(1, system.children?.length ?? 0)));
			const maxChildRows = Math.ceil(maxChildren / 2);
			const childrenAreaH = maxChildRows * childH + Math.max(0, maxChildRows - 1) * childGapY;
			const rowHeight = clusterPadY + childrenAreaH + 16 + parentH + clusterPadY;
			rowSystems.forEach((system, localIndex) => {
				const systemIndex = rowStart + localIndex;
				const clusterX = rowSystems.length === 1 ? (width - clusterWidth) / 2 : sideMargin + localIndex * (clusterWidth + pvGapX);
				const children = system.children ?? [];
				const childColumns = Math.min(2, Math.max(1, children.length));
				const childW = childColumns === 1 ? Math.min(220, clusterWidth - 36) : (clusterWidth - 36 - childGapX) / 2;
				const parentX = clusterX + clusterWidth / 2 - parentW / 2;
				const parentY = pvY + clusterPadY + childrenAreaH + 16;
				const parentPower = this._pvSystemPowerW(system);
				const parent = {
					id: `pv-system-${systemIndex}`,
					title: system.name ?? `PV ${systemIndex + 1}`,
					main: this._formatW(parentPower, true),
					sub: children.length ? `${children.length} MPPT${children.length === 1 ? "" : "s"}` : "PV-System",
					entity: system.power,
					kind: "pv-parent",
					x: parentX,
					y: parentY,
					w: parentW,
					h: parentH,
					activity: this._activityFromPower(parentPower)
				};
				const childNodes = children.map((child, childIndex) => {
					const row = Math.floor(childIndex / childColumns);
					const col = childIndex % childColumns;
					const itemsInThisRow = Math.min(childColumns, children.length - row * childColumns);
					const usedWidth = itemsInThisRow * childW + Math.max(0, itemsInThisRow - 1) * childGapX;
					const rowStartX = clusterX + (clusterWidth - usedWidth) / 2;
					return {
						id: `pv-${systemIndex}-${childIndex}`,
						title: child.name ?? `MPPT ${childIndex + 1}`,
						main: this._formatPower(child.power, true),
						sub: this._pvSub(child),
						entity: child.power,
						kind: "pv",
						x: rowStartX + col * (childW + childGapX),
						y: pvY + clusterPadY + row * 88,
						w: childW,
						h: childH,
						activity: this._activityFromPower(this._powerW(child.power))
					};
				});
				pvClusters.push({
					system,
					systemIndex,
					x: clusterX,
					y: pvY,
					width: clusterWidth,
					height: rowHeight,
					parent,
					children: childNodes
				});
			});
			pvY += rowHeight + pvGapY;
		}
		if (!solar.length) pvY = 24;
		const centerY = pvY + 34;
		const balance = this._systemBalanceInfo();
		const center = {
			id: "center",
			title: "Versorgung",
			main: balance.complete ? this._formatW(balance.source, true) : "—",
			sub: balance.complete ? balance.calculatedHouse ? "Haus aus Leistungsbilanz" : `${balance.warning ? "⚠ " : ""}Bilanz ${this._formatSignedW(balance.residual)}` : "Bilanz unvollständig",
			kind: "center",
			x: width / 2 - 100,
			y: centerY,
			w: 200,
			h: 92,
			activity: balance.complete ? this._activityFromPower(balance.source) : "unknown",
			warning: balance.warning
		};
		const grid = {
			id: "grid",
			title: "Netz",
			main: this._formatPower(this._config.grid?.power, true),
			sub: this._gridFlow() === "forward" ? "Energie aus Netz" : this._gridFlow() === "reverse" ? "Energie ins Netz" : "Kein Netzfluss",
			entity: this._config.grid?.power,
			kind: "grid",
			x: 50,
			y: centerY + 2,
			w: 190,
			h: 88,
			activity: this._activityFromPower(this._powerW(this._config.grid?.power)),
			badge: this._gridFlow() === "forward" ? "Bezug" : this._gridFlow() === "reverse" ? "Einspeisung" : "Ruhe"
		};
		const houseInfo = this._housePowerInfo();
		const house = {
			id: "house",
			title: this._config.house?.name ?? "Haus",
			main: houseInfo.complete ? this._formatW(houseInfo.value, true) : "—",
			sub: houseInfo.calculated ? houseInfo.complete ? "Aus PV, Netz & Akkus" : "Berechnung unvollständig" : houseInfo.complete ? "Gesamtverbrauch" : "Sensor nicht verfügbar",
			entity: this._config.house?.power,
			kind: "house",
			x: 760,
			y: centerY + 2,
			w: 190,
			h: 88,
			activity: houseInfo.complete ? this._activityFromPower(houseInfo.value) : "unknown",
			badge: houseInfo.calculated ? houseInfo.complete ? "Berechnet" : "Prüfen" : void 0
		};
		const bottom = [];
		const bottomSpecs = [];
		batteries.forEach((battery, index) => {
			bottomSpecs.push({
				width: 205,
				make: (x, y, nodeW) => ({
					source: "center",
					power: battery.power,
					direction: this._batteryFlow(battery),
					node: {
						id: `battery-${index}`,
						title: battery.name ?? `Batterie ${index + 1}`,
						main: this._formatPower(battery.power, true),
						sub: `${this._batteryStatus(battery)} · ${this._formatSoc(battery.soc)}`,
						entity: battery.power ?? battery.soc,
						kind: "battery",
						x,
						y,
						w: nodeW,
						h: 90,
						activity: this._activityFromPower(this._powerW(battery.power)),
						batterySoc: this._clampPercent(this._number(battery.soc))
					}
				})
			});
		});
		if (this._config.heat_pump) {
			const hp = this._config.heat_pump;
			bottomSpecs.push({
				width: 225,
				make: (x, y, nodeW) => ({
					source: hp.part_of_house ?? true ? "house" : "center",
					power: hp.power,
					direction: this._positiveFlow(this._powerW(hp.power)),
					node: {
						id: "heat-pump",
						title: hp.name ?? "Wärmepumpe",
						main: this._formatPower(hp.power, true),
						sub: this._heatPumpSummary(hp),
						entity: hp.power,
						kind: "heat",
						x,
						y,
						w: nodeW,
						h: 94,
						heatPump: true,
						activity: this._activityFromPower(this._powerW(hp.power)),
						badge: this._heatPumpBadge(hp)
					}
				})
			});
		}
		consumers.forEach((consumer, index) => {
			bottomSpecs.push({
				width: 205,
				make: (x, y, nodeW) => ({
					source: consumer.part_of_house ?? true ? "house" : "center",
					power: consumer.power,
					direction: this._positiveFlow(this._powerW(consumer.power)),
					node: {
						id: `consumer-${index}`,
						title: consumer.name ?? `Verbraucher ${index + 1}`,
						main: this._formatPower(consumer.power, true),
						sub: consumer.part_of_house ?? true ? "Teil des Hausverbrauchs" : "Direkter Verbraucher",
						entity: consumer.power,
						kind: "consumer",
						x,
						y,
						w: nodeW,
						h: 90,
						activity: this._activityFromPower(this._powerW(consumer.power))
					}
				})
			});
		});
		const bottomStartY = centerY + center.h + 68;
		const bottomColumns = Math.min(3, Math.max(1, bottomSpecs.length));
		const bottomGapX = 18;
		const bottomGapY = 18;
		const cellW = (944 - Math.max(0, bottomColumns - 1) * bottomGapX) / bottomColumns;
		const bottomRowH = 94;
		bottomSpecs.forEach((spec, index) => {
			const row = Math.floor(index / bottomColumns);
			const col = index % bottomColumns;
			const itemsInRow = Math.min(bottomColumns, bottomSpecs.length - row * bottomColumns);
			const rowWidth = itemsInRow * cellW + Math.max(0, itemsInRow - 1) * bottomGapX;
			const rowStartX = (width - rowWidth) / 2;
			const nodeW = Math.min(spec.width, cellW);
			const x = rowStartX + col * (cellW + bottomGapX) + (cellW - nodeW) / 2;
			const y = bottomStartY + row * 112;
			bottom.push(spec.make(x, y, nodeW));
		});
		const bottomRows = bottomSpecs.length ? Math.ceil(bottomSpecs.length / bottomColumns) : 0;
		return {
			width,
			height: bottomRows ? bottomStartY + bottomRows * bottomRowH + Math.max(0, bottomRows - 1) * bottomGapY + 30 : centerY + center.h + 38,
			center,
			grid,
			house,
			pvClusters,
			bottom
		};
	}
	_heatPumpBadge(hp) {
		const raw = this._raw(hp.mode)?.trim();
		if (raw) {
			const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_");
			return this._short({
				heat: "Heizen",
				heating: "Heizen",
				heating_only: "Heizen",
				dhw: "Warmwasser",
				hot_water: "Warmwasser",
				domestic_hot_water: "Warmwasser",
				cool: "Kühlen",
				cooling: "Kühlen",
				auto: "Auto",
				standby: "Standby",
				idle: "Standby",
				off: "Aus"
			}[normalized] ?? raw, 15);
		}
		const power = this._powerW(hp.power);
		if (power === void 0) return "Status —";
		return Math.abs(power) > this._threshold() ? "Aktiv" : "Standby";
	}
	_heatPumpSummary(hp) {
		const parts = [];
		const flow = this._number(hp.flow_temperature);
		if (flow !== void 0) {
			const unit = this._unit(hp.flow_temperature) || "°C";
			parts.push(`VL ${flow.toLocaleString(void 0, { maximumFractionDigits: 1 })} ${unit}`);
		}
		const cop = this._number(hp.cop);
		if (cop !== void 0) parts.push(`COP ${cop.toLocaleString(void 0, { maximumFractionDigits: 1 })}`);
		return parts.length ? parts.join(" · ") : "Details anzeigen";
	}
	_flowPath(d, direction, power, key = "", relatedNodes = []) {
		const duration = this._durationFromPower(power);
		const focusClass = this._flowFocusClass(relatedNodes);
		return w`
      <path d=${d} class=${`flow-base ${focusClass}`}></path>
      <path
        d=${d}
        class=${`flow ${direction} ${focusClass}`}
        style=${`--flow-duration:${duration}s`}
        pathLength="100"
        data-key=${key}
      ></path>
    `;
	}
	_node(node) {
		const icon = {
			pv: "☀",
			"pv-parent": "☀",
			center: "⚡",
			grid: "⇄",
			house: "⌂",
			battery: "▰",
			heat: "♨",
			consumer: "●"
		};
		const titleY = node.y + 26;
		const mainY = node.y + 54;
		const subY = node.y + 73;
		const clickable = Boolean(node.entity || node.heatPump);
		const activity = node.activity ?? "unknown";
		const socTrackX = node.x + 14;
		const socTrackY = node.y + node.h - 9;
		const socTrackW = Math.max(0, node.w - 28);
		const socFillW = node.batterySoc === void 0 ? 0 : socTrackW * node.batterySoc / 100;
		return w`
      <g
        class=${`node ${node.kind} ${activity} ${node.warning ? "warning" : ""} ${clickable ? "clickable" : ""}`}
        @click=${() => this._handleNodeClick(node)}
        @mouseenter=${() => {
			this._hoveredNode = node.id;
		}}
        @mouseleave=${() => {
			this._hoveredNode = void 0;
		}}
      >
        <rect
          x=${node.x}
          y=${node.y}
          width=${node.w}
          height=${node.h}
          rx="15"
          ry="15"
          class=${`node-bg ${node.kind}`}
        ></rect>
        <text x=${node.x + 14} y=${titleY} class="node-title">
          <tspan class="node-icon">${icon[node.kind]}</tspan>
          <tspan dx="8">${this._short(node.title, node.badge ? 20 : 28)}</tspan>
        </text>
        ${node.badge ? w`
            <g class=${`status-badge ${node.badge.startsWith("⚠") ? "warning" : ""}`}>
              <rect
                x=${node.x + node.w - Math.min(92, Math.max(52, node.badge.length * 7 + 20)) - 14}
                y=${node.y + 10}
                width=${Math.min(92, Math.max(52, node.badge.length * 7 + 20))}
                height="23"
                rx="11.5"
              ></rect>
              <text
                x=${node.x + node.w - 14 - Math.min(92, Math.max(52, node.badge.length * 7 + 20)) / 2}
                y=${node.y + 26}
                text-anchor="middle"
              >${this._short(node.badge, 15)}</text>
            </g>
          ` : A}
        <text x=${node.x + 14} y=${mainY} class="node-main">${node.main}</text>
        ${node.sub ? w`<text x=${node.x + 14} y=${subY} class="node-sub">${this._short(node.sub, 34)}</text>` : A}
        ${node.kind === "battery" && node.batterySoc !== void 0 ? w`
            <rect
              x=${socTrackX}
              y=${socTrackY}
              width=${socTrackW}
              height="4.5"
              rx="2.25"
              class="battery-soc-track"
            ></rect>
            <rect
              x=${socTrackX}
              y=${socTrackY}
              width=${socFillW}
              height="4.5"
              rx="2.25"
              class="battery-soc-fill"
            ></rect>
            <line
              x1=${socTrackX + socTrackW * .2}
              y1=${socTrackY - 1.5}
              x2=${socTrackX + socTrackW * .2}
              y2=${socTrackY + 6}
              class="battery-soc-mark"
            ></line>
            <line
              x1=${socTrackX + socTrackW * .8}
              y1=${socTrackY - 1.5}
              x2=${socTrackX + socTrackW * .8}
              y2=${socTrackY + 6}
              class="battery-soc-mark"
            ></line>
          ` : A}
        ${node.heatPump ? w`<text x=${node.x + node.w - 14} y=${node.y + node.h - 12} text-anchor="end" class="node-action">${this._heatExpanded ? "▲" : "▼"}</text>` : A}
      </g>
    `;
	}
	_handleNodeClick(node) {
		if (node.heatPump) {
			this._heatExpanded = !this._heatExpanded;
			return;
		}
		if (node.entity) this._openMoreInfo(node.entity);
	}
	_openMoreInfo(entityId) {
		this.dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId },
			bubbles: true,
			composed: true
		}));
	}
	_connectionPath(from, to) {
		const x1 = from.x + from.w / 2;
		const y1 = from.y + from.h;
		const x2 = to.x + to.w / 2;
		const y2 = to.y;
		const bend = Math.max(38, Math.abs(y2 - y1) * .42);
		return `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
	}
	_horizontalPath(from, to) {
		const fromOnLeft = from.x < to.x;
		const x1 = fromOnLeft ? from.x + from.w : from.x;
		const y1 = from.y + from.h / 2;
		const x2 = fromOnLeft ? to.x : to.x + to.w;
		const y2 = to.y + to.h / 2;
		const mid = (x1 + x2) / 2;
		return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
	}
	_detailItem(label, entity, fallbackUnit = "") {
		if (!entity) return A;
		return b`
      <div class="detail-item" @click=${() => this._openMoreInfo(entity)}>
        <span>${label}</span>
        <strong>${this._formatMeasurement(entity, fallbackUnit)}</strong>
      </div>
    `;
	}
	_heatDetails(hp) {
		const hasAny = [
			hp.flow_temperature,
			hp.return_temperature,
			hp.outdoor_temperature,
			hp.hot_water_temperature,
			hp.room_temperature,
			hp.target_temperature,
			hp.mode,
			hp.compressor_status,
			hp.compressor_frequency,
			hp.thermal_power,
			hp.cop,
			hp.daily_energy
		].some(Boolean);
		return b`
      <div class="heat-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">♨ ${hp.name ?? "Wärmepumpe"}</div>
            <div class="heat-subtitle">Zusätzliche Betriebsdaten</div>
          </div>
          <button @click=${() => {
			this._heatExpanded = false;
		}}>Schließen</button>
        </div>
        ${hasAny ? b`
            <div class="detail-grid">
              ${this._detailItem("Vorlauf", hp.flow_temperature, "°C")}
              ${this._detailItem("Rücklauf", hp.return_temperature, "°C")}
              ${this._detailItem("Außentemperatur", hp.outdoor_temperature, "°C")}
              ${this._detailItem("Warmwasser", hp.hot_water_temperature, "°C")}
              ${this._detailItem("Raumtemperatur", hp.room_temperature, "°C")}
              ${this._detailItem("Solltemperatur", hp.target_temperature, "°C")}
              ${this._detailItem("Betriebsmodus", hp.mode)}
              ${this._detailItem("Kompressor", hp.compressor_status)}
              ${this._detailItem("Kompressorfrequenz", hp.compressor_frequency, "Hz")}
              ${this._detailItem("Thermische Leistung", hp.thermal_power)}
              ${this._detailItem("COP", hp.cop)}
              ${this._detailItem("Tagesenergie", hp.daily_energy)}
            </div>
          ` : b`<div class="empty-detail">Noch keine Detail-Entities für die Wärmepumpe konfiguriert.</div>`}
      </div>
    `;
	}
	render() {
		if (!this.hass) return A;
		const layout = this._layout();
		const pvTotal = this._totalPvW();
		const dailyItems = this._dailyItems();
		const houseBranchIds = layout.bottom.filter((item) => item.source === "house").map((item) => item.node.id);
		return b`
      <ha-card class=${`text-${this._config.text_size ?? "large"}`}>
        <div class="header">
          <div>
            <div class="title">${this._config.title ?? "Energiefluss"}</div>
            <div class="subtitle">
              PV gesamt <strong>${this._formatW(pvTotal, true)}</strong>
              <span class="separator">·</span>
              ${(this._config.solar ?? []).length} PV-System${(this._config.solar ?? []).length === 1 ? "" : "e"}
            </div>
          </div>
          <div class="version">v${CARD_VERSION}</div>
        </div>

        ${dailyItems.length ? b`
            <div class="daily-summary">
              ${dailyItems.map((item) => b`
                <button class="daily-item" @click=${() => this._openMoreInfo(item.entity)}>
                  <span>${item.label}</span>
                  <strong>${item.value}</strong>
                </button>
              `)}
            </div>
          ` : A}

        <div class="diagram-fit">
          <svg
            viewBox=${`0 0 ${layout.width} ${layout.height}`}
            style="width:100%; height:auto;"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Energiefluss"
          >
            ${layout.pvClusters.map((cluster) => {
			const systemPower = this._pvSystemPowerW(cluster.system);
			return w`
                <rect
                  x=${cluster.x}
                  y=${cluster.y}
                  width=${cluster.width}
                  height=${cluster.height}
                  rx="24"
                  class="cluster-bg"
                ></rect>
                ${cluster.children.map((child, childIndex) => {
				const power = this._powerW(cluster.system.children?.[childIndex]?.power);
				return this._flowPath(this._connectionPath(child, cluster.parent), this._positiveFlow(power), power, `pv-child-${cluster.systemIndex}-${childIndex}`, [child.id, cluster.parent.id]);
			})}
                ${this._flowPath(this._connectionPath(cluster.parent, layout.center), this._positiveFlow(systemPower), systemPower, `pv-system-${cluster.systemIndex}`, [
				cluster.parent.id,
				layout.center.id,
				...cluster.children.map((child) => child.id)
			])}
              `;
		})}

            ${this._flowPath(this._horizontalPath(layout.grid, layout.center), this._gridFlow(), this._powerW(this._config.grid?.power), "grid", [layout.grid.id, layout.center.id])}

            ${this._flowPath(this._horizontalPath(layout.center, layout.house), this._positiveFlow(this._housePowerInfo().value), this._housePowerInfo().value, "house", [
			layout.center.id,
			layout.house.id,
			...houseBranchIds
		])}

            ${layout.bottom.map((item) => {
			const source = item.source === "house" ? layout.house : layout.center;
			const path = this._connectionPath(source, item.node);
			const direction = item.source === "house" ? item.direction : item.direction;
			return this._flowPath(path, direction, item.numericPower ?? this._powerW(item.power), item.node.id, [source.id, item.node.id]);
		})}

            ${layout.pvClusters.map((cluster) => w`
              ${cluster.children.map((child) => this._node(child))}
              ${this._node(cluster.parent)}
            `)}
            ${this._node(layout.grid)}
            ${this._node(layout.center)}
            ${this._node(layout.house)}
            ${layout.bottom.map((item) => this._node(item.node))}
          </svg>
        </div>

        <div class="legend">
          <span><i class="dot active"></i> aktiver Energiefluss</span>
          <span><i class="dot idle"></i> kein relevanter Fluss</span>
        </div>

        ${this._heatExpanded && this._config.heat_pump ? this._heatDetails(this._config.heat_pump) : A}
      </ha-card>
    `;
	}
	static {
		this.styles = i$3`
    :host {
      display: block;
      --apfc-flow: var(--primary-color);
      --apfc-line: color-mix(in srgb, var(--secondary-text-color) 28%, transparent);
      --apfc-node-bg: color-mix(in srgb, var(--card-background-color) 94%, var(--primary-color) 6%);
      --apfc-solar: var(--warning-color, #f4b400);
      --apfc-grid: var(--info-color, #039be5);
      --apfc-battery: var(--success-color, #43a047);
      --apfc-heat: var(--orange-color, #fb8c00);
      --apfc-consumer: var(--primary-color);
    }

    ha-card {
      overflow: hidden;
      padding: 20px;
      --apfc-title-size: 24px;
      --apfc-subtitle-size: 14px;
      --apfc-node-title-size: 17px;
      --apfc-node-icon-size: 19px;
      --apfc-node-main-size: 24px;
      --apfc-node-sub-size: 13.5px;
      --apfc-badge-size: 11.5px;
    }

    ha-card.text-small {
      --apfc-title-size: 22px;
      --apfc-subtitle-size: 13px;
      --apfc-node-title-size: 15.5px;
      --apfc-node-icon-size: 17.5px;
      --apfc-node-main-size: 22px;
      --apfc-node-sub-size: 12.5px;
      --apfc-badge-size: 10.5px;
    }

    ha-card.text-large {
      --apfc-title-size: 25px;
      --apfc-subtitle-size: 14.5px;
      --apfc-node-title-size: 18.5px;
      --apfc-node-icon-size: 20.5px;
      --apfc-node-main-size: 25.5px;
      --apfc-node-sub-size: 14.5px;
      --apfc-badge-size: 12px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }

    .title {
      font-size: var(--apfc-title-size);
      line-height: 1.2;
      font-weight: 700;
      color: var(--primary-text-color);
    }

    .subtitle {
      margin-top: 6px;
      font-size: var(--apfc-subtitle-size);
      color: var(--secondary-text-color);
    }

    .subtitle strong { color: var(--primary-text-color); }
    .separator { margin: 0 6px; }

    .version {
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .daily-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
      gap: 8px;
      margin: 0 0 12px;
    }

    .daily-item {
      display: grid;
      gap: 2px;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: color-mix(in srgb, var(--secondary-background-color) 58%, transparent);
      color: inherit;
      text-align: left;
      cursor: pointer;
      font: inherit;
    }

    .daily-item:hover {
      border-color: var(--primary-color);
    }

    .daily-item span {
      font-size: 11px;
      color: var(--secondary-text-color);
    }

    .daily-item strong {
      font-size: 14px;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .diagram-fit {
      width: 100%;
      overflow: hidden;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      max-width: 1100px;
      margin: 0 auto;
      overflow: visible;
    }

    .cluster-bg {
      fill: color-mix(in srgb, var(--apfc-solar) 4%, var(--secondary-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 20%, var(--divider-color));
      stroke-width: 1.2;
    }

    .flow-base {
      fill: none;
      stroke: var(--apfc-line);
      stroke-width: 7;
      stroke-linecap: round;
    }

    .flow {
      fill: none;
      stroke: var(--apfc-flow);
      stroke-width: 3.8;
      stroke-linecap: round;
      stroke-dasharray: 8 14;
      opacity: .98;
      filter: drop-shadow(0 0 1.5px color-mix(in srgb, var(--apfc-flow) 42%, transparent));
      animation: dash var(--flow-duration, 1.35s) linear infinite;
    }

    .flow.reverse { animation-direction: reverse; }
    .flow.off { opacity: 0; animation: none; }

    .flow-base,
    .flow {
      transition: opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease;
    }

    .flow-base.dimmed { opacity: .16; }
    .flow.dimmed { opacity: .14; }
    .flow-base.focus { opacity: 1; stroke-width: 8.5; }
    .flow.focus {
      opacity: 1;
      stroke-width: 4.8;
      filter: drop-shadow(0 0 3px color-mix(in srgb, var(--apfc-flow) 58%, transparent));
    }

    @keyframes dash {
      to { stroke-dashoffset: -50; }
    }

    .node-bg {
      fill: var(--apfc-node-bg);
      stroke: color-mix(in srgb, var(--divider-color) 82%, var(--primary-color) 18%);
      stroke-width: 1.45;
      filter: drop-shadow(0 2px 2px color-mix(in srgb, var(--primary-text-color) 9%, transparent));
      transition: opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease;
    }

    .node.active .node-bg {
      stroke-width: 1.9;
      filter: drop-shadow(0 2px 3px color-mix(in srgb, var(--primary-color) 12%, transparent));
    }

    .node.warning .node-bg {
      stroke: var(--error-color, #db4437);
      stroke-width: 2.2;
      filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--error-color, #db4437) 18%, transparent));
    }

    .node.warning .node-sub {
      fill: var(--error-color, #db4437);
      font-weight: 700;
    }

    .node.idle .node-bg {
      opacity: .58;
      filter: none;
    }

    .node.idle .node-icon { opacity: .46; }
    .node.idle .node-main { opacity: .68; }
    .node.idle .node-title { opacity: .72; }
    .node.idle .node-sub { opacity: .58; }

    .node.unknown .node-bg {
      opacity: .56;
      stroke-dasharray: 5 4;
      filter: none;
    }

    .node.unknown .node-icon,
    .node.unknown .node-main,
    .node.unknown .node-sub { opacity: .62; }

    .node-bg.pv,
    .node-bg.pv-parent {
      fill: color-mix(in srgb, var(--apfc-solar) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 46%, var(--divider-color));
    }

    .node-bg.pv-parent {
      fill: color-mix(in srgb, var(--apfc-solar) 12%, var(--card-background-color));
      stroke-width: 1.8;
    }

    .node-bg.center {
      fill: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--primary-color) 68%, var(--divider-color));
      stroke-width: 2.2;
      filter: drop-shadow(0 3px 4px color-mix(in srgb, var(--primary-color) 18%, transparent));
    }

    .node-bg.grid {
      fill: color-mix(in srgb, var(--apfc-grid) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-grid) 40%, var(--divider-color));
    }

    .node-bg.battery {
      fill: color-mix(in srgb, var(--apfc-battery) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-battery) 40%, var(--divider-color));
    }

    .node-bg.heat {
      fill: color-mix(in srgb, var(--apfc-heat) 9%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-heat) 42%, var(--divider-color));
    }

    .node-bg.house,
    .node-bg.consumer {
      fill: color-mix(in srgb, var(--apfc-consumer) 7%, var(--card-background-color));
    }

    .node.pv .node-icon,
    .node.pv-parent .node-icon { fill: var(--apfc-solar); }
    .node.grid .node-icon { fill: var(--apfc-grid); }
    .node.battery .node-icon { fill: var(--apfc-battery); }
    .node.heat .node-icon { fill: var(--apfc-heat); }

    .node-title {
      fill: var(--secondary-text-color);
      font-size: var(--apfc-node-title-size);
      font-weight: 650;
    }

    .node-icon {
      fill: var(--primary-color);
      font-size: var(--apfc-node-icon-size);
    }

    .node-main {
      fill: var(--primary-text-color);
      font-size: var(--apfc-node-main-size);
      font-weight: 750;
    }

    .node-sub {
      fill: var(--secondary-text-color);
      font-size: var(--apfc-node-sub-size);
    }

    .battery-soc-track {
      fill: color-mix(in srgb, var(--secondary-text-color) 18%, transparent);
    }

    .battery-soc-fill {
      fill: var(--apfc-battery);
      filter: drop-shadow(0 0 1px color-mix(in srgb, var(--apfc-battery) 35%, transparent));
    }

    .battery-soc-mark {
      stroke: color-mix(in srgb, var(--primary-text-color) 34%, transparent);
      stroke-width: 1;
      pointer-events: none;
    }

    .status-badge rect {
      fill: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--primary-color) 42%, var(--divider-color));
      stroke-width: 1;
    }

    .status-badge text {
      fill: color-mix(in srgb, var(--primary-color) 76%, var(--primary-text-color));
      font-size: var(--apfc-badge-size);
      font-weight: 700;
    }

    .node.heat .status-badge rect {
      fill: color-mix(in srgb, var(--apfc-heat) 16%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-heat) 48%, var(--divider-color));
    }

    .node.heat .status-badge text {
      fill: color-mix(in srgb, var(--apfc-heat) 78%, var(--primary-text-color));
    }

    .node.grid .status-badge rect {
      fill: color-mix(in srgb, var(--apfc-grid) 14%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-grid) 46%, var(--divider-color));
    }

    .node.grid .status-badge text {
      fill: color-mix(in srgb, var(--apfc-grid) 78%, var(--primary-text-color));
    }

    .status-badge.warning rect {
      fill: color-mix(in srgb, var(--error-color, #db4437) 15%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--divider-color));
    }

    .status-badge.warning text {
      fill: color-mix(in srgb, var(--error-color, #db4437) 82%, var(--primary-text-color));
    }

    .node.idle .status-badge,
    .node.unknown .status-badge { opacity: .7; }

    .node-action {
      fill: var(--secondary-text-color);
      font-size: 14px;
    }

    .clickable { cursor: pointer; }
    .clickable:hover .node-bg {
      stroke: var(--primary-color);
      stroke-width: 2.4;
      filter: drop-shadow(0 3px 4px color-mix(in srgb, var(--primary-color) 18%, transparent));
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      padding-top: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.active { background: var(--primary-color); }
    .dot.idle { background: var(--divider-color); }

    .heat-details {
      margin-top: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 16px;
      background: color-mix(in srgb, var(--secondary-background-color) 62%, transparent);
    }

    .heat-details-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .heat-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text-color);
    }

    .heat-subtitle {
      margin-top: 2px;
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .heat-details button {
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 7px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }

    .detail-item {
      display: grid;
      gap: 4px;
      min-height: 58px;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 11px;
      background: var(--card-background-color);
      cursor: pointer;
    }

    .detail-item:hover { border-color: var(--primary-color); }
    .detail-item span { font-size: 12px; color: var(--secondary-text-color); }
    .detail-item strong { font-size: 16px; color: var(--primary-text-color); }
    .empty-detail { color: var(--secondary-text-color); font-size: 13px; }

    @media (max-width: 700px) {
      ha-card { padding: 12px; }
      .version { font-size: 11.5px; }
      .legend { font-size: 11.5px; gap: 10px; }
      .daily-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        margin-bottom: 8px;
      }
      .daily-item { padding: 7px 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .flow { animation: none; }
    }
  `;
	}
};
if (!customElements.get("advanced-power-flow-card")) customElements.define("advanced-power-flow-card", AdvancedPowerFlowCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "advanced-power-flow-card")) window.customCards.push({
	type: "advanced-power-flow-card",
	name: CARD_NAME,
	description: "Flexible power-flow visualization with dynamic PV systems, MPPTs, batteries and consumers.",
	preview: true,
	configurable: true
});
console.info(`%c ${CARD_NAME} %c v${CARD_VERSION} `, "background:#03a9f4;color:white;font-weight:700;", "background:#222;color:white;");
//#endregion
export { AdvancedPowerFlowCard };

//# sourceMappingURL=advanced-power-flow-card.js.map