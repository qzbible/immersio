"""
Audio bank for BibleQuest — uses locally-generated WAV files
served via FastAPI's StaticFiles at /static/audio/.
"""

AUDIO_BANK = {
    "music": [
        {"id": "calm_quest",    "name": "Quête Calme 🏛️",     "url": "/static/audio/calm_quest.wav"},
        {"id": "epic_battle",   "name": "Bataille Épique ⚔️",  "url": "/static/audio/epic_battle.wav"},
        {"id": "mystic_riddle", "name": "Énigme Mystique 🔮",  "url": "/static/audio/mystic_riddle.wav"},
        {"id": "happy_village", "name": "Village Joyeux 🎪",   "url": "/static/audio/happy_village.wav"},
    ],
    "sfx": [
        {"id": "success_bip",  "name": "Bip Succès ✅",  "url": "/static/audio/success_bip.wav"},
        {"id": "fail_buzzer",  "name": "Buzzer Échec ❌", "url": "/static/audio/fail_buzzer.wav"},
        {"id": "click_pop",    "name": "Clic Pop 🖱️",    "url": "/static/audio/click_pop.wav"},
        {"id": "level_up",     "name": "Niveau + 🏆",    "url": "/static/audio/level_up.wav"},
    ]
}
