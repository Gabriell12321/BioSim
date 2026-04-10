(function () {

    var navBtns = document.querySelectorAll('.nav-btn');
    var tabs = document.querySelectorAll('.tab-content');

    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = btn.dataset.tab;
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            tabs.forEach(function(tc) {
                tc.classList.toggle('active', tc.id === target);
            });
        });
    });

    // sub-tabs
    document.querySelectorAll('.sub-tab').forEach(function(stab) {
        stab.onclick = function() {
            var parent = stab.closest('.tab-content');
            var targetId = stab.dataset.subtab;
            parent.querySelectorAll('.sub-tab').forEach(function(s) { s.classList.remove('active'); });
            stab.classList.add('active');
            parent.querySelectorAll('.sub-content').forEach(function(sc) {
                sc.classList.toggle('active', sc.id === targetId);
            });
        };
    });

    // range sliders
    document.querySelectorAll('input[type="range"]').forEach(function(input) {
        var valSpan = document.getElementById(input.id + '-val');
        if (valSpan) {
            input.addEventListener('input', function() { valSpan.textContent = input.value; });
        }
    });

    // toggle SIR/SEIR
    var sirBtn = document.getElementById('sir-mode-btn');
    var seirBtn = document.getElementById('seir-mode-btn');
    if (sirBtn && seirBtn) {
        sirBtn.onclick = function() {
            sirBtn.classList.add('active');
            seirBtn.classList.remove('active');
            document.querySelectorAll('.seir-only').forEach(function(el) { el.style.display = 'none'; });
        };
        seirBtn.onclick = function() {
            seirBtn.classList.add('active');
            sirBtn.classList.remove('active');
            document.querySelectorAll('.seir-only').forEach(function(el) { el.style.display = ''; });
        };
    }

    // pathway select
    var metaPathway = document.getElementById('meta-pathway');
    if (metaPathway) {
        metaPathway.onchange = function() {
            var fg = document.getElementById('meta-feedback-group');
            if (fg) fg.style.display = metaPathway.value === 'feedback' ? '' : 'none';
        };
    }

    // cenário evolução
    var evoSel = document.getElementById('evo-scenario');
    if (evoSel) {
        evoSel.onchange = function() {
            var v = evoSel.value;
            var mutG = document.getElementById('evo-mutation-group');
            var runsG = document.getElementById('evo-runs-group');
            if (mutG) mutG.style.display = v === 'mutation-selection' ? '' : 'none';
            if (runsG) runsG.style.display = (v === 'drift' || v === 'multi-loci') ? '' : 'none';
        };
    }

    // presets
    var presets = {
        'lv-classic':   { 'lv-alpha': 1.0, 'lv-beta': 0.1, 'lv-delta': 0.075, 'lv-gamma': 1.5, 'lv-x0': 40, 'lv-y0': 9, 'lv-time': 50 },
        'lv-explosive': { 'lv-alpha': 2.5, 'lv-beta': 0.08, 'lv-delta': 0.05, 'lv-gamma': 1.0, 'lv-x0': 80, 'lv-y0': 5, 'lv-time': 80 },
        'lv-efficient': { 'lv-alpha': 0.8, 'lv-beta': 0.3, 'lv-delta': 0.15, 'lv-gamma': 0.8, 'lv-x0': 30, 'lv-y0': 15, 'lv-time': 60 },
        'lv-fragile':   { 'lv-alpha': 0.5, 'lv-beta': 0.2, 'lv-delta': 0.1, 'lv-gamma': 2.0, 'lv-x0': 20, 'lv-y0': 10, 'lv-time': 100 },
        'epi-gripe':    { 'epi-beta': 0.2, 'epi-gamma': 0.14, 'epi-sigma': 0.5, 'epi-n': 10000, 'epi-i0': 10, 'epi-days': 200, '_mode': 'sir' },
        'epi-covid':    { 'epi-beta': 0.4, 'epi-gamma': 0.07, 'epi-sigma': 0.2, 'epi-n': 100000, 'epi-i0': 50, 'epi-days': 300, '_mode': 'seir' },
        'epi-sarampo':  { 'epi-beta': 0.9, 'epi-gamma': 0.07, 'epi-sigma': 0.1, 'epi-n': 50000, 'epi-i0': 5, 'epi-days': 200, '_mode': 'sir' },
        'epi-ebola':    { 'epi-beta': 0.15, 'epi-gamma': 0.1, 'epi-sigma': 0.1, 'epi-n': 5000, 'epi-i0': 3, 'epi-days': 300, '_mode': 'seir' }
    };

    document.querySelectorAll('.btn-preset').forEach(function(btn) {
        btn.onclick = function() {
            var p = presets[btn.dataset.preset];
            if (!p) return;
            for (var id in p) {
                if (id[0] === '_') continue;
                var el = document.getElementById(id);
                if (!el) continue;
                el.value = p[id];
                var sp = document.getElementById(id + '-val');
                if (sp) sp.textContent = p[id];
            }
            if (p._mode && sirBtn && seirBtn) {
                var useSEIR = p._mode === 'seir';
                sirBtn.classList.toggle('active', !useSEIR);
                seirBtn.classList.toggle('active', useSEIR);
                document.querySelectorAll('.seir-only').forEach(function(el) {
                    el.style.display = useSEIR ? '' : 'none';
                });
            }
        };
    });

    // init modules
    function initAll() {
        if (typeof Genetica !== 'undefined') Genetica.init();
        if (typeof LotkaVolterra !== 'undefined') LotkaVolterra.init();
        if (typeof Epidemiological !== 'undefined') Epidemiological.init();
        if (typeof Metabolic !== 'undefined') Metabolic.init();
        if (typeof Evolution !== 'undefined') Evolution.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
