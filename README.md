# Mystic Arcade

**Classic games reborn through magic.**

Mystic Arcade is a lightweight browser-based fantasy arcade built with HTML, CSS, JavaScript, Three.js, GSAP, WebGL shader materials, and the Web Audio API. It presents five familiar mini-games inside a cinematic magical hub floating in space.

## Included Games

- **Mystic Memory**: flip and match glowing rune cards, with combo scoring and harder rounds.
- **Fruit Smash**: smash falling enchanted fruit with mouse/touch slicing, and avoid bombs.
- **Astral Dodge**: guide a glowing nexus orb, collect energy sparks, and avoid incoming void shards.
- **Circuit Connector**: rotate wire pieces to connect a battery and turn on a bulb.
- **Number Path**: connect numbered checkpoints in order while filling the entire board.

## Project Structure

```text
Mystic Arcade/
  backend/
    app/
      main.py
      routes/
        experience.py
        gesture.py
  frontend/
    index.html
    css/
      styles.css
    js/
      audio/
      core/
      effects/
      games/
      interactions/
      particles/
      scenes/
      shaders/
      transitions/
      ui/
  assets/
    sounds/
    textures/
    models/
    particles/
```

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

## Controls

- Hub: drag to orbit, hover portals, click a portal or press **Open Portal**.
- All games: press **Escape** to return to the hub.
- Fruit Smash: hold and drag through fruit with mouse or touch. Avoid bombs.
- Astral Dodge: move the orb with your mouse or touch, collect green energy, and avoid red void shards.
- Circuit Connector: click wire pieces to rotate them. Connect the battery to the bulb.
- Number Path: start at 1, hold and drag through adjacent cells to reach each number in order, and fill every square.
- Audio: use the top-right music button.

## Optimization Strategy

- The hub uses procedural geometry, shader portals, capped particle systems, and a capped device pixel ratio.
- Mini-games use DOM or 2D canvas gameplay so the Three.js scene can remain atmospheric without heavy GPU cost.
- Fruit Smash uses pure 2D canvas pointer input for fast, predictable slicing without camera permissions.
- Particle bursts are short-lived and cleaned up after animation.
- Audio is generated with Web Audio oscillators, avoiding large sound downloads.
- Cinematic glow comes from emissive materials, additive particles, CSS shadows, and shader illusions rather than expensive post-processing.

## Development Phases Reflected

- Phase 1: magical hub, portals, particles, fantasy UI, ambient audio.
- Phase 2: Mystic Memory and Circuit Connector.
- Phase 3: Fruit Smash and Number Path.
- Phase 4: Astral Dodge, cinematic transitions, and shared polish systems.
