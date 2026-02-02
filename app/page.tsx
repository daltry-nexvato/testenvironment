"use client";

export default function Home() {
  return (
    <div className="group relative h-screen w-screen cursor-pointer overflow-hidden">
      {/* ═══════════════════════════════════════════
          PARADISE LAYER (default)
          ═══════════════════════════════════════════ */}
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out group-hover:opacity-0"
        style={{
          background:
            "linear-gradient(180deg, #87CEEB 0%, #98E4FF 30%, #B8F0B8 60%, #7BC67E 80%, #5A9E5C 100%)",
        }}
      >
        {/* Sun */}
        <div
          className="absolute top-8 right-12 h-28 w-28 rounded-full"
          style={{
            background: "radial-gradient(circle, #FFF7AE, #FFD700, #FFA500)",
            boxShadow: "0 0 80px 30px rgba(255, 215, 0, 0.5)",
            animation: "sunPulse 4s ease-in-out infinite",
          }}
        />

        {/* Clouds */}
        {[
          { top: "6%", left: "-10%", size: "120px", delay: "0s", dur: "25s" },
          { top: "12%", left: "20%", size: "90px", delay: "5s", dur: "30s" },
          { top: "4%", left: "50%", size: "100px", delay: "12s", dur: "28s" },
        ].map((c, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute"
            style={{
              top: c.top,
              left: c.left,
              fontSize: c.size,
              animation: `cloudDrift ${c.dur} linear ${c.delay} infinite`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Rainbow */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2"
          style={{
            width: "600px",
            height: "300px",
            borderRadius: "300px 300px 0 0",
            background:
              "conic-gradient(from 180deg at 50% 100%, #FF0000 0deg, #FF7700 30deg, #FFDD00 60deg, #00FF00 90deg, #0099FF 120deg, #6633FF 150deg, transparent 180deg)",
            opacity: 0.4,
            animation: "rainbowMove 8s ease-in-out infinite",
            filter: "blur(8px)",
          }}
        />

        {/* Rolling hills background */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{ height: "45%" }}
        >
          {/* Far hills */}
          <div
            className="absolute bottom-[30%] left-[-5%] w-[60%] rounded-[50%]"
            style={{
              height: "200px",
              background: "linear-gradient(to top, #6ABF69, #8FD98E)",
            }}
          />
          <div
            className="absolute bottom-[28%] right-[-5%] w-[55%] rounded-[50%]"
            style={{
              height: "180px",
              background: "linear-gradient(to top, #5CB85C, #7ECF7D)",
            }}
          />
          {/* Near ground */}
          <div
            className="absolute bottom-0 left-0 h-[60%] w-full"
            style={{
              background: "linear-gradient(to top, #4A8C4A, #6ABF69)",
            }}
          />
        </div>

        {/* Flowers */}
        {["🌸", "🌺", "🌻", "🌷", "🌹", "💐", "🌼", "🌸", "🌺", "🌻", "🌷", "🌹"].map(
          (f, i) => (
            <div
              key={`flower-${i}`}
              className="absolute"
              style={{
                bottom: `${5 + (i % 4) * 4}%`,
                left: `${5 + i * 8}%`,
                fontSize: `${24 + (i % 3) * 10}px`,
                animation: `floatSlow ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              {f}
            </div>
          )
        )}

        {/* Trees */}
        {["🌳", "🌲", "🌴", "🌳", "🌲"].map((t, i) => (
          <div
            key={`tree-${i}`}
            className="absolute"
            style={{
              bottom: `${18 + (i % 2) * 6}%`,
              left: `${10 + i * 20}%`,
              fontSize: "60px",
              animation: `floatSlow ${5 + i}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            {t}
          </div>
        ))}

        {/* Butterflies */}
        {["🦋", "🦋", "🦋", "🦋"].map((b, i) => (
          <div
            key={`butterfly-${i}`}
            className="absolute"
            style={{
              top: `${25 + i * 12}%`,
              left: `${15 + i * 22}%`,
              fontSize: "28px",
              animation: `butterflyFloat ${4 + i}s ease-in-out ${i * 1.2}s infinite`,
            }}
          >
            {b}
          </div>
        ))}

        {/* Sparkles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              top: `${10 + Math.random() * 50}%`,
              left: `${5 + Math.random() * 90}%`,
              fontSize: "16px",
              animation: `sparkle ${2 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            ✨
          </div>
        ))}

        {/* Birds */}
        {["🕊️", "🐦", "🕊️"].map((bird, i) => (
          <div
            key={`bird-${i}`}
            className="absolute"
            style={{
              top: `${15 + i * 5}%`,
              left: `${30 + i * 15}%`,
              fontSize: "24px",
              animation: `butterflyFloat ${6 + i * 2}s ease-in-out ${i * 2}s infinite`,
            }}
          >
            {bird}
          </div>
        ))}

        {/* Nice Cat */}
        <div className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 text-center">
          <div
            className="text-[10rem] leading-none drop-shadow-lg"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            😺
          </div>
          <p
            className="mt-2 text-2xl font-bold tracking-wide text-pink-600 drop-shadow-md"
            style={{
              textShadow: "0 0 20px rgba(255,182,193,0.8)",
            }}
          >
            Hello, I&apos;m a sweet kitty~
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HELL LAYER (on hover)
          ═══════════════════════════════════════════ */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-[1500ms] ease-in-out group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, #1a0000 0%, #330000 20%, #4d0000 40%, #661a00 60%, #802200 80%, #993300 100%)",
        }}
      >
        {/* Blood red sky with cracks */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(180,0,0,0.4) 0%, transparent 60%)",
          }}
        />

        {/* Evil moon */}
        <div
          className="absolute top-6 right-10 h-24 w-24 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF1A1A, #990000, #4D0000)",
            boxShadow: "0 0 60px 20px rgba(255,0,0,0.4)",
            animation: "demonPulse 3s ease-in-out infinite",
          }}
        />

        {/* Lava ground */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: "35%",
            background:
              "linear-gradient(to top, #FF4500, #CC3300, #8B0000, #4d0000)",
            animation: "lavaFlow 4s ease-in-out infinite",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Lava cracks */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`lava-${i}`}
            className="absolute"
            style={{
              bottom: `${2 + (i % 4) * 7}%`,
              left: `${5 + i * 12}%`,
              width: `${40 + (i % 3) * 20}px`,
              height: "3px",
              background: "linear-gradient(90deg, transparent, #FF6600, #FFAA00, #FF6600, transparent)",
              borderRadius: "50%",
              boxShadow: "0 0 10px 3px rgba(255,100,0,0.6)",
              animation: `flicker ${1.5 + (i % 3) * 0.5}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}

        {/* Fire columns */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`fire-${i}`}
            className="absolute"
            style={{
              bottom: `${28 + (i % 3) * 3}%`,
              left: `${3 + i * 10}%`,
              fontSize: `${30 + (i % 4) * 12}px`,
              animation: `flicker ${0.8 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite`,
              filter: `brightness(${1 + (i % 3) * 0.3})`,
            }}
          >
            🔥
          </div>
        ))}

        {/* Rising embers */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`ember-${i}`}
            className="absolute"
            style={{
              bottom: `${30 + (i % 5) * 3}%`,
              left: `${Math.random() * 95}%`,
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: i % 2 === 0 ? "#FF6600" : "#FFAA00",
              boxShadow: `0 0 6px 2px ${i % 2 === 0 ? "rgba(255,100,0,0.8)" : "rgba(255,170,0,0.8)"}`,
              animation: `ember ${2 + (i % 4)}s ease-out ${i * 0.3}s infinite`,
            }}
          />
        ))}

        {/* Skulls and bones scattered */}
        {["💀", "🦴", "💀", "☠️", "🦴", "💀"].map((s, i) => (
          <div
            key={`skull-${i}`}
            className="absolute"
            style={{
              bottom: `${3 + (i % 3) * 5}%`,
              left: `${8 + i * 16}%`,
              fontSize: `${20 + (i % 3) * 8}px`,
              opacity: 0.7,
              animation: `flicker ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            {s}
          </div>
        ))}

        {/* Bats */}
        {["🦇", "🦇", "🦇", "🦇", "🦇"].map((bat, i) => (
          <div
            key={`bat-${i}`}
            className="absolute"
            style={{
              top: `${10 + i * 8}%`,
              left: `${10 + i * 18}%`,
              fontSize: "30px",
              animation: `butterflyFloat ${3 + i}s ease-in-out ${i * 0.8}s infinite`,
              filter: "brightness(0.6)",
            }}
          >
            {bat}
          </div>
        ))}

        {/* Dead trees */}
        {["🏚️", "⚰️", "🪦", "🏚️", "🪦"].map((t, i) => (
          <div
            key={`dead-${i}`}
            className="absolute"
            style={{
              bottom: `${25 + (i % 2) * 5}%`,
              left: `${5 + i * 20}%`,
              fontSize: "50px",
              opacity: 0.6,
            }}
          >
            {t}
          </div>
        ))}

        {/* Lightning flashes */}
        <div
          className="absolute top-0 left-0 h-full w-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,0,0,0.05) 0%, transparent 30%)",
            animation: "flicker 2s ease-in-out infinite",
          }}
        />

        {/* Demon Cat */}
        <div className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 text-center">
          <div
            className="text-[10rem] leading-none"
            style={{
              animation: "demonPulse 1.5s ease-in-out infinite, shake 0.3s ease-in-out infinite",
              filter: "drop-shadow(0 0 30px rgba(255,0,0,0.8))",
            }}
          >
            👿
          </div>
          <p
            className="mt-2 text-3xl font-black uppercase tracking-widest text-red-500"
            style={{
              textShadow:
                "0 0 10px rgba(255,0,0,0.9), 0 0 30px rgba(255,0,0,0.6), 0 0 60px rgba(255,0,0,0.3)",
              animation: "shake 0.5s ease-in-out infinite",
            }}
          >
            I WILL CONSUME YOUR SOUL
          </p>
        </div>

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════
          FIRE TRANSITION OVERLAY
          Burns across during the transition
          ═══════════════════════════════════════════ */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[800ms] ease-in group-hover:opacity-100">
        {/* Fire line that sweeps across */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`burn-${i}`}
            className="absolute"
            style={{
              bottom: `${30 + (i % 8) * 8}%`,
              left: `${i * 5}%`,
              fontSize: `${20 + (i % 4) * 10}px`,
              animation: `fireRise ${1 + (i % 3) * 0.5}s ease-out ${0.3 + i * 0.1}s infinite`,
              opacity: 0.8,
            }}
          >
            🔥
          </div>
        ))}
      </div>
    </div>
  );
}
