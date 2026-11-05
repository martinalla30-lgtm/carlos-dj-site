// Site-wide audio player. Loaded once per full page load; internal links swap the page
// content around it, so the music keeps playing while people browse (see "Navigation").
(() => {
  // TEMPORARY TRACKS from Pixabay Music, stored in audio/.
  // To change a track, edit its title and artist and set src to a file path or a full MP3 URL.
  const TRACKS = [
    { title: 'Club', artist: 'miromaxmusic', src: 'audio/miromaxmusic-club-no-copyright-618622.mp3' },
    { title: 'Club Music', artist: 'AtlasAudio', src: 'audio/atlasaudio-club-music-625696.mp3' },
    { title: 'Club Music', artist: 'Sub_Clair', src: 'audio/sub_clair-club-music-624240.mp3' },
    { title: 'Summer Party', artist: 'Kulakovka', src: 'audio/kulakovka-summer-party-620566.mp3' },
    { title: 'Party Music', artist: 'AtlasAudio', src: 'audio/atlasaudio-party-music-617594.mp3' },
  ];
  const SKIP_SECONDS = 10;
  const VOLUME_KEY = 'djcarlos-volume';
  const STATE_KEY = 'djcarlos-player';

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9zM15.5 8.2v7.6a4.3 4.3 0 0 0 0-7.6zM15.5 4v2.1a6.2 6.2 0 0 1 0 11.8V20a8.2 8.2 0 0 0 0-16z"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9zM21.5 9.6 20.1 8.2 18 10.3l-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1z"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 8 7 7-1.500 1.500-5.500-5.500-5.500 5.500L5 15z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 16-7-7 1.500-1.500 5.500 5.500 5.500-5.500L19 9z"/></svg>',
  };

  const root = document.createElement('div');
  root.id = 'site-player';
  root.className = 'sp';
  root.innerHTML = `
    <section class="sp-bar" data-sp="bar" aria-label="Mini player">
      <button class="sp-bar-play" data-sp="play" type="button"></button>
      <button class="sp-bar-info" data-sp="expand" type="button" aria-expanded="false">
        <span class="sp-mini-disc" data-sp="disc" aria-hidden="true"></span>
        <span class="sp-bar-text">
          <span class="sp-bar-title" data-sp="title"></span>
          <span class="sp-bar-artist" data-sp="bar-artist"></span>
        </span>
      </button>
      <input class="sp-range sp-bar-seek" data-sp="seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek">
      <span class="sp-time" aria-hidden="true"><span data-sp="current">0:00</span> / <span data-sp="duration">--:--</span></span>
      <button class="sp-bar-expand" data-sp="expand" type="button" aria-expanded="false" aria-label="Expand player">${ICONS.up}</button>
    </section>

    <div class="sp-sheet" data-sp="sheet" role="region" aria-label="Full player">
      <div class="sp-sheet-head">
        <h2 class="sp-sheet-title">Mixes</h2>
        <button class="sp-collapse" data-sp="collapse" type="button">${ICONS.down}Minimize</button>
      </div>
      <div class="sp-full sp" data-sp="full">
        <div class="sp-app">
          <section class="sp-card" aria-label="Audio player">
            <div class="sp-deck" aria-hidden="true">
              <div class="sp-disc">
                <div class="sp-disc-label" data-sp="disc"><span>DJ</span><span>CARLOS</span></div>
              </div>
              <div class="sp-sheen"></div>
              <div class="sp-arm"></div>
            </div>
            <div class="sp-now">
              <p class="sp-now-state" data-sp="state">Ready</p>
              <p class="sp-now-title" data-sp="title"></p>
              <p class="sp-now-meta"><span data-sp="artist"></span> &middot; <span data-sp="duration">--:--</span></p>
            </div>
            <canvas class="sp-viz" data-sp="viz" aria-hidden="true"></canvas>
            <div class="sp-progress">
              <input class="sp-range" data-sp="seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek">
              <span class="sp-time" aria-hidden="true"><span data-sp="current">0:00</span> / <span data-sp="duration">--:--</span></span>
            </div>
            <div class="sp-controls" data-sp="controls">
              <button class="sp-ctl" data-sp="prev" type="button" aria-label="Previous track">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2.500v14H6zM19 5v14L9 12z"/></svg>
              </button>
              <button class="sp-ctl sp-seek-btn" data-sp="back" type="button" aria-label="Back 10 seconds">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6V1.500L9.500 7l6.500 5.500V8.200a9.800 9.800 0 1 1-9.800 9.800H4a12 12 0 1 0 12-12z"/><text x="16" y="22.200" text-anchor="middle" font-size="9.500" font-weight="700" font-family="Barlow, sans-serif">10</text></svg>
              </button>
              <button class="sp-ctl sp-main" data-sp="play" type="button"></button>
              <button class="sp-ctl sp-seek-btn" data-sp="forward" type="button" aria-label="Forward 10 seconds">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6V1.500L22.500 7 16 12.500V8.200a9.800 9.800 0 1 0 9.800 9.800H28A12 12 0 1 1 16 6z"/><text x="16" y="22.200" text-anchor="middle" font-size="9.500" font-weight="700" font-family="Barlow, sans-serif">10</text></svg>
              </button>
              <button class="sp-ctl" data-sp="next" type="button" aria-label="Next track">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.500 5H18v14h-2.500zM5 5v14l10-7z"/></svg>
              </button>
            </div>
            <div class="sp-volume" data-sp="volume-row">
              <button class="sp-ctl" data-sp="mute" type="button" aria-label="Mute"></button>
              <input class="sp-range" data-sp="volume" type="range" min="0" max="100" step="1" value="80" aria-label="Volume">
              <span class="sp-volume-val" data-sp="volume-val" aria-hidden="true">80</span>
            </div>
            <p class="sp-status" data-sp="status" role="status"></p>
          </section>
          <section class="sp-playlist" aria-label="Playlist">
            <div class="sp-playlist-head">
              <h2 class="sp-playlist-title">Playlist</h2>
              <span class="sp-total" data-sp="total"></span>
            </div>
            <ol data-sp="list"></ol>
          </section>
        </div>
      </div>
    </div>`;
  document.body.append(root);

  // References are collected now, because the full player moves in and out of this element.
  const all = (name) => [...root.querySelectorAll(`[data-sp="${name}"]`)];
  const one = (name) => all(name)[0];
  const ui = {
    bar: one('bar'), sheet: one('sheet'), full: one('full'), controls: one('controls'), collapse: one('collapse'),
    plays: all('play'), seeks: all('seek'), titles: all('title'), currents: all('current'), durations: all('duration'),
    discs: all('disc'), expands: all('expand'), artist: one('artist'), barArtist: one('bar-artist'),
    state: one('state'), status: one('status'), list: one('list'), total: one('total'),
    mute: one('mute'), volume: one('volume'), volumeVal: one('volume-val'), volumeRow: one('volume-row'),
    mainPlay: all('play')[1],
  };

  const clock = (s) => (Number.isFinite(s) && s >= 0
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    : '--:--');
  const fill = (input) => {
    input.style.setProperty('--p', `${((input.value - input.min) / (input.max - input.min)) * 100}%`);
  };
  const setText = (elements, text) => elements.forEach((element) => { element.textContent = text; });

  // Two decks, so the outgoing and incoming tracks can overlap during a crossfade.
  // `audio` is always the deck of the current track.
  const decks = [new Audio(), new Audio()];
  decks.forEach((deck) => { deck.preload = 'metadata'; });
  let audio = decks[0];
  const otherDeck = (deck) => (deck === decks[0] ? decks[1] : decks[0]);
  // Events from the outgoing deck must not change what the player shows
  const onAudio = (type, handler) => decks.forEach((deck) => {
    deck.addEventListener(type, (event) => { if (deck === audio) handler(event); });
  });

  const CROSSFADE_MS = 500;
  const gains = new Map([[decks[0], 1], [decks[1], 0]]);
  let masterVolume = 0.8;
  let isMuted = false;
  let fadeTimer = 0;
  let fadeRun = 0;
  // iOS only allows the volume to be changed with the device buttons, so it can't fade either
  const volumeProbe = new Audio();
  volumeProbe.volume = 0.5;
  const canSetVolume = volumeProbe.volume === 0.5;

  function applyGains() {
    decks.forEach((deck) => {
      deck.volume = Math.min(Math.max(masterVolume * gains.get(deck), 0), 1);
      deck.muted = isMuted;
    });
  }

  // Ends any crossfade at once and leaves only the current deck
  function stopFade() {
    fadeRun++;
    clearInterval(fadeTimer);
    const outgoing = otherDeck(audio);
    outgoing.pause();
    gains.set(outgoing, 0);
    gains.set(audio, 1);
    applyGains();
  }

  function startCrossfade(src) {
    // If tracks are skipped quickly, the louder deck keeps fading out and the other takes the new
    // track, so nothing audible is ever cut off.
    const from = gains.get(decks[0]) >= gains.get(decks[1]) ? decks[0] : decks[1];
    const to = otherDeck(from);
    clearInterval(fadeTimer);
    const run = ++fadeRun;
    to.pause();
    gains.set(to, 0);
    applyGains();
    to.src = src;
    audio = to;
    // The fade starts once the new track is really playing, so a slow download never leaves a gap
    to.play().then(() => {
      if (run !== fadeRun) return;
      const startedAt = performance.now();
      const fromGain = gains.get(from);
      fadeTimer = setInterval(() => {
        const progress = Math.min((performance.now() - startedAt) / CROSSFADE_MS, 1);
        // Equal-power curves keep the loudness steady through the middle of the fade
        gains.set(from, fromGain * Math.cos(progress * Math.PI / 2));
        gains.set(to, Math.sin(progress * Math.PI / 2));
        applyGains();
        if (progress === 1) stopFade();
      }, 16);
    }).catch(() => {
      if (run === fadeRun) stopFade();
    });
  }

  let index = 0;
  let scrubbing = false;
  let pendingSeek = null;
  let resumeOnLoad = false;
  const durations = TRACKS.map(() => NaN);
  const failed = TRACKS.map(() => false);

  // Playlist
  const rows = TRACKS.map((track, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'sp-item';
    button.type = 'button';
    button.innerHTML = `
      <span class="sp-item-no"></span>
      <span><span class="sp-item-title"></span><span class="sp-item-artist"></span></span>
      <span class="sp-item-time">--:--</span>`;
    button.querySelector('.sp-item-title').textContent = track.title;
    button.querySelector('.sp-item-artist').textContent = track.artist;
    button.addEventListener('click', () => {
      if (i === index) togglePlay();
      else select(i, true);
    });
    li.append(button);
    ui.list.append(li);
    return button;
  });

  function renderRows() {
    rows.forEach((row, i) => {
      const active = i === index;
      if (active) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
      row.classList.toggle('sp-playing-now', active && !audio.paused);
      row.disabled = failed[i];
      row.querySelector('.sp-item-no').innerHTML = active
        ? '<span class="sp-bars" aria-hidden="true"><i></i><i></i><i></i></span>'
        : String(i + 1);
      row.querySelector('.sp-item-time').textContent = failed[i] ? 'Unavailable' : clock(durations[i]);
    });
    const known = durations.filter(Number.isFinite);
    const seconds = known.reduce((sum, d) => sum + d, 0);
    const playable = failed.filter((f) => !f).length;
    ui.total.textContent = `${playable} track${playable === 1 ? '' : 's'}${known.length ? ` · ${clock(seconds)}` : ''}`;
  }

  // Durations for the whole list, loaded without playing anything
  TRACKS.forEach((track, i) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', () => {
      durations[i] = probe.duration;
      if (i === index) setText(ui.durations, clock(probe.duration));
      renderRows();
    });
    probe.addEventListener('error', () => { failed[i] = true; renderRows(); });
    probe.src = track.src;
  });

  function renderTransport() {
    const playing = !audio.paused;
    root.classList.toggle('sp-playing', playing);
    ui.full.classList.toggle('sp-playing', playing);
    ui.plays.forEach((button) => {
      button.innerHTML = playing ? ICONS.pause : ICONS.play;
      button.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    });
    ui.state.textContent = playing ? 'Now playing' : audio.currentTime > 0 ? 'Paused' : 'Ready';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    renderRows();
  }

  function renderTime() {
    const { currentTime, duration } = audio;
    if (!scrubbing) {
      setText(ui.currents, clock(currentTime));
      ui.seeks.forEach((seek) => {
        seek.value = duration ? (currentTime / duration) * 1000 : 0;
        fill(seek);
      });
    }
    ui.seeks.forEach((seek) => seek.setAttribute('aria-valuetext', `${clock(currentTime)} of ${clock(duration)}`));
  }

  function select(i, autoplay) {
    index = i;
    pendingSeek = null;
    resumeOnLoad = false;
    const track = TRACKS[i];
    // A background tab's timers are too slow for a fade, and would leave the new track silent
    const crossfade = autoplay && canSetVolume && !document.hidden && !audio.paused;
    if (crossfade) {
      startCrossfade(track.src);
    } else {
      stopFade();
      audio.src = track.src;
      if (autoplay) audio.play().catch(() => {});
    }
    ui.status.textContent = '';
    setText(ui.titles, track.title);
    ui.artist.textContent = track.artist;
    ui.barArtist.textContent = track.artist;
    setText(ui.durations, clock(durations[i]));
    ui.discs.forEach((disc) => disc.style.setProperty('--angle', `${i * 72}deg`));
    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: 'DJ Carlos' });
    }
    renderTime();
    renderTransport();
  }

  function togglePlay() {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  // Next playable track in a direction, or -1. Wraps around unless told not to.
  function neighbour(direction, wrap = true) {
    for (let step = 1; step < TRACKS.length; step++) {
      const raw = index + direction * step;
      if (!wrap && (raw < 0 || raw >= TRACKS.length)) return -1;
      const i = (raw + TRACKS.length) % TRACKS.length;
      if (!failed[i]) return i;
    }
    return -1;
  }

  function changeTrack(direction) {
    const target = neighbour(direction);
    if (target >= 0) select(target, !audio.paused);
  }

  function skip(seconds) {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
  }

  // Transport
  ui.plays.forEach((button) => button.addEventListener('click', togglePlay));
  one('next').addEventListener('click', () => changeTrack(1));
  one('prev').addEventListener('click', () => {
    // Like most music apps: restart the track first, then go to the previous one.
    if (audio.currentTime > 3) audio.currentTime = 0;
    else changeTrack(-1);
  });
  one('back').addEventListener('click', () => skip(-SKIP_SECONDS));
  one('forward').addEventListener('click', () => skip(SKIP_SECONDS));

  // Progress bars: both stay in step while either one is dragged
  ui.seeks.forEach((seek) => {
    seek.addEventListener('input', () => {
      scrubbing = true;
      ui.seeks.forEach((other) => { other.value = seek.value; fill(other); });
      if (audio.duration) setText(ui.currents, clock((seek.value / 1000) * audio.duration));
    });
    seek.addEventListener('change', () => {
      if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
      scrubbing = false;
    });
  });

  // Volume
  function renderVolume() {
    const level = isMuted ? 0 : Math.round(masterVolume * 100);
    ui.volume.value = level;
    ui.volumeVal.textContent = level;
    fill(ui.volume);
    ui.mute.innerHTML = level === 0 ? ICONS.muted : ICONS.volume;
    ui.mute.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
  }
  ui.volume.addEventListener('input', () => {
    masterVolume = ui.volume.value / 100;
    isMuted = false;
    applyGains();
    renderVolume();
    try { localStorage.setItem(VOLUME_KEY, ui.volume.value); } catch {}
  });
  ui.mute.addEventListener('click', () => {
    if (masterVolume === 0) {
      masterVolume = 0.8;
      isMuted = false;
    } else {
      isMuted = !isMuted;
    }
    applyGains();
    renderVolume();
  });
  let savedVolume = null;
  try { savedVolume = localStorage.getItem(VOLUME_KEY); } catch {}
  // A saved 0 is not restored, so a returning visitor never gets a silent player
  masterVolume = +savedVolume > 0 ? Math.min(+savedVolume / 100, 1) : 0.8;
  applyGains();
  if (!canSetVolume) ui.volumeRow.hidden = true;

  // Audio events
  onAudio('play', () => {
    ui.barArtist.textContent = TRACKS[index].artist;
    renderTransport();
  });
  onAudio('pause', () => {
    stopFade();
    renderTransport();
  });
  onAudio('timeupdate', () => {
    renderTime();
    // Starts the next track early, so the automatic change crossfades as well.
    // This event only fires about every 250 ms, so the margin guarantees a complete fade.
    const remaining = audio.duration - audio.currentTime;
    if (canSetVolume && !document.hidden && !scrubbing && !audio.paused && remaining <= (CROSSFADE_MS + 250) / 1000) {
      const target = neighbour(1, false);
      if (target >= 0) select(target, true);
    }
  });
  onAudio('seeked', () => { renderTime(); renderTransport(); });
  onAudio('loadedmetadata', () => {
    durations[index] = audio.duration;
    setText(ui.durations, clock(audio.duration));
    if (pendingSeek !== null) {
      audio.currentTime = Math.min(pendingSeek, audio.duration);
      pendingSeek = null;
    }
    if (resumeOnLoad) {
      resumeOnLoad = false;
      // Browsers may refuse to start audio by themselves after a full page load
      audio.play().catch(() => { ui.barArtist.textContent = 'Press play to keep listening'; });
    }
    renderTime();
    renderRows();
  });
  onAudio('waiting', () => { root.classList.add('sp-loading'); ui.full.classList.add('sp-loading'); });
  ['playing', 'pause', 'canplay', 'error'].forEach((type) => {
    onAudio(type, () => { root.classList.remove('sp-loading'); ui.full.classList.remove('sp-loading'); });
  });
  onAudio('ended', () => {
    const target = neighbour(1, false);
    if (target >= 0) select(target, true);
    else select(failed[0] ? Math.max(failed.indexOf(false), 0) : 0, false);
  });
  onAudio('error', () => {
    if (!audio.error) return;
    failed[index] = true;
    ui.status.textContent = `"${TRACKS[index].title}" could not be loaded.`;
    audio.pause(); // a failed element still reports itself as playing
    renderTransport();
  });

  // Frequency visualizer (Web Audio API)
  // Routing audio from another origin through Web Audio without CORS permission makes it silent.
  // That applies to file:// pages and to MP3 URLs on other sites, so the visualizer stays off
  // for those and the music keeps playing directly.
  const canvas = one('viz');
  const canvasContext = canvas.getContext('2d');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const VIZ_MIN_HZ = 50;
  const VIZ_MAX_HZ = 14000;
  const vizAllowed = /^https?:$/.test(location.protocol)
    && TRACKS.every((track) => new URL(track.src, location.href).origin === location.origin)
    && Boolean(AudioContextClass)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.hidden = !vizAllowed;
  let audioContext = null;
  let analyser = null;
  let frequencyData = null;
  let vizFrame = 0;
  let vizGradient = null;

  function connectAudioGraph() {
    if (!vizAllowed || audioContext) return;
    document.removeEventListener('click', connectAudioGraph, true);
    document.removeEventListener('keydown', connectAudioGraph, true);
    try {
      const context = new AudioContextClass();
      const node = context.createAnalyser();
      node.fftSize = 2048;
      node.smoothingTimeConstant = 0.78;
      frequencyData = new Uint8Array(node.frequencyBinCount);
      decks.forEach((deck) => context.createMediaElementSource(deck).connect(node));
      node.connect(context.destination);
      audioContext = context;
      analyser = node;
      audioContext.resume().catch(() => {});
      kickViz();
    } catch {
      canvas.hidden = true;
    }
  }
  // Started by a click or key press: a context created without one stays suspended,
  // and a suspended context would silence the audio routed through it.
  if (vizAllowed) {
    document.addEventListener('click', connectAudioGraph, true);
    document.addEventListener('keydown', connectAudioGraph, true);
  }

  function resumeAudioGraph() {
    if (audioContext && audioContext.state !== 'running' && !audio.paused) audioContext.resume().catch(() => {});
    kickViz();
  }
  onAudio('play', () => {
    if (audioContext && audioContext.state !== 'running') audioContext.resume().catch(() => {});
    kickViz();
  });
  onAudio('pause', kickViz);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resumeAudioGraph(); });

  function drawViz() {
    vizFrame = 0;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const scale = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      vizGradient = null;
    }
    if (!vizGradient) {
      vizGradient = canvasContext.createLinearGradient(0, height, 0, 0);
      vizGradient.addColorStop(0, '#8B5CF6');
      vizGradient.addColorStop(1, '#EC4899');
    }
    canvasContext.setTransform(scale, 0, 0, scale, 0, 0);
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = vizGradient;
    canvasContext.shadowColor = 'rgba(236, 72, 153, .6)';
    canvasContext.shadowBlur = 6;

    const count = Math.max(24, Math.min(64, Math.floor(width / 9)));
    const step = width / count;
    const barWidth = Math.max(2, step * 0.62);
    let active = false;
    if (analyser) analyser.getByteFrequencyData(frequencyData);

    for (let i = 0; i < count; i++) {
      let level = 0;
      if (analyser) {
        // Bands are spaced evenly in pitch, as hearing is, so the highs get as many bars as the lows
        const hzPerBin = audioContext.sampleRate / analyser.fftSize;
        const lowHz = VIZ_MIN_HZ * (VIZ_MAX_HZ / VIZ_MIN_HZ) ** (i / count);
        const highHz = VIZ_MIN_HZ * (VIZ_MAX_HZ / VIZ_MIN_HZ) ** ((i + 1) / count);
        const first = Math.min(Math.floor(lowHz / hzPerBin), frequencyData.length - 1);
        const last = Math.min(Math.max(first, Math.floor(highHz / hzPerBin)), frequencyData.length - 1);
        for (let bin = first; bin <= last; bin++) level = Math.max(level, frequencyData[bin]);
        if (level > 0) active = true;
      }
      const barHeight = Math.max(2, ((level / 255) ** 1.6) * height);
      const x = i * step + (step - barWidth) / 2;
      canvasContext.beginPath();
      if (canvasContext.roundRect) canvasContext.roundRect(x, height - barHeight, barWidth, barHeight, 2);
      else canvasContext.rect(x, height - barHeight, barWidth, barHeight);
      canvasContext.fill();
    }

    // Keeps going while the music plays and until the bars have settled after a pause
    if (analyser && isVizOnScreen() && (!audio.paused || active)) vizFrame = requestAnimationFrame(drawViz);
  }

  function isVizOnScreen() {
    return sheetOpen || Boolean(document.getElementById('player-slot'));
  }

  function kickViz() {
    if (vizAllowed && !vizFrame) vizFrame = requestAnimationFrame(drawViz);
  }
  if (vizAllowed) new ResizeObserver(kickViz).observe(canvas);

  // Bar, sheet and the inline player on mixes.html
  let sheetOpen = false;
  let inlineControlsVisible = false;
  let inlineObserver = null;

  function renderBar() {
    ui.bar.classList.toggle('sp-bar-hidden', sheetOpen || inlineControlsVisible);
    ui.expands.forEach((button) => button.setAttribute('aria-expanded', String(sheetOpen)));
    kickViz();
  }

  function setBackgroundInert(inert) {
    document.querySelectorAll('main, footer').forEach((element) => { element.inert = inert; });
  }

  function openSheet() {
    sheetOpen = true;
    ui.sheet.classList.add('sp-open');
    document.documentElement.classList.add('sp-locked');
    setBackgroundInert(true);
    renderBar();
    ui.collapse.focus();
  }

  function closeSheet(returnFocus = true) {
    if (!sheetOpen) return;
    sheetOpen = false;
    ui.sheet.classList.remove('sp-open');
    document.documentElement.classList.remove('sp-locked');
    setBackgroundInert(false);
    renderBar();
    if (returnFocus) ui.expands[0].focus();
  }

  function expand() {
    const slot = document.getElementById('player-slot');
    if (slot) {
      // mixes.html already shows the full player, so bring it into view instead
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ui.mainPlay.focus({ preventScroll: true });
    } else {
      openSheet();
    }
  }

  ui.expands.forEach((button) => button.addEventListener('click', expand));
  ui.collapse.addEventListener('click', () => closeSheet());

  // Puts the full player inside the page if it has a slot, otherwise inside the sheet
  function dock() {
    if (inlineObserver) inlineObserver.disconnect();
    inlineObserver = null;
    const slot = document.getElementById('player-slot');
    if (slot) {
      slot.append(ui.full);
      inlineControlsVisible = true;
      inlineObserver = new IntersectionObserver(([entry]) => {
        inlineControlsVisible = entry.isIntersecting;
        renderBar();
      }, { rootMargin: '-61px 0px -76px 0px', threshold: 0.6 });
      inlineObserver.observe(ui.controls);
    } else {
      ui.sheet.append(ui.full);
      inlineControlsVisible = false;
    }
    renderBar();
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sheetOpen) closeSheet();
    // Space and arrows belong to the page unless the full player is on screen
    const fullVisible = sheetOpen || inlineControlsVisible;
    const target = event.target instanceof Element ? event.target : document.body;
    if (!fullVisible || target.closest('button, input, select, textarea, a') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    if (event.code === 'ArrowLeft') skip(-SKIP_SECONDS);
    if (event.code === 'ArrowRight') skip(SKIP_SECONDS);
  });

  // Lock-screen and media-key controls
  if ('mediaSession' in navigator) {
    const handlers = {
      play: () => audio.play().catch(() => {}),
      pause: () => audio.pause(),
      previoustrack: () => changeTrack(-1),
      nexttrack: () => changeTrack(1),
      seekbackward: () => skip(-SKIP_SECONDS),
      seekforward: () => skip(SKIP_SECONDS),
    };
    Object.entries(handlers).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    });
  }

  // Navigation: swap the page around the player so the audio element is never destroyed.
  // Pages opened directly from disk (file://) can't be fetched, so those links load normally
  // and the track and position are restored from sessionStorage below.
  const canSwap = location.protocol === 'http:' || location.protocol === 'https:';
  let navigationId = 0;
  let currentPath = location.pathname;

  function swapPage(next) {
    closeSheet(false);
    document.title = next.title;
    const description = next.querySelector('meta[name="description"]');
    const ownDescription = document.querySelector('meta[name="description"]');
    if (description && ownDescription) ownDescription.content = description.content;
    const style = next.head.querySelector('style');
    const ownStyle = document.head.querySelector('style');
    if (style && ownStyle) ownStyle.replaceWith(document.importNode(style, true));

    [...document.body.children].forEach((child) => {
      if (child !== root && !child.classList.contains('aurora')) child.remove();
    });
    const scripts = [];
    [...next.body.children].forEach((child) => {
      if (child.classList.contains('aurora')) return;
      if (child.tagName === 'SCRIPT') {
        if (!child.src) scripts.push(child.textContent);
        return;
      }
      document.body.insertBefore(document.importNode(child, true), root);
    });
    scripts.forEach((code) => {
      const script = document.createElement('script');
      script.textContent = code;
      document.body.insertBefore(script, root);
    });
    dock();
    document.dispatchEvent(new Event('djcarlos:page-swapped'));
  }

  async function navigate(url, { push = true, y = 0 } = {}) {
    const id = ++navigationId;
    let next;
    try {
      const response = await fetch(url.href, { headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error(String(response.status));
      next = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (!next.querySelector('main')) throw new Error('Not a site page');
    } catch {
      location.href = url.href;
      return;
    }
    if (id !== navigationId) return;

    if (push) {
      history.replaceState({ y: window.scrollY }, '');
      history.pushState({ y: 0 }, '', url.href);
    }
    currentPath = url.pathname;
    swapPage(next);

    const anchor = url.hash && document.getElementById(url.hash.slice(1));
    if (anchor) anchor.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: y, behavior: 'instant' });

    // Tell keyboard and screen reader users that the page changed
    const heading = document.querySelector('main h1');
    if (heading && push) {
      heading.tabIndex = -1;
      heading.style.outline = 'none';
      heading.focus({ preventScroll: true });
    }
  }

  if (canSwap) {
    history.scrollRestoration = 'manual';
    history.replaceState({ y: 0 }, '');

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        closeSheet(false);
        if (url.hash) return; // the browser handles links within the page
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      event.preventDefault();
      navigate(url);
    });

    window.addEventListener('popstate', (event) => {
      if (location.pathname === currentPath) return;
      navigate(new URL(location.href), { push: false, y: event.state?.y || 0 });
    });
  }

  // Remembers the track through full page loads in this tab
  window.addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ index, time: audio.currentTime, playing: !audio.paused }));
    } catch {}
  });

  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(STATE_KEY)); } catch {}

  dock();
  renderVolume();
  select(saved && TRACKS[saved.index] ? saved.index : 0, false);
  if (saved && saved.time > 0) pendingSeek = saved.time;
  if (saved && saved.playing) resumeOnLoad = true;
})();
