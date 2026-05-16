from fastapi import APIRouter

router = APIRouter(prefix="/experience", tags=["experience"])


@router.get("/manifest")
async def manifest() -> dict:
    return {
        "name": "Mystic Arcade",
        "tagline": "Classic games reborn through magic.",
        "phase": "production-ready-browser-arcade",
        "features": [
            "three_js_portal_hub",
            "mystic_memory",
            "fruit_smash_mouse",
            "totem_stack",
            "spell_tiles",
            "crystal_crush",
            "shader_portals",
            "particle_bursts",
            "procedural_audio",
            "cinematic_transitions",
        ],
    }
