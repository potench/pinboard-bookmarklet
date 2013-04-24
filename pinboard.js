(function () {
	var doc = document,
		src = doc.getElementById("pinboard-hook").getAttribute("src"),
		form = '<form id="pinboard-bookmarklet" method="POST"><a id="pinboard-close">X</a><fieldset><input type="hidden" id="pb_auth_token" name="pb_auth_token" value=""/><ul><li><input name="tags" id="pb_tags" placeholder="Tags" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" value=""></li><li><input name="pb_title" id="pb_title" type="text" placeholder="Title" autocomplete="off" autocapitalize="off" value=""></li><li><textarea name="pb_description" id="pb_description" placeholder="Description" autocomplete="off" autocapitalize="off" rows="2"></textarea></li><li><input type="text" id="pb_url" name="pb_url" placeholder="URL" autocorrect="off" value=""></li><li><input type="submit" value="&#10003;"/></li></ul></fieldset></form>',
		//&#10003;"

		qs = querystring(src);

	var css,

		resizeTimer,
		scale = 280,

		container,
		close,

		formWrapper;

	var pinboard = {

		init : function () {
			doc.title = "(Pinning) " + qs.title;

			this.addOverlay();
			this.updateViewport();
			this.addStyleSheet();
			this.loadPinboard();
		},

		loadPinboard : function () {
			formWrapper = doc.createElement('div');
			formWrapper.innerHTML = form;
			container.appendChild(formWrapper);

			form = doc.getElementById('pinboard-bookmarklet');
			form.onsubmit = this.onSubmit.bind(this);

			// close button
			close = doc.getElementById("pinboard-close");
			close.onclick = this.onClose.bind(this);

			doc.getElementById('pb_auth_token').value = qs.auth_token || "";
			doc.getElementById('pb_url').value =  decodeURI(qs.url);
			doc.getElementById('pb_title').value = qs.title;

			var desc = this.getDescription();

			doc.getElementById('pb_description').value = desc || "";
		},

		getDescription : function () {
			var desc = getByTag("meta", "name", "description");

			if (desc) {
				desc = desc.getAttribute("content");
			} else { // no description, just get the first h1 as a guess

				desc = doc.getElementsByTagName("h1");

				if (desc) {
					desc = desc[0].innerText;
				} else {
					desc = "";
				}
			}

			return desc;

		},

		updateViewport : function () {
			window.onresize = this.onResize.bind(this);
			this.onResize();
		},

		onResize : function() {
			if (resizeTimer) {
				window.clearTimeout(resizeTimer);
			}

			resizeTimer = window.setTimeout(function () {
				var sW = window.innerWidth,
					sH = window.innerHeight;

				resizeTimer = null;

				container.style.fontSize = (Math.round((sW / scale) * 100) + "%");
			}, 200);
		},

		addStyleSheet : function () {
			css = doc.createElement('link');
			css.setAttribute('rel','stylesheet');
			css.setAttribute('href', qs.root + 'bookmarklet.css');
			doc.head.appendChild(css);
		},

		addOverlay : function () {
			container = doc.createElement("DIV");
			container.setAttribute("id", "pinboard-overlay");
			doc.body.appendChild(container);

			window.setTimeout(this.revealOverlay.bind(this), 200);
		},

		revealOverlay : function () {
			var style = window.getComputedStyle(container),
				top = style.getPropertyValue('top');

			if (top !== "-100%") {
				window.setTimeout(this.revealOverlay.bind(this), 2000);
			} else { // reveal the overlay
				container.setAttribute("class", "on");
			}
		},

		onClose : function () {
			container.setAttribute("class", "off");
			doc.title = qs.title;
			window.setTimeout(function () {
				this.destroy();
			}.bind(this), 230);
		},

		onSubmit : function (e) {
			e.preventDefault();

			var auth_token = doc.getElementById('pb_auth_token').value,
				url = doc.getElementById('pb_url').value,
				description = doc.getElementById('pb_title').value,
				extended = doc.getElementById('pb_description').value,
				tags = doc.getElementById('pb_tags').value;

			var method = "POST",
				src = "https://api.pinboard.in/v1/posts/add?format=json&auth_token=" + auth_token + "&url=" + url + "&extended=" + extended + "&description=" + description + "&tags=" + tags,
				postbody,
				errorFn = this.onComplete.bind(this), // this is expected, but fine we don't need a response
				completionFn = function () {}

			if (!auth_token) {
				this.onComplete.bind(this);
				alert("Error: No auth-token given.");
				return false;
			}
			try {
				if (window.XDomainRequest) {
					//
				} else if (window.XMLHttpRequest) {
					var x = new XMLHttpRequest();
					x.open(method, src, true);
					x.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
					x.onreadystatechange = function(){
						try {
							if (x.readyState != 4) return;
							if (x.status != 200) throw(0);
							completionFn(x.responseText);
						} catch (e) { errorFn(); }
					}
					x.send(postbody);
				} else {
					errorFn();
				}
			} catch (e) { errorFn(); }

			return false;
		},

		onComplete : function () {
			this.onClose();
		},

		destroy : function () {
			removeEl(css);
			removeEl("pinboard-overlay");
		}
	};

	pinboard.init();


	// tools
	function querystring(q) {
		q = q.substr(q.indexOf("?") + 1);
		var qo = {};

		q.replace(
			new RegExp("([^?=&]+)(=([^&]*))?", "g"),
			function($0, $1, $2, $3) { qo[$1] = $3; }
		);
		return qo;
	}

	function removeEl(elem) {
		elem = (typeof elem === "string") ? doc.getElementById(elem) : elem;
		return elem.parentNode.removeChild(elem);
	}

	function getByTag(tag, prop, val) {
		var metas = document.getElementsByTagName(tag),
			i = metas.length - 1;

		for (i; i >= 0; i--) {
			if (metas[i].getAttribute(prop) === val) {
				return metas[i];
			}
		}

		return null;
	}

})();
