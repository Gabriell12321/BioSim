var Metabolic = (function() {

    var grafConc = null;
    var grafFlux = null;

    var vias = {
        glycolysis: {
            nomes: ['Glicose', 'G6P', 'F6P', 'FBP', 'Piruvato'],
            vmaxMult: [1.0, 0.6, 1.2, 0.8],
            kmMult: [1.0, 0.8, 1.5, 1.0],
            feedback: false
        },
        linear: {
            nomes: ['A', 'B', 'C', 'D'],
            vmaxMult: [1.0, 0.8, 1.0],
            kmMult: [1.0, 1.0, 1.0],
            feedback: false
        },
        branched: {
            nomes: ['A', 'B', 'C₁', 'C₂', 'D₁', 'D₂'],
            vmaxMult: [1.0, 0.6, 0.5, 0.7, 0.6],
            kmMult: [1.0, 1.0, 1.2, 1.0, 1.0],
            feedback: false,
            ramificada: true
        },
        feedback: {
            nomes: ['A', 'B', 'C', 'D'],
            vmaxMult: [1.0, 1.0, 1.0],
            kmMult: [1.0, 1.0, 1.0],
            feedback: true
        }
    };

    function mm(s, vmax, km) {
        return (vmax * s) / (km + s);
    }

    function mmInibida(s, vmax, km, inibidor, ki) {
        return (vmax * s) / (km * (1 + inibidor / ki) + s);
    }

    function rodarSimulacao() {
        var tipo = document.getElementById('meta-pathway').value;
        var s0 = parseFloat(document.getElementById('meta-s0').value);
        var vmax = parseFloat(document.getElementById('meta-vmax').value);
        var km = parseFloat(document.getElementById('meta-km').value);
        var ki = parseFloat(document.getElementById('meta-ki').value);
        var tMax = parseFloat(document.getElementById('meta-time').value);

        var via = vias[tipo];
        var n = via.nomes.length;
        var dt = 0.01;
        var steps = Math.round(tMax / dt);

        var conc = [];
        for (var i = 0; i < n; i++) conc.push(0);
        conc[0] = s0;

        var tempos = [];
        var dadosConc = [];
        for (var i = 0; i < n; i++) dadosConc.push([]);

        var nFlux = via.ramificada ? via.vmaxMult.length : n - 1;
        var dadosFlux = [];
        for (var f = 0; f < nFlux; f++) dadosFlux.push([]);

        var intervalo = Math.max(1, Math.round(steps / 400));

        for (var i = 0; i <= steps; i++) {
            var gravar = (i % intervalo === 0);
            if (gravar) {
                tempos.push((i * dt).toFixed(2));
                for (var j = 0; j < n; j++) dadosConc[j].push(conc[j]);
            }

            if (via.ramificada) {
                var v0 = mm(conc[0], vmax * via.vmaxMult[0], km * via.kmMult[0]);
                var v1 = mm(conc[1], vmax * via.vmaxMult[1], km * via.kmMult[1]);
                var v2 = mm(conc[1], vmax * via.vmaxMult[2], km * via.kmMult[2]);
                var v3 = mm(conc[2], vmax * via.vmaxMult[3], km * via.kmMult[3]);
                var v4 = mm(conc[3], vmax * via.vmaxMult[4], km * via.kmMult[4]);

                conc[0] += (-v0) * dt;
                conc[1] += (v0 - v1 - v2) * dt;
                conc[2] += (v1 - v3) * dt;
                conc[3] += (v2 - v4) * dt;
                conc[4] += v3 * dt;
                conc[5] += v4 * dt;

                if (gravar) {
                    dadosFlux[0].push(v0);
                    dadosFlux[1].push(v1);
                    dadosFlux[2].push(v2);
                    dadosFlux[3].push(v3);
                    dadosFlux[4].push(v4);
                }
            } else {
                var fluxes = [];
                for (var j = 0; j < n - 1; j++) {
                    var vm = vmax * via.vmaxMult[j];
                    var kk = km * via.kmMult[j];
                    if (via.feedback && j === 0) {
                        fluxes.push(mmInibida(conc[j], vm, kk, conc[n-1], ki));
                    } else {
                        fluxes.push(mm(conc[j], vm, kk));
                    }
                }
                for (var j = 0; j < n; j++) {
                    var entra = j > 0 ? fluxes[j-1] : 0;
                    var sai = j < n-1 ? fluxes[j] : 0;
                    conc[j] += (entra - sai) * dt;
                }
                if (gravar) {
                    for (var j = 0; j < fluxes.length; j++) dadosFlux[j].push(fluxes[j]);
                }
            }

            for (var j = 0; j < n; j++) if (conc[j] < 0) conc[j] = 0;
        }

        desenharConc(tempos, dadosConc, via.nomes);
        desenharFlux(tempos, dadosFlux, via, tipo);
    }

    var cores = ['#4488cc', '#cc5555', 'teal', '#cc9922', '#8866bb', '#999'];

    function desenharConc(tempos, dados, nomes) {
        if (grafConc) grafConc.destroy();

        var datasets = [];
        for (var i = 0; i < dados.length; i++) {
            datasets.push({
                label: nomes[i], data: dados[i],
                borderColor: cores[i % cores.length],
                backgroundColor: 'transparent',
                tension: 0.3, pointRadius: 0, borderWidth: 2
            });
        }

        grafConc = new Chart(document.getElementById('meta-chart-conc'), {
            type: 'line',
            data: { labels: tempos, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Concentração' } },
                scales: {
                    x: { title: { display: true, text: 'Tempo' }, ticks: { maxTicksLimit: 12 } },
                    y: { title: { display: true, text: '[mM]' } }
                }
            }
        });
    }

    function desenharFlux(tempos, dados, via, tipo) {
        if (grafFlux) grafFlux.destroy();

        var labels;
        if (via.ramificada) {
            labels = ['A→B', 'B→C₁', 'B→C₂', 'C₁→D₁', 'C₂→D₂'];
        } else {
            labels = [];
            for (var i = 0; i < via.nomes.length - 1; i++)
                labels.push(via.nomes[i] + '→' + via.nomes[i+1]);
        }

        var datasets = [];
        for (var i = 0; i < dados.length; i++) {
            datasets.push({
                label: labels[i] || 'E' + (i+1), data: dados[i],
                borderColor: cores[i % cores.length],
                backgroundColor: 'transparent',
                tension: 0.2, pointRadius: 0, borderWidth: 1.5
            });
        }

        grafFlux = new Chart(document.getElementById('meta-chart-flux'), {
            type: 'line',
            data: { labels: tempos, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Fluxo Enzimático' } },
                scales: {
                    x: { title: { display: true, text: 'Tempo' }, ticks: { maxTicksLimit: 12 } },
                    y: { title: { display: true, text: 'v (mM/s)' } }
                }
            }
        });
    }

    function limpar() {
        var campos = ['meta-s0', 'meta-vmax', 'meta-km', 'meta-ki', 'meta-time'];
        for (var i = 0; i < campos.length; i++) {
            var el = document.getElementById(campos[i]);
            if (!el) continue;
            el.value = el.defaultValue;
            var sp = document.getElementById(campos[i] + '-val');
            if (sp) sp.textContent = el.defaultValue;
        }
        document.getElementById('meta-pathway').selectedIndex = 0;
        document.getElementById('meta-feedback-group').style.display = 'none';
        if (grafConc) { grafConc.destroy(); grafConc = null; }
        if (grafFlux) { grafFlux.destroy(); grafFlux = null; }
    }

    return {
        init: function() {
            document.getElementById('meta-run').addEventListener('click', rodarSimulacao);
            document.getElementById('meta-reset').addEventListener('click', limpar);
        }
    };
})();
