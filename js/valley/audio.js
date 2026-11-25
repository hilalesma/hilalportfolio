/* ==========================================================================
   valley/audio.js — Vadi için yumuşak ortam sesi (Web Audio ile tarayıcıda sentezlenir)
   Hiçbir ses dosyası kullanılmaz; lisans gerektirmez. Varsayılan olarak KAPALI başlar.
   Yapı:
     4 hafif detune'lu osilatör (yavaş değişen iki akor) ┐
     filtrelenmiş beyaz gürültü ("rüzgâr")                ├→ alçak geçiren filtre → ana ses (fade in/out)
   setMuffle(0..1): ok butonunun üzerine gelince ses boğuklaşır (filtre frekansı düşer).
   HE.valleyAudio = { toggle(), setOn(bool), setMuffle(k), isOn(), dispose() }
   ========================================================================== */
(function () {
  "use strict";

  var HE = (window.HE = window.HE || {});
  var ctx = null, master = null, filter = null, voices = [], noise = null, chordTimer = 0;
  var on = false;

  // İki akor (Hz): La majör yedili ve Fa# minör yedili, alçak ve yumuşak
  var CHORDS = [
    [110.0, 164.81, 277.18, 329.63],
    [92.5, 138.59, 220.0, 277.18]
  ];
  var chordIndex = 0;
  var OPEN_HZ = 1600, MUFFLED_HZ = 320;

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = OPEN_HZ;
    filter.Q.value = 0.6;
    filter.connect(master);
    master.connect(ctx.destination);

    // Pad: her ses kendi yavaş tremolosuyla
    CHORDS[0].forEach(function (hz, i) {
      var osc = ctx.createOscillator();
      osc.type = i % 2 ? "triangle" : "sine";
      osc.frequency.value = hz;
      osc.detune.value = (i - 1.5) * 4;
      var g = ctx.createGain();
      g.gain.value = 0.06;
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.03;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(filter);
      osc.start();
      lfo.start();
      voices.push({ osc: osc, lfo: lfo });
    });

    // Rüzgâr: 2 sn'lik beyaz gürültü döngüsü, bant geçiren filtreyle
    var buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    var band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 520;
    band.Q.value = 0.7;
    var ng = ctx.createGain();
    ng.gain.value = 0.018;
    noise.connect(band).connect(ng).connect(filter);
    noise.start();

    // Akor her 9 sn'de yumuşakça değişir
    chordTimer = window.setInterval(function () {
      chordIndex = 1 - chordIndex;
      var t = ctx.currentTime;
      voices.forEach(function (v, i) { v.osc.frequency.setTargetAtTime(CHORDS[chordIndex][i], t, 1.8); });
    }, 9000);
    return true;
  }

  /** Sesi açar/kapatır (fade in 1.2 sn, fade out 0.8 sn). Kullanıcı tıklamasıyla çağrılmalı. */
  function setOn(value) {
    if (value && !ctx && !build()) return false;
    if (!ctx) return false;
    on = !!value;
    var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    if (on) {
      if (ctx.state === "suspended") ctx.resume();
      master.gain.linearRampToValueAtTime(0.55, t + 1.2);
    } else {
      master.gain.linearRampToValueAtTime(0, t + 0.8);
    }
    return on;
  }

  function setMuffle(k) {
    if (!ctx) return;
    var hz = OPEN_HZ + (MUFFLED_HZ - OPEN_HZ) * Math.max(0, Math.min(1, k));
    filter.frequency.setTargetAtTime(hz, ctx.currentTime, 0.12);
  }

  /** Sesi söndürür ve ses bağlamını kapatır (intro bitince). */
  function dispose() {
    if (!ctx) return;
    setOn(false);
    window.clearInterval(chordTimer);
    var c = ctx;
    window.setTimeout(function () { c.close(); }, 900);
    ctx = null;
    voices = [];
  }

  HE.valleyAudio = {
    setOn: setOn,
    toggle: function () { return setOn(!on); },
    setMuffle: setMuffle,
    isOn: function () { return on; },
    dispose: dispose
  };
})();
