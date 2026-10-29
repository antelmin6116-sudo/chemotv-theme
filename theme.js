/*
 * BlackEye - tema moderno (solo apariencia).
 *
 * Se ejecuta DENTRO de la pagina del servidor (https://<dominio>/app/) despues de cargar,
 * inyectado por el APK. No toca conexion, API, login ni reproduccion: solo cambia
 * colores, tipografia, bordes/animaciones y el diseno de la escena de busqueda.
 * Cada parche va en try/catch: si algo falla, la app sigue funcionando con el diseno original.
 */
(function () {
    if (window.__bxTheme) return;
    if (location.protocol !== "https:" && !window.__bxTest) return;
    if (typeof ra !== "function" || typeof G !== "function" || typeof ud !== "function" ||
        typeof P !== "function" || typeof M !== "function" || typeof La !== "function") {
        if (document.title === "vsjsapp" && window.vsaClient) vsaClient.Toast("Tema: la pagina del servidor cambio, no se aplico");
        return;
    }
    window.__bxTheme = "1.0";

    /* base grafito elegante; el color vivo lo da el tipo de contenido */
    var BG = "#101217",
        IRIS = "radial-gradient(1000px 620px at 18% -12%,rgba(130,150,180,.10),rgba(0,0,0,0) 58%)," +
            "radial-gradient(900px 620px at 112% 112%,rgba(90,110,145,.12),rgba(0,0,0,0) 58%)," +
            "linear-gradient(150deg,#0c0d11 0%,#13151b 48%,#1a1d25 100%)",
        GLASS = "rgba(20, 22, 29, 0.66)",
        STROKE = "1px solid rgba(255, 255, 255, 0.10)",
        TEXT = "#eef1f6",
        MUTED = "rgba(226, 230, 238, 0.55)",
        KEY_BG = "rgba(255, 255, 255, 0.055)",
        ACCENT = "#7ed0ff",                 /* acento frio (cursor, progreso) */
        ACCENT2 = "#5a6578",
        ACCENT_SOFT = "#c3cedd",            /* platino */
        STEEL = "#aeb8c7",
        GRAD = "linear-gradient(90deg,#434c5e 0%,#697488 100%)",
        GRAD_V = "linear-gradient(150deg,#5c6578 0%,#394150 100%)";

    function rgba(hex, a) {
        hex = (hex || "#000").replace("#", "");
        var n = parseInt(hex, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    /* paleta por tipo de contenido (vivida) */
    var TYPES = {
        movie: { c: "#4ea3ff", label: "PELÍCULA" },
        series: { c: "#b57cff", label: "SERIE" },
        collection: { c: "#2fd4bf", label: "COLECCIÓN" },
        episode: { c: "#2fd4bf", label: "EPISODIO" },
        concert: { c: "#ff6ad5", label: "CONCIERTO" },
        live: { c: "#ff6b5e", label: "EN VIVO" },
        kids: { c: "#ffcc4d", label: "INFANTIL" },
        other: { c: "#aeb8c7", label: "" }
    };
    function bxType(rc, name) {
        if (rc && TYPES[rc]) return TYPES[rc];
        var s = (name || "").toString().toLowerCase();
        if (/concier|concert|músic|music|show en vivo/.test(s)) return TYPES.concert;
        if (/vivo|live|canal|directo|tv en/.test(s)) return TYPES.live;
        if (/kids|infant|niñ|disney/.test(s)) return TYPES.kids;
        if (/serie|novela|temporada/.test(s)) return TYPES.series;
        if (/colec|saga/.test(s)) return TYPES.collection;
        if (/película|pelicula|movie|cine|estreno/.test(s)) return TYPES.movie;
        return TYPES.other;
    }

    /* limpia sufijos del catalogo (*Lat*, *Sub*, 4K, etc.) para buscar en TMDb y para mostrar */
    function bxCleanTitle(s) {
        return (s || "").toString()
            .replace(/\*[^*]*\*/g, " ")
            .replace(/[\[\(][^\]\)]*[\]\)]/g, " ")
            .replace(/\b(4k|uhd|fhd|hd|sd|lat|latino|sub|subtitulad[oa]s?|castellano|dual|dualaudio|esp|espanol|español|ingles|ing|vose?|hdr|dolby)\b/gi, " ")
            .replace(/\s*[-|]\s*$/, "").replace(/\s{2,}/g, " ").replace(/^\s+|\s+$/g, "");
    }
    /* es una version en espanol latino? (lo que el usuario consume) */
    function bxIsLat(s) { s = (s || "").toString(); return /\blat\b|latino|\besp\b|español|espanol|castellano/i.test(s) || !/\bsub\b|subtitulad/i.test(s); }
    function bxIsSub(s) { return /\bsub\b|subtitulad/i.test((s || "").toString()); }

    /* nombres de menu en espanol */
    var ES_NAMES = {
        "movies": "Películas", "movie": "Películas", "movies by genre": "Películas por género",
        "movies by rating": "Películas por rating", "movies by year": "Películas por año",
        "movies by country": "Películas por país", "4k": "4K", "series": "Series", "tv series": "Series",
        "tv series by country": "Series por país", "tv series by network": "Series por productora",
        "live tv": "TV en vivo", "live tv national": "TV en vivo nacional", "live tv usa": "TV en vivo USA",
        "live tv international": "TV en vivo internacional", "search": "Buscar", "favorites": "Favoritos",
        "settings": "Configuraciones", "concerts": "Conciertos", "kids zone": "Zona para niños",
        "kidszone": "Zona para niños", "live events": "Eventos en vivo", "recorded events": "Eventos grabados",
        "adults": "Adultos", "adult": "Adultos", "adults vod": "Adultos"
    };
    function bxEsName(s) {
        var k = (s || "").toString().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").toLowerCase();
        return ES_NAMES[k] || s;
    }

    /* ---- agrupacion de la barra en menus desplegables ---- */
    /* a que familia pertenece una seccion (para la barra padre + submenu) */
    function bxGroupKey(name) {
        var s = (name || "").toString().toLowerCase();
        if (/adult|adulto|\bxxx\b|porn|\+\s*18/.test(s)) return null;        /* adultos: suelto */
        if (/serie/.test(s)) return "series";
        if (/\btv\b|canal/.test(s) && /(vivo|live|nacional|national|usa|internacional|international)/.test(s)) return "livetv";
        if (/live\s*tv/.test(s)) return "livetv";
        if (/(movie|pel[ií]cula|pelicula)/.test(s) || /\b4k\b/.test(s)) return "movies";
        return null;   /* suelto (busqueda, favoritos, config, conciertos, eventos, ninos...) */
    }
    var GROUP_LABEL = { movies: "Películas", series: "Series", livetv: "TV en vivo" };
    /* etiqueta corta del hijo dentro del submenu */
    function bxChildLabel(key, name) {
        var s = (name || "").toString().toLowerCase();
        if (/g[eé]nero|genre/.test(s)) return "Por género";
        if (/rating|clasificaci/.test(s)) return "Por rating";
        if (/year|a[ñn]o/.test(s)) return "Por año";
        if (/country|pa[ií]s|pais/.test(s)) return "Por país";
        if (/network|productor/.test(s)) return "Por productoras";
        if (/\b4k\b|uhd/.test(s)) return "4K";
        if (/nacional|national/.test(s)) return "Nacional";
        if (/\busa\b|estados unidos/.test(s)) return "USA";
        if (/internacional|international/.test(s)) return "Internacional";
        return "Todas";   /* la seccion base (p.ej. "Movies" A-Z) */
    }
    /* construye las entradas de la barra: padres con hijos + sueltos, en orden del catalogo */
    function bxBuildGroups(items) {
        var entries = [], byKey = {}, idxToEntry = [], idxToChild = [];
        for (var i = 0; i < items.length; i++) {
            var name = items[i].hc || items[i].fe || "", key = bxGroupKey(name), entry;
            if (key && byKey[key]) { entry = byKey[key]; }
            else {
                entry = { key: key || ("single" + i), label: key ? GROUP_LABEL[key] : bxEsName(name),
                          color: bxType(items[i].rc, name).c, childIdxs: [], childLabels: [], group: !!key };
                entries.push(entry);
                if (key) byKey[key] = entry;
            }
            idxToEntry[i] = entries.indexOf(entry);
            idxToChild[i] = entry.childIdxs.length;
            entry.childIdxs.push(i);
            entry.childLabels.push(key ? bxChildLabel(key, name) : entry.label);
        }
        /* un grupo con un solo hijo se comporta como suelto (sin desplegable) */
        for (var e = 0; e < entries.length; e++) if (entries[e].childIdxs.length < 2) entries[e].group = false;
        return { entries: entries, idxToEntry: idxToEntry, idxToChild: idxToChild };
    }

    /* TMDb: amplia la busqueda a otros idiomas y por actor. Solo lee metadatos (titulos y elenco);
       no toca la conexion ni el login. Si falla o esta vacio, la busqueda normal del servidor sigue igual. */
    /* la clave de TMDb NO vive en este archivo (es publico); la inyecta el cargador del APK */
    var BX_TMDB_KEY = (typeof window !== "undefined" && window.BX_TMDB_KEY) || "";
    var TMDB_IMG = "https://image.tmdb.org/t/p/";
    var BX_VERSION = "v26";   /* se muestra en el chip de "Buscar actualizaciones" del inicio */

    function tmdb(path, params, cb) {
        try {
            params = params || {};
            params.api_key = BX_TMDB_KEY;
            var qs = [];
            for (var k in params) if (params.hasOwnProperty(k))
                qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
            var x = new XMLHttpRequest();
            x.open("GET", "https://api.themoviedb.org/3/" + path + "?" + qs.join("&"), true);
            x.timeout = 8000;
            x.onreadystatechange = function () {
                if (x.readyState !== 4) return;
                var r = null;
                try { if (x.status === 200) r = JSON.parse(x.responseText); } catch (e) {}
                cb(r);
            };
            x.onerror = x.ontimeout = function () { cb(null); };
            x.send();
        } catch (e) { cb(null); }
    }

    var failed = [];
    function safe(name, fn) {
        try { fn(); } catch (e) {
            failed.push(name);
            if (window.console) console.log("[bx] " + name + ": " + e);
        }
    }

    function el(tag, css, parent) {
        var d = document.createElement(tag);
        if (css) d.style.cssText = css;
        if (parent) parent.appendChild(d);
        return d;
    }

    /* Envuelve un constructor global conservando su prototipo (instanceof sigue igual). */
    function wrapCtor(name, after, before) {
        var orig = window[name];
        if (typeof orig !== "function" || orig.__bx) return;
        var w = function () {
            var args = Array.prototype.slice.call(arguments);
            if (before) { try { args = before.call(this, args) || args; } catch (e) {} }
            orig.apply(this, args);
            if (after) { try { after.call(this, args); } catch (e) {} }
        };
        w.prototype = orig.prototype;
        w.__bx = orig;
        window[name] = w;
    }

    /* Envuelve un metodo de prototipo ejecutando "after" tras el original. */
    function wrapMethod(proto, name, after) {
        var orig = proto[name];
        if (typeof orig !== "function" || orig.__bx) return;
        var w = function () {
            var r = orig.apply(this, arguments);
            try { after.apply(this, arguments); } catch (e) {}
            return r;
        };
        w.__bx = orig;
        proto[name] = w;
    }

    /* ---------- 1. Tipografia y CSS global ---------- */
    safe("css", function () {
        var head = document.head || document.getElementsByTagName("head")[0];
        var pc = el("link", null, head);
        pc.rel = "preconnect";
        pc.href = "https://fonts.gstatic.com";
        pc.crossOrigin = "anonymous";
        var lk = el("link", null, head);
        lk.rel = "stylesheet";
        lk.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow+Semi+Condensed:wght@700;800&display=swap";

        var scenes = ["AuthenticateScene", "HomeScene", "SettingsScene", "SearchScene", "FavoritesScene",
            "GridViewScene", "SeasonViewScene", "EpisodeViewScene", "DetailViewScene",
            "FullSynopsisScene", "LinkAccountScene", "LinkingDoneScene"];
        var sceneSel = scenes.map(function (s) { return "#" + s; }).join(",");
        var posterScenes = ["GridViewScene", "FavoritesScene", "SeasonViewScene", "EpisodeViewScene", "DetailViewScene"]
            .map(function (s) { return "#" + s + " img"; }).join(",");

        var css = [
            /* Gotham -> Barlow (moderna, condensada; misma anchura aproximada) */
            '[style*="GothamCondensed"]{font-family:"Barlow Condensed",GothamCondensed,sans-serif!important;font-weight:500!important;font-synthesis:none}',
            '[style*="GothamCondensedBold"]{font-family:"Barlow Condensed",GothamCondensedBold,sans-serif!important;font-weight:700!important}',
            '[style*="GothamBlack"]{font-family:"Barlow Semi Condensed",GothamBlack,sans-serif!important;font-weight:800!important;letter-spacing:.3px}',
            /* fondo de escenas (nunca el body: el video se ve a traves de la WebView) */
            sceneSel + "{background:" + IRIS + "!important;background-color:" + BG + "!important}",
            posterScenes + "{border-radius:10px}",
            /* capa tornasol sobre la imagen de fondo del servidor: con "screen" lo negro se vuelve
               degradado y el logo/lineas claras se conservan; la capa interna se mueve lento (GPU) */
            ".bx-iris{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:0;" +
                "mix-blend-mode:screen}",
            ".bx-iris div{position:absolute;left:-25%;top:-25%;width:150%;height:150%;background:" + IRIS + ";" +
                "-webkit-animation:bxShift 24s ease-in-out infinite alternate;animation:bxShift 24s ease-in-out infinite alternate}",
            "@-webkit-keyframes bxShift{from{-webkit-transform:translate3d(-6%,-4%,0) rotate(0deg)}to{-webkit-transform:translate3d(6%,4%,0) rotate(8deg)}}",
            "@keyframes bxShift{from{transform:translate3d(-6%,-4%,0) rotate(0deg)}to{transform:translate3d(6%,4%,0) rotate(8deg)}}",
            ".bx-overlay{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:0;" +
                "background:linear-gradient(180deg,rgba(10,6,30,0) 0%,rgba(10,6,30,.05) 50%,rgba(10,6,30,.55) 100%)}",
            /* carrusel principal */
            ".bx-tile{transition:left .28s cubic-bezier(.2,.8,.2,1),top .28s cubic-bezier(.2,.8,.2,1),width .28s cubic-bezier(.2,.8,.2,1)," +
                "height .28s cubic-bezier(.2,.8,.2,1),opacity .28s,box-shadow .28s}",
            ".bx-tile img{transition:width .28s cubic-bezier(.2,.8,.2,1),height .28s cubic-bezier(.2,.8,.2,1)}",
            /* teclado de busqueda */
            ".bx-key{transition:transform .12s ease-out,box-shadow .12s ease-out,background .12s}",
            ".bx-key-label{text-transform:uppercase}",
            /* filas de resultados */
            ".bx-results-list{transition:transform .22s cubic-bezier(.2,.8,.2,1)}",
            ".bx-meta{color:" + MUTED + ";margin-left:10px;font-size:.82em}",
            ".bx-badge{position:absolute;right:14px;top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%);" +
                "padding:2px 10px;border-radius:999px;font:600 14px 'Barlow Condensed',sans-serif;letter-spacing:.8px;" +
                "color:#fff;background:rgba(255,255,255,.12)}",
            ".bx-badge{border:1px solid rgba(255,255,255,.12)}",
            ".bx-via{position:absolute;right:96px;top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%);" +
                "padding:1px 8px;border-radius:999px;background:rgba(255,255,255,.08);" +
                "font:600 12px 'Barlow Condensed',sans-serif;letter-spacing:.6px;text-transform:uppercase;color:rgba(255,255,255,.6)}",
            ".bx-hint{position:absolute;left:0;width:100%;text-align:center;color:" + MUTED + ";white-space:normal}",
            ".bx-lens{position:absolute;width:16px;height:16px;border:3px solid rgba(232,238,255,.75);border-radius:50%}",
            ".bx-lens:after{content:'';position:absolute;width:9px;height:3px;background:rgba(232,238,255,.75);border-radius:2px;" +
                "left:13px;top:17px;-webkit-transform:rotate(45deg);transform:rotate(45deg)}"
        ].join("\n");
        var st = el("style", null, head);
        st.id = "bx-theme";
        st.appendChild(document.createTextNode(css));
    });

    /* ---------- 2. Paleta global del motor (se lee cada vez que se construye una escena) ---------- */
    safe("palette", function () {
        window.Kb = ACCENT;                         /* acento principal */
        window.Za = ACCENT_SOFT;                    /* barras de progreso */
        window.Ib = GLASS;                          /* paneles */
        window.zb = "#141722";
        window.Xa = KEY_BG;                         /* teclas / botones inactivos */
        window.gb = "solid rgba(255,255,255,0)";    /* borde de la barra de foco de listas */
        window.Rb = "solid rgba(255,255,255,0.08)";
        if (typeof C === "object" && C) {
            C.kk = GRAD;                                                     /* foco de listas */
            C.me = "linear-gradient(180deg,#232838 0%,#12141e 100%)";         /* placeholder de imagen */
            C.sk = "linear-gradient(180deg,#1b1f2e 0%,#0c0e16 100%)";         /* dialogos */
            C.Ef = "linear-gradient(180deg,#2a3048 0%,#151826 100%)";
            C.Bl = "linear-gradient(180deg,#3a4262 0%,#1c2133 100%)";
        }
    });

    /* ---------- 3. Rectangulos: sombra suave en vez de la sombra negra dura ---------- */
    safe("P", function () {
        wrapCtor("P", function () {
            this.a.style.boxShadow = "0 10px 30px rgba(0,0,0,.45)";
        });
    });

    /* ---------- 4. Capa de degradado sobre la imagen de fondo de cada menu ---------- */
    function addOverlay(scene) {
        if (!scene || !scene.m || !scene.m.a || !scene.m.a.parentNode) return;
        var iris = el("div");
        iris.className = "bx-iris";
        el("div", null, iris);
        var ov = el("div");
        ov.className = "bx-overlay";
        scene.m.a.parentNode.insertBefore(ov, scene.m.a.nextSibling);
        scene.m.a.parentNode.insertBefore(iris, scene.m.a.nextSibling);
    }
    safe("overlays", function () {
        ["sd", "td", "vd", "wd", "xd", "yd", "zd", "Cd"].forEach(function (n) {
            if (typeof window[n] === "function" && window[n].prototype)
                wrapMethod(window[n].prototype, "xa", function () { addOverlay(this); });
        });
    });

    /* ---------- 5. Menu principal estilo Prime: barra de categorias arriba + hero ---------- */
    safe("homeNav", function () {
        if (typeof sd !== "function" || !sd.prototype) return;
        var origXa = sd.prototype.xa;
        sd.prototype.xa = function () {
            var r = origXa.apply(this, arguments);   /* arma this.dc (carrusel de secciones) */
            try { bxHomeLayout(this); } catch (e) { if (window.console) console.log("[bx] home: " + e); }
            return r;
        };
    });

    /* oculta el carrusel nativo (coverflow gris). display:none es a prueba de balas: los hijos
       del motor se ponen visibility:visible y anulan un visibility:hidden del padre en el WebView del TV. */
    function bxHideNative(scene) {
        try {
            if (scene.dc && scene.dc.a) scene.dc.a.style.display = "none";
            if (scene.j && scene.j.a) scene.j.a.style.display = "none";
            if (scene.m && scene.m.a) scene.m.a.style.display = "none";
        } catch (e) {}
    }

    function bxHomeLayout(scene) {
        var dc = scene.dc;
        if (!dc || !dc.items || !dc.a) return;
        bxHideNative(scene);

        var W = scene.b.width, H = scene.b.height;

        /* collage de portadas de la seccion (bordes difuminados y celdas redondeadas) */
        var mask = "radial-gradient(135% 120% at 88% 45%, #000 42%, rgba(0,0,0,0) 86%)";
        var collage = el("div", "position:absolute;right:0;top:0;width:66%;height:100%;z-index:0;overflow:hidden;" +
            "display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:" + Math.ceil((H + 30) / 4) + "px;gap:10px;padding:10px;box-sizing:border-box;" +
            "opacity:0;transition:opacity .5s;-webkit-mask-image:" + mask + ";mask-image:" + mask, scene.a);
        /* dibujo tematico para secciones sin portadas (configuracion, favoritos, busqueda...) */
        var art = el("div", "position:absolute;right:7%;top:50%;width:380px;height:380px;margin-top:-190px;z-index:1;display:none;opacity:.85", scene.a);
        /* +18 para adultos */
        var adult = el("div", "position:absolute;right:0;top:0;width:64%;height:100%;z-index:1;display:none;" +
            "-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center", scene.a);
        var ab = el("div", "width:240px;height:240px;border-radius:50%;border:10px solid #ff6b5e;display:flex;" +
            "-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;" +
            "font:800 84px 'Barlow Semi Condensed',sans-serif;color:#ff6b5e;box-shadow:0 0 80px rgba(255,107,94,.5);background:rgba(16,18,23,.45)", adult);
        ab.appendChild(document.createTextNode("+18"));
        /* scrim */
        el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;" +
            "background:linear-gradient(90deg,rgba(16,18,23,1) 22%,rgba(16,18,23,.5) 60%,rgba(16,18,23,.2) 100%)," +
            "linear-gradient(0deg,rgba(16,18,23,.95) 0%,rgba(16,18,23,0) 34%)", scene.a);

        /* logo chemotv (grande) */
        var logo = el("div", "position:absolute;left:48px;top:58px;z-index:5;white-space:nowrap", scene.a);
        var mark = el("span", "display:inline-block;vertical-align:middle;width:54px;height:54px;border-radius:16px;margin-right:14px;position:relative;" +
            "background:linear-gradient(135deg,#4ea3ff,#b57cff);box-shadow:0 7px 22px rgba(78,163,255,.5)", logo);
        el("span", "position:absolute;left:20px;top:15px;width:0;height:0;border-left:17px solid #0c0d11;" +
            "border-top:13px solid transparent;border-bottom:13px solid transparent", mark);
        var word = el("span", "display:inline-block;vertical-align:middle;font:800 48px 'Barlow Semi Condensed',sans-serif;letter-spacing:.5px", logo);
        var c1 = el("span", "color:#f4f6ff", word); c1.appendChild(document.createTextNode("chemo"));
        var c2 = el("span", "background:linear-gradient(135deg,#4ea3ff,#b57cff);-webkit-background-clip:text;background-clip:text;color:transparent", word);
        c2.appendChild(document.createTextNode("tv"));

        /* barra de categorias con scroll (la seleccionada se centra, mas grande) */
        /* el clip es ALTO y centra verticalmente: asi el aro/brillo de la tab seleccionada (escala 1.3)
           no se corta por arriba. overflow:hidden sigue recortando los lados para el scroll horizontal. */
        var navClip = el("div", "position:absolute;left:360px;right:44px;top:40px;height:100px;z-index:4;overflow:hidden;" +
            "display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-box-align:center", scene.a);
        /* relleno a los lados (~medio ancho visible) para poder centrar cualquier tab */
        var navStrip = el("div", "position:relative;white-space:nowrap;padding:0 430px;-webkit-flex:0 0 auto;flex:0 0 auto;" +
            "transition:-webkit-transform .28s cubic-bezier(.2,.8,.2,1),transform .28s cubic-bezier(.2,.8,.2,1)", navClip);
        var grp = bxBuildGroups(dc.items);
        var tabs = [], caret = [];
        for (var gi = 0; gi < grp.entries.length; gi++) {
            var ent = grp.entries[gi];
            var tab = el("span", "display:inline-block;vertical-align:middle;margin:0 9px;padding:6px 18px;border-radius:14px;" +
                "font:600 27px 'Barlow Condensed',sans-serif;letter-spacing:.3px;color:rgba(238,241,246,.5);background:transparent;" +
                "-webkit-transform-origin:center;transform-origin:center;transition:-webkit-transform .2s,transform .2s,color .2s,background .2s", navStrip);
            tab.appendChild(document.createTextNode(ent.label));
            if (ent.group) { var cv = el("span", "font-size:17px;opacity:.65;margin-left:7px", tab); cv.appendChild(document.createTextNode("▾")); }
            tabs.push(tab);
        }
        /* submenu desplegable VERTICAL (se abre hacia abajo bajo el padre activo) */
        var drop = el("div", "position:absolute;top:150px;z-index:6;display:none;padding:9px;border-radius:16px;min-width:230px;" +
            "background:rgba(14,16,21,.97);box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);" +
            "transition:opacity .18s;opacity:0", scene.a);

        /* hero */
        var heroTitle = el("div", "position:absolute;left:64px;top:300px;width:620px;z-index:3;" +
            "font:800 66px 'Barlow Semi Condensed',GothamBlack,sans-serif;color:" + TEXT +
            ";text-shadow:0 3px 22px rgba(0,0,0,.75);line-height:68px;max-height:140px;overflow:hidden", scene.a);
        heroTitle.appendChild(document.createTextNode(""));
        var heroDesc = el("div", "position:absolute;left:64px;top:446px;width:560px;z-index:3;" +
            "font:400 22px/29px 'Barlow',sans-serif;color:rgba(238,241,246,.82);max-height:60px;overflow:hidden", scene.a);
        heroDesc.appendChild(document.createTextNode(""));
        var heroHint = el("div", "position:absolute;left:64px;top:528px;z-index:3;padding:12px 28px;border-radius:999px;" +
            "font:700 21px 'Barlow Condensed',sans-serif;letter-spacing:.6px;color:#0c0d11;background:#fff;display:inline-block", scene.a);
        heroHint.appendChild(document.createTextNode("▶  Entrar"));

        /* chip "Buscar actualizaciones" (se enfoca con ARRIBA desde la barra) */
        var upd = el("div", "position:absolute;left:48px;bottom:28px;z-index:5;padding:9px 18px;border-radius:999px;white-space:nowrap;" +
            "font:700 17px 'Barlow Condensed',sans-serif;letter-spacing:.4px;color:rgba(238,241,246,.7);" +
            "background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);" +
            "-webkit-transform-origin:left center;transform-origin:left center;transition:all .18s", scene.a);
        upd.appendChild(document.createTextNode("⟳  Buscar actualizaciones · chemotv " + BX_VERSION));

        scene.__bxHome = { tabs: tabs, navClip: navClip, navStrip: navStrip, drop: drop, grp: grp, collage: collage, art: art, adult: adult, heroTitle: heroTitle, heroDesc: heroDesc, heroHint: heroHint, upd: upd };
        scene.__bxColCache = {}; scene.__bxColGen = 0; scene.__bxColTimer = null;
        bxHomeUpdate(dc);
        /* al construir, la escena aun esta oculta (offsetLeft=0) y la barra no puede centrarse;
           reintentamos cuando ya es visible y tiene layout, si no el primer render se descuadra. */
        var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 32); };
        raf(function () { raf(function () { try { bxHomeUpdate(dc); } catch (e) {} }); });
        setTimeout(function () { try { bxHomeUpdate(dc); } catch (e) {} }, 140);
        setTimeout(function () { try { bxHomeUpdate(dc); } catch (e) {} }, 450);
    }

    function bxIsAdult(name) { return /adult|adulto|\bxxx\b|porn/i.test((name || "").toString()) || /\+\s*18/.test(name || ""); }

    /* dibuja el submenu VERTICAL bajo el padre activo. inSub = el foco bajo (en el submenu) */
    function bxRenderDrop(home, grp, ei, sel, tx, hc, inSub) {
        var drop = home.drop; if (!drop) return;
        var entry = grp && grp.entries[ei];
        if (!entry || !entry.group) { drop.style.display = "none"; drop.style.opacity = "0"; return; }
        var childPos = grp.idxToChild[sel];
        while (drop.firstChild) drop.removeChild(drop.firstChild);
        /* pista "▾ abajo" cuando el foco aun esta en la barra (no has entrado al submenu) */
        if (!inSub) {
            var hint = el("div", "padding:2px 14px 7px;font:700 13px 'Barlow Condensed',sans-serif;letter-spacing:1px;" +
                "color:" + rgba(hc, .9) + ";text-align:center", drop);
            hint.appendChild(document.createTextNode("▾  BAJA PARA ELEGIR"));
        }
        for (var k = 0; k < entry.childLabels.length; k++) {
            var on = inSub && k === childPos;
            var row = el("div", "padding:9px 20px;border-radius:11px;margin:2px 0;white-space:nowrap;" +
                "font:600 23px 'Barlow Condensed',sans-serif;letter-spacing:.3px;" +
                "color:" + (on ? "#ffffff" : "rgba(238,241,246,.6)") + ";" +
                "background:" + (on ? rgba(hc, .3) : "transparent") + ";" +
                "box-shadow:" + (on ? "inset 0 0 0 1px " + rgba(hc, .65) : "none") + ";" +
                "text-shadow:" + (on ? "0 0 16px " + rgba(hc, .85) : "none") + "", drop);
            row.appendChild(document.createTextNode(entry.childLabels[k]));
        }
        drop.style.display = "block";
        drop.style.opacity = "1";
        try {
            var tab = home.tabs[ei];
            var left = home.navClip.offsetLeft + tab.offsetLeft + tx;
            var rightEdge = home.navClip.offsetLeft + home.navClip.clientWidth;
            var dw = drop.offsetWidth || 230;
            if (left + dw > rightEdge) left = rightEdge - dw;
            if (left < 24) left = 24;
            drop.style.left = Math.round(left) + "px";
        } catch (e) {}
    }

    function bxIsLiveEvents(name) {
        var s = (name || "").toString().toLowerCase();
        if (/grabad|recorded/.test(s)) return false;         /* "Eventos grabados" queda como esta */
        return (/evento|event/.test(s) && /vivo|live/.test(s));
    }
    /* iconos de deportes (viewBox 24) para el mosaico de "Eventos en vivo" */
    var SPORTS = [
        '<circle cx="12" cy="12" r="9"/><path d="M12 7l4.5 3.3-1.7 5.4h-5.6L7.5 10.3z"/>',                 /* futbol */
        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3.8 3 3.8 9.8 0 12.8M18.4 5.6c-3.8 3-3.8 9.8 0 12.8"/>', /* basket */
        '<ellipse cx="12" cy="12" rx="9" ry="5.5"/><path d="M8 12h8M10 10v4M14 10v4"/>',                   /* futbol americano */
        '<circle cx="12" cy="12" r="9"/><path d="M5 5c5 3 5 11 0 14M19 5c-5 3-5 11 0 14"/>',               /* tenis */
        '<circle cx="12" cy="12" r="9"/><path d="M7 5c2 4 2 10 0 14M17 5c-2 4-2 10 0 14"/>',               /* beisbol */
        '<path d="M8 11V7a3 3 0 0 1 6 0v4"/><path d="M14 9h2a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4H9a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2"/>', /* boxeo */
        '<path d="M5 3v18"/><path d="M5 4h13l-3 4 3 4H5"/>',                                                /* bandera carreras */
        '<circle cx="12" cy="12" r="9"/><path d="M12 3c3 5 3 13-4 17M21 12c-5 1-12-2-15-8"/>',             /* voley */
        '<path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M9 20h6M12 12v8"/>', /* trofeo */
        '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4.5-7H16M9.5 7H13"/>', /* ciclismo */
        '<path d="M11 3v13"/><path d="M11 4l6 2.5L11 9"/><circle cx="11" cy="19" r="1.6"/>',                /* golf */
        '<circle cx="12" cy="15" r="5"/><path d="M9 3l3 6 3-6"/>'                                            /* medalla */
    ];
    function bxSportsCollage(scene) {
        var home = scene.__bxHome; if (!home) return;
        if (home.art) home.art.style.display = "none";
        var col = home.collage;
        while (col.firstChild) col.removeChild(col.firstChild);
        for (var i = 0; i < 16; i++) {
            var h = (i * 53) % 360;
            var cell = el("div", "display:flex;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;" +
                "border-radius:16px;overflow:hidden;background:linear-gradient(145deg,hsl(" + h + ",62%,40%),hsl(" + ((h + 45) % 360) + ",58%,17%))", col);
            cell.innerHTML = "<svg width='50%' height='50%' viewBox='0 0 24 24' fill='none' stroke='#ffffff' stroke-width='1.4' " +
                "stroke-linecap='round' stroke-linejoin='round' style='filter:drop-shadow(0 3px 8px rgba(0,0,0,.45))'>" + SPORTS[i % SPORTS.length] + "</svg>";
        }
        col.style.opacity = "1";
    }

    /* chip "Buscar actualizaciones": usa window.bxCheckUpdate del cargador del APK */
    function bxDoUpdate(scene) {
        var home = scene.__bxHome; if (!home || !home.upd) return;
        function setT(t) { try { home.upd.firstChild.data = t; } catch (e) {} }
        function reset() { setT("⟳  Buscar actualizaciones · chemotv " + BX_VERSION); }
        if (typeof window.bxCheckUpdate !== "function") { setT("Actualización no disponible aquí"); setTimeout(reset, 2600); return; }
        setT("Buscando actualizaciones…");
        window.bxCheckUpdate(function (res) {
            if (res === "updated") {
                setT("¡Nueva versión! Aplicando…");
                try { vsaClient.Toast("chemotv: actualizando interfaz…"); } catch (e) {}
                setTimeout(function () { try { location.reload(); } catch (e) {} }, 1200);
            } else if (res === "uptodate") {
                setT("✓  Ya tienes la última versión"); setTimeout(reset, 3000);
            } else {
                setT("Sin conexión — intenta más tarde"); setTimeout(reset, 3000);
            }
        });
    }

    function bxHomeUpdate(dc) {
        var scene = dc.ca, home = scene && scene.__bxHome;
        if (!home) return;
        bxHideNative(scene);   /* re-oculta el coverflow nativo por si el motor lo reactivo */
        var sel = dc.selectedIndex, it = dc.items[sel] || {}, pt = bxType(null, it.hc || it.fe || "");
        var grp = home.grp, ei = grp ? grp.idxToEntry[sel] : sel, inSub = !!scene.__bxInSub;
        /* color de seleccion vivido: para secciones sin tipo (Config/Buscar/Favoritos) usamos el acento */
        var hc = (pt === TYPES.other || pt.c === TYPES.other.c) ? ACCENT : pt.c;
        for (var i = 0; i < home.tabs.length; i++) {
            var on = i === ei, s = home.tabs[i].style;
            /* cuando el foco bajo al submenu, el padre se ve activo pero un poco atenuado */
            s.color = on ? (inSub ? "rgba(255,255,255,.82)" : "#ffffff") : "rgba(238,241,246,.5)";
            s.background = on ? rgba(hc, inSub ? .14 : .24) : "transparent";
            s.fontWeight = on ? "700" : "600";
            s.transform = on ? (inSub ? "scale(1.16)" : "scale(1.3)") : "scale(1)";
            s.webkitTransform = s.transform;
            s.boxShadow = on ? "0 0 0 2px " + rgba(hc, inSub ? .35 : .6) + ",0 6px 24px " + rgba(hc, .4) : "none";
            s.textShadow = on ? "0 0 20px " + rgba(hc, .9) : "none";
        }
        var tx = 0;
        try {
            var tab = home.tabs[ei];
            if (tab) {
                var clipW = home.navClip.clientWidth || 876, pad = home.navPad || 0;
                /* la tira tiene relleno a ambos lados (= medio ancho visible): asi CUALQUIER tab,
                   incluso el primero, puede quedar centrado sin empujar la tira hacia la derecha. */
                tx = Math.round(clipW / 2 - (tab.offsetLeft + tab.offsetWidth / 2));
                if (tx > 0) tx = 0;
                home.navStrip.style.transform = "translateX(" + tx + "px)";
                home.navStrip.style.webkitTransform = "translateX(" + tx + "px)";
            }
        } catch (e) {}
        bxRenderDrop(home, grp, ei, sel, tx, hc, inSub);

        home.heroTitle.firstChild.data = bxEsName(it.hc || "");
        home.heroDesc.firstChild.data = it.fe || "";
        home.heroHint.style.background = (pt === TYPES.other || pt.c === TYPES.other.c) ? ACCENT : pt.c;
        home.heroHint.style.color = "#0c0d11";

        if (home.upd) {   /* chip de actualizaciones: resaltado cuando esta enfocado (ARRIBA) */
            var uon = !!scene.__bxUpd, us = home.upd.style;
            us.color = uon ? "#ffffff" : "rgba(238,241,246,.7)";
            us.background = uon ? rgba(ACCENT, .22) : "rgba(255,255,255,.06)";
            us.borderColor = uon ? ACCENT : "rgba(255,255,255,.14)";
            us.boxShadow = uon ? "0 0 0 2px " + rgba(ACCENT, .55) + ",0 6px 20px " + rgba(ACCENT, .35) : "none";
            us.transform = us.webkitTransform = uon ? "scale(1.06)" : "none";
        }

        var id = it.m, name = it.hc || "";
        home.adult.style.display = "none";
        if (home.art) home.art.style.display = "none";
        if (scene.__bxColTimer) { clearTimeout(scene.__bxColTimer); scene.__bxColTimer = null; }
        if (bxIsLiveEvents(name)) {
            bxSportsCollage(scene);              /* mosaico de deportes en vez de "No hay eventos" */
        } else if (bxIsAdult(name)) {
            home.collage.style.opacity = "0";
            while (home.collage.firstChild) home.collage.removeChild(home.collage.firstChild);
            home.adult.style.display = "flex";
        } else if (id && ("" + id).charAt(0) !== "-") {
            if (scene.__bxColCache[id]) {
                if (scene.__bxColCache[id].length) bxBuildCollage(scene, scene.__bxColCache[id]);
                else bxSectionArt(scene, it);   /* catalogo sin portadas: dibujo tematico */
            } else { home.collage.style.opacity = "0"; scene.__bxColTimer = setTimeout(function () { bxLoadCollage(scene, it); }, 280); }
        } else {
            bxSectionArt(scene, it);   /* configuraciones, favoritos, busqueda... */
        }
    }

    /* paleta de iconos SVG grandes para las secciones sin portadas */
    function bxIconSvg(name, color) {
        var n = (name || "").toLowerCase(), p;
        if (/config|settings|ajuste/.test(n))
            p = '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19"/>';
        else if (/favor|like|me gusta/.test(n))
            p = '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.4 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9z"/>';
        else if (/search|buscar|busqueda/.test(n))
            p = '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>';
        else if (/kid|niñ|nino|caricatur|infant/.test(n))
            p = '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>';
        else if (/concert|musi|conciert/.test(n))
            p = '<circle cx="7" cy="17.5" r="2.6"/><circle cx="17" cy="15.5" r="2.6"/><path d="M9.6 17.5V6l10-2v9.5"/><path d="M9.6 8.5l10-2"/>';
        else if (/event|deporte|sport|grabad/.test(n))
            p = '<path d="M7 4h10v3a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5h4M9 20h6M12 12.5V20"/>';
        else if (/live|tv|vivo|canal/.test(n))
            p = '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 3l4 4 4-4"/><path d="M7 11h6"/>';
        else if (/serie/.test(n))
            p = '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 3l2 3M16 3l-2 3M3 10h18"/>';
        else
            p = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4l-1.5 5M13 4l-1.5 5M18 4l-1.5 5"/>';
        return '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="' + color +
            '" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" ' +
            'style="filter:drop-shadow(0 0 34px ' + rgba(color, .55) + ')">' + p + '</svg>';
    }

    function bxSectionArt(scene, it) {
        var home = scene.__bxHome; if (!home || !home.art) return;
        var pt = bxType(null, it.hc || it.fe || "");
        home.art.innerHTML = bxIconSvg(it.hc || "", pt.c);
        home.art.style.display = "block";
        home.collage.style.opacity = "0";
        while (home.collage.firstChild) home.collage.removeChild(home.collage.firstChild);
    }

    function bxLoadCollage(scene, section) {
        if (typeof cd !== "function") return;
        var gen = ++scene.__bxColGen, id = section.m, it = section;
        try {
            cd(id, false, 0, 3, {
                success: function (r) {
                    if (gen !== scene.__bxColGen || !scene.__bxHome) return;
                    var seen = {}, posters = [];
                    if (r && r.status && r.ie) for (var ci = 0; ci < r.ie.length; ci++) {
                        var cs = r.ie[ci].contents || [];
                        for (var k = 0; k < cs.length; k++) {
                            var item = cs[k], u = item.Ia || item.ud;
                            if (!u || bxIsSub(item.R)) continue;          /* solo Lat: descarta los *Sub* */
                            var t = bxCleanTitle(item.R).toLowerCase() || u;
                            if (seen[t]) continue; seen[t] = 1;           /* sin titulos repetidos */
                            posters.push(u);
                        }
                    }
                    for (var i = posters.length - 1; i > 0; i--) {        /* barajar (aleatorio de todo el catalogo) */
                        var j = Math.floor(Math.random() * (i + 1)), tmp = posters[i]; posters[i] = posters[j]; posters[j] = tmp;
                    }
                    scene.__bxColCache[id] = posters;
                    if (posters.length) bxBuildCollage(scene, posters);
                    else bxSectionArt(scene, it);
                },
                f: function () {}
            });
        } catch (e) {}
    }

    function bxBuildCollage(scene, posters) {
        var home = scene.__bxHome; if (!home) return;
        var col = home.collage;
        if (home.art) home.art.style.display = "none";
        while (col.firstChild) col.removeChild(col.firstChild);
        if (!posters || !posters.length) { col.style.opacity = "0"; return; }
        for (var i = 0; i < 16; i++) {
            var u = posters[i % posters.length];   /* si hay <16 unicas se completan, pero ya vienen barajadas */
            el("div", "background:url('" + u + "') center/cover;background-color:#1a1d24;border-radius:16px;overflow:hidden", col);
        }
        col.style.opacity = "1";
    }

    /* la seleccion del carrusel (ob.K) actualiza barra/hero/collage del home */
    safe("carousel", function () {
        if (typeof ob !== "function") return;
        wrapMethod(ob.prototype, "K", function () {
            try { if (this.ca && this.ca.__bxHome) bxHomeUpdate(this); } catch (e) {}
        });
    });

    /* navegacion de la barra con submenus desplegables:
       izq/der = entre padres (saltando sus hijos); ABAJO = entra al submenu; ARRIBA/ATRAS = sale;
       OK en un padre con submenu = entra; OK en un hijo o seccion simple = lo abre (nativo). */
    safe("homeNav", function () {
        if (typeof sd !== "function" || !sd.prototype || typeof sd.prototype.event !== "function") return;
        var origEvent = sd.prototype.event;
        sd.prototype.event = function (a) {
            try {
                var home = this.__bxHome, grp = home && home.grp, dc = this.dc;
                if (home && grp && dc && !this.na && a && a.source === "key" && a.type === "press") {
                    /* chip de actualizaciones enfocado: OK lo ejecuta, cualquier otra tecla sale */
                    if (this.__bxUpd) {
                        if (a.code === B.key.ra) { bxDoUpdate(this); return; }
                        this.__bxUpd = false; bxHomeUpdate(dc); return;
                    }
                    var sel = dc.selectedIndex, ei = grp.idxToEntry[sel], entry = grp.entries[ei], inSub = !!this.__bxInSub;
                    switch (a.code) {
                        case B.key.bb:   /* izquierda: padre anterior */
                            this.__bxInSub = false;
                            if (ei > 0) dc.K(grp.entries[ei - 1].childIdxs[0]);
                            else bxHomeUpdate(dc);
                            return;
                        case B.key.ib:   /* derecha: siguiente padre */
                            this.__bxInSub = false;
                            if (ei < grp.entries.length - 1) dc.K(grp.entries[ei + 1].childIdxs[0]);
                            else bxHomeUpdate(dc);
                            return;
                        case B.key.ab:   /* abajo: entra / baja en el submenu */
                            if (entry && entry.group) {
                                if (!inSub) { this.__bxInSub = true; bxHomeUpdate(dc); }
                                else {
                                    var cp = grp.idxToChild[sel];
                                    if (cp < entry.childIdxs.length - 1) dc.K(entry.childIdxs[cp + 1]);
                                }
                            }
                            return;
                        case B.key.cb:   /* arriba: sube en el submenu, o enfoca el chip de actualizaciones */
                            if (inSub) {
                                var cp2 = grp.idxToChild[sel];
                                if (cp2 > 0) dc.K(entry.childIdxs[cp2 - 1]);
                                else { this.__bxInSub = false; bxHomeUpdate(dc); }
                            } else { this.__bxUpd = true; bxHomeUpdate(dc); }
                            return;
                        case B.key.ra:   /* OK: en padre entra al submenu; en hijo/seccion simple lo abre */
                            if (entry && entry.group && !inSub) { this.__bxInSub = true; bxHomeUpdate(dc); return; }
                            break;   /* deja que la nativa abra dc.vb() */
                        case B.key.ma: case B.key.BACK:
                            if (inSub) { this.__bxInSub = false; bxHomeUpdate(dc); return; }
                            break;   /* sale del home */
                        default: break;
                    }
                }
            } catch (e) {}
            return origEvent.apply(this, arguments);
        };
    });

    /* ---------- 5b. Barra de progreso moderna (reproductor y detalle) ---------- */
    safe("progress", function () {
        if (typeof Ya !== "function") return;
        wrapCtor("Ya", function () {
            try {
                if (this.frame && this.frame.a) {
                    this.frame.a.style.background = "rgba(255,255,255,.12)";
                    this.frame.a.style.border = "0";
                    this.frame.a.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,.10)";
                    if (this.frame.a.style.height) this.frame.a.style.borderRadius = "999px";
                }
                if (this.xd && this.xd.a) {
                    this.xd.a.style.background = "linear-gradient(90deg," + ACCENT + " 0%,#ffffff 100%)";
                    this.xd.a.style.borderRadius = "999px";
                    this.xd.a.style.boxShadow = "0 0 12px " + rgba(ACCENT, .7);
                    this.xd.a.style.border = "0";
                    this.xd.a.style.overflow = "visible";
                    /* perilla al final del relleno (estilo reproductor moderno) */
                    var knob = el("div", "position:absolute;right:-9px;top:50%;width:18px;height:18px;border-radius:50%;" +
                        "background:#fff;-webkit-transform:translateY(-50%);transform:translateY(-50%);" +
                        "box-shadow:0 0 0 5px " + rgba(ACCENT, .45) + ",0 3px 10px rgba(0,0,0,.5)", this.xd.a);
                }
            } catch (e) {}
        });
    });

    /* ---------- 5c. Reproductor VOD: barra tipo maqueta (Inception) con audio/subtitulos navegables ----------
       La escena Bd es pantalla completa (1280x720). Dibujamos una barra propia encima que replica la maqueta
       y se alimenta de los datos reales de la barra nativa (yb = scene.ka.info): titulo, tiempos, progreso,
       audio/subtitulos y estado play/pausa. La nativa se oculta (opacidad 0) pero sigue manejando las teclas. */
    function bxPlayerBar(scene) { return scene && scene.ka && scene.ka.info; }

    function bxAfterColon(s) {
        s = (s || "").toString(); var i = s.indexOf(":");
        var v = i >= 0 ? s.substr(i + 1).replace(/^\s+|\s+$/g, "") : s.replace(/^\s+|\s+$/g, "");
        if (/none|ninguno/i.test(v)) return "Ninguno";
        if (/unavailable|no disponible/i.test(v) || !v) return "No disponible";
        return v;
    }
    function bxPlAvail(btn, v) { try { btn.style.opacity = (v === "No disponible") ? ".5" : "1"; } catch (e) {} }

    function bxPlHi(pb) {
        var btns = [pb.audioBtn, pb.subsBtn];
        for (var i = 0; i < 2; i++) {
            var on = pb.focus && i === pb.idx, active = (i === 1 && pb.subsActive), s = btns[i].style;
            s.borderColor = on ? "#ffffff" : (active ? ACCENT : "rgba(255,255,255,.2)");
            s.background = on ? rgba(ACCENT, .24) : (active ? rgba(ACCENT, .14) : "rgba(255,255,255,.09)");
            s.boxShadow = on ? "0 0 0 3px rgba(255,255,255,.85),0 8px 22px rgba(0,0,0,.5)" : (active ? "0 0 0 2px " + rgba(ACCENT, .45) : "none");
            s.transform = on ? "scale(1.06)" : "none"; s.webkitTransform = s.transform;
        }
    }

    function bxBuildPlayer(scene) {
        if (scene.__bxPB || !scene.a) return;
        var b = bxPlayerBar(scene); if (!b) return;
        /* ocultar los elementos visuales de la barra nativa (siguen funcionando las teclas) */
        var nat = [b.Pa, b.Ng, b.tn, b.ci, b.hk, b.Aj, b.zc, b.dg, b.ne, b.We, b.Si, b.pn, b.Gm, b.qn, b.Hm, b.rn];
        for (var i = 0; i < nat.length; i++) try { if (nat[i] && nat[i].a) nat[i].a.style.opacity = "0"; } catch (e) {}

        var e = (scene.l && scene.l.e) || {}, pt = bxType(e.rc, e.R);
        var title = bxCleanTitle(e.R) || e.R || "";
        var parts = [];
        if (pt.label) parts.push(pt.label.toUpperCase());
        var yr = (e.td || "").toString().slice(0, 4); if (yr) parts.push(yr);
        try { if (e.Gf) parts.push(da(e.Gf)); } catch (e2) {}

        var root = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:60;pointer-events:none;" +
            "opacity:0;transition:opacity .28s", scene.a);
        el("div", "position:absolute;left:0;right:0;bottom:0;height:62%;" +
            "background:linear-gradient(0deg,rgba(8,9,12,.96) 0%,rgba(8,9,12,.55) 45%,rgba(8,9,12,0) 100%)", root);
        var bar = el("div", "position:absolute;left:64px;right:64px;bottom:46px", root);

        var tEl = el("div", "font:800 40px 'Barlow Semi Condensed',sans-serif;color:#eef1f6;text-shadow:0 2px 16px rgba(0,0,0,.6);margin:0 0 5px", bar);
        tEl.appendChild(document.createTextNode(title));
        var mEl = el("div", "font:600 18px 'Barlow Condensed',sans-serif;letter-spacing:.6px;color:rgba(230,234,242,.62);margin:0 0 20px", bar);
        var mType = el("span", "color:" + pt.c + ";font-weight:700", mEl); mType.appendChild(document.createTextNode(parts[0] || ""));
        var mRest = el("span", "", mEl); mRest.appendChild(document.createTextNode(parts.length > 1 ? "   •   " + parts.slice(1).join("   •   ") : ""));

        /* fila de progreso */
        var row = el("div", "display:flex;-webkit-box-align:center;align-items:center;gap:20px", bar);
        var cur = el("div", "font:600 21px 'Barlow Condensed',sans-serif;color:#eef1f6;min-width:82px;text-align:center;letter-spacing:.5px", row);
        cur.appendChild(document.createTextNode("00:00:00"));
        var track = el("div", "position:relative;-webkit-box-flex:1;flex:1;height:7px;border-radius:999px;background:rgba(255,255,255,.16)", row);
        var buf = el("div", "position:absolute;left:0;top:0;height:100%;width:0;border-radius:999px;background:rgba(255,255,255,.28)", track);
        var play = el("div", "position:absolute;left:0;top:0;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg," + ACCENT + ",#ffffff);box-shadow:0 0 12px " + rgba(ACCENT, .7), track);
        var knob = el("div", "position:absolute;left:0;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;" +
            "-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);box-shadow:0 0 0 5px " + rgba(ACCENT, .45) + ",0 4px 12px rgba(0,0,0,.5)", track);
        var tot = el("div", "font:600 21px 'Barlow Condensed',sans-serif;color:rgba(230,234,242,.55);min-width:82px;text-align:center;letter-spacing:.5px", row);
        tot.appendChild(document.createTextNode("00:00:00"));

        /* fila de controles: transporte centrado + pills de audio/subtitulos a la derecha */
        var crow = el("div", "position:relative;margin-top:24px;height:66px", bar);
        var ctr = el("div", "position:absolute;left:0;right:0;top:0;display:flex;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;gap:34px", crow);
        function skip(fwd) {
            var w = el("div", "position:relative;width:50px;height:50px;opacity:.9;color:#eef1f6", ctr);
            w.innerHTML = "<svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
                (fwd ? "<path d='M13 17l5-5-5-5M6 17l5-5-5-5'/>" : "<path d='M11 17l-5-5 5-5M18 17l-5-5 5-5'/>") + "</svg>" +
                "<span style='position:absolute;left:0;right:0;top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%);text-align:center;font:700 12px \"Barlow Condensed\",sans-serif'>10</span>";
        }
        skip(false);
        var mid = el("div", "position:relative;width:64px;height:64px;border-radius:50%;background:#fff;color:#0a0b0f;box-shadow:0 8px 24px rgba(0,0,0,.5)", ctr);
        var gPlay = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;display:flex;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center", mid);
        gPlay.innerHTML = "<svg width='28' height='28' viewBox='0 0 24 24' fill='#0a0b0f'><path d='M8 5v14l11-7z'/></svg>";
        var gPause = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;display:none;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center", mid);
        gPause.innerHTML = "<svg width='26' height='26' viewBox='0 0 24 24' fill='#0a0b0f'><rect x='6' y='5' width='4' height='14' rx='1'/><rect x='14' y='5' width='4' height='14' rx='1'/></svg>";
        skip(true);

        var side = el("div", "position:absolute;right:0;top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%);display:flex;gap:12px", crow);
        function pill(icon, lab) {
            var p = el("div", "display:flex;-webkit-box-align:center;align-items:center;gap:9px;padding:10px 18px;border-radius:999px;white-space:nowrap;" +
                "background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.2);color:rgba(238,241,246,.9);" +
                "font:600 17px 'Barlow Condensed',sans-serif;letter-spacing:.3px;transition:all .18s", side);
            var ic = el("span", "display:inline-flex;-webkit-box-align:center;align-items:center", p); ic.innerHTML = icon;
            var l = el("span", "color:rgba(238,241,246,.6)", p); l.appendChild(document.createTextNode(lab));
            var v = el("span", "color:#eef1f6;font-weight:700", p); v.appendChild(document.createTextNode("—"));
            return { btn: p, v: v };
        }
        var spk = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9v6h4l5 5V4L7 9H3z'/><path d='M16 8a5 5 0 0 1 0 8'/></svg>";
        var cc = "<span style='display:inline-flex;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;width:27px;height:19px;border-radius:4px;border:2px solid currentColor;font:800 11px \"Barlow Semi Condensed\",sans-serif'>CC</span>";
        var au = pill(spk, "Audio"), su = pill(cc, "Subtítulos");

        /* indicador de avance rapido (se muestra al mantener izquierda/derecha) */
        var ff = el("div", "position:absolute;top:36px;right:64px;display:none;-webkit-box-align:center;align-items:center;gap:10px;" +
            "background:rgba(10,11,15,.7);padding:7px 15px;border-radius:999px;font:700 19px 'Barlow Condensed',sans-serif;color:" + ACCENT + ";letter-spacing:1px", root);
        ff.appendChild(document.createTextNode("▶▶  AVANCE"));

        scene.__bxPB = { root: root, cur: cur, tot: tot, buf: buf, play: play, knob: knob,
            gPlay: gPlay, gPause: gPause, audioBtn: au.btn, audioV: au.v, subsBtn: su.btn, subsV: su.v,
            ff: ff, focus: false, idx: 1, subsActive: false };
        bxPlHi(scene.__bxPB);
    }

    function bxSyncPlayer(scene) {
        var pb = scene.__bxPB, b = bxPlayerBar(scene);
        if (!pb || !b) return;
        var vis = b.H && b.H();
        pb.root.style.opacity = vis ? "1" : "0";
        if (!vis) return;
        var pct = +b.progress; if (isNaN(pct)) pct = 0; pct = pct < 0 ? 0 : pct > 100 ? 100 : pct;
        pb.play.style.width = pct + "%";
        pb.knob.style.left = pct + "%";
        pb.buf.style.width = Math.min(100, pct + 6) + "%";
        try { if (b.currentTime) pb.cur.firstChild.data = b.currentTime.text || "00:00:00"; } catch (e) {}
        try { if (b.totalTime) pb.tot.firstChild.data = b.totalTime.text || "00:00:00"; } catch (e2) {}
        var av = bxAfterColon(b.We ? b.We.text : ""), sv = bxAfterColon(b.ne ? b.ne.text : "");
        pb.audioV.firstChild.data = av; pb.subsV.firstChild.data = sv;
        bxPlAvail(pb.audioBtn, av); bxPlAvail(pb.subsBtn, sv);
        pb.subsActive = sv !== "Ninguno" && sv !== "No disponible";
        var showPlay = /play/.test((b.ob && b.ob.key) || "");   /* refleja el icono nativo */
        pb.gPlay.style.display = showPlay ? "flex" : "none";
        pb.gPause.style.display = showPlay ? "none" : "flex";
        bxPlHi(pb);
    }

    safe("playerBar", function () {
        if (typeof Bd !== "function" || !Bd.prototype) return;
        var origXa = Bd.prototype.xa, origNd = Bd.prototype.nd, origEvent = Bd.prototype.event;

        Bd.prototype.xa = function () {
            var r = origXa.apply(this, arguments);
            try { bxBuildPlayer(this); } catch (e) { if (window.console) console.log("[bx] player: " + e); }
            return r;
        };
        if (typeof origNd === "function") Bd.prototype.nd = function () {
            var r = origNd.apply(this, arguments);
            try { bxSyncPlayer(this); } catch (e) {}
            return r;
        };
        if (typeof origEvent === "function") Bd.prototype.event = function (a) {
            try {
                var pb = this.__bxPB, b = bxPlayerBar(this);
                if (pb && b && a && a.source === "key" && a.type === "press" && b.H && b.H()) {
                    if (pb.focus) {
                        switch (a.code) {
                            case B.key.bb: pb.idx = 0; bxPlHi(pb); return;
                            case B.key.ib: pb.idx = 1; bxPlHi(pb); return;
                            case B.key.cb: pb.focus = false; bxPlHi(pb); return;
                            case B.key.ma: case B.key.BACK: pb.focus = false; bxPlHi(pb); return;
                            case B.key.ra:
                                try { document.dispatchEvent(pb.idx === 1 ? vsaEvents.redF1Event : vsaEvents.greenF2Event); } catch (e2) {}
                                return;
                            default: break;
                        }
                    } else if (a.code === B.key.ab) { pb.focus = true; pb.idx = 1; bxPlHi(pb); return; }
                    /* aviso de avance rapido al mantener izquierda/derecha (el seek lo hace la nativa) */
                    if (a.code === B.key.bb || a.code === B.key.ib) {
                        pb.ff.style.display = "flex";
                        if (this.__bxFFt) clearTimeout(this.__bxFFt);
                        var self = this; this.__bxFFt = setTimeout(function () { try { self.__bxPB.ff.style.display = "none"; } catch (e3) {} }, 700);
                    }
                }
            } catch (e) {}
            return origEvent.apply(this, arguments);
        };
    });

    /* ---------- 6. Listas (menus de ajustes, dialogos, temporadas...) ---------- */
    function styleList(list) {
        if (!list || !list.L) return;
        var s = list.L.a.style;
        s.background = GRAD;
        s.border = "0";
        s.borderRadius = "10px";
        s.boxShadow = "0 8px 22px rgba(0,0,0,.45)";
        list.Zg = "#ffffff";
        list.pf = "rgba(232,238,255,.78)";
        for (var i = 0; i < list.md.length; i++)
            list.md[i].ea = i === list.selectedIndex ? list.Zg : list.pf;
    }

    /* ---------- 7. Rejillas de posters (peliculas / series) ---------- */
    safe("grid", function () {
        if (typeof Nb !== "function") return;
        var origNb = Nb;
        window.Nb = function (a, b) {
            origNb.apply(this, arguments);
            try {
                if (a.L) {
                    var s = a.L.a.style;
                    s.border = "3px solid #ffffff";
                    s.borderRadius = "14px";
                    s.boxShadow = "0 0 0 6px rgba(255,255,255,.35),0 18px 40px rgba(0,0,0,.6)";
                    s.background = "transparent";
                }
                if (a.ld) {
                    /* ficha de sinopsis: fondo blanco difuminado + letra negra para que se lea bien */
                    var c = a.ld.a.style;
                    c.background = "rgba(246,248,252,.94)";
                    c.border = "1px solid rgba(255,255,255,.6)";
                    c.borderRadius = "16px";
                    c.boxShadow = "0 18px 44px rgba(0,0,0,.6)";
                    c.backdropFilter = "blur(8px)";
                    c.webkitBackdropFilter = "blur(8px)";
                    if (a.Hl) a.Hl.ea = "#0c0e14";
                    if (a.Fl) a.Fl.ea = "#2a56b0";
                    if (a.uj) a.uj.ea = "#1a1d26";
                }
                if (a.eg) a.eg.ea = MUTED;
                if (a.w) for (var i = 0; i < a.w.length; i++) if (a.w[i].zj) {
                    a.w[i].zj.ea = TEXT;
                    a.w[i].zj.a.style.letterSpacing = ".6px";
                }
            } catch (e) {}
        };
        window.Nb.__bx = origNb;
    });

    /* ---------- 7b. Rejillas: fondo con la portada enfocada + filo de color por tipo ---------- */
    safe("gridPoster", function () {
        if (typeof Tb !== "function") return;
        var origTb = Tb;
        window.Tb = function (a) {
            var r = origTb.apply(this, arguments);
            try {
                var item = a.vb(), scene = a.parent;
                if (item && scene && scene.a) {
                    var pt = bxType(item.rc, item.R);
                    if (a.L && a.L.a) a.L.a.style.boxShadow = "0 0 0 6px " + rgba(pt.c, .55) + ",0 18px 40px rgba(0,0,0,.6)";
                    var url = item.Ia || item.ud;
                    if (url && ("" + url).indexOf("http") === 0) {
                        var bg = scene.__bxPosterBg;
                        if (!bg) {
                            bg = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;background-size:cover;" +
                                "background-position:center;filter:blur(34px) saturate(1.25) brightness(.5);" +
                                "-webkit-filter:blur(34px) saturate(1.25) brightness(.5);opacity:0;transition:opacity .45s");
                            var scrim = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;" +
                                "background:linear-gradient(90deg,rgba(16,18,23,.97) 0%,rgba(16,18,23,.78) 42%,rgba(16,18,23,.45) 100%)");
                            var ref = (scene.m && scene.m.a) ? scene.m.a.nextSibling : scene.a.firstChild;
                            scene.a.insertBefore(bg, ref);
                            scene.a.insertBefore(scrim, bg.nextSibling);
                            scene.__bxPosterBg = bg;
                        }
                        bg.style.backgroundImage = "url('" + url + "')";
                        bg.style.opacity = "1";
                    }
                }
            } catch (e) {}
            return r;
        };
        window.Tb.__bx = origTb;
    });

    /* ---------- 7c. Rejillas: mostrar solo *Lat* (ocultar *Sub*) ---------- */
    /* Sb(lista, fila, contenidos) llena cada fila de la rejilla, tanto la carga inicial
       como las paginas que se piden al bajar/avanzar: filtramos ahi los titulos *Sub*. */
    safe("gridLatFilter", function () {
        if (typeof Sb !== "function") return;
        var origSb = Sb;
        window.Sb = function (a, b, c) {
            try {
                if (c && c.length) {
                    var f = [];
                    for (var i = 0; i < c.length; i++) if (!bxIsSub(c[i].R)) f.push(c[i]);
                    if (f.length) c = f;   /* si TODO era Sub, dejamos la fila original para no vaciarla */
                }
            } catch (e) {}
            return origSb.call(this, a, b, c);
        };
        window.Sb.__bx = origSb;
    });

    /* ---------- 7d. Rejillas: avanzar de pagina y scroll rapido al mantener ---------- */
    safe("gridFast", function () {
        if (typeof wd !== "function" || !wd.prototype) return;
        var origEvent = wd.prototype.event, origXa = wd.prototype.xa;
        var PG_FWD = { 34: 1, 43: 1, 2113: 1, 2115: 1 }, PG_BACK = { 33: 1, 45: 1, 2112: 1, 2114: 1 };
        var PAGE = 6;

        wd.prototype.xa = function () {
            var r = origXa.apply(this, arguments);
            try {
                if (this.a && !this.__bxHint) {
                    var hint = el("div", "position:absolute;right:28px;bottom:22px;z-index:9;padding:9px 18px;border-radius:999px;" +
                        "background:rgba(14,16,21,.82);box-shadow:0 0 0 1px rgba(255,255,255,.12),0 10px 26px rgba(0,0,0,.5);" +
                        "font:600 18px 'Barlow Condensed',sans-serif;letter-spacing:.4px;color:rgba(238,241,246,.82)", this.a);
                    hint.appendChild(document.createTextNode("Mantén ◀ ▶ para avanzar de página"));
                    this.__bxHint = true;
                }
            } catch (e) {}
            return r;
        };

        wd.prototype.event = function (a) {
            try {
                if (a && a.source === "key" && a.type === "press" && this.U) {
                    var code = a.code;
                    /* teclas de pagina (page up/down, canal +/-, FF/RW): salto horizontal de una pagina */
                    if (PG_FWD[code] || PG_BACK[code]) {
                        var ev = Object.create(a); ev.code = PG_FWD[code] ? B.key.ib : B.key.bb;
                        for (var i = 0; i < PAGE; i++) { try { this.U.cc(ev); } catch (e2) {} }
                        return;
                    }
                    /* mantener izquierda/derecha: acelera el recorrido dentro de la fila */
                    if (code === B.key.bb || code === B.key.ib) {
                        var now = Date.now();
                        if (code === this.__bxLastDir && now - (this.__bxLastT || 0) < 260) this.__bxStreak = (this.__bxStreak || 0) + 1;
                        else this.__bxStreak = 0;
                        this.__bxLastDir = code; this.__bxLastT = now;
                        var r = origEvent.call(this, a);
                        if (this.__bxStreak >= 3) {
                            var extra = Math.min(5, this.__bxStreak - 1);
                            for (var j = 0; j < extra; j++) { try { this.U.cc(a); } catch (e3) {} }
                        }
                        return r;
                    }
                }
            } catch (e) {}
            return origEvent.call(this, a);
        };
    });

    /* ---------- 8. Busqueda: teclado ---------- */
    function keyStyle(c, f, on) {
        if (!c) return;
        var s = c.a.style;
        if (on) {
            c.background = GRAD_V;
            s.boxShadow = "0 0 0 2px rgba(255,255,255,.9),0 10px 24px rgba(126,208,255,.5)";
            s.transform = "scale(1.08)";
            s.webkitTransform = "scale(1.08)";
            s.zIndex = 5;
            if (f) f.ea = "#ffffff";
        } else {
            c.background = KEY_BG;
            s.boxShadow = "none";
            s.transform = "none";
            s.webkitTransform = "none";
            s.zIndex = 0;
            if (f) f.ea = "rgba(232,238,255,.85)";
        }
    }
    safe("keyboard", function () {
        if (typeof Hb !== "function") return;
        /* misma logica de seleccion que el original; solo cambia el estilo */
        Hb.prototype.u = function (a, b) {
            var c = null, f = null;
            if (0 > a) {
                switch (a) {
                    case -1: c = this.lkt; break;
                    case -2: c = this.lkm; break;
                    case -3: c = this.lks; break;
                    case -4: c = this.lk; break;
                    case -5: c = this.Te; break;
                    case -6: c = this.jk; break;
                    default: return;
                }
            } else {
                c = this.buttons[a];
                f = this.Jg[a];
            }
            keyStyle(c, f, !!b);
        };
        wrapCtor("Hb", function () {
            this.Pa.background = "transparent";
            this.Pa.a.style.boxShadow = "none";
            var top = [this.jk, this.Te, this.lk, this.lks, this.lkm, this.lkt];
            var icons = [this.ym, this.Rh, this.zm, this.zks, this.zmk, this.zmt];
            var Mk = this.M, Sk = this.S;
            /* fila superior alineada con la rejilla de letras (en el original es fija de 48px) */
            for (var t = 0; t < top.length; t++) if (top[t]) {
                top[t].x = Sk + (Mk + Sk) * t;
                top[t].y = Sk;
                top[t].width = Mk;
                top[t].height = Mk;
                var ic = icons[t];
                if (!ic) continue;
                if (ic instanceof M) {
                    ic.x = 0;
                    ic.width = Mk;
                    ic.align = "center";
                } else if (t >= 2) {
                    ic.x = 4; ic.y = 4; ic.width = Mk - 8; ic.height = Mk - 8;
                } else {
                    ic.x = Math.floor((Mk - ic.Rc) / 2);
                    ic.y = Math.floor((Mk - ic.Pc) / 2);
                }
            }
            var all = top.concat(this.buttons);
            for (var i = 0; i < all.length; i++) if (all[i]) {
                all[i].a.className += " bx-key";
                all[i].a.style.borderRadius = "12px";
                keyStyle(all[i], null, false);
            }
            for (i = 0; i < this.Jg.length; i++) {
                this.Jg[i].a.className += " bx-key-label";
                this.Jg[i].ea = "rgba(232,238,255,.85)";
            }
            if (this.zmk) this.zmk.ea = "rgba(232,238,255,.85)";
            if (this.zmt) this.zmt.ea = "rgba(232,238,255,.85)";
        });
    });

    /* teclado numerico del PIN: misma logica, nuevo estilo */
    safe("pinpad", function () {
        if (typeof Qa !== "function") return;
        Qa.prototype.u = function (a, b) {
            var c = null, f = null;
            if (0 > a) {
                if (a !== -1) return;
                c = this.Te;
            } else {
                c = this.buttons[a];
                f = this.lg[a];
            }
            keyStyle(c, f, !!b);
        };
        wrapCtor("Qa", function () {
            var all = [this.Te].concat(this.buttons);
            for (var i = 0; i < all.length; i++) if (all[i]) {
                all[i].a.className += " bx-key";
                all[i].a.style.borderRadius = "12px";
                keyStyle(all[i], this.lg[i - 1] || null, false);
            }
        });
    });

    /* ---------- 9. Busqueda: escena completa ---------- */
    var LIST_TOP = 74, ROW_H = 76, FOOTER_H = 52, LIST_W = 470, THUMB_W = 44, THUMB_H = 66;
    var MAX_POSTERS = 24;

    function searchState(scene, mode, query, count) {
        var ui = scene && scene.__bx;
        if (!ui) return;
        ui.empty.style.display = mode === "idle" ? "block" : "none";
        ui.none.style.display = mode === "none" ? "block" : "none";
        ui.preview.style.display = mode === "results" ? "block" : "none";
        if (mode === "none") ui.noneText.data = "Sin resultados para “" + query + "”";
        if (mode !== "results") posterGen++;          /* cancela cargas pendientes */
        ui.count.text = mode === "results" ? count + (count === 1 ? " resultado" : " resultados") : "";
        ui.placeholder.style.display = query ? "none" : "block";
    }

    /* ---- portadas: se piden al servidor con las mismas consultas de detalle que usa la app ---- */
    var posterCache = {}, posterQueue = [], posterBusy = 0, posterGen = 0;

    function fetchPoster(item, done) {
        var called = false;
        function fin(u) { if (!called) { called = true; done(u || ""); } }
        /* resultados venidos de TMDb ya traen su portada: no gastamos una consulta al servidor */
        var meta = bxMeta[item.m];
        if (meta && meta.poster) { fin(meta.poster); return; }
        try {
            if (item.rc === "series" || item.rc === "collection") {
                ed(item.m, {
                    success: function (r) {
                        var it = r && r.status && r.items && r.items[0];
                        fin(it && (it.Ia || it.ud));
                    },
                    f: function () { fin(""); }
                });
            } else {
                dd(item.m, {
                    success: function (r) { fin(r && r.status && r.e && (r.e.Ia || r.e.ud)); },
                    f: function () { fin(""); }
                });
            }
        } catch (e) { fin(""); }
    }

    function pumpPosters() {
        while (posterBusy < 2 && posterQueue.length) {
            var job = posterQueue.shift();
            if (job.gen !== posterGen) continue;
            if (job.item.m in posterCache) { job.cb(posterCache[job.item.m]); continue; }
            posterBusy++;
            (function (job) {
                fetchPoster(job.item, function (url) {
                    posterBusy--;
                    posterCache[job.item.m] = url;
                    if (job.gen === posterGen) job.cb(url);
                    pumpPosters();
                });
            })(job);
        }
    }

    function setImg(img, url) {
        if (!url) return;
        img.onload = function () { img.style.opacity = "1"; };
        img.onerror = function () { img.style.display = "none"; };
        img.src = url;
    }

    function loadPosters(list, scene) {
        posterGen++;
        posterQueue = [];
        var n = Math.min(list.buttons.length, MAX_POSTERS);
        for (var i = 0; i < n; i++) (function (i) {
            posterQueue.push({
                gen: posterGen, item: list.buttons[i], cb: function (url) {
                    if (list.__bxThumbs && list.__bxThumbs[i]) setImg(list.__bxThumbs[i], url);
                    if (list.selectedIndex === i) updatePreview(scene, list);
                }
            });
        })(i);
        pumpPosters();
    }

    function updatePreview(scene, list) {
        var ui = scene && scene.__bx;
        if (!ui || list.selectedIndex < 0) return;
        var data = list.buttons[list.selectedIndex] || {};
        var info = (list.__bxInfo && list.__bxInfo[list.selectedIndex]) || {};
        ui.pvTitle.firstChild.data = info.title || "";
        var pt = bxType(data.rc, info.title);
        ui.pvMeta.firstChild.data = [info.year, pt.label || info.kind || ""].filter(function (x) { return x; }).join("  ·  ");
        ui.pvMeta.style.color = rgba(pt.c, 0.95);
        if (ui.pvBox) ui.pvBox.style.boxShadow = "0 0 0 2px " + rgba(pt.c, .5) + ",0 18px 42px rgba(0,0,0,.6)";
        ui.pvLetter.firstChild.data = (info.title || "?").replace(/^(el|la|los|las|the)\s+/i, "").charAt(0).toUpperCase();
        var url = posterCache[data.m];
        ui.pvImg.style.opacity = "0";
        if (url) {
            ui.pvImg.style.display = "block";
            ui.pvImg.onload = function () { ui.pvImg.style.opacity = "1"; };
            ui.pvImg.onerror = function () { ui.pvImg.style.display = "none"; };
            if (ui.pvImg.getAttribute("src") === url) ui.pvImg.style.opacity = "1";
            else ui.pvImg.src = url;
        } else {
            ui.pvImg.style.display = "none";
        }
    }

    function scrollResults(list) {
        var vh = list.__bxViewport;
        if (!vh || list.selectedIndex < 0) return;
        var pos = list.buttons[list.selectedIndex].position;
        var total = list.Df * list.$f;
        var off = pos * list.$f - (vh - list.$f) / 2;
        off = Math.max(0, Math.min(off, Math.max(0, total - vh)));
        list.a.style.transform = "translateY(" + (-off) + "px)";
        list.a.style.webkitTransform = "translateY(" + (-off) + "px)";
    }

    function decorateRows(list) {
        list.__bxThumbs = [];
        list.__bxInfo = [];
        for (var i = 0; i < list.md.length; i++) {
            var lab = list.md[i], data = list.buttons[i] || {};
            var raw = lab.text || "";
            var m = /^(.*)\s\[([^,\]]*)(?:,\s*([^\]]*))?\]$/.exec(raw);
            var title = m ? m[1] : raw;
            var year = m && m[2] ? (String(m[2]).match(/\d{4}/) || [m[2]])[0] : "";
            list.__bxInfo[i] = { title: title, year: year, kind: m && m[3] ? String(m[3]).toUpperCase() : "" };
            var hasHint = bxMeta[data.m] && bxMeta[data.m].hint;
            lab.a.firstChild.data = title;
            lab.a.style.lineHeight = (ROW_H - 6) + "px";
            lab.a.style.paddingLeft = (THUMB_W + 16) + "px";
            lab.a.style.paddingRight = (hasHint ? 182 : 118) + "px";
            lab.a.style.boxSizing = "border-box";
            lab.a.style.textOverflow = "ellipsis";
            /* miniatura de portada (se rellena cuando llega del servidor) */
            var th = el("div", "position:absolute;left:4px;top:" + Math.floor((ROW_H - 6 - THUMB_H) / 2) + "px;width:" +
                THUMB_W + "px;height:" + THUMB_H + "px;border-radius:7px;overflow:hidden;" +
                "background:linear-gradient(160deg,rgba(255,255,255,.18),rgba(255,255,255,.04));" +
                "box-shadow:0 4px 12px rgba(0,0,0,.35)", lab.a);
            var img = el("img", "width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s;display:block", th);
            list.__bxThumbs[i] = img;
            if (year) {
                var meta = el("span", null, lab.a);
                meta.className = "bx-meta";
                meta.appendChild(document.createTextNode(year));
            }
            var pt = bxType(data.rc, title);
            var label = pt.label || (m && m[3] ? String(m[3]).toUpperCase() : "");
            if (label) {
                var b = el("span", null, lab.a);
                b.className = "bx-badge";
                b.style.background = rgba(pt.c, .24);
                b.style.borderColor = rgba(pt.c, .5);
                b.style.color = "#fff";
                b.appendChild(document.createTextNode(label));
            }
            /* filo de color por tipo en la miniatura */
            th.style.boxShadow = "0 4px 12px rgba(0,0,0,.35),inset 0 0 0 2px " + rgba(pt.c, .55);
            /* etiqueta de por que aparecio (otro idioma / actor) */
            var meta2 = bxMeta[data.m];
            if (meta2 && meta2.hint) {
                var h = el("span", null, lab.a);
                h.className = "bx-via";
                h.appendChild(document.createTextNode(meta2.hint));
            }
        }
    }

    safe("La", function () {
        wrapCtor("La", function () {
            var scene = this.parent && this.parent.__bxSearch;
            styleList(this);
            if (!scene) return;
            /* lista de resultados de busqueda: filas grandes, desplazamiento y etiquetas */
            this.a.className += " bx-results-list";
            this.L.a.style.borderRadius = "12px";
            /* se mueve a un contenedor recortado para que al desplazar no tape la cabecera */
            var clip = scene.__bx && scene.__bx.clip;
            if (clip) {
                while (clip.firstChild) clip.removeChild(clip.firstChild);
                clip.appendChild(this.a);
            }
            this.__bxViewport = this.parent.height - LIST_TOP - FOOTER_H - 8;
            decorateRows(this);
            var self = this, origK = this.K;
            this.K = function (a, b) { origK.call(self, a, b); scrollResults(self); updatePreview(scene, self); };
            scrollResults(this);
            searchState(scene, "results", scene.Ab ? scene.Ab.wc.text : "", this.buttons.length);
            updatePreview(scene, this);
            loadPosters(this, scene);
        }, function (args) {
            var be = args[0];
            if (be && be.__bxSearch) {
                args[1] = 16;                          /* x */
                args[2] = 0;                           /* y (dentro del contenedor recortado) */
                args[3] = LIST_W - 24;                 /* ancho: la columna derecha es el poster */
                args[4] = ROW_H;                       /* alto de fila */
                args[9] = "21px GothamCondensed";      /* fuente */
            }
            return args;
        });
    });

    /* ===== Busqueda ampliada con TMDb (otros idiomas + por actor) ===== */
    var bxServerSearch = null;                 /* ad original del servidor */
    var CAND_CAP = 70, ACTOR_MOVIES = 30, TERM_CAP = 110, EXTRA_CAP = 90, LOOKUP_CONC = 3;
    var MAX_EXPAND = 10, VARIANT_CONC = 4;   /* cuantos titulos expandir a TODOS sus idiomas, y con que concurrencia */
    var titleLookupCache = {};
    /* la escena arma la lista con {name,text,m,rc,rtg} y descarta otros campos, asi que
       la portada/etiqueta de TMDb se guardan aparte, indexadas por id (m), que si se conserva */
    var bxMeta = {};
    var enrichTimer = null, enrichGen = 0;

    function norm(s) {
        return (s || "").toString().toLowerCase()
            .replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e")
            .replace(/[íìïî]/g, "i").replace(/[óòöô]/g, "o")
            .replace(/[úùüû]/g, "u").replace(/ñ/g, "n")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\b(el|la|los|las|un|una|the|a|an)\b/g, " ")
            .replace(/\s+/g, " ").trim();
    }

    function scheduleEnrich(scene, query, serverGd, content, cb) {
        enrichGen++;
        var gen = enrichGen;
        if (enrichTimer) { clearTimeout(enrichTimer); enrichTimer = null; }
        bxMeta = {};
        if (!bxServerSearch || !query || query.length < 3) return;
        enrichTimer = setTimeout(function () { runEnrich(scene, query, serverGd, content, gen, cb); }, 650);
    }

    function runEnrich(scene, query, serverGd, content, gen, cb) {
        if (gen !== enrichGen || !scene.__bx) return;
        var wantMovies = content !== "series", wantSeries = content !== "movies";
        try { scene.__bx.count.text = "buscando variantes…"; } catch (e) {}

        tmdb("search/multi", { query: query, language: "es-MX", include_adult: "false" }, function (r) {
            if (gen !== enrichGen || !scene.__bx) return;
            if (!r || !r.results) { restoreCount(scene, serverGd); return; }
            var cands = [], seen = {}, expand = [], expSeen = {};
            function pushCand(title, orig, poster, hint) {
                if (!title) return;
                var key = norm(title);
                if (!key || seen[key]) return;
                seen[key] = 1;
                cands.push({ title: title, orig: orig, poster: poster, hint: hint });
            }
            /* marca una pelicula/serie para traer TODOS sus titulos en otros idiomas */
            function pushExpand(id, mt, poster, hint) {
                if (!id) return;
                var ek = mt + id;
                if (expSeen[ek] || expand.length >= MAX_EXPAND) return;
                expSeen[ek] = 1;
                expand.push({ id: id, mt: mt, poster: poster, hint: hint });
            }
            var movieTv = [], person = null;
            for (var i = 0; i < r.results.length; i++) {
                var it = r.results[i];
                if ((it.media_type === "movie" && wantMovies) || (it.media_type === "tv" && wantSeries)) movieTv.push(it);
                else if (it.media_type === "person" && !person) person = it;
            }
            for (i = 0; i < movieTv.length && i < 6; i++) {
                var mt = movieTv[i];
                pushCand(mt.title || mt.name, mt.original_title || mt.original_name, mt.poster_path, "idioma");
                pushExpand(mt.id, mt.media_type === "tv" ? "tv" : "movie", mt.poster_path, "idioma");
            }

            function afterPerson() {
                /* trae las variantes de idioma (alternative_titles) de los titulos marcados, luego busca en el catalogo */
                expandVariants(expand, gen, pushCand, function () {
                    cands = cands.slice(0, CAND_CAP);
                    if (!cands.length) { restoreCount(scene, serverGd); return; }
                    lookupCandidates(scene, query, serverGd, content, gen, cb, cands);
                });
            }
            if (person) {
                tmdb("person/" + person.id + "/movie_credits", { language: "es-MX" }, function (pc) {
                    if (gen !== enrichGen) return;
                    if (pc && pc.cast) {
                        var cast = pc.cast.slice().sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
                        for (var j = 0; j < cast.length && j < ACTOR_MOVIES; j++) {
                            pushCand(cast[j].title, cast[j].original_title, cast[j].poster_path, "actor");
                            if (j < 8) pushExpand(cast[j].id, "movie", cast[j].poster_path, "actor");  /* variantes de sus pelis top */
                        }
                    }
                    afterPerson();
                });
            } else afterPerson();
        });
    }

    /* para cada pelicula/serie marcada pide /alternative_titles (todos los paises/idiomas)
       y agrega cada titulo como candidato, para hallarla aunque el catalogo la tenga en otro idioma */
    function expandVariants(list, gen, pushCand, done) {
        if (!list || !list.length) { done(); return; }
        var k = 0, active = 0, finished = false;
        function fin() { if (!finished) { finished = true; done(); } }
        function one() {
            if (gen !== enrichGen) { fin(); return; }
            if (k >= list.length) { if (active === 0) fin(); return; }
            var m = list[k++]; active++;
            tmdb(m.mt + "/" + m.id + "/alternative_titles", {}, function (r) {
                try {
                    var arr = (r && (r.titles || r.results)) || [];
                    for (var i = 0; i < arr.length; i++) pushCand(arr[i].title, null, m.poster, m.hint);
                } catch (e) {}
                active--; one();
            });
        }
        var conc = Math.min(VARIANT_CONC, list.length);
        for (var c = 0; c < conc; c++) one();
    }

    function restoreCount(scene, serverGd) {
        try { if (scene.__bx) scene.__bx.count.text = serverGd.length + (serverGd.length === 1 ? " resultado" : " resultados"); } catch (e) {}
    }

    function lookupCandidates(scene, query, serverGd, content, gen, cb, cands) {
        var have = {}, extras = [], k = 0, active = 0, finished = false;
        for (var i = 0; i < serverGd.length; i++) have[serverGd[i].m] = 1;

        /* cada pelicula se busca por su titulo en espanol Y por el original en ingles, porque el
           catalogo puede tener cualquiera de los dos. Lista plana de terminos, sin repetir. */
        var terms = [], tseen = {};
        for (var c0 = 0; c0 < cands.length; c0++) {
            var cd = cands[c0], ts = [cd.title, cd.orig];
            for (var t0 = 0; t0 < ts.length; t0++) {
                var term = ts[t0]; if (!term) continue;
                var tn = norm(term); if (!tn || tseen[tn]) continue;
                tseen[tn] = 1;
                terms.push({ term: term, poster: cd.poster, hint: cd.hint, a: norm(cd.title), b: cd.orig ? norm(cd.orig) : "" });
                if (terms.length >= TERM_CAP) break;
            }
            if (terms.length >= TERM_CAP) break;
        }

        function finish() {
            if (finished) return;
            finished = true;
            if (gen !== enrichGen || !scene.__bx) return;
            restoreCount(scene, serverGd);
            if (!extras.length) return;
            /* solo reconstruimos si el usuario sigue en el teclado y no cambio la busqueda */
            if (scene.Xe !== "alphabox") return;
            if (scene.Ab && scene.Ab.wc.text !== query) return;
            var combined = serverGd.concat(extras.slice(0, EXTRA_CAP));
            try { cb.success({ status: true, gd: combined }); } catch (e) {}
        }
        function one() {
            if (gen !== enrichGen) return;
            if (k >= terms.length) { if (active === 0) finish(); return; }
            var cand = terms[k++];
            var ckey = content + "|" + norm(cand.term);
            function use(gd) {
                var best = null, j, it;
                for (j = 0; j < gd.length; j++) {
                    it = gd[j];
                    if (have[it.m]) continue;
                    if (!best && (norm(it.R) === cand.a || (cand.b && norm(it.R) === cand.b))) best = it;
                }
                for (j = 0; j < gd.length; j++) {
                    it = gd[j];
                    if (have[it.m]) continue;
                    have[it.m] = 1;
                    bxMeta[it.m] = {
                        hint: cand.hint,
                        poster: (cand.poster && (it === best || (best === null && j === 0))) ? TMDB_IMG + "w342" + cand.poster : null
                    };
                    extras.push(it);
                }
                active--;
                if (extras.length >= EXTRA_CAP) { finish(); return; }
                one();
            }
            if (ckey in titleLookupCache) { use(titleLookupCache[ckey]); return; }
            active++;
            bxServerSearch(cand.term, {
                success: function (res) {
                    var gd = (res && res.status && res.gd) ? res.gd : [];
                    titleLookupCache[ckey] = gd;
                    use(gd);
                },
                f: function () { titleLookupCache[ckey] = []; use([]); }
            }, content);
        }
        for (var cc = 0; cc < LOOKUP_CONC; cc++) one();
    }

    safe("search-hooks", function () {
        /* Amplia la busqueda con TMDb; la peticion al servidor sigue siendo la original. */
        if (typeof ad === "function") {
            var origAd = ad;
            bxServerSearch = origAd;
            window.ad = function (q, cb, content) {
                var scene = window.__bxSearchScene;
                if (!cb || !scene) return origAd.call(this, q, cb, content);
                var wrapped = {
                    success: function (r) {
                        try {
                            var gd = (r && r.status && r.gd) ? r.gd : [];
                            if (!gd.length) searchState(scene, "none", q, 0);
                            scheduleEnrich(scene, q, gd.slice(), content, cb);
                        } catch (e) {}
                        return cb.success && cb.success.apply(this, arguments);
                    },
                    f: cb.f
                };
                return origAd.call(this, q, wrapped, content);
            };
            window.ad.__bx = origAd;
        }
        if (typeof Lb === "function") {
            var origLb = Lb;
            window.Lb = function (field, text) {
                var r = origLb.apply(this, arguments);
                try {
                    var scene = window.__bxSearchScene;
                    if (r && scene && scene.Ab === field && scene.__bx) {
                        scene.__bx.placeholder.style.display = text ? "none" : "block";
                        if (!text) searchState(scene, "idle", "", 0);
                    }
                } catch (e) {}
                return r;
            };
            window.Lb.__bx = origLb;
        }
    });

    safe("SearchScene", function () {
        var origXa = ud.prototype.xa, origYa = ud.prototype.ya;
        ud.prototype.xa = function () {
            try {
                return bxSearchLayout.call(this);
            } catch (e) {
                if (window.console) console.log("[bx] search layout: " + e);
                /* si el nuevo diseno falla, se usa el original */
                this.clear();
                this.__bx = null;
                window.__bxSearchScene = null;
                return origXa.apply(this, arguments);
            }
        };
        ud.prototype.ya = function () {
            if (window.__bxSearchScene === this) window.__bxSearchScene = null;
            this.__bx = null;
            return origYa.apply(this, arguments);
        };
    });

    function bxSearchLayout() {
        var W = this.b.width, H = this.b.height;
        this.m = new O(this, "SearchScene", 0, 0, W, H, void 0, void 0);
        addOverlay(this);
        /* el fondo nativo "SearchScene" trae el ojo de BlackEye marcado arriba a la izquierda;
           lo ocultamos (el fondo IRIS del tema ya cubre) para que no se encime con el logo chemotv. */
        try { this.m.a.style.opacity = "0"; } catch (e) {}
        this.j = new O(this, "overhang", 0, 0, void 0, void 0, void 0, void 0);
        var a = this.j.width, b = this.j.height;
        this.j.width = W;
        this.j.height = Math.floor(W / a * b) || 0;
        var top = Math.min(this.j.height, 140);
        Ga(this, this.l.zb.hc, this.l.Da, this.j.height - Math.floor(1.2 * K.d.p));
        this.N = Math.floor(W / 40);
        this.Ha = Math.floor(H / 40);
        this.Kl = K.gc.sl;

        var panelY = top + 12, panelH = H - panelY - 24;

        /* teclado (mismo tamano que el original: 20 * Ha); se coloca despues */
        this.input = new Hb(this, 0, 0, 20 * this.Ha, L, T);
        /* fila superior + 7 filas de letras (la propiedad height del original cuenta una menos) */
        var kbW = this.input.width || 305, kbH = 8 * (this.input.M + this.input.S) + this.input.S || 405;

        /* panel izquierdo: debajo del logo del fondo; compacto si la pantalla es baja */
        var leftY = Math.max(panelY, Math.round(H * 0.235)), leftH = H - leftY - 24;
        var compact = leftH < 92 + 66 + kbH + 12;
        var left = new P(this, 40, leftY, 410, leftH, 22, GLASS, STROKE);
        left.a.style.boxShadow = "0 20px 50px rgba(0,0,0,.5)";
        if (!compact) {
            var title = new M(left, "Buscar", 28, 18, 360, 40, "34px GothamBlack", TEXT);
            title.a.style.lineHeight = "40px";
            var sub = new M(left, "Películas, series y colecciones", 28, 58, 360, 24, "18px GothamCondensed", MUTED);
            sub.a.style.lineHeight = "24px";
        }
        /* el panel se creo despues del teclado: el teclado debe quedar encima */
        this.input.zIndex = 3;

        var fieldY = leftY + (compact ? 16 : 92);
        this.Ab = new Jb(this, 64, fieldY, 362, 48, 0, 24, "rgba(255,255,255,.06)",
            "solid rgba(255,255,255,.16) 2px", TEXT);
        this.Ab.g.a.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,.35)";
        var lens = el("div", "right:20px;top:11px", this.Ab.g.a);
        lens.className = "bx-lens";
        var ph = el("div", "position:absolute;left:" + (2 * this.Ab.hh) + "px;top:0;line-height:44px;" +
            "font:18px GothamCondensed;color:rgba(232,238,255,.38);white-space:nowrap;pointer-events:none", this.Ab.g.a);
        ph.appendChild(document.createTextNode("Título de película o serie…"));

        this.Ab.zIndex = 3;
        this.input.x = 40 + Math.floor((410 - kbW) / 2);
        this.input.y = fieldY + (compact ? 62 : 66);

        /* panel derecho: resultados */
        var rx = 470, rw = W - rx - 40;
        this.Be = new P(this, rx, panelY, rw, panelH, 22, GLASS, STROKE);
        this.Be.a.style.overflow = "hidden";
        this.Be.a.style.boxShadow = "0 20px 50px rgba(0,0,0,.5)";
        this.Be.__bxSearch = this;
        var rt = new M(this.Be, "Resultados", 26, 18, 300, 40, "28px GothamBlack", TEXT);
        rt.a.style.lineHeight = "40px";
        var count = new M(this.Be, "", rw - 226, 24, 200, 30, "18px GothamCondensed", MUTED);
        count.align = "right";
        var sep = el("div", "position:absolute;left:26px;right:26px;top:" + (LIST_TOP - 10) + "px;height:1px;" +
            "background:rgba(255,255,255,.08)", this.Be.a);

        var areaH = panelH - LIST_TOP - FOOTER_H - 8;
        var clip = el("div", "position:absolute;left:0;top:" + LIST_TOP + "px;width:" + LIST_W + "px;height:" +
            areaH + "px;overflow:hidden", this.Be.a);

        /* columna derecha: poster grande del resultado seleccionado */
        var pvX = LIST_W + 8, pvW = rw - pvX - 24;
        var posterH = Math.max(120, Math.min(Math.floor(pvW * 1.5), areaH - 84)), posterW = Math.floor(posterH / 1.5);
        var preview = el("div", "position:absolute;left:" + pvX + "px;top:" + LIST_TOP + "px;width:" + pvW + "px;height:" +
            areaH + "px;display:none;text-align:center", this.Be.a);
        var pvBox = el("div", "position:relative;margin:0 auto;width:" + posterW + "px;height:" + posterH + "px;border-radius:14px;" +
            "overflow:hidden;background:linear-gradient(150deg,#2a2e38 0%,#1a1d24 60%,#14161b 100%);" +
            "box-shadow:0 0 0 2px rgba(255,255,255,.18),0 18px 40px rgba(0,0,0,.55)", preview);
        var pvLetter = el("div", "position:absolute;left:0;top:0;width:100%;height:100%;line-height:" + posterH + "px;" +
            "font:800 " + Math.floor(posterH / 2.6) + "px 'Barlow Semi Condensed',GothamBlack,sans-serif;color:rgba(255,255,255,.55)", pvBox);
        pvLetter.appendChild(document.createTextNode(""));
        var pvImg = el("img", "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;opacity:0;" +
            "transition:opacity .3s;display:none", pvBox);
        var pvTitle = el("div", "margin-top:12px;font:700 21px/24px 'Barlow Condensed',GothamCondensed,sans-serif;color:" + TEXT + ";" +
            "max-height:48px;overflow:hidden", preview);
        pvTitle.appendChild(document.createTextNode(""));
        var pvMeta = el("div", "margin-top:4px;font:600 15px 'Barlow Condensed',GothamCondensed,sans-serif;letter-spacing:.8px;color:" + MUTED, preview);
        pvMeta.appendChild(document.createTextNode(""));

        var midY = Math.floor((panelH - FOOTER_H) / 2) - 40;
        var empty = el("div", "top:" + midY + "px", this.Be.a);
        empty.className = "bx-hint";
        var bigLens = el("div", "position:relative;display:inline-block;width:46px;height:46px;margin-bottom:14px", empty);
        el("div", "left:6px;top:4px;width:24px;height:24px;border-width:4px", bigLens).className = "bx-lens";
        var t1 = el("div", "font:600 24px 'Barlow Condensed',GothamCondensed,sans-serif;color:" + TEXT, empty);
        t1.appendChild(document.createTextNode("Escribe para empezar a buscar"));
        var t2 = el("div", "font:500 18px 'Barlow Condensed',GothamCondensed,sans-serif;margin-top:6px", empty);
        t2.appendChild(document.createTextNode("Usa el teclado de la izquierda. Pulsa → para ir a los resultados."));
        var none = el("div", "top:" + midY + "px;display:none", this.Be.a);
        none.className = "bx-hint";
        var n1 = el("div", "font:600 24px 'Barlow Condensed',GothamCondensed,sans-serif;color:" + TEXT, none);
        var noneText = document.createTextNode("");
        n1.appendChild(noneText);
        var n2 = el("div", "font:500 18px 'Barlow Condensed',GothamCondensed,sans-serif;margin-top:6px", none);
        n2.appendChild(document.createTextNode("Prueba con otra palabra o revisa la ortografía."));

        /* pie: leyenda de los botones de peliculas / series del teclado */
        var fy = panelH - FOOTER_H;
        var foot = new P(this.Be, 0, fy, rw, FOOTER_H, 0, "rgba(255,255,255,.035)");
        foot.a.style.boxShadow = "none";
        foot.a.style.borderTop = "1px solid rgba(255,255,255,.07)";
        foot.zIndex = 10;
        new O(foot, "section_search_movies", 26, 11, 30, 30, void 0, void 0);
        new M(foot, "Solo películas", 64, 13, 200, 26, "18px GothamCondensed", MUTED).a.style.lineHeight = "26px";
        new O(foot, "section_search_series", 230, 11, 30, 30, void 0, void 0);
        new M(foot, "Solo series", 268, 13, 200, 26, "18px GothamCondensed", MUTED).a.style.lineHeight = "26px";

        this.__bx = { empty: empty, none: none, noneText: noneText, count: count, placeholder: ph, clip: clip, pvBox: pvBox,
            preview: preview, pvImg: pvImg, pvTitle: pvTitle, pvMeta: pvMeta, pvLetter: pvLetter };
        window.__bxSearchScene = this;

        /* estado inicial identico al original */
        this.na = !1;
        window.yc = !1;
        this.Ie = !1;
        this.Ya = null;
        this.input.Bd();
        this.Xe = "alphabox";
        this.show();

        /* abierto desde "Mas peliculas de [actor]": corre la busqueda sola */
        if (this.l && this.l.bxQuery) {
            var self = this, q = this.l.bxQuery;
            setTimeout(function () { bxRunSearch(self, q); }, 80);
        }
    }

    function bxRunSearch(scene, query) {
        try {
            if (scene.Ab) scene.Ab.wc.text = query;
            if (scene.__bx) scene.__bx.placeholder.style.display = "none";
            window.ad(query, {
                success: function (a) {
                    if (!a.status) return;
                    if (scene.Ya) { try { scene.Ya.clear(); } catch (e) {} scene.Ya = null; }
                    if (a.gd.length) {
                        var c = [];
                        for (var g = 0; g < a.gd.length; g++) c.push({
                            name: a.gd[g].m, text: a.gd[g].R + " [" + a.gd[g].td + ", " + a.gd[g].Sl + "]",
                            m: a.gd[g].m, rc: a.gd[g].rc, rtg: a.gd[g].rtg
                        });
                        scene.Ya = new La(scene.Be, Math.floor(scene.N / 2), scene.Ha, scene.Be.width - scene.N, 19, c, "left", void 0, void 0, "18px GothamCondensed");
                        scene.Ya.ef();
                    }
                },
                f: function () {}
            }, "all");
        } catch (e) {}
    }

    /* ---------- 10. Detalle de pelicula/serie: centro de entretenimiento ---------- */
    var bxDetailGen = 0, DETAIL_BTN_W = 300;
    safe("DetailScene", function () {
        if (typeof zd !== "function" || !zd.prototype) return;
        var origXa = zd.prototype.xa, origAc = zd.prototype.Ac, origEvent = zd.prototype.event;
        zd.prototype.xa = function () {
            try { return bxDetailLayout(this); }
            catch (e) {
                if (window.console) console.log("[bx] detail: " + e);
                this.__bxDetail = false;
                this.clear();
                return origXa.apply(this, arguments);
            }
        };
        zd.prototype.Ac = function () {
            var r = origAc.apply(this, arguments);   /* crea this.buttons via Ad */
            try {
                if (this.__bxDetail && this.buttons) {
                    /* se reconstruye mas ancho (300) para que no se corte "Continuar reproducción" */
                    var items = this.buttons.buttons.slice();
                    this.buttons.clear();
                    this.buttons = new La(this, 64, 462, DETAIL_BTN_W, K.d.p, items, "left");
                    ib(this.buttons);
                }
            } catch (e) {}
            return r;
        };
        zd.prototype.event = function (a) {
            try {
                if (this.__bxDetail && a && a.source === "key" && a.type === "press") {
                    var scene = this, z = scene.__bxZone || 0, code = a.code;
                    var cast = scene.__bxCast || [], rel = scene.__bxRel || [];
                    if (z === 0) {
                        /* en los botones: OK sobre "Más de [actor]" abre su busqueda (como antes) */
                        if (code === B.key.ra && scene.buttons && jb(scene.buttons) === "bxactor") {
                            bxDetailGo(scene, scene.__bxActor); return;
                        }
                        /* DERECHA: salta al reparto (o a relacionadas si no hay reparto) */
                        if (code === B.key.ib) {
                            if (cast.length) { scene.__bxZone = 1; bxDetailHi(scene); return; }
                            if (rel.length) { scene.__bxZone = 2; bxDetailHi(scene); return; }
                        }
                        /* resto de teclas: comportamiento nativo (sube/baja botones, OK reproduce, atras sale) */
                    } else if (z === 1) {   /* reparto */
                        switch (code) {
                            case B.key.bb: if (scene.__bxCi > 0) { scene.__bxCi--; bxDetailHi(scene); } else { scene.__bxZone = 0; bxDetailHi(scene); } return;
                            case B.key.ib: if (scene.__bxCi < cast.length - 1) { scene.__bxCi++; bxDetailHi(scene); } return;
                            case B.key.ab: if (rel.length) { scene.__bxZone = 2; bxDetailHi(scene); } return;
                            case B.key.cb: scene.__bxZone = 0; bxDetailHi(scene); return;
                            case B.key.ra: bxDetailGo(scene, cast[scene.__bxCi] && cast[scene.__bxCi].name); return;
                            case B.key.ma: case B.key.BACK: scene.__bxZone = 0; bxDetailHi(scene); return;
                            default: return;
                        }
                    } else if (z === 2) {   /* relacionadas */
                        switch (code) {
                            case B.key.bb: if (scene.__bxRi > 0) { scene.__bxRi--; bxDetailHi(scene); } else { scene.__bxZone = cast.length ? 1 : 0; bxDetailHi(scene); } return;
                            case B.key.ib: if (scene.__bxRi < rel.length - 1) { scene.__bxRi++; bxDetailHi(scene); } return;
                            case B.key.cb: scene.__bxZone = cast.length ? 1 : 0; bxDetailHi(scene); return;
                            case B.key.ab: return;
                            case B.key.ra: bxDetailGo(scene, rel[scene.__bxRi] && rel[scene.__bxRi].title); return;
                            case B.key.ma: case B.key.BACK: scene.__bxZone = 0; bxDetailHi(scene); return;
                            default: return;
                        }
                    }
                }
            } catch (e) {}
            return origEvent.apply(this, arguments);
        };
    });

    function addActorButton(scene, name) {
        if (!scene.buttons || scene.__bxActorAdded) return;
        try {
            scene.__bxActorAdded = true;
            scene.__bxActor = name;
            var items = scene.buttons.buttons.slice();
            items.push({ name: "bxactor", text: "Más de " + name, visible: true });
            scene.buttons.clear();
            scene.buttons = new La(scene, 64, 462, DETAIL_BTN_W, K.d.p, items, "left");
            ib(scene.buttons);
        } catch (e) {}
    }

    /* desplaza la tira (reparto/relacionadas) para que la celda enfocada quede a la vista */
    function bxStripScroll(track, cell, stripW) {
        if (!track || !cell) return;
        var cl = cell.offsetLeft, cw = cell.offsetWidth, cur = track.__tx || 0;
        var viewL = -cur, viewR = viewL + stripW, tx = cur;
        if (cl < viewL + 6) tx = -cl + 6;
        else if (cl + cw > viewR - 6) tx = -(cl + cw - stripW) - 6;
        if (tx > 0) tx = 0;
        track.__tx = tx;
        track.style.transform = "translateX(" + tx + "px)";
        track.style.webkitTransform = "translateX(" + tx + "px)";
    }
    /* pinta el foco: atenua los botones si el foco esta en reparto/relacionadas y resalta la celda */
    function bxDetailHi(scene) {
        try {
            var hc = (scene.__bxType && scene.__bxType.c) || ACCENT, z = scene.__bxZone || 0;
            if (scene.buttons && scene.buttons.L && scene.buttons.L.a) scene.buttons.L.a.style.opacity = z === 0 ? "1" : "0";
            var cast = scene.__bxCast || [], rel = scene.__bxRel || [];
            for (var i = 0; i < cast.length; i++) {
                var on = z === 1 && i === scene.__bxCi, a = cast[i].av.style;
                a.boxShadow = on ? "0 0 0 3px " + hc + ",0 8px 20px rgba(0,0,0,.55)" : "0 4px 12px rgba(0,0,0,.4)";
                a.transform = a.webkitTransform = on ? "scale(1.12)" : "none";
                cast[i].nm.style.color = on ? "#ffffff" : TEXT;
            }
            for (var j = 0; j < rel.length; j++) {
                var on2 = z === 2 && j === scene.__bxRi, p = rel[j].pbx.style;
                p.boxShadow = on2 ? "0 0 0 3px " + hc + ",0 12px 26px rgba(0,0,0,.6)" : "0 6px 16px rgba(0,0,0,.45)";
                p.transform = p.webkitTransform = on2 ? "scale(1.07)" : "none";
                rel[j].nm.style.color = on2 ? "#ffffff" : MUTED;
            }
            if (z === 1 && cast[scene.__bxCi]) bxStripScroll(scene.__bxCastTrack, cast[scene.__bxCi].cell, scene.__bxCastW);
            if (z === 2 && rel[scene.__bxRi]) bxStripScroll(scene.__bxRelTrack, rel[scene.__bxRi].cell, scene.__bxRelW);
        } catch (e) {}
    }
    /* navega a la busqueda del catalogo con una consulta (nombre de actor o titulo) */
    function bxDetailGo(scene, query) {
        if (!query) return;
        scene.aa("SearchScene", true, { zb: { hc: "Buscar" }, Da: (scene.l && scene.l.Da) || "", bxQuery: query });
    }

    function bxDetailLayout(scene) {
        var W = scene.b.width, H = scene.b.height, e = scene.l.e;
        scene.N = W / 40; scene.Ha = H / 40;
        scene.e = e;
        scene.Hd = e.Mc; scene.Ci = e.Zl; scene.tra = 1;
        scene.pe = 0 < e.sb.length;
        e.Ga = -1;
        if (scene.pe) {
            var f = B.Ta("SubtitleLanguagePreference");
            if (null === f) f = m;
            if ("[none]" !== f) for (var si = 0; si < e.sb.length; si++) if (e.sb[si].Rj === f) { e.Ga = si; break; }
        }
        scene.$i = !1;
        scene.__bxActorAdded = false;
        var pt = bxType(e.rc, e.R);
        scene.__bxType = pt;
        scene.__bxDetail = true;
        var gen = ++bxDetailGen; scene.__bxGen = gen;
        function alive() { return scene.__bxGen === gen && scene.a; }

        var url = e.Ia || e.ud, hasImg = url && ("" + url).indexOf("http") === 0;
        if (hasImg)
            el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;background:url('" + url + "') center/cover;" +
                "filter:blur(44px) saturate(1.3) brightness(.4);-webkit-filter:blur(44px) saturate(1.3) brightness(.4)", scene.a);
        el("div", "position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;" +
            "background:linear-gradient(90deg,rgba(16,18,23,.97) 0%,rgba(16,18,23,.86) 40%,rgba(16,18,23,.6) 100%)," +
            "linear-gradient(0deg,rgba(16,18,23,.9) 0%,rgba(16,18,23,0) 30%)", scene.a);

        Ga(scene, I("Play"), scene.l.Da, 40);

        /* poster izquierdo */
        var pbox = el("div", "position:absolute;left:64px;top:118px;width:214px;height:321px;border-radius:14px;overflow:hidden;z-index:2;" +
            "background:linear-gradient(150deg,#2a2e38,#14161b);box-shadow:0 0 0 2px " + rgba(pt.c, .5) + ",0 20px 44px rgba(0,0,0,.6)", scene.a);
        if (hasImg) { var pimg = el("img", "width:100%;height:100%;object-fit:cover", pbox); pimg.src = url; }

        var rx = 312, rw = W - rx - 56;
        function div(css) { return el("div", "position:absolute;left:" + rx + "px;width:" + rw + "px;z-index:2;" + css, scene.a); }

        var title = div("top:112px;font:800 46px 'Barlow Semi Condensed',GothamBlack,sans-serif;color:" + TEXT +
            ";text-shadow:0 2px 16px rgba(0,0,0,.6);line-height:52px;max-height:108px;overflow:hidden");
        title.appendChild(document.createTextNode(bxCleanTitle(e.R) || e.R || ""));

        var meta = div("top:206px;white-space:nowrap;overflow:hidden");
        function chip(txt, bg, bc, col) {
            var s = el("span", "display:inline-block;vertical-align:middle;margin-right:10px;padding:3px 13px;border-radius:999px;" +
                "font:600 16px 'Barlow Condensed',sans-serif;letter-spacing:.6px;background:" + bg + ";border:1px solid " + bc + ";color:" + (col || "#fff"), meta);
            s.appendChild(document.createTextNode(txt));
        }
        if (pt.label) chip(pt.label, rgba(pt.c, .24), rgba(pt.c, .5), "#fff");
        var yr = (e.td || "").toString().slice(0, 4);
        if (yr) chip(yr, "rgba(255,255,255,.07)", "rgba(255,255,255,.14)", TEXT);
        if (e.sd) chip(e.sd, "rgba(255,255,255,.07)", "rgba(255,255,255,.14)", TEXT);
        try { if (e.Gf) chip(da(e.Gf), "rgba(255,255,255,.07)", "rgba(255,255,255,.14)", TEXT); } catch (e2) {}

        var gens = (e.Ff || []).slice(0, 4).join("  ·  ");
        if (gens) {
            var g = div("top:248px;font:600 17px 'Barlow Condensed',sans-serif;letter-spacing:.5px;text-transform:uppercase;" +
                "color:" + rgba(pt.c, .95) + ";white-space:nowrap;overflow:hidden");
            g.appendChild(document.createTextNode(gens));
        }
        var syn = div("top:282px;height:116px;overflow:hidden;font:400 18px/25px 'Barlow',sans-serif;" +
            "color:rgba(238,241,246,.86);text-align:justify");
        syn.appendChild(document.createTextNode(e.fc || ""));
        el("div", "position:absolute;left:" + rx + "px;top:372px;width:" + rw + "px;height:26px;z-index:3;pointer-events:none;" +
            "background:linear-gradient(180deg,rgba(16,18,23,0),rgba(16,18,23,.9))", scene.a);

        /* secciones que se llenan desde TMDb (a la derecha de los botones, que ahora son mas anchos) */
        var sx = 384, sw = W - sx - 48;
        function sdiv(css) { return el("div", "position:absolute;left:" + sx + "px;width:" + sw + "px;z-index:2;" + css, scene.a); }
        function sectionLabel(topPx, txt) {
            var l = sdiv("top:" + topPx + "px;font:700 15px 'Barlow Condensed',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.5)");
            l.appendChild(document.createTextNode(txt));
            l.style.display = "none";
            return l;
        }
        var castLbl = sectionLabel(410, "Reparto principal  ▸");
        var castStrip = sdiv("top:434px;height:118px;white-space:nowrap;overflow:hidden");
        var castTrack = el("div", "position:relative;white-space:nowrap;padding-top:6px;transition:-webkit-transform .2s,transform .2s", castStrip);
        var relLbl = sectionLabel(548, "Relacionadas  ▸");
        var relStrip = sdiv("top:568px;height:150px;white-space:nowrap;overflow:hidden");
        var relTrack = el("div", "position:relative;white-space:nowrap;padding-top:6px;transition:-webkit-transform .2s,transform .2s", relStrip);
        /* estado de foco del detalle: 0=botones, 1=reparto, 2=relacionadas */
        scene.__bxZone = 0; scene.__bxCi = 0; scene.__bxRi = 0;
        scene.__bxCast = []; scene.__bxRel = [];
        scene.__bxCastTrack = castTrack; scene.__bxRelTrack = relTrack;
        scene.__bxCastW = sw; scene.__bxRelW = sw;

        function renderCast(list) {
            if (!alive()) return;
            var shown = 0;
            for (var i = 0; i < list.length && shown < 10; i++) {
                var p = list[i]; if (!p.name) continue;
                shown++;
                var cell = el("div", "display:inline-block;vertical-align:top;width:98px;margin-right:8px;text-align:center;white-space:normal", castTrack);
                var av = el("div", "width:62px;height:62px;border-radius:50%;margin:0 auto 6px;overflow:hidden;" +
                    "background:linear-gradient(150deg,#2b2f39,#15171d);box-shadow:0 4px 12px rgba(0,0,0,.4);" +
                    "-webkit-transform-origin:center;transform-origin:center;transition:-webkit-transform .15s,transform .15s,box-shadow .15s", cell);
                if (p.profile_path) { var im = el("img", "width:100%;height:100%;object-fit:cover", av); im.src = TMDB_IMG + "w185" + p.profile_path; }
                else { av.style.lineHeight = "62px"; av.style.color = "rgba(255,255,255,.5)"; av.style.font = "700 24px 'Barlow Semi Condensed',sans-serif"; av.appendChild(document.createTextNode((p.name[0] || "?").toUpperCase())); }
                var nm = el("div", "font:600 13px/15px 'Barlow Condensed',sans-serif;color:" + TEXT + ";max-height:30px;overflow:hidden", cell);
                nm.appendChild(document.createTextNode(p.name));
                if (p.character) { var ch = el("div", "font:500 12px 'Barlow Condensed',sans-serif;color:" + MUTED + ";max-height:15px;overflow:hidden", cell); ch.appendChild(document.createTextNode(p.character)); }
                scene.__bxCast.push({ cell: cell, av: av, nm: nm, name: p.name });
            }
            if (shown) castLbl.style.display = "block";
            bxDetailHi(scene);
        }
        function renderRelated(list) {
            if (!alive()) return;
            var shown = 0;
            for (var i = 0; i < list.length && shown < 12; i++) {
                var mo = list[i], ti = mo.title || mo.name; if (!mo.poster_path || !ti) continue;
                shown++;
                var cell = el("div", "display:inline-block;vertical-align:top;width:92px;margin-right:10px;white-space:normal", relTrack);
                var pbx = el("div", "width:92px;height:138px;border-radius:9px;overflow:hidden;background:#1a1d24;box-shadow:0 6px 16px rgba(0,0,0,.45);" +
                    "-webkit-transform-origin:center;transform-origin:center;transition:-webkit-transform .15s,transform .15s,box-shadow .15s", cell);
                var im = el("img", "width:100%;height:100%;object-fit:cover", pbx); im.src = TMDB_IMG + "w185" + mo.poster_path;
                var nm = el("div", "margin-top:5px;font:600 12px/14px 'Barlow Condensed',sans-serif;color:" + MUTED + ";max-height:28px;overflow:hidden", cell);
                nm.appendChild(document.createTextNode(ti));
                scene.__bxRel.push({ cell: cell, pbx: pbx, nm: nm, title: bxCleanTitle(ti) || ti });
            }
            if (shown) relLbl.style.display = "block";
            bxDetailHi(scene);
        }

        /* TMDb: sinopsis completa, reparto con fotos, relacionadas, y actor principal */
        tmdb("search/multi", { query: bxCleanTitle(e.R) || e.R, language: "es-MX", include_adult: "false" }, function (r) {
            if (!alive() || !r || !r.results) return;
            var best = null;
            for (var i = 0; i < r.results.length; i++) {
                var it = r.results[i];
                if (it.media_type === "movie" || it.media_type === "tv") {
                    var ty = (it.release_date || it.first_air_date || "").slice(0, 4);
                    if (!best) best = it;
                    if (yr && ty === yr) { best = it; break; }
                }
            }
            if (!best) return;
            var base = (best.media_type === "tv" ? "tv/" : "movie/") + best.id;
            if (best.overview && best.overview.length > 20) {   /* preferir la sinopsis de TMDb */
                try { syn.firstChild.data = best.overview; } catch (e3) {}
            }
            tmdb(base + "/credits", { language: "es-MX" }, function (cr) {
                if (!alive() || !cr || !cr.cast) return;
                renderCast(cr.cast.slice(0, 8));
                if (cr.cast[0] && cr.cast[0].name) addActorButton(scene, cr.cast[0].name);
            });
            tmdb(base + "/similar", { language: "es-MX" }, function (sm) {
                if (!alive() || !sm || !sm.results || !sm.results.length) {
                    tmdb(base + "/recommendations", { language: "es-MX" }, function (rc) {
                        if (alive() && rc && rc.results) renderRelated(rc.results.slice(0, 10));
                    });
                    return;
                }
                renderRelated(sm.results.slice(0, 10));
            });
        });

        scene.show();
        scene.b.h.hide();
        scene.caller.na = !1;
    }

    /* ---------- 11. Reemplazar el logo del ojo por chemotv (splash, protector de pantalla, banner) ---------- */
    safe("chemoLogo", function () {
        var defs = "<defs><linearGradient id='cg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#4ea3ff'/><stop offset='1' stop-color='#b57cff'/></linearGradient></defs>";
        var square = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' preserveAspectRatio='xMidYMid meet'>" + defs +
            "<rect x='168' y='120' width='164' height='164' rx='44' fill='url(#cg)'/>" +
            "<path d='M228 178 L228 246 L292 212 Z' fill='#0c0d11'/>" +
            "<text x='250' y='382' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='86'>" +
            "<tspan fill='#f4f6ff'>chemo</tspan><tspan fill='url(#cg)'>tv</tspan></text></svg>";
        var wide = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 124' preserveAspectRatio='xMidYMid meet'>" + defs +
            "<rect x='34' y='34' width='56' height='56' rx='16' fill='url(#cg)'/>" +
            "<path d='M55 52 L55 80 L79 66 Z' fill='#0c0d11'/>" +
            "<text x='104' y='83' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='56'>" +
            "<tspan fill='#f4f6ff'>chemo</tspan><tspan fill='url(#cg)'>tv</tspan></text></svg>";
        var sqUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(square);
        var wideUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(wide);
        /* preciso: SOLO el logo (DEv0vX1/splash_logo) y el banner (overhang). NO toca iconos de seccion
           como menu_icons_blackeye/*, que tambien contienen "blackeye". */
        var RE_WIDE = /_?overhang/i, RE_SQ = /DEv0vX1|splash_logo/i;
        function pick(src) { src = (src || "").toString(); if (RE_WIDE.test(src)) return wideUri; if (RE_SQ.test(src)) return sqUri; return null; }
        function swap(img) {
            try {
                if (!img || !img.src || img.__bxLogo) return;
                var u = pick(img.src);
                if (u) { img.__bxLogo = 1; img.src = u; img.style.objectFit = "contain"; }
            } catch (e) {}
        }
        /* el logo viejo (ovalo del ojo) puede venir como fondo CSS en algunas pantallas
           (configuraciones/favoritos): tambien lo reemplazamos ahi para que no se empalme. */
        function swapBg(elm) {
            try {
                if (!elm || elm.__bxLogoBg || !elm.style) return;
                var bg = elm.style.backgroundImage || "";
                if (bg.indexOf("url") < 0) return;
                var u = pick(bg);
                if (u) { elm.__bxLogoBg = 1; elm.style.backgroundImage = "url('" + u + "')"; elm.style.backgroundRepeat = "no-repeat"; elm.style.backgroundPosition = "center"; elm.style.backgroundSize = "contain"; }
            } catch (e) {}
        }
        function sweep() {
            try {
                var g = document.getElementsByTagName("img");
                for (var i = 0; i < g.length; i++) swap(g[i]);
                var all = document.getElementsByTagName("*");
                for (var j = 0; j < all.length; j++) swapBg(all[j]);
            } catch (e) {}
        }
        try {
            if (window.MutationObserver) {
                new MutationObserver(function (muts) {
                    for (var i = 0; i < muts.length; i++) {
                        var n = muts[i].addedNodes;
                        for (var j = 0; j < n.length; j++) {
                            var nd2 = n[j];
                            if (nd2.tagName === "IMG") swap(nd2);
                            else if (nd2.getElementsByTagName) { var inner = nd2.getElementsByTagName("img"); for (var k = 0; k < inner.length; k++) swap(inner[k]); }
                            if (nd2.style) swapBg(nd2);
                        }
                    }
                }).observe(document.documentElement || document.body, { childList: true, subtree: true });
            }
            sweep();
            setInterval(sweep, 1500);
        } catch (e) {}
    });

    /* aviso para confirmar en la TV que el tema se cargo */
    try {
        if (window.vsaClient && vsaClient.Toast)
            vsaClient.Toast(failed.length ? "Tema moderno activo (fallo: " + failed.join(", ") + ")" : "Tema moderno activo");
    } catch (e) {}

    void 0;
})();
void 0;
