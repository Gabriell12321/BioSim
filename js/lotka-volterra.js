var LotkaVolterra = (function () {

    var chartTime = null, chartPhase = null;

    function pegaParams() {
        return {
            alpha: parseFloat(document.getElementById('lv-alpha').value),
            beta:  parseFloat(document.getElementById('lv-beta').value),
            delta: parseFloat(document.getElementById('lv-delta').value),
            gamma: parseFloat(document.getElementById('lv-gamma').value),
            x0:    parseFloat(document.getElementById('lv-x0').value),
            y0:    parseFloat(document.getElementById('lv-y0').value),
            tMax:  parseFloat(document.getElementById('lv-time').value),
        };
    }

    // runge-kutta 4a ordem
    function rk4(alpha, beta, delta, gamma, x, y, dt) {
        var dxdt = function(x, y) { return alpha * x - beta * x * y; };
        var dydt = function(x, y) { return delta * x * y - gamma * y; };

        var kx1 = dxdt(x, y);
        var ky1 = dydt(x, y);
        var kx2 = dxdt(x + 0.5*dt*kx1, y + 0.5*dt*ky1);
        var ky2 = dydt(x + 0.5*dt*kx1, y + 0.5*dt*ky1);
        var kx3 = dxdt(x + 0.5*dt*kx2, y + 0.5*dt*ky2);
        var ky3 = dydt(x + 0.5*dt*kx2, y + 0.5*dt*ky2);
        var kx4 = dxdt(x + dt*kx3, y + dt*ky3);
        var ky4 = dydt(x + dt*kx3, y + dt*ky3);

        return {
            x: x + (dt/6) * (kx1 + 2*kx2 + 2*kx3 + kx4),
            y: y + (dt/6) * (ky1 + 2*ky2 + 2*ky3 + ky4)
        };
    }

    function rodar() {
        var p = pegaParams();
        var dt = 0.02;
        var steps = Math.round(p.tMax / dt);

        var times = [], preys = [], preds = [];
        var x = p.x0, y = p.y0;
        var maxPrey = x, maxPred = y, minPrey = x, minPred = y;

        for (var i = 0; i <= steps; i++) {
            if (i % 50 === 0) {
                times.push((i * dt).toFixed(1));
                preys.push(x);
                preds.push(y);
            }
            if (x > maxPrey) maxPrey = x;
            if (y > maxPred) maxPred = y;
            if (x < minPrey) minPrey = x;
            if (y < minPred) minPred = y;

            var next = rk4(p.alpha, p.beta, p.delta, p.gamma, x, y, dt);
            x = Math.max(0, next.x);
            y = Math.max(0, next.y);
        }

        var eqX = p.gamma / p.delta;
        var eqY = p.alpha / p.beta;

        // stats
        var box = document.getElementById('lv-stats');
        if (box) {
            box.innerHTML =
                '<h4>Resultados</h4>' +
                '<div class="stat-row"><span class="stat-label">Presa — máx:</span><span class="stat-value">' + maxPrey.toFixed(1) + '</span></div>' +
                '<div class="stat-row"><span class="stat-label">Presa — mín:</span><span class="stat-value">' + minPrey.toFixed(1) + '</span></div>' +
                '<div class="stat-row"><span class="stat-label">Predador — máx:</span><span class="stat-value">' + maxPred.toFixed(1) + '</span></div>' +
                '<div class="stat-row"><span class="stat-label">Predador — mín:</span><span class="stat-value">' + minPred.toFixed(1) + '</span></div>' +
                '<hr>' +
                '<div class="stat-row"><span class="stat-label">Equil. x*:</span><span class="stat-value">' + eqX.toFixed(1) + '</span></div>' +
                '<div class="stat-row"><span class="stat-label">Equil. y*:</span><span class="stat-value">' + eqY.toFixed(1) + '</span></div>' +
                '<hr>' +
                '<div class="stat-row"><span class="stat-label">Amplitude presas:</span><span class="stat-value">' + (maxPrey - minPrey).toFixed(1) + '</span></div>' +
                '<div class="stat-row"><span class="stat-label">Amplitude pred.:</span><span class="stat-value">' + (maxPred - minPred).toFixed(1) + '</span></div>';
        }

        // grafico temporal
        if (chartTime) chartTime.destroy();
        chartTime = new Chart(document.getElementById('lv-chart-time'), {
            type: 'line',
            data: {
                labels: times,
                datasets: [
                    { label: 'Presas (x)', data: preys, borderColor: '#3388cc', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
                    { label: 'Predadores (y)', data: preds, borderColor: '#cc4444', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Dinâmica Temporal' } },
                scales: {
                    x: { title: { display: true, text: 'Tempo' }, ticks: { maxTicksLimit: 12 } },
                    y: { title: { display: true, text: 'População' } }
                }
            }
        });

        // fase
        if (chartPhase) chartPhase.destroy();
        var phaseData = [];
        for (var j = 0; j < preys.length; j++) phaseData.push({ x: preys[j], y: preds[j] });
        chartPhase = new Chart(document.getElementById('lv-chart-phase'), {
            type: 'scatter',
            data: {
                datasets: [
                    { label: 'Órbita', data: phaseData, showLine: true, borderColor: '#3388cc', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5, tension: 0.1 },
                    { label: 'Início', data: [phaseData[0]], pointRadius: 5, pointBackgroundColor: '#333' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Diagrama de Fase' } },
                scales: {
                    x: { title: { display: true, text: 'Presas (x)' } },
                    y: { title: { display: true, text: 'Predadores (y)' } }
                }
            }
        });
    }

    function resetar() {
        var ids = ['lv-alpha', 'lv-beta', 'lv-delta', 'lv-gamma', 'lv-x0', 'lv-y0', 'lv-time'];
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]);
            if (el) {
                el.value = el.defaultValue;
                var sp = document.getElementById(ids[i] + '-val');
                if (sp) sp.textContent = el.defaultValue;
            }
        }
        var box = document.getElementById('lv-stats');
        if (box) box.innerHTML = '';
        if (chartTime) { chartTime.destroy(); chartTime = null; }
        if (chartPhase) { chartPhase.destroy(); chartPhase = null; }
    }

    function init() {
        document.getElementById('lv-run').addEventListener('click', rodar);
        document.getElementById('lv-reset').addEventListener('click', resetar);
    }

    return { init: init };
})();
