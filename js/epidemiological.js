var Epidemiological = (function() {
    'use strict';

    let chartTime = null;
    let chartR0 = null;

    function isSEIR() {
        var btn = document.getElementById('seir-mode-btn');
        return btn && btn.classList.contains('active');
    }

    function simulate() {
        var beta  = parseFloat(document.getElementById('epi-beta').value);
        var gamma = parseFloat(document.getElementById('epi-gamma').value);
        var sigma = parseFloat(document.getElementById('epi-sigma').value);
        var N     = parseInt(document.getElementById('epi-n').value);
        var I0    = parseInt(document.getElementById('epi-i0').value);
        var days  = parseInt(document.getElementById('epi-days').value);
        var seir  = isSEIR();
        var dt = 0.1;
        var nSteps = Math.round(days / dt);

        var S = N - I0, E = 0, I = I0, R = 0;
        var arrT = [], arrS = [], arrE = [], arrI = [], arrR = [];
        var peakI = 0, peakDay = 0;

        for (var i = 0; i <= nSteps; i++) {
            var t = i * dt;
            if (i % 10 === 0) {
                arrT.push(t.toFixed(0));
                arrS.push(S); arrE.push(E); arrI.push(I); arrR.push(R);
            }
            if (I > peakI) { peakI = I; peakDay = t; }

            var infec = (beta * S * I) / N;
            if (seir) {
                var inc = sigma * E;
                var rec = gamma * I;
                S += -infec * dt;
                E += (infec - inc) * dt;
                I += (inc - rec) * dt;
                R += rec * dt;
            } else {
                var rec = gamma * I;
                S += -infec * dt;
                I += (infec - rec) * dt;
                R += rec * dt;
            }
            S = Math.max(0, S); E = Math.max(0, E);
            I = Math.max(0, I); R = Math.max(0, R);
        }

        var R0 = beta / gamma;
        var herdImm = R0 > 1 ? (1 - 1/R0) * 100 : 0;
        var totalInf = N - S;

        // stats
        var box = document.getElementById('epi-stats');
        if (box) {
            box.innerHTML = '<h4>Resultados</h4>' +
                stat('R₀', R0.toFixed(2)) +
                stat('Status', R0 > 1 ? 'Epidemia (R₀>1)' : 'Contido (R₀<1)') +
                stat('Imun. rebanho', herdImm > 0 ? herdImm.toFixed(1) + '%' : 'N/A') +
                '<hr>' +
                stat('Pico infectados', Math.round(peakI).toLocaleString()) +
                stat('Dia do pico', Math.round(peakDay)) +
                stat('Total infectados', Math.round(totalInf).toLocaleString() + ' (' + (totalInf/N*100).toFixed(1) + '%)') +
                '<hr>' +
                stat('Modelo', seir ? 'SEIR' : 'SIR');
        }

        // grafico curva
        if (chartTime) chartTime.destroy();
        var datasets = [
            { label: 'S', data: arrS, borderColor: 'steelblue', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
            { label: 'I', data: arrI, borderColor: 'tomato', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
            { label: 'R', data: arrR, borderColor: 'rgb(75,192,192)', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 }
        ];
        if (seir) {
            datasets.splice(1, 0, { label: 'E', data: arrE, borderColor: 'goldenrod', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5, borderDash: [4, 3] });
        }
        chartTime = new Chart(document.getElementById('epi-chart-time'), {
            type: 'line',
            data: { labels: arrT, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Curva Epidêmica — ' + (seir ? 'SEIR' : 'SIR') } },
                scales: {
                    x: { title: { display: true, text: 'Dias' }, ticks: { maxTicksLimit: 15 } },
                    y: { title: { display: true, text: 'Indivíduos' } }
                }
            }
        });

        // grafico R0
        if (chartR0) chartR0.destroy();
        var betas = [], r0vals = [];
        for (var b = 0.05; b <= 1.0; b += 0.05) {
            betas.push(b.toFixed(2));
            r0vals.push(b / gamma);
        }
        chartR0 = new Chart(document.getElementById('epi-chart-r0'), {
            type: 'bar',
            data: {
                labels: betas,
                datasets: [{
                    label: 'R₀ = β/γ',
                    data: r0vals,
                    backgroundColor: r0vals.map(function(v) { return v > 1 ? 'rgba(205,92,92,0.5)' : 'rgba(100,149,237,0.5)'; }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Sensibilidade do R₀' },
                    annotation: {
                        annotations: {
                            limiar: { type: 'line', yMin: 1, yMax: 1, borderColor: '#888', borderWidth: 1, borderDash: [6, 4], label: { content: 'R₀ = 1', display: true } }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'β (Transmissão)' } },
                    y: { title: { display: true, text: 'R₀' } }
                }
            }
        });
    }

    function stat(label, value) {
        return '<div class="stat-row"><span class="stat-label">' + label + ':</span><span class="stat-value">' + value + '</span></div>';
    }

    function reset() {
        ['epi-beta','epi-gamma','epi-sigma','epi-n','epi-i0','epi-days'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = el.defaultValue;
            var sp = document.getElementById(id + '-val');
            if (sp) sp.textContent = el.defaultValue;
        });
        document.getElementById('epi-stats').innerHTML = '';
        if (chartTime) { chartTime.destroy(); chartTime = null; }
        if (chartR0) { chartR0.destroy(); chartR0 = null; }
    }

    return {
        init: function() {
            document.getElementById('epi-run').onclick = simulate;
            document.getElementById('epi-reset').onclick = reset;
        }
    };
})();
