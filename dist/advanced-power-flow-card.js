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
//#region src/editor.ts
var AdvancedPowerFlowCardEditor = class extends i {
	constructor(..._args) {
		super(..._args);
		this._config = { type: "custom:advanced-power-flow-card" };
	}
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true }
		};
	}
	setConfig(config) {
		this._config = structuredClone(config);
	}
	_get(path) {
		let value = this._config;
		for (const key of path) {
			if (!value || typeof value !== "object") return void 0;
			value = value[key];
		}
		return value;
	}
	_set(path, value) {
		const next = structuredClone(this._config);
		let cursor = next;
		path.forEach((key, index) => {
			if (index === path.length - 1) {
				if (value === "" || value === void 0 || value === null) delete cursor[key];
				else cursor[key] = value;
				return;
			}
			const existing = cursor[key];
			if (!existing || typeof existing !== "object" || Array.isArray(existing)) cursor[key] = {};
			cursor = cursor[key];
		});
		this._config = next;
		this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: this._config },
			bubbles: true,
			composed: true
		}));
	}
	_entityPicker(label, path) {
		const value = this._get(path) ?? "";
		return b`
      <label>${label}</label>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${value}
        .allowCustomEntity=${true}
        @value-changed=${(event) => this._set(path, event.detail?.value ?? "")}
      ></ha-entity-picker>
    `;
	}
	_textInput(label, path, placeholder = "") {
		return b`
      <label>${label}</label>
      <input
        type="text"
        .value=${this._get(path) ?? ""}
        placeholder=${placeholder}
        @input=${(event) => this._set(path, event.target.value)}
      />
    `;
	}
	_numberInput(label, path, fallback) {
		const value = this._get(path) ?? fallback;
		return b`
      <label>${label}</label>
      <input
        type="number"
        .value=${String(value)}
        @input=${(event) => this._set(path, Number(event.target.value))}
      />
    `;
	}
	_checkbox(label, path, fallback) {
		const stored = this._get(path);
		return b`
      <label class="check">
        <input
          type="checkbox"
          .checked=${typeof stored === "boolean" ? stored : fallback}
          @change=${(event) => this._set(path, event.target.checked)}
        />
        <span>${label}</span>
      </label>
    `;
	}
	render() {
		if (!this.hass) return A;
		return b`
      <div class="editor">
        <section>
          <h3>Allgemein</h3>
          ${this._textInput("Titel", ["title"], "Energiefluss")}
          ${this._numberInput("Animationsschwelle in W", ["power_threshold"], 5)}
        </section>

        ${this._pvSection("PV1", "pv1")}
        ${this._pvSection("PV2", "pv2")}
        ${this._pvSection("PV3", "pv3")}

        ${this._batterySection("Batterie 1", "battery1")}
        ${this._batterySection("Batterie 2", "battery2")}

        <section>
          <h3>Netz</h3>
          ${this._entityPicker("Leistung", ["grid", "power"])}
          ${this._checkbox("Positiver Wert bedeutet Netzbezug", ["grid", "positive_is_import"], true)}
        </section>

        <section>
          <h3>Haus</h3>
          ${this._textInput("Name", ["house", "name"], "Haus")}
          ${this._entityPicker("Leistung", ["house", "power"])}
        </section>

        <section>
          <h3>Wärmepumpe</h3>
          ${this._textInput("Name", ["heat_pump", "name"], "Wärmepumpe")}
          ${this._entityPicker("Leistung", ["heat_pump", "power"])}
        </section>
      </div>
    `;
	}
	_pvSection(title, key) {
		return b`
      <section>
        <h3>${title}</h3>
        ${this._textInput("Name", [
			"solar",
			key,
			"name"
		], title)}
        ${this._entityPicker("Leistung", [
			"solar",
			key,
			"power"
		])}
        ${this._entityPicker("Spannung", [
			"solar",
			key,
			"voltage"
		])}
        ${this._entityPicker("Strom", [
			"solar",
			key,
			"current"
		])}
      </section>
    `;
	}
	_batterySection(title, key) {
		return b`
      <section>
        <h3>${title}</h3>
        ${this._textInput("Name", [key, "name"], title)}
        ${this._entityPicker("Leistung", [key, "power"])}
        ${this._entityPicker("Ladezustand (SOC)", [key, "soc"])}
        ${this._checkbox("Positiver Wert bedeutet Laden", [key, "positive_is_charging"], true)}
      </section>
    `;
	}
	static {
		this.styles = i$3`
    :host {
      display: block;
    }

    .editor {
      display: grid;
      gap: 12px;
      padding: 4px 0;
    }

    section {
      display: grid;
      grid-template-columns: minmax(140px, 0.8fr) minmax(180px, 1.4fr);
      gap: 8px 12px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }

    h3 {
      grid-column: 1 / -1;
      margin: 0 0 4px;
      font-size: 15px;
    }

    label {
      align-self: center;
      font-size: 14px;
    }

    input[type="text"],
    input[type="number"] {
      box-sizing: border-box;
      width: 100%;
      min-height: 40px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 8px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }

    .check {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    @media (max-width: 600px) {
      section {
        grid-template-columns: 1fr;
      }

      h3,
      .check {
        grid-column: 1;
      }
    }
  `;
	}
};
if (!customElements.get("advanced-power-flow-card-editor")) customElements.define("advanced-power-flow-card-editor", AdvancedPowerFlowCardEditor);
//#endregion
//#region src/advanced-power-flow-card.ts
var CARD_NAME = "Advanced Power Flow Card";
var CARD_VERSION = "0.1.0";
var AdvancedPowerFlowCard = class extends i {
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true }
		};
	}
	static getConfigElement() {
		return document.createElement("advanced-power-flow-card-editor");
	}
	static getStubConfig() {
		return {
			type: "custom:advanced-power-flow-card",
			title: "Energiefluss",
			solar: {
				pv1: {
					name: "PV1",
					power: "sensor.goodwe_pv1_power",
					voltage: "sensor.goodwe_pv1_voltage",
					current: "sensor.goodwe_pv1_current"
				},
				pv2: {
					name: "PV2",
					power: "sensor.goodwe_pv2_power",
					voltage: "sensor.goodwe_pv2_voltage",
					current: "sensor.goodwe_pv2_current"
				},
				pv3: {
					name: "PV3",
					power: "sensor.goodwe_pv3_power",
					voltage: "sensor.goodwe_pv3_voltage",
					current: "sensor.goodwe_pv3_current"
				}
			},
			battery1: {
				name: "Batterie 1",
				power: "sensor.battery_1_power",
				soc: "sensor.battery_1_soc",
				positive_is_charging: true
			},
			battery2: {
				name: "Batterie 2",
				power: "sensor.battery_2_power",
				soc: "sensor.battery_2_soc",
				positive_is_charging: true
			},
			grid: {
				power: "sensor.grid_power",
				positive_is_import: true
			},
			house: {
				name: "Haus",
				power: "sensor.house_power"
			},
			heat_pump: {
				name: "Wärmepumpe",
				power: "sensor.heatpump_power"
			},
			power_threshold: 5
		};
	}
	setConfig(config) {
		if (!config) throw new Error("Konfiguration fehlt.");
		this._config = structuredClone(config);
	}
	getCardSize() {
		return 5;
	}
	getGridOptions() {
		return {
			rows: 5,
			columns: 12,
			min_rows: 4,
			min_columns: 6
		};
	}
	_state(entityId) {
		if (!entityId || !this.hass) return void 0;
		return this.hass.states[entityId];
	}
	_number(entityId) {
		const state = this._state(entityId);
		if (!state || state.state === "unknown" || state.state === "unavailable") return;
		const value = Number(state.state.replace(",", "."));
		return Number.isFinite(value) ? value : void 0;
	}
	_unit(entityId) {
		const unit = this._state(entityId)?.attributes?.unit_of_measurement;
		return typeof unit === "string" ? unit : "";
	}
	_powerW(entityId) {
		const value = this._number(entityId);
		if (value === void 0) return void 0;
		const unit = this._unit(entityId).toLowerCase();
		if (unit === "kw") return value * 1e3;
		if (unit === "mw") return value * 1e6;
		return value;
	}
	_formatPower(entityId) {
		const watts = this._powerW(entityId);
		if (watts === void 0) return "—";
		if (Math.abs(watts) >= 1e3) return `${(watts / 1e3).toLocaleString(void 0, { maximumFractionDigits: 2 })} kW`;
		return `${watts.toLocaleString(void 0, { maximumFractionDigits: 0 })} W`;
	}
	_formatMeasurement(entityId, fallbackUnit = "") {
		const value = this._number(entityId);
		if (value === void 0) return "—";
		const unit = this._unit(entityId) || fallbackUnit;
		return `${value.toLocaleString(void 0, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
	}
	_formatSoc(entityId) {
		const value = this._number(entityId);
		return value === void 0 ? "SOC —" : `SOC ${value.toLocaleString(void 0, { maximumFractionDigits: 0 })} %`;
	}
	_pvSub(config) {
		if (!config) return "";
		return `${this._formatMeasurement(config.voltage, "V")} · ${this._formatMeasurement(config.current, "A")}`;
	}
	_threshold() {
		return Math.max(0, this._config.power_threshold ?? 5);
	}
	_flowForPositivePower(entityId) {
		const p = this._powerW(entityId);
		if (p === void 0 || Math.abs(p) <= this._threshold()) return "off";
		return p > 0 ? "forward" : "reverse";
	}
	_gridFlow() {
		const p = this._powerW(this._config.grid?.power);
		if (p === void 0 || Math.abs(p) <= this._threshold()) return "off";
		return (this._config.grid?.positive_is_import ?? true ? p > 0 : p < 0) ? "forward" : "reverse";
	}
	_batteryFlow(config) {
		const p = this._powerW(config?.power);
		if (p === void 0 || Math.abs(p) <= this._threshold()) return "off";
		return (config?.positive_is_charging ?? true ? p > 0 : p < 0) ? "forward" : "reverse";
	}
	_duration(entityId) {
		const p = Math.abs(this._powerW(entityId) ?? 0);
		if (p <= this._threshold()) return 2.4;
		return 2.3 - Math.min(1, Math.log10(Math.max(100, p)) / 4) * 1.5;
	}
	_sumPvW() {
		const values = [
			this._config.solar?.pv1?.power,
			this._config.solar?.pv2?.power,
			this._config.solar?.pv3?.power
		].map((id) => this._powerW(id)).filter((v) => v !== void 0);
		return values.length ? values.reduce((a, b) => a + b, 0) : void 0;
	}
	_formatW(value) {
		if (value === void 0) return "—";
		if (Math.abs(value) >= 1e3) return `${(value / 1e3).toLocaleString(void 0, { maximumFractionDigits: 2 })} kW`;
		return `${value.toLocaleString(void 0, { maximumFractionDigits: 0 })} W`;
	}
	_flowPath(d, direction, powerEntity, key = "") {
		return w`
      <path d=${d} class="flow-base"></path>
      <path
        d=${d}
        class="flow ${direction}"
        style=${`--flow-duration:${this._duration(powerEntity)}s`}
        pathLength="100"
        data-key=${key}
      ></path>
    `;
	}
	_node(data) {
		const icon = {
			pv: "☀",
			center: "⚡",
			grid: "⇄",
			house: "⌂",
			battery: "▰",
			heat: "♨"
		}[data.kind];
		const titleY = data.y + 29;
		const mainY = data.y + 57;
		const subY = data.y + 78;
		return w`
      <g
        class=${`node ${data.entity ? "clickable" : ""}`}
        @click=${() => data.entity && this._openMoreInfo(data.entity)}
      >
        <rect
          x=${data.x}
          y=${data.y}
          width=${data.w}
          height=${data.h}
          rx="16"
          ry="16"
          class=${`node-bg ${data.kind}`}
        ></rect>

        <text x=${data.x + 16} y=${titleY} class="node-title">
          <tspan class="node-icon">${icon}</tspan>
          <tspan dx="7">${data.title}</tspan>
        </text>

        <text x=${data.x + 16} y=${mainY} class="node-main">
          ${data.main}
        </text>

        ${data.sub ? w`<text x=${data.x + 16} y=${subY} class="node-sub">${data.sub}</text>` : A}
      </g>
    `;
	}
	_openMoreInfo(entity) {
		const event = new Event("hass-action", {
			bubbles: true,
			composed: true
		});
		event.detail = {
			config: {
				entity,
				tap_action: { action: "more-info" }
			},
			action: "tap"
		};
		this.dispatchEvent(event);
	}
	render() {
		if (!this._config || !this.hass) return A;
		const pv1 = this._config.solar?.pv1;
		const pv2 = this._config.solar?.pv2;
		const pv3 = this._config.solar?.pv3;
		const battery1 = this._config.battery1;
		const battery2 = this._config.battery2;
		const grid = this._config.grid;
		const house = this._config.house;
		const heatPump = this._config.heat_pump;
		const pvTotal = this._sumPvW();
		return b`
      <ha-card>
        <div class="header">
          <div>
            <div class="title">${this._config.title ?? "Energiefluss"}</div>
            <div class="subtitle">PV gesamt ${this._formatW(pvTotal)}</div>
          </div>
          <div class="version">v${CARD_VERSION}</div>
        </div>

        <div class="canvas">
          <svg
            viewBox="0 0 1000 650"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Energiefluss"
          >
            ${this._flowPath("M 170 142 C 170 210, 360 210, 455 270", this._flowForPositivePower(pv1?.power), pv1?.power, "pv1")}
            ${this._flowPath("M 500 142 L 500 258", this._flowForPositivePower(pv2?.power), pv2?.power, "pv2")}
            ${this._flowPath("M 830 142 C 830 210, 640 210, 545 270", this._flowForPositivePower(pv3?.power), pv3?.power, "pv3")}

            ${this._flowPath("M 260 334 L 430 334", this._gridFlow(), grid?.power, "grid")}

            ${this._flowPath("M 570 334 L 740 334", this._flowForPositivePower(house?.power), house?.power, "house")}

            ${this._flowPath("M 450 386 C 430 430, 385 455, 350 490", this._batteryFlow(battery1), battery1?.power, "battery1")}

            ${this._flowPath("M 550 386 C 570 430, 615 455, 650 490", this._batteryFlow(battery2), battery2?.power, "battery2")}

            ${this._flowPath("M 840 395 L 840 490", this._flowForPositivePower(heatPump?.power), heatPump?.power, "heatpump")}

            ${this._node({
			title: pv1?.name ?? "PV1",
			main: this._formatPower(pv1?.power),
			sub: this._pvSub(pv1),
			entity: pv1?.power,
			kind: "pv",
			x: 70,
			y: 55,
			w: 200,
			h: 88
		})}

            ${this._node({
			title: pv2?.name ?? "PV2",
			main: this._formatPower(pv2?.power),
			sub: this._pvSub(pv2),
			entity: pv2?.power,
			kind: "pv",
			x: 400,
			y: 55,
			w: 200,
			h: 88
		})}

            ${this._node({
			title: pv3?.name ?? "PV3",
			main: this._formatPower(pv3?.power),
			sub: this._pvSub(pv3),
			entity: pv3?.power,
			kind: "pv",
			x: 730,
			y: 55,
			w: 200,
			h: 88
		})}

            ${this._node({
			title: "PV / Wechselrichter",
			main: this._formatW(pvTotal),
			sub: "Zentraler Energiefluss",
			kind: "center",
			x: 430,
			y: 278,
			w: 140,
			h: 108
		})}

            ${this._node({
			title: "Netz",
			main: this._formatPower(grid?.power),
			sub: this._gridFlow() === "forward" ? "Bezug" : this._gridFlow() === "reverse" ? "Einspeisung" : "Ruhe",
			entity: grid?.power,
			kind: "grid",
			x: 60,
			y: 290,
			w: 200,
			h: 88
		})}

            ${this._node({
			title: house?.name ?? "Haus",
			main: this._formatPower(house?.power),
			sub: "Gesamtverbrauch",
			entity: house?.power,
			kind: "house",
			x: 740,
			y: 290,
			w: 200,
			h: 105
		})}

            ${this._node({
			title: battery1?.name ?? "Batterie 1",
			main: this._formatPower(battery1?.power),
			sub: this._formatSoc(battery1?.soc),
			entity: battery1?.power ?? battery1?.soc,
			kind: "battery",
			x: 215,
			y: 490,
			w: 240,
			h: 96
		})}

            ${this._node({
			title: battery2?.name ?? "Batterie 2",
			main: this._formatPower(battery2?.power),
			sub: this._formatSoc(battery2?.soc),
			entity: battery2?.power ?? battery2?.soc,
			kind: "battery",
			x: 545,
			y: 490,
			w: 240,
			h: 96
		})}

            ${this._node({
			title: heatPump?.name ?? "Wärmepumpe",
			main: this._formatPower(heatPump?.power),
			sub: "Teil des Hausverbrauchs",
			entity: heatPump?.power,
			kind: "heat",
			x: 760,
			y: 490,
			w: 180,
			h: 96
		})}
          </svg>
        </div>

        <div class="legend">
          <span><i class="dot active"></i> aktiver Energiefluss</span>
          <span><i class="dot idle"></i> kein relevanter Fluss</span>
        </div>
      </ha-card>
    `;
	}
	static {
		this.styles = i$3`
    :host {
      display: block;
      --apfc-flow: var(--primary-color);
      --apfc-line: color-mix(
        in srgb,
        var(--secondary-text-color) 36%,
        transparent
      );
      --apfc-node-bg: color-mix(
        in srgb,
        var(--card-background-color) 92%,
        var(--primary-color) 8%
      );
    }

    ha-card {
      overflow: hidden;
      padding: 16px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 4px;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .subtitle,
    .version {
      margin-top: 3px;
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .canvas {
      width: 100%;
      min-height: 360px;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      min-height: 360px;
      overflow: visible;
    }

    .flow-base {
      fill: none;
      stroke: var(--apfc-line);
      stroke-width: 8;
      stroke-linecap: round;
    }

    .flow {
      fill: none;
      stroke: var(--apfc-flow);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 8 14;
      opacity: 0.95;
      animation: dash var(--flow-duration, 1.4s) linear infinite;
    }

    .flow.reverse {
      animation-direction: reverse;
    }

    .flow.off {
      opacity: 0;
      animation: none;
    }

    @keyframes dash {
      to {
        stroke-dashoffset: -44;
      }
    }

    .node-bg {
      fill: var(--apfc-node-bg);
      stroke: color-mix(
        in srgb,
        var(--divider-color) 85%,
        var(--primary-color) 15%
      );
      stroke-width: 1.4;
    }

    .node-bg.center {
      fill: color-mix(
        in srgb,
        var(--primary-color) 13%,
        var(--card-background-color)
      );
      stroke: color-mix(
        in srgb,
        var(--primary-color) 55%,
        var(--divider-color)
      );
    }

    .node-title {
      fill: var(--secondary-text-color);
      font-size: 15px;
      font-weight: 600;
    }

    .node-icon {
      fill: var(--primary-color);
      font-size: 18px;
    }

    .node-main {
      fill: var(--primary-text-color);
      font-size: 21px;
      font-weight: 700;
    }

    .node-sub {
      fill: var(--secondary-text-color);
      font-size: 12px;
    }

    .clickable {
      cursor: pointer;
    }

    .clickable:hover .node-bg {
      stroke: var(--primary-color);
      stroke-width: 2;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 2px;
      color: var(--secondary-text-color);
      font-size: 11px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.active {
      background: var(--primary-color);
    }

    .dot.idle {
      background: var(--divider-color);
    }

    @media (max-width: 700px) {
      ha-card {
        padding: 12px;
      }

      .canvas {
        min-height: 320px;
      }

      svg {
        min-height: 320px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .flow {
        animation: none;
      }
    }
  `;
	}
};
if (!customElements.get("advanced-power-flow-card")) customElements.define("advanced-power-flow-card", AdvancedPowerFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({
	type: "advanced-power-flow-card",
	name: CARD_NAME,
	description: "Power-flow visualization with three PV strings, two batteries, grid, house and heat pump.",
	preview: true,
	configurable: true
});
console.info(`%c ${CARD_NAME} %c v${CARD_VERSION} `, "background:#03a9f4;color:white;font-weight:700;", "background:#222;color:white;");
//#endregion
export { AdvancedPowerFlowCard };

//# sourceMappingURL=advanced-power-flow-card.js.map