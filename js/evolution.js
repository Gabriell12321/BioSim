var Evolution = (function(){

    var grafFreq, grafGeno;

    function params() {
        var el = function(id) { return document.getElementById(id); };
        return {
            scenario: el('evo-scenario').value,
            p0:   parseFloat(el('evo-p0').value),
            w11:  parseFloat(el('evo-w11').value),
            w12:  parseFloat(el('evo-w12').value),
            w22:  parseFloat(el('evo-w22').value),
            N:    parseInt(el('evo-popsize').value),
            mu:   parseFloat(el('evo-mu').value),
            gens: parseInt(el('evo-gen').value),
            runs: parseInt(el('evo-runs').value)
        };
    }

    function selStep(p, w11, w12, w22) {
        var q = 1 - p;
        var wbar = p*p*w11 + 2*p*q*w12 + q*q*w22;
        if (wbar === 0) return p;
        return Math.max(0, Math.min(1, (p*p*w11 + p*q*w12) / wbar));
    }

    function driftStep(p, N) {
        var v = (p * (1-p)) / (2*N);
        if (v <= 0) return p;
        // box-muller
        var u1 = Math.random(), u2 = Math.random();
        var z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, Math.min(1, p + z * Math.sqrt(v)));
    }

    function rodar() {
        var P = params();
        var geracoes = [];
        for (var g = 0; g <= P.gens; g++) geracoes.push(g);

        var series = [];
        var genoAA = [], genoAa = [], genoaa = [];

        if (P.scenario === 'selection') {
            var freq = [P.p0];
            for (var g = 1; g <= P.gens; g++)
                freq.push(selStep(freq[g-1], P.w11, P.w12, P.w22));
            series.push({ label: 'Freq. A', data: freq, color: '#3388cc' });
            genoAA = freq.map(function(p){ return p*p; });
            genoAa = freq.map(function(p){ return 2*p*(1-p); });
            genoaa = freq.map(function(p){ return (1-p)*(1-p); });
            mostrarStats(freq, P);

        } else if (P.scenario === 'heterozygote') {
            var freq = [P.p0];
            for (var g = 1; g <= P.gens; g++)
                freq.push(selStep(freq[g-1], 0.8, 1.0, 0.7));
            series.push({ label: 'Freq. A (het. advantage)', data: freq, color: '#cc5555' });
            genoAA = freq.map(function(p){ return p*p; });
            genoAa = freq.map(function(p){ return 2*p*(1-p); });
            genoaa = freq.map(function(p){ return (1-p)*(1-p); });
            var pEq = (1.0 - 0.7) / (2*1.0 - 0.8 - 0.7);
            mostrarStatsHet(freq, pEq);

        } else if (P.scenario === 'drift') {
            var nr = P.runs || 5;
            for (var r = 0; r < nr; r++) {
                var freq = [P.p0];
                for (var g = 1; g <= P.gens; g++)
                    freq.push(driftStep(freq[g-1], P.N));
                var hue = Math.round(r * 360 / nr);
                series.push({ label: 'Pop ' + (r+1), data: freq, color: 'hsl('+hue+',70%,50%)' });
            }
            var last = series[series.length-1].data;
            genoAA = last.map(function(p){ return p*p; });
            genoAa = last.map(function(p){ return 2*p*(1-p); });
            genoaa = last.map(function(p){ return (1-p)*(1-p); });
            mostrarStatsDrift(series, P);

        } else if (P.scenario === 'mutation-selection') {
            var freq = [P.p0];
            for (var g = 1; g <= P.gens; g++) {
                var pc = freq[g-1];
                pc = pc * (1 - P.mu) + (1 - pc) * P.mu;
                freq.push(selStep(pc, P.w11, P.w12, P.w22));
            }
            series.push({ label: 'Freq. A (mut+sel)', data: freq, color: 'teal' });
            genoAA = freq.map(function(p){ return p*p; });
            genoAa = freq.map(function(p){ return 2*p*(1-p); });
            genoaa = freq.map(function(p){ return (1-p)*(1-p); });
            mostrarStatsMutSel(freq, P);

        } else if (P.scenario === 'multi-loci') {
            var nr = P.runs || 5;
            for (var r = 0; r < nr; r++) {
                var popN = Math.max(10, Math.round(P.N * (0.5 + Math.random())));
                var freq = [P.p0];
                for (var g = 1; g <= P.gens; g++) {
                    var pc = driftStep(freq[g-1], popN);
                    freq.push(selStep(pc, P.w11, P.w12, P.w22));
                }
                var hue = Math.round(r * 360 / nr);
                series.push({ label: 'Pop ' + (r+1) + ' (N≈'+popN+')', data: freq, color: 'hsl('+hue+',60%,45%)' });
            }
            var last = series[series.length-1].data;
            genoAA = last.map(function(p){ return p*p; });
            genoAa = last.map(function(p){ return 2*p*(1-p); });
            genoaa = last.map(function(p){ return (1-p)*(1-p); });
            mostrarStatsMulti(series, P);
        }

        plotFreq(geracoes, series);
        plotGeno(geracoes, genoAA, genoAa, genoaa);
    }

    // helper pra stats
    function _s(label, val) {
        return '<div class="stat-row"><span class="stat-label">' + label + ':</span><span class="stat-value">' + val + '</span></div>';
    }

    function mostrarStats(freq, P) {
        var box = document.getElementById('evo-stats');
        if (!box) return;
        var pf = freq[freq.length-1];
        var wbar = pf*pf*P.w11 + 2*pf*(1-pf)*P.w12 + (1-pf)*(1-pf)*P.w22;
        box.innerHTML = '<h4>Resultados</h4>' +
            _s('p final', pf.toFixed(4)) +
            _s('q final', (1-pf).toFixed(4)) +
            _s('Status', pf > 0.99 ? 'A fixado' : pf < 0.01 ? 'A perdido' : 'Polimórfico') +
            '<hr>' + _s('Fitness w̄', wbar.toFixed(4));
    }

    function mostrarStatsHet(freq, pEq) {
        var box = document.getElementById('evo-stats');
        if (!box) return;
        var pf = freq[freq.length-1];
        box.innerHTML = '<h4>Vantagem heterozigoto</h4>' +
            _s('p equil. teórico', pEq.toFixed(4)) +
            _s('p final', pf.toFixed(4)) +
            _s('Heterozigotos', (2*pf*(1-pf)*100).toFixed(1) + '%') +
            _s('Polimorfismo', 'Balanceado');
    }

    function mostrarStatsDrift(series, P) {
        var box = document.getElementById('evo-stats');
        if (!box) return;
        var fins = series.map(function(s) { return s.data[s.data.length-1]; });
        var fixados = fins.filter(function(f) { return f > 0.99; }).length;
        var perdidos = fins.filter(function(f) { return f < 0.01; }).length;
        var media = fins.reduce(function(a,b) { return a+b; }, 0) / fins.length;
        box.innerHTML = '<h4>Deriva</h4>' +
            _s('Populações', series.length) +
            _s('Fixadas (p≈1)', fixados) +
            _s('Perdidas (p≈0)', perdidos) +
            _s('p médio', media.toFixed(4)) +
            _s('N', P.N);
    }

    function mostrarStatsMutSel(freq, P) {
        var box = document.getElementById('evo-stats');
        if (!box) return;
        var pf = freq[freq.length-1];
        var convergiu = Math.abs(freq[freq.length-1] - freq[freq.length-2]) < 0.0001;
        box.innerHTML = '<h4>Mutação + seleção</h4>' +
            _s('p final', pf.toFixed(4)) +
            _s('μ', P.mu) +
            _s('Equilíbrio', convergiu ? 'Atingido' : 'Convergindo...');
    }

    function mostrarStatsMulti(series, P) {
        var box = document.getElementById('evo-stats');
        if (!box) return;
        var fins = series.map(function(s){ return s.data[s.data.length-1]; });
        var avg = fins.reduce(function(a,b){ return a+b; },0) / fins.length;
        var vari = fins.reduce(function(s,f){ return s + (f - avg) * (f - avg); }, 0) / fins.length;
        box.innerHTML = '<h4>Multi-populações</h4>' +
            _s('Populações', series.length) +
            _s('Variância p', vari.toFixed(6)) +
            _s('Divergência', vari > 0.05 ? 'Alta' : vari > 0.01 ? 'Moderada' : 'Baixa');
    }

    function plotFreq(gens, series) {
        if (grafFreq) grafFreq.destroy();
        var ds = series.map(function(s) {
            return {
                label: s.label, data: s.data,
                borderColor: s.color, backgroundColor: 'transparent',
                tension: 0.2, pointRadius: 0, borderWidth: 1.5
            };
        });
        grafFreq = new Chart(document.getElementById('evo-chart-freq'), {
            type: 'line',
            data: { labels: gens, datasets: ds },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Frequência Alélica (p)' },
                    legend: { labels: { boxWidth: 12 }, position: 'top' }
                },
                scales: {
                    x: { title: { display: true, text: 'Geração' }, ticks: { maxTicksLimit: 15 } },
                    y: { title: { display: true, text: 'p' }, min: 0, max: 1 }
                }
            }
        });
    }

    function plotGeno(gens, AA, Aa, aa) {
        if (grafGeno) grafGeno.destroy();
        grafGeno = new Chart(document.getElementById('evo-chart-genotype'), {
            type: 'line',
            data: {
                labels: gens,
                datasets: [
                    { label: 'AA', data: AA, borderColor: '#3388cc', fill: false, tension: 0.2, pointRadius: 0, borderWidth: 1.5 },
                    { label: 'Aa', data: Aa, borderColor: '#cc5555', fill: false, tension: 0.2, pointRadius: 0, borderWidth: 1.5 },
                    { label: 'aa', data: aa, borderColor: 'teal', fill: false, tension: 0.2, pointRadius: 0, borderWidth: 1.5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Genótipos' } },
                scales: {
                    x: { title: { display: true, text: 'Geração' }, ticks: { maxTicksLimit: 15 } },
                    y: { title: { display: true, text: 'Freq.' }, min: 0, max: 1 }
                }
            }
        });
    }

    function reset() {
        var ids = ['evo-p0','evo-w11','evo-w12','evo-w22','evo-popsize','evo-mu','evo-gen','evo-runs'];
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = el.defaultValue;
            var sp = document.getElementById(id + '-val');
            if (sp) sp.textContent = el.defaultValue;
        });
        document.getElementById('evo-scenario').selectedIndex = 0;
        document.getElementById('evo-stats').innerHTML = '';
        if (grafFreq) { grafFreq.destroy(); grafFreq = null; }
        if (grafGeno) { grafGeno.destroy(); grafGeno = null; }
    }

    return {
        init: function(){
            document.getElementById('evo-run').addEventListener('click', rodar);
            document.getElementById('evo-reset').addEventListener('click', reset);
        }
    };
})();
