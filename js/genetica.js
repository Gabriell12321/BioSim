var Genetica = (function() {

    var grfGeno = null, grfFeno = null;

    function $(id) { return document.getElementById(id); }

    var corP = {
        'Dominante': '#c8e6c9', 'Recessivo': '#fff9c4',
        'Vermelho': '#ef9a9a', 'Rosa': '#f8bbd0', 'Branco': '#f5f5f5',
        'Ruão': '#ffcc80',
        'A_B_': '#c8e6c9', 'A_bb': '#bbdefb', 'aaB_': '#ffe0b2', 'aabb': '#ffccbc',
        'Selvagem': '#c8e6c9', 'Modificado': '#bbdefb', 'Epistático': '#fff9c4',
        'Inibido': '#e8f5e9',
        'Complementar': '#c8e6c9', 'Sem expressão': '#eee',
        '♂ Normal': '#c8e6c9', '♂ Afetado': '#ef9a9a',
        '♀ Normal': '#bbdefb', '♀ Portadora': '#e1bee7', '♀ Afetada': '#ffccbc'
    };

    function _diOpts() {
        return [['AABB','AABB'],['AABb','AABb'],['AAbb','AAbb'],
                ['AaBB','AaBB'],['AaBb','AaBb'],['Aabb','Aabb'],
                ['aaBB','aaBB'],['aaBb','aaBb'],['aabb','aabb']];
    }

    function opcoesDoTipo(tipo) {
        var mono = [['AA','AA (homoz. dom.)'],['Aa','Aa (heterozigoto)'],['aa','aa (homoz. rec.)']];
        var cod = [['CRCR','CRCR (vermelho)'],['CRCW','CRCW (ruão)'],['CWCW','CWCW (branco)']];
        switch(tipo) {
            case 'mono-completa':
            case 'mono-incompleta':
                return { p1: mono, p2: mono, l1: 'Genótipo P1:', l2: 'Genótipo P2:', d1: 1, d2: 1 };
            case 'mono-codominancia':
                return { p1: cod, p2: cod, l1: 'Genótipo P1:', l2: 'Genótipo P2:', d1: 0, d2: 2 };
            case 'testcross':
                return { p1: [mono[0],mono[1]], p2: [mono[2]], l1: 'Testado:', l2: 'Testador:', d1: 1, d2: 0 };
            case 'di-hibrido':
                return { p1: _diOpts(), p2: _diOpts(), l1: 'Genótipo P1:', l2: 'Genótipo P2:', d1: 4, d2: 4 };
            case 'di-testcross':
                return { p1: _diOpts(), p2: [['aabb','aabb']], l1: 'Testado:', l2: 'Testador:', d1: 4, d2: 0 };
            case 'epistasia-recessiva':
            case 'epistasia-dominante':
            case 'epistasia-dupla':
                return { p1: _diOpts(), p2: _diOpts(), l1: 'Genótipo P1:', l2: 'Genótipo P2:', d1: 4, d2: 4 };
            case 'ligado-x':
                return {
                    p1: [['XA_XA','XAXA (♀ normal)'],['XA_Xa','XAXa (♀ portadora)'],['Xa_Xa','XaXa (♀ afetada)']],
                    p2: [['XA_Y','XAY (♂ normal)'],['Xa_Y','XaY (♂ afetado)']],
                    l1: 'Mãe (♀):', l2: 'Pai (♂):', d1: 1, d2: 0
                };
        }
    }

    function popular(tipo) {
        var ops = opcoesDoTipo(tipo);
        var s1 = $('gen-p1'), s2 = $('gen-p2');
        s1.length = 0; s2.length = 0;
        for (var i = 0; i < ops.p1.length; i++) s1.options[i] = new Option(ops.p1[i][1], ops.p1[i][0]);
        for (var i = 0; i < ops.p2.length; i++) s2.options[i] = new Option(ops.p2[i][1], ops.p2[i][0]);
        s1.selectedIndex = ops.d1;
        s2.selectedIndex = ops.d2;
        s1.parentElement.querySelector('label').textContent = ops.l1;
        s2.parentElement.querySelector('label').textContent = ops.l2;
    }

    function gametas(gen, tipo) {
        switch(tipo) {
            case 'mono-completa': case 'mono-incompleta': case 'testcross':
                return gen[0] === gen[1] ? [gen[0]] : [gen[0], gen[1]];
            case 'mono-codominancia':
                var a = gen.substring(0,2), b = gen.substring(2);
                return a === b ? [a] : [a, b];
            case 'di-hibrido': case 'di-testcross':
            case 'epistasia-recessiva': case 'epistasia-dominante': case 'epistasia-dupla':
                var loc1 = [gen[0], gen[1]], loc2 = [gen[2], gen[3]];
                var res = [], visto = {};
                for (var i = 0; i < 2; i++) {
                    for (var j = 0; j < 2; j++) {
                        var g = loc1[i] + loc2[j];
                        if (!visto[g]) { res.push(g); visto[g] = 1; }
                    }
                }
                return res;
            case 'ligado-x':
                var pts = gen.split('_');
                return pts[0] === pts[1] ? [pts[0]] : pts;
        }
    }

    function juntar(g1, g2, tipo) {
        switch(tipo) {
            case 'mono-completa': case 'mono-incompleta': case 'testcross':
            case 'mono-codominancia':
                return [g1, g2].sort().join('');
            case 'di-hibrido': case 'di-testcross':
            case 'epistasia-recessiva': case 'epistasia-dominante': case 'epistasia-dupla':
                return [g1[0], g2[0]].sort().join('') + [g1[1], g2[1]].sort().join('');
            case 'ligado-x':
                if (g1 === 'Y' || g2 === 'Y') {
                    return (g1 === 'Y' ? g2 : g1) + '_Y';
                }
                return [g1, g2].sort().join('_');
        }
    }

    function fenot(gen, tipo) {
        var tA, tB;
        switch(tipo) {
            case 'mono-completa': case 'testcross':
                return gen.indexOf('A') >= 0 ? 'Dominante' : 'Recessivo';
            case 'mono-incompleta':
                if (gen === 'AA') return 'Vermelho';
                if (gen === 'aa') return 'Branco';
                return 'Rosa';
            case 'mono-codominancia':
                if (gen === 'CRCR') return 'Vermelho';
                if (gen === 'CWCW') return 'Branco';
                return 'Ruão';
            case 'di-hibrido': case 'di-testcross':
                tA = gen[0] === 'A' || gen[1] === 'A';
                tB = gen[2] === 'B' || gen[3] === 'B';
                if (tA && tB) return 'A_B_';
                if (tA) return 'A_bb';
                if (tB) return 'aaB_';
                return 'aabb';
            case 'epistasia-recessiva':
                tA = gen[0] === 'A' || gen[1] === 'A';
                tB = gen[2] === 'B' || gen[3] === 'B';
                if (!tA) return 'Epistático';
                return tB ? 'Selvagem' : 'Modificado';
            case 'epistasia-dominante':
                tA = gen[0] === 'A' || gen[1] === 'A';
                tB = gen[2] === 'B' || gen[3] === 'B';
                if (tA) return 'Inibido';
                return tB ? 'aaB_' : 'aabb';
            case 'epistasia-dupla':
                tA = gen[0] === 'A' || gen[1] === 'A';
                tB = gen[2] === 'B' || gen[3] === 'B';
                return (tA && tB) ? 'Complementar' : 'Sem expressão';
            case 'ligado-x':
                var p = gen.split('_');
                if (p[1] === 'Y') return p[0] === 'XA' ? '♂ Normal' : '♂ Afetado';
                if (p[0] === 'XA' && p[1] === 'XA') return '♀ Normal';
                if ((p[0]==='XA' && p[1]==='Xa') || (p[0]==='Xa' && p[1]==='XA')) return '♀ Portadora';
                return '♀ Afetada';
        }
    }

    function _exG(gen, tipo) {
        if (tipo === 'mono-codominancia')
            return 'C<sup>' + gen[1] + '</sup>C<sup>' + gen[3] + '</sup>';
        if (tipo === 'ligado-x') {
            var p = gen.split('_');
            if (p[1] === 'Y') return 'X<sup>' + p[0].charAt(1) + '</sup>Y';
            return 'X<sup>' + p[0].charAt(1) + '</sup>X<sup>' + p[1].charAt(1) + '</sup>';
        }
        return gen;
    }

    function _exGam(gam, tipo) {
        if (tipo === 'mono-codominancia') return 'C<sup>' + gam.charAt(1) + '</sup>';
        if (tipo === 'ligado-x') return gam === 'Y' ? 'Y' : 'X<sup>' + gam.charAt(1) + '</sup>';
        return gam;
    }

    function montarPunnett(g1, g2, tipo) {
        var h = '<table class="punnett-table"><thead><tr><th class="punnett-corner"></th>';
        for (var c = 0; c < g2.length; c++) h += '<th>' + _exGam(g2[c], tipo) + '</th>';
        h += '</tr></thead><tbody>';
        var cont = {};
        for (var r = 0; r < g1.length; r++) {
            h += '<tr><th>' + _exGam(g1[r], tipo) + '</th>';
            for (var c = 0; c < g2.length; c++) {
                var f = juntar(g1[r], g2[c], tipo);
                var fn = fenot(f, tipo);
                h += '<td style="background:' + (corP[fn] || '#fff') + '">' + _exG(f, tipo) + '</td>';
                cont[f] = (cont[f] || 0) + 1;
            }
            h += '</tr>';
        }
        h += '</tbody></table>';
        return { html: h, cont: cont, total: g1.length * g2.length };
    }

    function simular(cont, total, n) {
        var genos = Object.keys(cont);
        var probs = genos.map(function(g) { return cont[g] / total; });
        var res = {};
        for (var k = 0; k < genos.length; k++) res[genos[k]] = 0;
        for (var i = 0; i < n; i++) {
            var r = Math.random(), ac = 0;
            for (var k = 0; k < genos.length; k++) {
                ac += probs[k];
                if (r < ac || k === genos.length - 1) { res[genos[k]]++; break; }
            }
        }
        return res;
    }

    function _mdc(arr) {
        function g(a, b) { return b ? g(b, a % b) : a; }
        var v = arr[0];
        for (var i = 1; i < arr.length; i++) v = g(v, arr[i]);
        return v || 1;
    }

    function desenhar(cont, total, sim, n, tipo) {
        if (grfGeno) grfGeno.destroy();
        if (grfFeno) grfFeno.destroy();
        var genos = Object.keys(cont);

        grfGeno = new Chart($('gen-chart-geno'), {
            type: 'bar',
            data: {
                labels: genos.map(function(g) { return g.replace(/_/g,''); }),
                datasets: [
                    { label: 'Teórico (%)', data: genos.map(function(g){ return +(cont[g]/total*100).toFixed(1); }), backgroundColor: 'rgb(56,142,60)' },
                    { label: 'Simulado (%)', data: genos.map(function(g){ return +((sim[g]||0)/n*100).toFixed(1); }), backgroundColor: 'rgb(255,143,0)' }
                ]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Genótipos' }}, scales: { y: { beginAtZero: true }}}
        });

        var fenoT = {}, fenoS = {};
        genos.forEach(function(g) {
            var f = fenot(g, tipo);
            fenoT[f] = (fenoT[f] || 0) + cont[g];
            fenoS[f] = (fenoS[f] || 0) + (sim[g] || 0);
        });
        var fenos = Object.keys(fenoT);

        grfFeno = new Chart($('gen-chart-feno'), {
            type: 'bar',
            data: {
                labels: fenos,
                datasets: [
                    { label: 'Teórico (%)', data: fenos.map(function(f){ return +(fenoT[f]/total*100).toFixed(1); }), backgroundColor: 'rgb(30,136,229)' },
                    { label: 'Simulado (%)', data: fenos.map(function(f){ return +((fenoS[f]||0)/n*100).toFixed(1); }), backgroundColor: 'rgb(216,27,96)' }
                ]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Fenótipos' }}, scales: { y: { beginAtZero: true }}}
        });

        return { fenoT: fenoT, fenoS: fenoS };
    }

    function montarStats(cont, total, sim, n, fenoT, fenoS) {
        var genos = Object.keys(cont);
        var fenos = Object.keys(fenoT);
        var h = '<h4>Proporções teóricas</h4>';

        var gcdG = _mdc(genos.map(function(g){ return cont[g]; }));
        h += '<div class="stat-row"><span class="stat-label">Genotípica:</span> <span class="stat-value">';
        h += genos.map(function(g){ return (cont[g]/gcdG) + ' ' + g.replace(/_/g,''); }).join(' : ');
        h += '</span></div>';

        var gcdF = _mdc(fenos.map(function(f){ return fenoT[f]; }));
        h += '<div class="stat-row"><span class="stat-label">Fenotípica:</span> <span class="stat-value">';
        h += fenos.map(function(f){ return (fenoT[f]/gcdF) + ' ' + f; }).join(' : ');
        h += '</span></div>';

        h += '<hr><h4>Simulação (n=' + n + ')</h4>';
        fenos.forEach(function(f) {
            var c = fenoS[f] || 0;
            h += '<div class="stat-row"><span class="stat-label">' + f + ':</span> <span class="stat-value">' + c + ' (' + (c/n*100).toFixed(1) + '%)</span></div>';
        });

        var gl = fenos.length - 1;
        if (gl > 0) {
            var chi2 = 0;
            fenos.forEach(function(f) {
                var e = fenoT[f] / total * n;
                var o = fenoS[f] || 0;
                chi2 += (o - e) * (o - e) / e;
            });
            var crit = [0, 3.841, 5.991, 7.815, 9.488, 11.07, 12.59, 14.07, 15.51][gl] || 15.51;
            h += '<hr><h4>Teste χ²</h4>';
            h += '<div class="stat-row"><span class="stat-label">χ²:</span> <span class="stat-value">' + chi2.toFixed(3) + '</span></div>';
            h += '<div class="stat-row"><span class="stat-label">g.l.:</span> <span class="stat-value">' + gl + '</span></div>';
            h += '<div class="stat-row"><span class="stat-label">α=0.05:</span> <span class="stat-value">';
            h += chi2 > crit ? 'Significativo (rejeita H₀)' : 'Não significativo (aceita H₀)';
            h += '</span></div>';
        }

        $('gen-stats').innerHTML = h;
    }

    function cruzar() {
        var tipo = $('gen-tipo').value;
        var p1 = $('gen-p1').value;
        var p2 = $('gen-p2').value;
        var n = parseInt($('gen-n').value);
        var g1 = gametas(p1, tipo);
        var g2 = gametas(p2, tipo);
        var pun = montarPunnett(g1, g2, tipo);
        $('gen-punnett').innerHTML = pun.html;
        var sr = simular(pun.cont, pun.total, n);
        var gr = desenhar(pun.cont, pun.total, sr, n, tipo);
        montarStats(pun.cont, pun.total, sr, n, gr.fenoT, gr.fenoS);
    }

    function limpar() {
        $('gen-punnett').innerHTML = '';
        $('gen-stats').innerHTML = '';
        if (grfGeno) { grfGeno.destroy(); grfGeno = null; }
        if (grfFeno) { grfFeno.destroy(); grfFeno = null; }
    }

    function init() {
        var sel = $('gen-tipo');
        if (!sel) return;
        popular(sel.value);
        sel.onchange = function() { popular(sel.value); limpar(); };
        $('gen-run').onclick = cruzar;
        $('gen-reset').onclick = limpar;
    }

    return { init: init };
})();
