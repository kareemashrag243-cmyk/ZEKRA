import { useEffect, useRef } from "react";
import Head from "next/head";

function withBreaks(text) {
  if (!text) return null;
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

function formatDateBadge(customer) {
  if (customer.story_year) return `OUR STORY · ${customer.story_year}`;
  return "OUR STORY";
}

export default function PublicSite({ customer }) {
  const stackRef = useRef(null);

  const memorySlots = (customer.memory_images || []).filter((m) => m && m.url);
  const gallerySlots = Array.from({ length: 4 }, (_, i) => (customer.gallery_images || [])[i] || { url: null, caption: "" });

  useEffect(() => {
    document.body.classList.add("locked");

    // ---- CURSOR ----
    const cursor = document.getElementById("cursor");
    const onMouseMove = (e) => {
      if (!cursor) return;
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };
    window.addEventListener("mousemove", onMouseMove);

    // ---- INTRO ----
    const intro = document.getElementById("intro");
    const enter = document.getElementById("enter");
    const audio = document.getElementById("audio");
    const music = document.getElementById("music");

    const onEnter = () => {
      intro?.classList.add("hide");
      document.body.classList.remove("locked");
      if (audio && customer.music_url) {
        audio.play().then(() => music?.classList.add("playing")).catch(() => {});
      }
    };
    enter?.addEventListener("click", onEnter);

    const onMusicClick = () => {
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        music?.classList.add("playing");
      } else {
        audio.pause();
        music?.classList.remove("playing");
      }
    };
    music?.addEventListener("click", onMusicClick);

    // ---- REVEAL ----
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // ---- MEMORY SWIPE ----
    const stack = stackRef.current;
    let cards = stack ? Array.from(stack.querySelectorAll(".memory-card")) : [];
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let activeCard = null;
    let autoSwipe = null;

    function updateCards() {
      cards.forEach((card, index) => {
        card.classList.remove("swiped-left", "swiped-right", "dragging");
        card.style.opacity = "";
        if (index === 0) {
          card.style.zIndex = 23;
          card.style.transform = "rotate(-2deg)";
        } else {
          card.style.zIndex = 23 - index;
          const offset = Math.min(index, 5);
          const rotations = [-2, 2, -3, 3, -2];
          const scales = [1, 0.97, 0.94, 0.91, 0.88];
          card.style.transform = `translate(${offset * 7}px,${offset * 7}px) rotate(${rotations[index % 5]}deg) scale(${scales[index % 5]})`;
        }
      });
    }

    function startDrag(e) {
      if (cards.length === 0) return;
      activeCard = cards[0];
      isDragging = true;
      startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      currentX = startX;
      activeCard.classList.add("dragging");
    }

    function moveDrag(e) {
      if (!isDragging || !activeCard) return;
      currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      const diff = currentX - startX;
      const rotate = diff * 0.08;
      activeCard.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;
    }

    function endDrag() {
      if (!isDragging || !activeCard) return;
      isDragging = false;
      const diff = currentX - startX;
      activeCard.classList.remove("dragging");
      const threshold = 90;

      if (Math.abs(diff) > threshold) {
        const direction = diff > 0 ? "swiped-right" : "swiped-left";
        activeCard.classList.add(direction);
        setTimeout(() => {
          const first = cards.shift();
          cards.push(first);
          updateCards();
        }, 450);
      } else {
        updateCards();
      }
      activeCard = null;
    }

    if (stack) {
      stack.addEventListener("touchstart", startDrag, { passive: true });
      stack.addEventListener("touchmove", moveDrag, { passive: true });
      stack.addEventListener("touchend", endDrag);
      stack.addEventListener("mousedown", startDrag);
      window.addEventListener("mousemove", moveDrag);
      window.addEventListener("mouseup", endDrag);

      const stopAuto = () => clearInterval(autoSwipe);
      stack.addEventListener("touchstart", stopAuto, { passive: true });
      stack.addEventListener("mousedown", stopAuto);

      updateCards();

      autoSwipe = setInterval(() => {
        if (!isDragging && cards.length > 1) {
          const first = cards[0];
          first.classList.add("swiped-left");
          setTimeout(() => {
            cards.push(cards.shift());
            updateCards();
          }, 450);
        }
      }, 5000);
    }

    // ---- COUNTER ----
    const startDate = customer.relationship_start_date ? new Date(customer.relationship_start_date) : null;
    let counterInterval = null;

    function countUp() {
      if (!startDate) return;
      const diff = Math.max(0, new Date() - startDate);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff / 3600000) % 24;
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, "0");
      };
      set("days", d);
      set("hours", h);
      set("minutes", m);
      set("seconds", s);
    }

    if (startDate) {
      countUp();
      counterInterval = setInterval(countUp, 1000);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      enter?.removeEventListener("click", onEnter);
      music?.removeEventListener("click", onMusicClick);
      observer.disconnect();
      if (stack) {
        stack.removeEventListener("touchstart", startDrag);
        stack.removeEventListener("touchmove", moveDrag);
        stack.removeEventListener("touchend", endDrag);
        stack.removeEventListener("mousedown", startDrag);
        window.removeEventListener("mousemove", moveDrag);
        window.removeEventListener("mouseup", endDrag);
      }
      clearInterval(autoSwipe);
      clearInterval(counterInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  return (
    <>
      <Head>
        <title>{`${customer.boy_name || ""} & ${customer.girl_name || ""} — Our Story`}</title>
        <meta name="theme-color" content="#210f18" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* prettier-ignore */}
      <style jsx global>{`
:root{
  --bg:#210f18;
  --bg2:#351522;
  --paper:#fff5f7;
  --muted:#cdb2ba;
  --gold:#d89aaa;
  --gold2:#f6ccd6;
  --line:rgba(246,204,214,.22);
  --white:#fff8fa;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--paper);font-family:"DM Sans",sans-serif;font-weight:300;overflow-x:hidden;line-height:1.6;}
body.locked{overflow:hidden;}
a{color:inherit;text-decoration:none;}
button,input{font:inherit;}
::selection{background:var(--gold);color:#171113;}
.noise{position:fixed;inset:0;pointer-events:none;z-index:50;opacity:.055;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='%23n' opacity='.7'/%3E%3C/svg%3E");}
.cursor{position:fixed;width:14px;height:14px;border:1px solid var(--gold2);border-radius:50%;pointer-events:none;z-index:100;transform:translate(-50%,-50%);transition:transform .15s ease,opacity .2s;mix-blend-mode:difference;}
@media(max-width:800px){.cursor{display:none;}}
.music{position:fixed;right:22px;top:22px;z-index:60;width:48px;height:48px;border:1px solid var(--line);border-radius:50%;background:rgba(13,11,12,.65);backdrop-filter:blur(14px);color:var(--gold2);cursor:pointer;}
.music span{display:block;width:15px;height:15px;border:1px solid currentColor;border-radius:50%;margin:auto;}
.music.playing span{animation:spin 2.5s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.intro-screen{position:fixed;inset:0;z-index:80;background:#210f18;display:grid;place-items:center;transition:opacity .8s ease,visibility .8s;}
.intro-screen.hide{opacity:0;visibility:hidden;}
.intro-inner{text-align:center;padding:30px;}
.eyebrow{font-size:10px;letter-spacing:5px;text-transform:uppercase;color:var(--gold);margin-bottom:18px;}
.intro-inner h1{font-family:"Cormorant Garamond",serif;font-size:clamp(60px,12vw,130px);font-weight:400;line-height:.82;}
.intro-inner p{color:var(--muted);margin:25px auto;max-width:420px;}
.enter{border:1px solid var(--gold);background:transparent;color:var(--paper);padding:14px 28px;border-radius:100px;cursor:pointer;letter-spacing:3px;font-size:10px;text-transform:uppercase;transition:.3s;}
.enter:hover{background:var(--gold);color:#151012;}
.hero{min-height:100svh;position:relative;display:grid;place-items:center;text-align:center;overflow:hidden;background:radial-gradient(circle at 50% 35%,rgba(199,165,122,.18),transparent 30%),linear-gradient(180deg,#100c0e,#0d0b0c);}
.hero::before,.hero::after{content:"";position:absolute;border:1px solid var(--line);border-radius:50%;pointer-events:none;}
.hero::before{width:min(70vw,650px);height:min(70vw,650px);animation:float 8s ease-in-out infinite;}
.hero::after{width:min(90vw,900px);height:min(90vw,900px);opacity:.35;}
@keyframes float{50%{transform:translateY(-12px) scale(1.02);}}
.hero-content{position:relative;z-index:2;padding:30px;}
.hero h1{font-family:"Cormorant Garamond",serif;font-weight:400;font-size:clamp(80px,17vw,190px);line-height:.7;letter-spacing:-5px;}
.hero h1 em{font-size:.42em;color:var(--gold);display:block;letter-spacing:0;font-style:normal;margin:20px 0;}
.hero-date{margin-top:34px;font-size:10px;letter-spacing:5px;color:var(--muted);}
.scroll{margin-top:60px;color:var(--muted);font-size:9px;letter-spacing:4px;}
.scroll i{display:block;width:1px;height:55px;background:linear-gradient(var(--gold),transparent);margin:12px auto;}
section{position:relative;}
.wrap{max-width:1100px;margin:auto;padding:130px 25px;}
.center{text-align:center;}
.kicker{font-size:10px;letter-spacing:5px;text-transform:uppercase;color:var(--gold);margin-bottom:18px;}
.title{font-family:"Cormorant Garamond",serif;font-size:clamp(52px,8vw,105px);font-weight:400;line-height:.88;}
.lead{max-width:620px;margin:28px auto 0;color:var(--muted);font-size:14px;line-height:2;}
.reveal{opacity:0;transform:translateY(35px);transition:opacity 1s ease,transform 1s ease;}
.reveal.visible{opacity:1;transform:none;}
.story{background:var(--paper);color:#211b19;}
.story .kicker{color:#9d7950;}
.memory-section{margin-top:80px;position:relative;min-height:620px;display:flex;justify-content:center;align-items:center;}
.memory-stack{width:min(390px,86vw);height:540px;position:relative;perspective:1200px;touch-action:pan-y;user-select:none;-webkit-user-select:none;}
.memory-card{position:absolute;inset:0;background:#fff;padding:10px;border-radius:3px;box-shadow:0 25px 70px rgba(45,30,20,.18),0 4px 12px rgba(45,30,20,.12);transform-origin:center bottom;transition:transform .55s cubic-bezier(.22,.61,.36,1),opacity .4s ease,z-index 0s;cursor:grab;will-change:transform;}
.memory-card:active{cursor:grabbing;}
.memory-card img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}
.memory-card::after{content:"";position:absolute;inset:10px;border:1px solid rgba(255,255,255,.45);pointer-events:none;}
.memory-card.dragging{transition:none;}
.memory-card.swiped-left{transform:translateX(-130%) rotate(-18deg);opacity:0;pointer-events:none;}
.memory-card.swiped-right{transform:translateX(130%) rotate(18deg);opacity:0;pointer-events:none;}
.memory-hint{position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);text-align:center;color:#9d7950;font-size:9px;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;}
.memory-hint span{display:block;font-size:18px;letter-spacing:0;margin-bottom:3px;animation:hintMove 1.8s ease-in-out infinite;}
@keyframes hintMove{0%,100%{transform:translateX(0);}50%{transform:translateX(12px);}}
.gallery{background:#100d0e;}
.grid{margin-top:60px;display:grid;grid-template-columns:repeat(12,1fr);gap:14px;}
.card{overflow:hidden;background:#181315;position:relative;}
.card:nth-child(1){grid-column:span 7;}
.card:nth-child(2){grid-column:span 5;margin-top:60px;}
.card:nth-child(3){grid-column:span 5;}
.card:nth-child(4){grid-column:span 7;margin-top:-40px;}
.card img{width:100%;height:520px;object-fit:cover;display:block;filter:saturate(.88);transition:transform .8s ease,filter .8s;}
.card:nth-child(2) img,.card:nth-child(3) img{height:400px;}
.card:hover img{transform:scale(1.045);filter:saturate(1);}
.card figcaption{position:absolute;bottom:0;left:0;right:0;padding:25px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.7));font-family:"Cormorant Garamond";font-size:25px;}
.counter{background:linear-gradient(135deg,#351522,#210f18);text-align:center;}
.counter-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:800px;margin:55px auto 0;}
.time{border:1px solid var(--line);padding:28px 10px;background:rgba(255,255,255,.015);}
.time b{display:block;font-family:"Cormorant Garamond";font-size:58px;font-weight:400;color:var(--gold2);line-height:1;}
.time span{font-size:9px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;}
.video{background:#f2ebe4;color:#211b19;}
.video .kicker{color:#9d7950;}
.video-box{margin-top:55px;position:relative;overflow:hidden;background:#d7cec4;box-shadow:0 30px 80px rgba(30,20,15,.18);}
.video-box video{width:100%;display:block;max-height:720px;object-fit:cover;}
.letter{background:#e9dfd5;color:#211b19;text-align:center;}
.letter-box{max-width:750px;margin:50px auto 0;padding:60px 45px;border:1px solid rgba(80,60,45,.2);background:rgba(255,255,255,.18);}
.letter-text{font-family:"Cormorant Garamond";font-size:clamp(30px,5vw,52px);line-height:1.15;font-style:italic;}
.signature{margin-top:30px;font-size:10px;letter-spacing:4px;color:#9d7950;text-transform:uppercase;}
.final{min-height:85svh;display:grid;place-items:center;text-align:center;background:#210f18;overflow:hidden;}
.final h2{font-family:"Cormorant Garamond";font-size:clamp(75px,14vw,180px);font-weight:400;line-height:.78;}
.final h2 span{color:var(--gold);}
.final p{margin-top:30px;color:var(--muted);letter-spacing:4px;font-size:9px;text-transform:uppercase;}
footer{text-align:center;padding:60px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:9px;letter-spacing:3px;}
@media(max-width:700px){
  .wrap{padding:95px 20px;}
  .hero h1{letter-spacing:-2px;}
  .memory-section{min-height:560px;margin-top:65px;}
  .memory-stack{width:min(330px,82vw);height:465px;}
  .memory-card{padding:8px;}
  .memory-card::after{inset:8px;}
  .memory-hint{bottom:0;}
  .grid{display:grid;grid-template-columns:1fr;}
  .card,.card:nth-child(2),.card:nth-child(3),.card:nth-child(4){grid-column:1;margin:0;}
  .card img,.card:nth-child(2) img,.card:nth-child(3) img{height:430px;}
  .counter-grid{grid-template-columns:repeat(2,1fr);}
  .letter-box{padding:45px 22px;}
}
      `}</style>

      <div className="noise" />
      <div className="cursor" id="cursor" />

      {/* INTRO */}
      <div className="intro-screen" id="intro">
        <div className="intro-inner">
          <div className="eyebrow">A little world made for two</div>
          <h1>
            Our
            <br />
            Story
          </h1>
          <p>Some moments deserve more than a photo. They deserve a whole place to live.</p>
          <button className="enter" id="enter">
            Enter our story
          </button>
        </div>
      </div>

      {/* MUSIC */}
      {customer.music_url && (
        <>
          <button className="music" id="music" aria-label="Play music">
            <span></span>
          </button>
          <audio id="audio" loop>
            <source src={customer.music_url} type="audio/mpeg" />
          </audio>
        </>
      )}

      {/* HERO */}
      <header className="hero">
        <div className="hero-content reveal">
          <div className="kicker">A story worth remembering</div>
          <h1>
            {customer.boy_name}
            <em>&</em>
            {customer.girl_name}
          </h1>
          <div className="hero-date">{formatDateBadge(customer)}</div>
          <div className="scroll">
            SCROLL TO DISCOVER
            <i></i>
          </div>
        </div>
      </header>

      {/* BEGINNING */}
      <section className="wrap center reveal">
        <div className="kicker">The beginning</div>
        <h2 className="title">{withBreaks(customer.beginning_title)}</h2>
        <p className="lead">{customer.beginning_description}</p>
      </section>

      {/* MEMORY SWIPE */}
      <section className="story">
        <div className="wrap">
          <div className="center reveal">
            <div className="kicker">Our memories</div>
            <h2 className="title">
              Little moments.
              <br />
              Forever ours.
            </h2>
          </div>

          <div className="memory-section reveal">
            <div className="memory-stack" id="memoryStack" ref={stackRef}>
              {memorySlots.map((m, i) => (
                <div className="memory-card" key={m.url || i}>
                  <img src={m.url} alt="Our memory" />
                </div>
              ))}
            </div>
            <div className="memory-hint">
              <span>↔</span>
              SWIPE TO DISCOVER
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery">
        <div className="wrap">
          <div className="center reveal">
            <div className="kicker">Memories</div>
            <h2 className="title">
              Little moments.
              <br />
              Big feelings.
            </h2>
          </div>

          <div className="grid">
            {gallerySlots.map((g, i) => (
              <figure className="card reveal" key={i}>
                {g.url && <img src={g.url} alt="Our memory" />}
                {g.caption && <figcaption>{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* COUNTER */}
      <section className="counter">
        <div className="wrap center reveal">
          <div className="kicker">Our time together</div>
          <h2 className="title">
            Every second
            <br />
            counts.
          </h2>

          <div className="counter-grid">
            <div className="time">
              <b id="days">00</b>
              <span>Days</span>
            </div>
            <div className="time">
              <b id="hours">00</b>
              <span>Hours</span>
            </div>
            <div className="time">
              <b id="minutes">00</b>
              <span>Minutes</span>
            </div>
            <div className="time">
              <b id="seconds">00</b>
              <span>Seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      {customer.video_url && (
        <section className="video">
          <div className="wrap">
            <div className="center reveal">
              <div className="kicker">Our film</div>
              <h2 className="title">
                Some memories
                <br />
                move.
              </h2>
            </div>

            <div className="video-box reveal">
              <video controls playsInline poster={customer.video_cover_url || undefined}>
                <source src={customer.video_url} type="video/mp4" />
                Your browser does not support video.
              </video>
            </div>
          </div>
        </section>
      )}

      {/* LETTER */}
      <section className="letter">
        <div className="wrap reveal">
          <div className="kicker">A little note</div>
          <div className="letter-box">
            <div className="letter-text">“{customer.letter_text}”</div>
            <div className="signature">{customer.signature}</div>
          </div>
        </div>
      </section>

      {/* FINAL */}
      <section className="final">
        <div className="reveal">
          <div className="kicker">And now...</div>
          <h2>
            Our
            <br />
            <span>story.</span>
          </h2>
          <p>{customer.final_text}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        MADE WITH LOVE · {customer.boy_name} & {customer.girl_name}
        {customer.story_year ? ` · ${customer.story_year}` : ""}
      </footer>
    </>
  );
}
